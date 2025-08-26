from langchain_openai import ChatOpenAI
from typing import List, Dict
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()


def write_newsletter(topic: str, papers_with_analysis: List[Dict]) -> Dict:
    """
    Generates a newsletter issue in Markdown format.

    Args:
        topic: The topic of the newsletter.
        papers_with_analysis: A list of dictionaries, where each dictionary
                              contains paper information and its analysis.

    Returns:
        A dictionary containing the different parts of the newsletter.
    """
    llm = ChatOpenAI(temperature=0, model_name="gpt-4o-mini")

    papers_summary = ""
    for item in papers_with_analysis:
        papers_summary += f"- {item['paper'].get('title', 'No Title')}: {item['analysis'].get('synthesis', 'N/A')}\\n"

    response_schemas = [
        ResponseSchema(
            name="title", description="A catchy and relevant title for the newsletter."),
        ResponseSchema(name="introduction",
                       description="A brief introduction for the newsletter."),
        ResponseSchema(
            name="conclusion", description="A conclusion for the newsletter, summarizing key takeaways and identifying potential future trends.")
    ]
    output_parser = StructuredOutputParser.from_response_schemas(
        response_schemas)
    format_instructions = output_parser.get_format_instructions()

    prompt = PromptTemplate(
        template="""
        You are a research assistant. Your task is to write a weekly newsletter about the latest research papers on '{topic}'.
        Based on the following summaries of the selected papers, generate a title, introduction, and conclusion for this week's newsletter issue.

        Introduction (2–3 sentences):
        Briefly set the context: what the week’s monitoring is about.
        Mention how many articles were selected and the general theme.
        Example: “This week’s scientific watch highlights 3 new papers on mixed data clustering, focusing on distance measures and meta-learning approaches.”

        Conclusion:
        End with a short reflection or takeaway (2–3 sentences).
        Highlight an emerging trend, a recurring theme, or your personal comment.
        Example: “This week shows a clear trend towards combining deep learning embeddings with traditional similarity measures, bridging the gap between clustering and representation learning.”

        {format_instructions}

        Here are the summaries of the selected papers:
        {papers_summary}
        """,
        input_variables=["topic", "papers_summary"],
        partial_variables={"format_instructions": format_instructions}
    )

    chain = prompt | llm | output_parser
    output = chain.invoke(
        input={'topic': topic, 'papers_summary': papers_summary})

    title = output.get('title', '')
    introduction = output.get('introduction', '')
    conclusion = output.get('conclusion', '')

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

    # 5. Generate Summary
    summary_prompt = PromptTemplate.from_template("Summarize in few sentences this week's issue of a newsletter about {topic}.\n\n{newsletter}")
    summary_chain = summary_prompt | llm
    summary = summary_chain.invoke(input={'topic': topic, 'newsletter': newsletter}).content
    summary = summary.strip()

    return {
        'title': title,
        'introduction': introduction,
        'papers_section': papers_section,
        'conclusion': conclusion,
        'summary': summary,
        'content_markdown': newsletter
    }


if __name__ == '__main__':
    # Example Usage
    papers_with_analysis_example = [
        {
            'paper': {
                'title': 'Attention Is All You Need',
                'url': 'https://arxiv.org/abs/1706.03762',
                'abstract': 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.'
            },
            'analysis': {
                'synthesis': 'This paper introduces the Transformer, a novel network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.',
                'usefulness': 'It has become the foundation for most state-of-the-art NLP models, including BERT and GPT.',
                'pertinence': 5
            }
        },
        {
            'paper': {
                'title': 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
                'url': 'https://arxiv.org/abs/1810.04805',
                'abstract': 'This paper presents BERT, a new language representation model which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.'
            },
            'analysis': {
                'synthesis': 'This paper presents BERT, a new language representation model which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.',
                'usefulness': 'BERT achieved state-of-the-art results on a wide range of NLP tasks.',
                'pertinence': 4
            }
        }
    ]
    keywords_example = "transformer architecture"
    newsletter_data = write_newsletter(
        keywords_example, papers_with_analysis_example)
    print(newsletter_data['summary'])
