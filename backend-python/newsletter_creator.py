import prompts
from data_models import RelevanceOutput, QueryGeneratorOutput, SotANewsletterOutput, ClassicNewsletterOutput
from paper_search import SemanticSearch, OpenAlexSearch
import asyncio
from typing import List, Dict, Optional
from pydantic import BaseModel
import numpy as np
import re
from openai import OpenAI, AsyncOpenAI
import time

MAX_AUTHORS = 6


def _format_paper(i: int, p: Dict) -> str:
    names = [a.get("name") or "" for a in (p.get("authors") or [])]
    names = [n for n in names if n]
    if not names:
        authors = "authors not listed"
    elif len(names) > MAX_AUTHORS:
        authors = ", ".join(names[:MAX_AUTHORS]) + " et al."
    else:
        authors = ", ".join(names)

    date = p.get("publicationDate") or p.get("year") or "date unknown"
    venue = p.get("venue") or "venue not listed"
    url = p.get("url") or ""
    abstract = (p.get("abstract") or "").strip() or "[no abstract available]"

    return (
        f'{i}. "{p.get("title") or "[untitled]"}"\n'
        f'   Authors: {authors}\n'
        f'   Date: {date} | Venue: {venue}\n'
        f'   URL: {url}\n'
        f'   Abstract: {abstract}\n\n'
    )

def generate_queries(topic: str, description: str, model: str="gpt-5.6-terra") -> List[str]:
    client = OpenAI()
    response = client.responses.parse(
        model=model,
        input=prompts.query_generator_prompt.format(
            topic=topic,
            description=description
        ),
        text_format=QueryGeneratorOutput,
        reasoning={"effort": "medium"}
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
    def __init__(self, model: str = "gpt-5.6-luna", writer_model: str = "gpt-5.6-luna", embedding_model="text-embedding-3-large", temperature: float = 0, api_client=None):
        self.model = model
        self.writer_model = writer_model
        self.embedding_model = embedding_model
        self.temperature = temperature
        self.client = OpenAI()
        self.api_client = api_client

    def search(self, topic, description, start_date, end_date=None, max_papers: int = 10, queries=None, filters=None, newsletter_id=None, search_engine="semantic_scholar"):
        if not queries or len(queries) == 0:
            print("No stored queries found. Generating search queries...")
            queries = generate_queries(topic, description)
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

    async def create_newsletter(self, topic: str, start_date: str, description: str="", nb_papers: int = 5, end_date: str = None, max_papers: int = 10, queries=None, ranking_strategy='author_based', filters=None, newsletter_id=None, search_engine="semantic_scholar", issue_format: str = 'classic') -> Dict:
        print(f"Searching for papers (engine: {search_engine}, strategy: {ranking_strategy}, filters: {filters})...")
        papers = self.search(topic, description=description, start_date=start_date, end_date=end_date, max_papers=max_papers, queries=queries, filters=filters, newsletter_id=newsletter_id, search_engine=search_engine)
        if papers:
            print(f"Found {len(papers)} papers. Filtering for relevance...")
            papers = await self.filter_papers(topic, papers, description=description)
            print(f"{len(papers)} papers are relevant.")
            if len(papers) > 0:
                if issue_format == 'state_of_the_art':
                    print(f"Writing state-of-the-art review for {len(papers)} papers...")
                    newsletter = self.write_sota_newsletter(topic, papers, description=description)
                    papers_with_analysis = [{"paper": p, "analysis": {"synthesis": None, "usefulness": None}} for p in papers]
                else:
                    print(f"Ranking and top-{nb_papers} selection...")
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

                    print(f"Writing issue for {len(papers)} papers...")
                    newsletter, papers_with_analysis = self.write_newsletter(
                        topic, papers, description=description)

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
                reasoning={"effort": "medium"},
                text_format=RelevanceOutput
            )
            parsed_response: RelevanceOutput = response.output_parsed
            return parsed_response.is_relevant

        tasks = [do_filter(paper) for paper in papers]
        results = await asyncio.gather(*tasks)
        filtered_papers = [paper for paper, is_relevant in zip(
            papers, results) if is_relevant == "yes"]
        return filtered_papers

    def write_sota_newsletter(self, topic: str, papers: List[Dict], description: str = "") -> Dict:
        papers_list = "".join(_format_paper(i, p) for i, p in enumerate(papers, 1))

        response = self.client.responses.parse(
            model=self.writer_model,
            input=prompts.sota_newsletter_prompt.format(
                topic=topic,
                description=description,
                papers_list=papers_list
            ),
            reasoning={"effort": "high"},
            text_format=SotANewsletterOutput
        )
        parsed: SotANewsletterOutput = response.output_parsed

        summary_response = self.client.responses.create(
            model=self.model,
            input=prompts.newsletter_summary_prompt.format(
                topic=topic,
                newsletter=parsed.content_markdown
            )
        )

        return {
            'title': parsed.title,
            'introduction': '',
            'conclusion': '',
            'summary': summary_response.output_text,
            'papers_section': '',
            'content_markdown': parsed.content_markdown,
            'is_sota': True,
        }

    def write_newsletter(self, topic: str, papers: List[Dict], description: str = "") -> tuple:
        papers_list = "".join(_format_paper(i, p) for i, p in enumerate(papers, 1))

        response = self.client.responses.parse(
            model=self.writer_model,
            input=prompts.classic_newsletter_prompt.format(
                topic=topic,
                description=description,
                papers_list=papers_list
            ),
            reasoning={"effort": "high"},
            text_format=ClassicNewsletterOutput
        )
        parsed: ClassicNewsletterOutput = response.output_parsed

        # Map entries back to papers by index; never trust emission order.
        by_index = {}
        for e in parsed.entries:
            if 1 <= e.paper_index <= len(papers) and e.paper_index not in by_index:
                by_index[e.paper_index] = e
            else:
                print(f"Discarding entry with invalid/duplicate index {e.paper_index}")

        missing = [i for i in range(1, len(papers) + 1) if i not in by_index]
        if missing:
            print(f"Warning: no entry returned for papers {missing}")

        # Presentation order: use the model's sequencing only if it is a clean
        # permutation of the entries we actually have.
        order = [i for i in parsed.reading_order if i in by_index]
        if sorted(order) != sorted(by_index.keys()):
            print("Invalid reading_order; falling back to input order")
            order = sorted(by_index.keys())

        papers_with_analysis = []
        for i in order:
            e = by_index[i]
            papers_with_analysis.append({
                "paper": papers[i - 1],
                "analysis": {"synthesis": e.synthesis, "usefulness": e.usefulness},
            })

        papers_section = "## 📝 Papers Selection\n\n"
        for item in papers_with_analysis:
            paper, analysis = item["paper"], item["analysis"]
            papers_section += f"### {paper.get('title', 'No Title')}\n\n"
            papers_section += f"**Synthesis**: {analysis['synthesis']}\n\n"
            papers_section += f"**Usefulness**: {analysis['usefulness']}\n\n"
            if paper.get("url"):
                papers_section += f"[Read the full paper]({paper['url']})\n\n"
            papers_section += "---\n\n"

        newsletter = (
            f"# 🔬 Research Digest: {parsed.title}\n\n"
            f"{parsed.introduction}\n\n"
            f"{papers_section}\n\n"
            f"## 📈 Conclusion and Trends\n\n"
            f"{parsed.conclusion}\n"
        )

        summary = self.client.responses.create(
            model=self.model,
            input=prompts.newsletter_summary_prompt.format(topic=topic, newsletter=newsletter)
        ).output_text

        return {
            'title': parsed.title,
            'introduction': parsed.introduction,
            'papers_section': papers_section,
            'conclusion': parsed.conclusion,
            'summary': summary,
            'content_markdown': newsletter,
        }, papers_with_analysis


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    async def main():
        creator = NewsletterCreator()
        result = await creator.create_newsletter(
            "Small language models", "2026-01-06",
            description="News breakthroughs on small and efficient language models.",
            end_date="2026-01-14", max_papers=10, issue_format='classic')
        if result and "newsletter" in result:
            print(result["newsletter"]["content_markdown"])

    asyncio.run(main())
