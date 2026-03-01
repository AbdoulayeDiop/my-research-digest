# Project Memory: My Research Digest

## Project Overview
An AI-powered research digest that automatically synthesizes scientific papers from Semantic Scholar into weekly newsletters.

## Current Architecture

### 1. Backend (Management/Metadata): Node.js & MongoDB
- **Role**: Handles user management, newsletter metadata, issue history, and paper storage.
- **Tech Stack**: Express, Mongoose, Auth0 (express-oauth2-jwt-bearer), Nodemailer.
- **Key Models**: `User`, `Newsletter`, `Issue`, `Paper`, `Reading`.
- **Note**: OpenAI and Zod dependencies were removed to centralize LLM logic in the Python service.

### 2. Backend (Content Generation): Python (FastAPI)
- **Role**: Handles search query generation, paper filtering, analysis, and newsletter synthesis.
- **Tech Stack**: FastAPI, OpenAI SDK, Semantic Scholar API.
- **Key Components**:
  - `api.py`: Provides endpoints for search testing and query generation.
  - `newsletter_creator.py`: Main logic for synthesis, now supports updating the Node.js backend when queries are generated during the cycle.
  - `main.py`: Orchestrates the weekly processing cycle.
  - `paper_search.py`: Implements Semantic Scholar search with support for advanced filters (venues, citations, open access).

### 3. Frontend: React (TypeScript) & Tailwind CSS
- **Role**: User dashboard, newsletter configuration, and issue viewing.
- **Tech Stack**: Vite, React, Shadcn UI, Lucide React, Sonner (Toasts).
- **Key Features**:
  - `NewsletterPage`: A unified, tabbed interface consolidating `IssuesList` and `NewsletterSettings` for a better user experience.
  - `Dashboard`: Lists newsletters with status and strategy badges.
  - `useAxios`: Hook supporting multiple base URLs (Node vs. Python).

## Key Decisions & Evolution
- **LLM Centralization**: Moved all OpenAI-related tasks (query generation, analysis) to the Python backend to simplify the Node.js service.
- **Direct Python Communication**: Frontend now calls the Python API directly for "interactive" AI tasks like query generation and search testing to improve responsiveness.
- **Query Auto-Sync**: The Python generation cycle now automatically updates the Node.js database if it generates new queries for a newsletter that didn't have any.
- **UI Consistency**: Standardized `CardHeader` styles and improved "Test Search" feedback to show empty results for specific queries.

## Future Roadmap
- Implementation of "Mark as Read" analytics.
- Enhanced ranking strategies (Embedding-based).
- Support for more research databases.
