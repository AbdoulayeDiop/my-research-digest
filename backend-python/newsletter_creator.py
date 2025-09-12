import prompts
import data_models
from paper_search import SemanticSearch
from langchain_openai import ChatOpenAI
import asyncio
from typing import List, Dict
import numpy as np
import re
from bs4 import BeautifulSoup


def extract_tag_beautifulsoup(response_text, tag):
    """Extract thinking content using BeautifulSoup (more robust)"""
    try:
        soup = BeautifulSoup(response_text, 'html.parser')
        element = soup.find(tag)
        if element:
            return element.get_text().strip()
    except:
        return None
    return None


def get_paper_score(paper: Dict) -> float:
    if paper.get("authors") is None or len(paper.get("authors")) == 0:
        return 0
    return np.mean([(author.get("citationCount") or 0) for author in paper.get("authors")]) * \
        np.mean([(author.get("hIndex") or 0)
                for author in paper.get("authors")])


class NewsletterCreator:
    def __init__(self, model_name: str = "gpt-4o-mini", temperature: float = 0):
        self.searcher = SemanticSearch()
        self.llm = ChatOpenAI(model_name=model_name, temperature=temperature)

    async def create_newsletter(self, topic: str, start_date: str, nb_papers: int = 5, end_date: str = None, max_papers: int = 20) -> data_models.NewsletterWriterOutput:
        papers = self.searcher.search(
            topic, start_date, max_papers, end_date=end_date)
        if papers:
            papers = await self._filter_papers(topic, papers)
            papers = sorted(papers, key=get_paper_score,
                            reverse=True)[:nb_papers]
            if len(papers) > 0:
                analyzes = await self._analyze_papers(topic, papers)
                papers_with_analysis = [{"paper": paper, "analysis": analysis.model_dump(
                )} for paper, analysis in zip(papers, analyzes)]
                newsletter = self._write_newsletter(
                    topic, papers_with_analysis)
                return {'newsletter': newsletter, 'papers': papers_with_analysis}
        return None

    async def _filter_papers(self, topic: str, papers: List[Dict]) -> List[Dict]:
        async def do_filter(paper):
            chain = prompts.paper_filterer_prompt | self.llm
            response = await chain.ainvoke({
                "topic": topic,
                "title": paper['title'],
                "abstract": paper['abstract']
            })
            # thinking = extract_tag_beautifulsoup(response.content, 'thinking')
            is_relevant = extract_tag_beautifulsoup(
                response.content, 'response')
            if is_relevant is not None:
                return is_relevant
            else:
                raise ValueError(
                    "Could not parse the response to determine relevance.")

        tasks = [do_filter(paper) for paper in papers]
        results = await asyncio.gather(*tasks)
        filtered_papers = [paper for paper, is_relevant in zip(
            papers, results) if is_relevant == "yes"]
        return filtered_papers

    async def _analyze_papers(self, topic: str, papers: List[Dict]) -> List[data_models.PaperAnalyzerOutput]:
        async def do_analysis(paper):
            chain = prompts.paper_analyzer_prompt | self.llm.with_structured_output(
                data_models.PaperAnalyzerOutput)
            response = await chain.ainvoke({
                "topic": topic,
                "title": paper['title'],
                "abstract": paper['abstract']
            })
            return response

        tasks = [do_analysis(paper) for paper in papers]
        results = await asyncio.gather(*tasks)
        return results

    def _write_newsletter(self, topic, papers_with_analysis: List[Dict]):
        papers_summary = ""
        for item in papers_with_analysis:
            papers_summary += f"- {item['paper']['title']}: {item['analysis']['synthesis']}\n"

        chain = prompts.newsletter_writer_prompt | self.llm.with_structured_output(
            data_models.NewsletterWriterOutput)
        output = chain.invoke({
            "topic": topic,
            "papers_summary": papers_summary
        })
        title = output.title
        introduction = output.introduction
        conclusion = output.conclusion

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

        chain = prompts.newsletter_summary_prompt | self.llm
        response = chain.invoke({
            "topic": topic,
            "newsletter": newsletter
        })
        summary = response.content

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
        result = await creator.create_newsletter("AI applications in farming", "2025-08-31", end_date="2025-09-06", max_papers=3)
        if result and "newsletter" in result:
            print(result["newsletter"]["content_markdown"])

    asyncio.run(main())
