from langchain_core.prompts import PromptTemplate

newsletter_writer_prompt = PromptTemplate(
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

    Here are the summaries of the selected papers:
    {papers_summary}
    """
)

newsletter_summary_prompt = PromptTemplate.from_template(
    template="Summarize in few sentences this week's issue of a newsletter about {topic}.\n\n{newsletter}"
)

paper_analyzer_prompt = PromptTemplate(
    template="""
    You are a research assistant. Based on the following information, your task is to provide a synthesis of the paper and explain why it should matter to the user.
    The user's topic of interest is: "{topic}"
    The paper's title is: "{title}"
    The paper's abstract is: "{abstract}"
    """
)

paper_filterer_prompt = PromptTemplate(
    template="""
    You are a research assistant tasked with filtering academic papers based on relevance to a specific research topic.

    USER'S RESEARCH TOPIC: "{topic}"
    
    PAPER DETAILS:
    Title: "{title}"
    Abstract: "{abstract}"

    INSTRUCTIONS:
    1. Carefully analyze the user's topic to understand the specific focus area and scope
    2. Read the paper's title and abstract thoroughly
    3. Determine if there is a substantial connection between the paper's content and the user's research topic

    RELEVANCE CRITERIA:
    - HIGH RELEVANCE: Paper directly addresses the topic as a primary focus
    - MEDIUM RELEVANCE: Paper touches on the topic but may not be the main focus
    - LOW RELEVANCE: Paper has minimal connection or no connection to the topic

    DECISION RULE:
    - Return "yes" ONLY for HIGH relevance papers
    - Return "no" for MEDIUM and LOW relevance papers

    EXAMPLES:
    - Topic: "LLM Architecture" → Paper about "Attention mechanisms in transformer models" = HIGH relevance = "yes"
    - Topic: "LLM Architecture" → Paper about "General applications of large language models with a section on architecture impact" = MEDIUM relevance = "no"
    - Topic: "Machine Learning Security" → Paper about "Adversarial attacks on neural networks" = HIGH relevance = "yes"
    - Topic: "Machine Learning Security" → Paper about "Basic neural network training" = LOW relevance = "no"

    RESPONSE FORMAT:
    Use the following structured format:

    <thinking>[Your detailed reasoning about the user topic of interest, the paper and its relevance to the topic based on the given rules]</thinking>
    <response>[Your final decision: "yes" or "no"]</response>

    Now, analyze the provided paper and determine its relevance to the user's research topic. Think step-by-step.
    """
)

# if __name__ == '__main__':
#     from dotenv import load_dotenv
#     from langchain_openai import ChatOpenAI
#     from data_models import PaperFiltererOutput
#     load_dotenv()
#     topic = "LLMs Architecture"
#     title = "Attention is All You Need"
#     abstract= """
#     The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.
#     """
#     llm = ChatOpenAI(temperature=0, model_name="gpt-4o-mini")
#     chain = paper_filterer_prompt | llm.with_structured_output(PaperFiltererOutput)
#     response = chain.invoke({
#         "topic": topic,
#         "title": title,
#         "abstract": abstract
#     })
#     print("response:", response.is_relevant)
