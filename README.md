# My Research Digest

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automate your research discovery and stay up-to-date with personalized newsletters powered by AI.**

My Research Digest is an open-source application designed to help researchers, students, and professionals keep up with the latest scientific papers in their fields of interest. It automates the entire process of finding relevant papers, analyzing them, and delivering a curated digest to your inbox.

---

## 🚀 How It Works: The Paper Search and Ranking Strategy

A key goal of My Research Digest is to provide a transparent and effective way to surface high-quality, relevant research. We don't just do a simple keyword search. Our process is a multi-stage pipeline designed to ensure you get the best content.

### 1. AI-Powered Query Generation
-   **Method:** First, we use an LLM to generate multiple, diverse search queries based on your newsletter's topic and description.
-   **Goal:** This ensures we cover the topic from various angles, leading to a more comprehensive and relevant set of initial results.

### 2. Relevance-Based Search
-   **Source**: We use the **Semantic Scholar API**, which employs a sophisticated machine learning model to rank papers.
-   **Method**: We execute searches for all the generated queries, retrieving a broad set of potentially relevant papers from a specific date range.

### 3. AI-Powered Relevance Filtering
-   **Method**: The top papers from the search are then passed to a Large Language Model.
-   **Goal**: The LLM acts as an expert screener, reading the title and abstract of each paper to determine if it's truly a "must-read" for your topic.

### 4. Author-Based Scoring and Ranking
-   **Metric**: To prioritize papers from authoritative authors, we calculate a score for each paper using the formula: `score = mean(author_citation_counts) * mean(author_h_indices)`.
-   **Rationale**: This metric favors papers from established researchers, serving as a strong proxy for the paper's potential significance.

The top-ranked papers are then selected, synthesized by our AI, and compiled into your personalized newsletter.

For a more detailed breakdown, check out our [**full documentation on the Python backend**](./docs/backend-python.md).

## ✨ Key Features

-   **Personalized Newsletters**: Create newsletters for any research topic you can imagine.
-   **Automated Content Generation**: New issues are automatically generated on a weekly basis.
-   **AI-Powered Summaries**: Each paper is analyzed and summarized by an LLM to give you the key insights at a glance.
-   **Transparent Ranking**: Our multi-stage paper ranking strategy is designed to be clear and effective.
-   **User-Friendly Dashboard**: Manage your newsletters and read your digests from a clean and modern interface.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, TypeScript, Tailwind CSS
-   **Backend (API)**: Node.js, Express.js, MongoDB
-   **Backend (Content Generation)**: Python, OpenAI Python SDK
-   **Infrastructure**: Docker, Nginx

## 🏁 Getting Started

The easiest way to get My Research Digest running locally is with Docker.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AbdoulayeDiop/my-research-digest.git
    cd my-research-digest
    ```

2.  **Set up your environment:**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
    Then, open `.env` and add your credentials (e.g., for Auth0 and OpenAI).

3.  **Launch the application:**
    ```bash
    docker-compose -f docker-compose-dev.yml up --build
    ```

The application will be available at `http://localhost`. For more detailed instructions, please see our [**Contribution Guide**](./CONTRIBUTING.md).

## 🤝 We Welcome Contributions!

My Research Digest is an open-source project, and we would love your help to make it even better. Whether you're a developer, a designer, or just have a great idea, we invite you to contribute.

-   **Report a bug**, **propose a new feature**, or **start a discussion** by [opening an issue](https://github.com/AbdoulayeDiop/my-research-digest/issues).
-   **Submit a pull request** by following our [**Contribution Guide**](./CONTRIBUTING.md).

Every contribution is valuable and appreciated!

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
