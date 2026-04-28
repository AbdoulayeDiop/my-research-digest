import prompts
from data_models import RelevanceOutput, QueryGeneratorOutput, PaperAnalyzerOutput, NewsletterWriterOutput
from paper_search import SemanticSearch, OpenAlexSearch
import asyncio
from typing import List, Dict, Optional
from pydantic import BaseModel
import numpy as np
import re
from openai import OpenAI, AsyncOpenAI
import time

def generate_queries(topic: str, description: str, model: str="gpt-5-mini") -> List[str]:
    client = OpenAI()
    response = client.responses.parse(
        model=model,
        input=prompts.query_generator_prompt.format(
            topic=topic,
            description=description
        ),
        text_format=QueryGeneratorOutput
    )
    parsed_response: QueryGeneratorOutput = response.output_parsed
    return parsed_response.queries

def get_paper_score(paper: Dict) -> float:
    """
    Computes a score for a paper based on the maximum h-index among its authors 
    and its own citation count.
    """
    citation_score = paper.get("citationCount", 0) or 0
    
    # Author influence: consider h-index only as requested
    max_h_index = 0
    if paper.get("authors"):
        h_indexes = [author.get("hIndex", 0) or 0 for author in paper.get("authors")]
        if h_indexes:
            max_h_index = max(h_indexes)
    
    # Combined score: log(citations) + h_index
    # We use max h-index as it represents the "most senior/influential" author on the paper
    return float(np.log1p(citation_score) + max_h_index)


class NewsletterCreator:
    def __init__(self, model: str = "gpt-5-mini", embedding_model="text-embedding-3-large", temperature: float = 0, api_client=None):
        self.model = model
        self.embedding_model = embedding_model
        self.temperature = temperature
        self.client = OpenAI()
        self.api_client = api_client

    def search(self, topic, description, start_date, end_date=None, max_papers: int = 10, queries=None, filters=None, newsletter_id=None, search_engine="semantic_scholar"):
        if not queries or len(queries) == 0:
            print("No stored queries found. Generating search queries...")
            queries = generate_queries(topic, description, model=self.model)
            print("Search queries generated:", queries)
            # Update the newsletter with the generated queries if api_client and newsletter_id are provided
            if self.api_client and newsletter_id:
                try:
                    self.api_client.update_newsletter(newsletter_id, {"queries": queries})
                    print(f"Newsletter {newsletter_id} updated with generated queries.")
                except Exception as e:
                    print(f"Failed to update newsletter {newsletter_id} with queries: {e}")
        else:
            print("Using stored search queries:", queries)
            
        searchers = []
        if search_engine == "openalex":
            searchers.append(OpenAlexSearch())
        elif search_engine == "all":
            searchers.append(SemanticSearch())
            searchers.append(OpenAlexSearch())
        else: # Default is "semantic_scholar"
            searchers.append(SemanticSearch())

        results = []
        for searcher in searchers:
            for query in queries:
                results.extend(searcher.search(
                    query, start_date, max_papers, end_date=end_date, filters=filters))
                time.sleep(1) # Add a 1-second delay to respect API rate limits
        
        # Filter unique papers (by title normalization if IDs differ, but paperId is usually a good start)
        # We use a dict to deduplicate by title (normalized) to catch papers found across different engines
        unique_papers = {}
        for p in results:
            title_norm = re.sub(r'\W+', '', p["title"].lower())
            if title_norm not in unique_papers:
                unique_papers[title_norm] = p
        
        return list(unique_papers.values())

    async def create_newsletter(self, topic: str, start_date: str, description: str="", nb_papers: int = 5, end_date: str = None, max_papers: int = 10, queries=None, ranking_strategy='author_based', filters=None, newsletter_id=None, search_engine="semantic_scholar") -> NewsletterWriterOutput:
        print(f"Searching for papers (engine: {search_engine}, strategy: {ranking_strategy}, filters: {filters})...")
        papers = self.search(topic, description=description, start_date=start_date, end_date=end_date, max_papers=max_papers, queries=queries, filters=filters, newsletter_id=newsletter_id, search_engine=search_engine)
        if papers:
            print(f"Found {len(papers)} papers. Filtering for relevance...")
            papers = await self.filter_papers(topic, papers, description=description)
            if len(papers) > 0:
                print(f"{len(papers)} papers are relevant. Analyzing papers...")
                
                if ranking_strategy == 'author_based':
                    for p in papers:
                        p["score"] = get_paper_score(p)
                    papers = sorted(papers, key=lambda p: p["score"], reverse=True)[:nb_papers]
                else:
                    response = self.client.embeddings.create(
                        model=self.embedding_model,
                        input=[f"{topic}\n{description}"] + [p["abstract"] for p in papers]
                    )
                    embbedings = [obj.embedding for obj in response.data]

                    v0 = embbedings[0]
                    norm0 = np.linalg.norm(v0)

                    for i, p in enumerate(papers):
                        emb = embbedings[i + 1]
                        p["score"] = np.dot(v0, emb)/(norm0 * np.linalg.norm(emb))

                    papers = sorted(papers, key=lambda p: p["score"], reverse=True)[:nb_papers]
                    
                analyzes = await self.analyze_papers(topic, papers, description=description)
                papers_with_analysis = [{"paper": paper, "analysis": analysis.model_dump(
                )} for paper, analysis in zip(papers, analyzes)]
                newsletter = self.write_newsletter(topic, papers_with_analysis, description=description)
                return {'newsletter': newsletter, 'papers': papers_with_analysis}
        return None

    async def filter_papers(self, topic: str, papers: List[Dict], description: str="") -> List[Dict]:
        async def do_filter(paper):
            if not paper['title'] or not paper['abstract']:
                return 'no'

            response = await asyncio.to_thread(
                self.client.responses.parse,
                model=self.model,
                input=prompts.paper_filterer_prompt.format(
                    topic=topic,
                    description=description,
                    title=paper['title'],
                    abstract=paper['abstract']
                ),
                text_format=RelevanceOutput
            )
            parsed_response: RelevanceOutput = response.output_parsed
            return parsed_response.is_relevant

        tasks = [do_filter(paper) for paper in papers]
        results = await asyncio.gather(*tasks)
        filtered_papers = [paper for paper, is_relevant in zip(
            papers, results) if is_relevant == "yes"]
        return filtered_papers

    async def analyze_papers(self, topic: str, papers: List[Dict], description: str="") -> List[PaperAnalyzerOutput]:
        async def do_analysis(paper):
            response = await asyncio.to_thread(
                self.client.responses.parse,
                model=self.model,
                input=prompts.paper_analyzer_prompt.format(
                    topic=topic,
                    description=description,
                    title=paper['title'],
                    abstract=paper['abstract']
                ),
                text_format=PaperAnalyzerOutput
            )
            parsed_response: PaperAnalyzerOutput = response.output_parsed
            return parsed_response

        tasks = [do_analysis(paper) for paper in papers]
        results = await asyncio.gather(*tasks)
        return results

    def write_newsletter(self, topic, papers_with_analysis: List[Dict], description: str="") -> Dict:
        papers_summary = ""
        for item in papers_with_analysis:
            papers_summary += f"- {item['paper']['title']}: {item['analysis']['synthesis']}\n"

        response = self.client.responses.parse(
            model=self.model,
            input=prompts.newsletter_writer_prompt.format(
                topic=topic,
                description=description,
                papers_summary=papers_summary
            ),
            text_format=NewsletterWriterOutput
        )
        parsed_response: NewsletterWriterOutput = response.output_parsed
        title = parsed_response.title
        introduction = parsed_response.introduction
        conclusion = parsed_response.conclusion

        # Format Papers Selection
        papers_section = "## 📝 Papers Selection\n\n"
        for item in papers_with_analysis:
            paper = item['paper']
            analysis = item['analysis']
            papers_section += f"### {paper.get('title', 'No Title')}\n\n"
            papers_section += f"**Synthesis**: {analysis.get('synthesis', 'N/A')}\n\n"
            papers_section += f"**Usefulness**: {analysis.get('usefulness', 'N/A')}\n\n"
            papers_section += f"**Score**: {paper.get('score', 'N/A')}\n\n"
            if paper.get('url'):
                papers_section += f"[Read the full paper]({paper.get('url')})\n\n"
            papers_section += "---\n\n"

        # Combine all parts
        newsletter = f"# 🔬 Research Digest: {title}\n\n"
        newsletter += f"{introduction}\n\n"
        newsletter += f"{papers_section}\n\n"
        newsletter += f"## 📈 Conclusion and Trends\n\n"
        newsletter += f"{conclusion}\n"

        response = self.client.responses.create(
            model=self.model,
            input=prompts.newsletter_summary_prompt.format(
                topic=topic,
                newsletter=newsletter
            )
        )
        summary = response.output_text

        return {
            'title': title,
            'introduction': introduction,
            'papers_section': papers_section,
            'conclusion': conclusion,
            'summary': summary,
            'content_markdown': newsletter
        }


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    async def main():
        creator = NewsletterCreator()
        result = await creator.create_newsletter(
            "new llm architectures", "2026-01-06", 
            description="New Large Language Models with novel architecture or new innovations",
            end_date="2026-01-14", max_papers=10, ranking_strategy="embedding_based",
            search_engine="openalex")
        if result and "newsletter" in result:
            print(result["newsletter"]["content_markdown"])

    asyncio.run(main())
