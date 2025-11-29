# Python Backend

The Python backend is the engine of My Research Digest. It is a standalone script that runs on a schedule (daily) to automatically generate new newsletter issues. It is not a web server; instead, it acts as a client to the Node.js backend to fetch data and post results.

## Tech Stack

-   **HTTP Client**: [requests](https://requests.readthedocs.io/en/latest/)
-   **LLM Integration**: [LangChain](https://www.langchain.com/)
-   **LLM Provider**: [OpenAI](https://openai.com/)
-   **Scientific Paper API**: [Semantic Scholar](https://www.semanticscholar.org/product/api)

## Workflow

The Python script (`main.py`) runs in an infinite loop with a 24-hour sleep interval. In each cycle, it performs the following steps:

1.  **Fetch Newsletters**: It calls the Node.js backend to get a list of all active newsletters.
2.  **Check for Updates**: For each newsletter, it checks the publication date of the latest issue. If an issue has been published within the last 7 days, it skips to the next newsletter.
3.  **Generate Newsletter**: If a new issue is needed, it triggers the `NewsletterCreator` to generate the content.
4.  **Create Issue and Papers**: The generated content (newsletter body and paper analyses) is posted to the Node.js backend, creating a new issue and its associated paper entries in the database.
5.  **Send Notification**: An email is sent to the newsletter's creator to notify them that a new issue is available.

## Paper Search and Ranking Strategy

The core of the Python backend is its strategy for finding and ranking relevant research papers. This is a multi-stage process designed to balance relevance, quality, and authoritativeness.

### 1. Initial Search (Broad Retrieval)

-   **Service**: The `SemanticSearch` class in `paper_search.py` is used.
-   **Source**: It queries the **Semantic Scholar API**.
-   **Method**: It performs a relevance search based on the newsletter's `topic`, leveraging Semantic Scholar's sophisticated two-phase approach. This involves an initial retrieval phase (Elasticsearch) followed by a reranking phase (LightGBM model) that considers various features like query matches in title, abstract, and venue, as well as recency and citation count. The search is limited to a specific date range (the last 7 days) and retrieves a maximum of 20 papers (`max_papers`). It requests a comprehensive set of fields for each paper, including author data like `citationCount` and `hIndex`.

### 2. Relevance Filtering (LLM-based)

-   **Service**: The `_filter_papers` method in `newsletter_creator.py`.
-   **Method**: The title and abstract of each paper from the initial search are passed to a Large Language Model (`gpt-4o-mini`). The model is asked to determine if the paper is relevant to the newsletter's topic, responding with a simple "yes" or "no".
-   **Outcome**: Papers that the LLM deems irrelevant are discarded. This step is crucial for refining the results of the broad keyword search and ensuring topical alignment.

### 3. Scoring and Ranking (Author-based)

-   **Service**: The `get_paper_score` function in `newsletter_creator.py`.
-   **Metric**: The score for each *filtered* paper is calculated using the following formula:
    ```
    score = mean(author_citation_counts) * mean(author_h_indices)
    ```
-   **Rationale**: This scoring model prioritizes papers from authors who are, on average, highly cited and have a high h-index. This serves as a proxy for the paper's potential impact and the authoritativeness of the research. It is a deliberate choice to favor papers from established and influential researchers.

### 4. Final Selection

-   The filtered papers are sorted in descending order based on their calculated score.
-   The top 5 papers (`nb_papers`) are selected for inclusion in the newsletter.

### 5. Analysis and Synthesis (LLM-based)

For each of the final 5 papers, the LLM is used again (`_analyze_papers`) to generate:
-   A **synthesis** of the paper's key findings.
-   A **usefulness** description.
-   A **pertinence score** out of 5.

This analysis is what gets displayed in the final newsletter issue.

## Transparency, Limitations and Future Work

-   **Transparency**: This multi-stage process is designed to be as transparent as possible. The combination of a broad search, LLM-based filtering, and a clear, author-based ranking metric provides a balanced approach to content curation.
-   **Limitations**:
    -   The reliance on author metrics (`citationCount`, `hIndex`) can create a "rich get richer" effect, potentially overlooking high-quality work from early-career researchers.
    -   The initial relevance search on Semantic Scholar, while sophisticated, is still dependent on the initial query and the underlying ranking model. It may not always surface all relevant papers, especially if the query terminology is not well-aligned with the paper's content and metadata.
    -   The LLM's relevance filtering and analysis are subjective and can sometimes be inconsistent.
-   **Future Work**:
    -   Incorporate paper-level metrics (e.g., citation velocity) into the scoring algorithm.
    -   Allow users to customize the ranking strategy (e.g., prioritize for novelty over authoritativeness).
    -   Augment the initial search step by using multiple query variations or by integrating a secondary search provider to increase diversity of results.
