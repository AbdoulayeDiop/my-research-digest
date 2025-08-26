# Description: This file contains a function to analyze a paper using a query.
# The analysis is done by an AI agent implemented with langchain.
# The user needs to have langchain and openai installed, and the OPENAI_API_KEY environment variable set.

from langchain_openai import ChatOpenAI # Placeholder, user might need to change this
from langchain_core.prompts import PromptTemplate
from typing import Dict, List
from langchain.output_parsers import StructuredOutputParser, ResponseSchema
import numpy as np
from dotenv import load_dotenv

load_dotenv()

async def analyze_paper(topic: str, paper: Dict) -> Dict:
    """
    Analyzes a paper based on a query.

    Args:
        topic: The topic used to find the paper.
        paper: A dictionary representing the paper, with at least 'title' and 'abstract'.

    Returns:
        A dictionary with the analysis of the paper, containing:
        - synthesis: A brief synthesis of the paper.
        - usefulness: Why the paper is useful.
    """
    # This requires the OPENAI_API_KEY environment variable to be set.
    # You can get a key from https://platform.openai.com/account/api-keys
    llm = ChatOpenAI(temperature=0, model_name="gpt-4o-mini")

    response_schemas = [
        ResponseSchema(name="synthesis", description="A brief synthesis of the paper. Explain the paper’s contribution in simple terms. (2–4 sentences)"),
        ResponseSchema(name="usefulness", description="Explain why the paper matters, particularly given the newsletter topic / why should the reader should read it? (1–3 sentences)"),
        # ResponseSchema(name="relevance_score", description="A score from 0 to 5 indicating the relevance of the paper to the user's topic of interest, where 0 is not relevant at all and 5 is very relevant.")
    ]
    output_parser = StructuredOutputParser.from_response_schemas(response_schemas)
    format_instructions = output_parser.get_format_instructions()

    prompt_template = """
    You are a research assistant. Your task is to analyze a research paper based on a user's topic of interest.
    The user's topic is: "{topic}"
    The paper's title is: "{title}"
    The paper's abstract is: "{abstract}"

    Based on this information, please provide the following analysis:
    {format_instructions}
    """

    prompt = PromptTemplate(
        input_variables=["topic", "title", "abstract"],
        template=prompt_template,
        partial_variables={"format_instructions": format_instructions}
    )

    chain = prompt | llm | output_parser

    output = await chain.ainvoke(input={'topic': topic, 'title': paper.get('title', ''), 'abstract': paper.get('abstract', '')})
    output['score'] = np.mean([(author.get("citationCount") or 0) for author in paper.get("authors", [])]) * \
        np.mean([(author.get("hIndex") or 0) for author in paper.get("authors", [])])
    return output

if __name__ == '__main__':
    # Example usage
    paper_example = {
        'title': 'Attention Is All You Need',
        'abstract': 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.',
    }
    topic = "transformer architecture"
    analysis_result = analyze_paper(topic, paper_example)
    print(analysis_result)