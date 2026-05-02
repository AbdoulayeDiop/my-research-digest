from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from paper_search import SemanticSearch
from newsletter_creator import generate_queries
from datetime import datetime, timedelta
import logging
import asyncio
import os
from contextlib import asynccontextmanager
from auth import auth_verifier
from worker_state import worker_state
from api_client import ApiClient
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the background newsletter generation loop
    from worker import main as run_newsletter_loop
    logging.info("Starting background newsletter generation loop...")
    loop_task = asyncio.create_task(run_newsletter_loop())
    
    yield
    
    # Shutdown: Cancel the background task
    logging.info("Shutting down background newsletter generation loop...")
    loop_task.cancel()
    try:
        await loop_task
    except asyncio.CancelledError:
        logging.info("Background newsletter generation loop cancelled.")

app = FastAPI(title="My Research Digest Python Service", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchFilters(BaseModel):
    venues: Optional[List[str]] = []
    publicationTypes: Optional[List[str]] = []
    minCitationCount: Optional[int] = 0
    openAccessPdf: Optional[bool] = False

class TestSearchRequest(BaseModel):
    queries: List[str]
    filters: Optional[SearchFilters] = None

class GenerateQueriesRequest(BaseModel):
    topic: str
    description: Optional[str] = ""

@app.post("/generate-queries")
async def generate_queries_endpoint(request: GenerateQueriesRequest, token_payload: dict = Depends(auth_verifier.verify)):
    try:
        logging.info(f"Generating queries for topic: {request.topic}")
        queries = generate_queries(request.topic, request.description)
        return {"queries": queries}
    except Exception as e:
        logging.error(f"Error in generate-queries endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-search")
async def test_search(request: TestSearchRequest, token_payload: dict = Depends(auth_verifier.verify)):
    try:
        logging.info(f"Authenticated request from user: {token_payload.get('sub')}")
        searcher = SemanticSearch()
        
        # Test search for the last 7 days
        now = datetime.now()
        end_date = now.strftime("%Y-%m-%d")
        start_date = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        
        filters_dict = request.filters.dict() if request.filters else {}
        
        results_by_query = []
        
        for i, query in enumerate(request.queries):
            # Respect rate limit (1 request/s)
            if i > 0:
                await asyncio.sleep(1)
                
            papers = searcher.search(
                query=query,
                start_date=start_date,
                nb_papers=5, # Limit per query for testing
                end_date=end_date,
                filters=filters_dict,
            )
            results_by_query.append({
                "query": query,
                "papers": papers,
                "count": len(papers)
            })
                
        return {
            "results": results_by_query
        }
    except Exception as e:
        logging.error(f"Error in test_search endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

_node_api_client = ApiClient(os.getenv('NODE_API_BASE_URL'))
_role_cache: dict = {}  # { auth0_id: (role, expires_at) }
_ROLE_CACHE_TTL = 300   # 5 minutes

def require_admin(token_payload: dict):
    sub = token_payload.get('sub')
    if not sub:
        raise HTTPException(status_code=403, detail="Admin access required")

    now = time.time()
    cached = _role_cache.get(sub)
    if cached and now < cached[1]:
        role = cached[0]
    else:
        user = _node_api_client.get_user_by_auth0_id(sub)
        role = user.get('role') if user else None
        _role_cache[sub] = (role, now + _ROLE_CACHE_TTL)

    if role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")


@app.get("/worker/status")
async def get_worker_status(token_payload: dict = Depends(auth_verifier.verify)):
    require_admin(token_payload)
    return {
        "status": worker_state.status,
        "cycle_started_at": worker_state.cycle_started_at,
        "cycle_completed_at": worker_state.cycle_completed_at,
        "next_cycle_at": worker_state.next_cycle_at,
        "total_newsletters": worker_state.total_newsletters,
        "processed_count": worker_state.processed_count,
        "current_newsletter_topic": worker_state.current_newsletter_topic,
        "current_step": worker_state.current_step,
        "cycle_log": worker_state.cycle_log,
    }


@app.post("/worker/trigger")
async def trigger_worker_cycle(token_payload: dict = Depends(auth_verifier.verify)):
    require_admin(token_payload)
    if worker_state.status == "running":
        raise HTTPException(status_code=409, detail="A cycle is already running")
    worker_state.manual_trigger = True
    return {"message": "Cycle triggered"}


@app.post("/worker/stop")
async def stop_worker_cycle(token_payload: dict = Depends(auth_verifier.verify)):
    require_admin(token_payload)
    if worker_state.status != "running":
        raise HTTPException(status_code=409, detail="No cycle is currently running")
    worker_state.should_stop = True
    worker_state.status = "stopping"
    return {"message": "Stop requested — will halt after current newsletter finishes"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
