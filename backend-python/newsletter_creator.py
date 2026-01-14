import prompts
from data_models import RelevanceOutput, QueryGeneratorOutput, PaperAnalyzerOutput, NewsletterWriterOutput
from paper_search import SemanticSearch
import asyncio
from typing import List, Dict
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
    if paper.get("authors") is None or len(paper.get("authors")) == 0:
        return 0
    return np.mean([(author.get("citationCount") or 0) for author in paper.get("authors")]) * \
        np.mean([(author.get("hIndex") or 0)
                for author in paper.get("authors")])


class NewsletterCreator:
    def __init__(self, model: str = "gpt-5-mini", temperature: float = 0):
        self.model = model
        self.temperature = temperature
        self.client = OpenAI()

    def search(self, topic, description, start_date, end_date=None, max_papers: int = 10):
        print("Generating search queries...")
        queries = generate_queries(topic, description, model=self.model)
        print("Search queries generated:", queries)
        semantic_searcher = SemanticSearch()
        results = []
        for query in queries:
            results.extend(semantic_searcher.search(
                query, start_date, max_papers, end_date=end_date))
            time.sleep(1) # Add a 1-second delay to respect API rate limits
        return results

    async def create_newsletter(self, topic: str, start_date: str, description: str="", nb_papers: int = 5, end_date: str = None, max_papers: int = 10) -> NewsletterWriterOutput:
        print("Searching for papers...")
        papers = self.search(topic, description=description, start_date=start_date, end_date=end_date, max_papers=max_papers)
        if papers:
            print(f"Found {len(papers)} papers. Filtering for relevance...")
            papers = await self.filter_papers(topic, papers, description=description)
            if len(papers) > 0:
                print(f"{len(papers)} papers are relevant. Analyzing papers...")
                papers = sorted(papers, key=get_paper_score, reverse=True)[:nb_papers]
                analyzes = await self.analyze_papers(topic, papers, description=description)
                papers_with_analysis = [{"paper": paper, "analysis": analysis.model_dump(
                )} for paper, analysis in zip(papers, analyzes)]
                newsletter = self.write_newsletter(topic, papers_with_analysis, description=description)
                return {'newsletter': newsletter, 'papers': papers_with_analysis}
        return None

    async def filter_papers(self, topic: str, papers: List[Dict], description: str="") -> List[Dict]:
        async def do_filter(paper):
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
            papers_section += f"**Pertinence Score**: {analysis.get('pertinence', 'N/A')}/5\n\n"
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
        result = await creator.create_newsletter("new llm architectures", "2026-01-06", description="New Large Language Models with novel architecture or new innovations", end_date="2026-01-14", max_papers=10)
        if result and "newsletter" in result:
            print(result["newsletter"]["content_markdown"])

    asyncio.run(main())
