# My Research Digest

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automate your research discovery and stay up-to-date with personalized newsletters powered by AI.**

My Research Digest is an open-source application designed to help researchers, students, and professionals keep up with the latest scientific papers in their fields of interest. It automates the entire process of finding relevant papers, analyzing them, and delivering a curated digest to your inbox.

---

## 🚀 How It Works: The Paper Search and Ranking Pipeline

A key goal of My Research Digest is to provide a transparent and effective way to surface high-quality, relevant research. Our process is a multi-stage pipeline designed to ensure you get the best content.

### 1. AI-Powered Query Generation
- **Method:** An LLM generates multiple, diverse search queries based on your newsletter's topic and description.
- **Goal:** Covers the topic from various angles for a more comprehensive set of initial results.

### 2. Multi-Source Paper Search
- **Sources**: **Semantic Scholar** and **OpenAlex** — two complementary academic databases.
- **Method**: Searches are executed for all generated queries across both sources. Results are deduplicated by normalized title before proceeding.

### 3. AI-Powered Relevance Filtering
- **Method**: Each paper's title and abstract are passed to an LLM acting as an expert screener.
- **Goal**: Only papers deemed truly relevant to your topic are kept.

### 4. Ranking (Two Strategies)
You can choose between two ranking strategies per newsletter:
- **Author-based** *(default)*: `log1p(citations) + max_h_index` — prioritizes papers from established, highly-cited authors.
- **Embedding-based**: Cosine similarity between the paper's abstract embedding and your topic description — prioritizes semantic closeness to your stated interest.

The top-ranked papers are synthesized by the AI and compiled into your personalized newsletter.

For a detailed breakdown, see the [**Python backend documentation**](./docs/backend-python.md).

## ✨ Key Features

- **Personalized Newsletters**: Create newsletters for any research topic.
- **Automated Weekly Issues**: New issues are generated automatically every week.
- **Multi-Source Search**: Papers sourced from both Semantic Scholar and OpenAlex.
- **Two Ranking Strategies**: Author-based or embedding-based, configurable per newsletter.
- **AI-Powered Summaries**: Each paper is analyzed and summarized by an LLM.
- **Email Digests**: Full issue delivered to your inbox with a one-click "Mark as Read" action.
- **Smart Inactivity Management**: Newsletters are automatically paused after several consecutive unread issues to avoid generating content you don't need, with an advance warning email before any pause.
- **Saved Papers**: Bookmark interesting papers to a personal library that persists across newsletters.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend (API)**: Node.js, Express.js, MongoDB, Mongoose
- **Backend (Content Generation)**: Python, FastAPI, OpenAI Python SDK
- **Authentication**: Auth0 (JWT + M2M client credentials)
- **Infrastructure**: Docker, Nginx

## 🏁 Getting Started

The easiest way to get My Research Digest running locally is with Docker.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AbdoulayeDiop/my-research-digest.git
   cd my-research-digest
   ```

2. **Set up your environment:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your credentials (Auth0, OpenAI, SMTP, etc.).

3. **Launch the application:**
   ```bash
   docker-compose -f docker-compose-dev.yml up --build
   ```

The application will be available at `http://localhost`. For more detailed instructions, see the [**Contribution Guide**](./CONTRIBUTING.md).

## 🤝 We Welcome Contributions!

My Research Digest is an open-source project and we'd love your help to make it better. Whether you're a developer, a designer, or just have a great idea:

- **Report a bug**, **propose a feature**, or **start a discussion** by [opening an issue](https://github.com/AbdoulayeDiop/my-research-digest/issues).
- **Submit a pull request** following our [**Contribution Guide**](./CONTRIBUTING.md).

Every contribution is appreciated!

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
