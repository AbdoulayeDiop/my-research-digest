newsletter_writer_prompt = """You are a research assistant. Your task is to write the weekly issue of the following scientific newsletter.

Newsletter topic: {topic}
Newsletter description: {description}

Here are the summaries of the selected papers for this week's issue:
{papers_summary}

Based on these summaries, generate a title, introduction, and conclusion for this week's newsletter issue.

Introduction (2–3 sentences):
Briefly set the context: what the week’s monitoring is about.
Mention how many articles were selected and the general theme.
Example: “This week’s scientific watch highlights 3 new papers on mixed data clustering, focusing on distance measures and meta-learning approaches.”

Conclusion:
End with a short reflection or takeaway (2–3 sentences).
Highlight an emerging trend, a recurring theme, or your personal comment.
Example: “This week shows a clear trend towards combining deep learning embeddings with traditional similarity measures, bridging the gap between clustering and representation learning.”
"""

newsletter_summary_prompt = "Summarize in few sentences this week's issue of a newsletter about {topic}.\n\n{newsletter}"

paper_analyzer_prompt = """You are a research assistant. Analyze the following newsletter and paper. Provide a synthesis of the paper and explain why it should matter to the readers of the newsletter.
Newsletter topic: "{topic}"
Newsletter description: "{description}"

Paper title: "{title}"
Paper abstract: "{abstract}"
"""

paper_filterer_prompt = """### Role
You are an expert Research Screener specializing in academic literature classification. Your task is to determine if a specific paper is a "Must-Read" for a targeted newsletter.

### Context
Newsletter Topic: "{topic}"
Newsletter Description: "{description}"

Paper Title: "{title}"
Paper Abstract: "{abstract}"

### Strict Relevance Definitions
* **HIGH (YES):** The paper’s *primary* contribution or core methodology directly advances the newsletter topic. It is a "perfect fit."
* **MEDIUM (NO):** The paper mentions the topic or uses it as a secondary tool/application, but the main research focus lies elsewhere.
* **LOW (NO):** The paper is unrelated or only shares broad, high-level keywords (e.g., both are "Machine Learning").

### Filtering Logic
1. **Analyze Focus:** What is the "Main Character" of the paper? (The core problem it solves).
2. **Analyze Alignment:** Does the paper's "Main Character" match the Newsletter Topic?
3. **Threshold Check:** If you have to "stretch" the connection to make it fit, classify it as MEDIUM.

### Response Format
You must return your response in the following format:

reasonning: [1-2 sentences analyzing the alignment between the paper's core focus and the newsletter's scope.]
is_relevant: [yes/no]
"""

query_generator_prompt = """<role>
You are an expert Information Retrieval (IR) Specialist specializing in scientific literature. Your task is to generate three distinct search queries to find high-impact research papers based on a provided topic and description.
</role>

<instructions>
1. Analyze the topic and description for key technical terms, methodologies, and synonyms.
2. Generate exactly three queries with varying strategies:
   - **Query 1 (Broad/Semantic):** Uses the core concept and common synonyms.
   - **Query 2 (Technical/Specific):** Focuses on specific methodologies or niche terminology mentioned.
   - **Query 3 (Database-Optimized):** Uses a combination of terms likely to appear in titles and abstracts of peer-reviewed journals.
3. Queries need to be concise (5-8 words) and relevant to the topic.
</instructions>

<examples>
Input:
- topic: Mixed data clustering
- description: Papers on clustering of data with mixed numerical and categorical attributes.
Output: 
[
  "mixed data clustering algorithms", 
  "clustering datasets with heterogeneous numerical and categorical variables", 
  "unsupervised learning for mixed-type data"
]
</examples>

<task>
Generate the queries for the following:
- topic: {topic}
- description: {description}
</task>
"""