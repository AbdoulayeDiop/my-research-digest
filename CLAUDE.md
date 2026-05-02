# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Research Digest is a three-service application that automatically searches academic papers and generates newsletter digests on user-defined research topics at a configurable frequency (weekly / bi-weekly / monthly).

## Services

### Frontend (`frontend/`)
React + TypeScript SPA built with Vite.

```bash
cd frontend
npm install
npm run dev        # dev server on :5173
npm run build      # tsc && vite build
npm run lint       # eslint
```

Environment: copy `.env.example` to `.env` and fill `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_REDIRECT_URI`, `VITE_AUTH0_AUDIENCE`, `VITE_NODE_API_BASE_URL`, `VITE_PYTHON_API_URL`.

### Backend Node.js (`backend-node/`)
Express 5 REST API backed by MongoDB/Mongoose. Handles all data persistence.

```bash
cd backend-node
npm install
npm run dev        # nodemon on :5000
npm start          # production
```

Start MongoDB locally:
```bash
cd backend-node
docker compose up -d   # starts MongoDB on :27017
```

Environment: copy `.env.example` to `.env`.

### Backend Python (`backend-python/`)
FastAPI service handling AI workloads (query generation, paper analysis, newsletter writing). Also runs the background worker loop.

```bash
cd backend-python
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn api:app --reload --port 8000   # API on :8000
python worker.py                        # standalone background worker
```

Run tests:
```bash
cd backend-python
pytest tests/
pytest tests/test_paper_search.py   # single test file
```

Environment: copy `.env.example` to `.env`.

## Architecture

### Authentication (Auth0 throughout)
- **Frontend**: `@auth0/auth0-react` wraps the entire app; tokens are passed as Bearer headers on all API calls.
- **Node.js**: `express-oauth2-jwt-bearer` validates JWTs on every protected route (`jwtCheck` middleware).
- **Python**: `PyJWT` + `VerifyToken` class in `auth.py` validates Auth0 JWTs using JWKS.
- **Python → Node.js**: The Python service uses Auth0 Machine-to-Machine (client credentials flow) to authenticate itself. The `adminOrBackendCheck` middleware in Node.js grants access when the JWT `sub` matches `AUTH0_PYTHON_CLIENT_ID`.
- **Admin routes**: Protected by `adminOrBackendCheck`, which allows either the Python backend client or users whose email is in `ADMIN_EMAILS`.

### Data Model (MongoDB)
```
User ──< Newsletter ──< Issue ──< Paper
                              └─< Reading
User ──< SavedPaper
```
- `Newsletter`: topic, description, search `queries[]`, `rankingStrategy` (`author_based` | `embedding_based`), `frequency` (`weekly` | `biweekly` | `monthly`), `filters` (venues, publicationTypes, minCitationCount, openAccessPdf), `lastSearch`.
- `Issue`: generated newsletter content (title, introduction, conclusion, contentMarkdown, summary).
- `Paper`: per-issue paper with AI-generated `synthesis` and `usefulness` fields.

### Newsletter Generation Pipeline (Python)

The background worker (`worker.py`) runs a 24-hour loop, iterating over all active newsletters. For each:

1. **Skip check**: if `lastSearch` (or latest issue date) is within the newsletter's `frequency` window (7 / 14 / 30 days), skip.
2. **Query generation** (if no stored queries): calls `NewsletterCreator.generate_queries()` via OpenAI structured output → saves queries back to Node.js API.
3. **Paper search**: `SemanticSearch` (Semantic Scholar API) and/or `OpenAlexSearch` (OpenAlex API), both implementing the `PaperSearch` ABC. Results are normalized to a common field schema defined in `config.py::FIELDS`. Duplicates are removed by normalizing titles.
4. **Relevance filtering**: parallel async OpenAI calls per paper using `paper_filterer_prompt`.
5. **Ranking** (two strategies):
   - `author_based`: `log1p(citations) + max_h_index`
   - `embedding_based`: cosine similarity between paper abstract embeddings and the topic description embedding.
6. **Analysis**: parallel async OpenAI calls per selected paper → synthesis + usefulness.
7. **Newsletter writing**: OpenAI call to generate title, introduction, conclusion → formatted Markdown.
8. **Persist**: creates Issue + Papers via Node.js REST API.
9. **Email**: sends HTML digest via SMTP (`send_email.py`). Emails include a HMAC-signed "Mark as Read" link (`URL_SIGNATURE_SECRET`).

The central orchestrator is `NewsletterCreator` in `newsletter_creator.py`. Steps 2–7 are all methods on that class.

The Python API (`api.py`) also exposes synchronous endpoints:
- `POST /generate-queries` — generate search queries for a topic.
- `POST /test-search` — test search against last-7-days papers.

### Python Backend File Map

| File | Role |
|------|------|
| `newsletter_creator.py` | `NewsletterCreator` class — orchestrates the full pipeline |
| `worker.py` | 24-hour async loop; inactivity detection; calls `newsletter_creator` |
| `prompts.py` | All LLM prompts as module-level strings with `.format()` placeholders |
| `data_models.py` | Pydantic output models for structured LLM responses |
| `paper_search.py` | `PaperSearch` ABC + `SemanticSearch` + `OpenAlexSearch` |
| `api_client.py` | HTTP client for Node.js API; Auth0 M2M token caching; exponential backoff |
| `config.py` | `FIELDS` constant — Semantic Scholar field list |
| `api.py` | FastAPI app; launches worker as background task on startup |
| `auth.py` | Auth0 JWT verification for FastAPI routes |
| `send_email.py` | SMTP HTML email sender |

### Extending the Pipeline

**New paper search engine**: subclass `PaperSearch`, implement `search(query, start_date, nb_papers, end_date, filters) -> List[Dict]`, normalize output to match the existing field schema, then register in `NewsletterCreator.search()`.

**New ranking strategy**: add a scoring function and an `elif` branch in `NewsletterCreator.create_newsletter()` where ranking happens.

**New pipeline step**: add an async method to `NewsletterCreator`, call it from `create_newsletter()`. Use `asyncio.gather()` for steps that are per-paper and IO-bound (LLM calls).

**New LLM prompt**: add a string to `prompts.py`, add a Pydantic model to `data_models.py`, call via `client.responses.parse()` with the model class.

### Newsletter Inactivity State Machine
`active` → (3 consecutive unread issues) → warning email sent → (4 consecutive unread) → `inactive` + pause email. Reading any issue resets the counter.

### Frontend Routes
| Path | Component |
|------|-----------|
| `/` | `Dashboard` (auth) or `LandingPage` (anon) |
| `/newsletters/:id` | `NewsletterPage` (issues list) |
| `/newsletters/:id/settings` | `NewsletterPage` (settings tab) |
| `/issues/:id` | `IssueDetail` |
| `/saved-papers` | `SavedPapers` |
| `/admin` | `AdminDashboard` |

UI components come from shadcn/ui (`frontend/src/components/ui/`). Auth state is managed via `useAuth0()`; user sync to MongoDB happens in the `useUserSync` hook.

### Node.js API Routes
All routes under `/api/` require JWT except `/api/public/issues/:id/mark-as-read`.

| Resource | Prefix | Notes |
|----------|--------|-------|
| Newsletters | `/api/newsletters` | CRUD; `/all` admin-only |
| Issues | `/api/issues` | CRUD |
| Papers | `/api/papers` | feedback (`like`/`dislike`/`heart`) |
| Users | `/api/users` | lookup by auth0Id |
| Public | `/api/public/issues` | mark-as-read with HMAC signature |

## Key Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `OPENAI_API_KEY` | Python | Paper filtering, analysis, newsletter writing |
| `SEMANTIC_SCHOLAR_API_KEY` | Python | Optional — higher rate limits |
| `OPENALEX_EMAIL` | Python | Polite pool access |
| `AUTH0_PYTHON_CLIENT_ID` / `SECRET` | Both | Python M2M credentials |
| `URL_SIGNATURE_SECRET` | Both | HMAC for email "mark as read" links |
| `NODE_API_BASE_URL` | Python | e.g. `http://localhost:5000/api` |
| `CORS_ORIGINS` | Node | Comma-separated allowed origins |
| `ADMIN_EMAILS` | Node | JSON array of admin emails |
