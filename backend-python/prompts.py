sota_newsletter_prompt = """You are a domain expert writing a literature review for a technically sophisticated audience that already knows the basics. Your job is to synthesize, not summarize.

# Newsletter context
- Topic: {topic}
- Description: {description}

# Papers to review
{papers_list}

# Before you write
Privately identify the 2–4 strongest threads connecting these papers (shared method, dataset, problem, or finding — not just shared topic). Note which papers genuinely agree, which disagree, and which are outliers. Then write the review.

# Output
A cohesive Markdown review with exactly these three sections:

## Overview
(2–3 sentences)
State the dominant research direction of this period and the most significant tension, shift, or convergence visible across these papers. No filler openers like "this period saw activity in...".

## Key themes & methods
(250–400 words)
Identify 2–4 themes that group papers by *shared approach, problem, or finding* — not by surface topic. For each theme:
- Name it precisely ("Scaling sparse attention past 1M tokens", not "Long context").
- Explain what specifically unites the papers: architecture, dataset, evaluation, or claim.
- Cite each paper inline as [Short Label](url) on first mention, where Short Label is the paper's acronym or its first 2–3 distinctive words — never the full title. Examples: [BERAG], [Prism-Reranker], [Faithfulness-QA], [RAG-Reflect].
- Compare and contrast where the abstracts allow — flag disagreements, conflicting results, or methodological splits.

If two papers tackle the same problem differently, say how. Don't enumerate paper-by-paper.

## Emerging trends
(100–150 words)
Name 1–3 directions gaining momentum, distinguished from already-mainstream methods. Ground each in specific evidence from the cited papers (e.g., "three of these replace softmax attention with..."). Label speculation as such.

# Rules
- **Cite inline only** as [Short Label](url) — acronym or first 2–3 words. No bibliography. Every paper appears at least once.
- **Stay grounded.** Use only what the abstracts contain. Do not infer numbers, datasets, baselines, or comparisons that aren't stated.
- **Be concrete.** Name architectures, datasets, metrics, and percentages when the abstract gives them.
- **Avoid empty hype language**: "novel", "groundbreaking", "state-of-the-art", "significant improvements", "paradigm shift". Replace with specifics or cut.
- **Synthesize, don't enumerate.** "Paper A does X. Paper B does Y." is a failure mode — group, compare, contextualize instead.
- **Total length: 400–600 words** (excluding section headers).
- **Begin directly with the `## Overview` heading.** No preamble, no closing remarks.
"""

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
You are an expert at generating search queries for Semantic Scholar, a semantic search engine for academic papers.
</role>

<context>
The queries you generate will be run weekly to discover newly published papers on a recurring topic of interest. Results will be filtered for relevance afterward, so your priority is recall — it is better to cast slightly wide than to miss relevant papers.
</context>

<instructions>
1. Analyze the topic and description to identify the core concepts and their main facets.
2. Generate between one and three queries following these principles:
   - Each query must target a **distinct facet or angle** of the topic so that each one surfaces papers the others would likely miss.
   - Each query must be **short and semantically coherent**: Semantic Scholar uses semantic search, so natural concept-focused phrases outperform keyword lists.
   - Each query must be **durable**: formulated around the topic itself, not around specific known papers or methods, so it remains effective at capturing new publications week after week.
   - Do not mix multiple independent concepts or enumerate techniques in a single query.
</instructions>

<examples>
Input:
- topic: Mixed data clustering
- description: Papers on clustering of data with mixed numerical and categorical attributes.
Output:
[
  "clustering mixed numerical categorical data",
  "unsupervised learning heterogeneous data types",
  "mixed attribute clustering evaluation benchmarks"
]

Input:
- topic: LLM hallucination
- description: Understanding why large language models generate factually incorrect or fabricated content.
Output:
[
  "large language model hallucination factuality",
  "LLM factual inconsistency detection mitigation",
  "grounding and faithfulness in language model generation"
]

Input:
- topic: Transformer positional encoding
- description: Methods for encoding position information in transformer architectures.
Output:
[
  "positional encoding transformer architecture",
  "relative position representations attention mechanism"
]
</examples>

<task>
Generate the queries for the following:
- topic: {topic}
- description: {description}
</task>
"""