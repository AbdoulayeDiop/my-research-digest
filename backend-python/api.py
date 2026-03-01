from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from paper_search import SemanticSearch
from newsletter_creator import generate_queries
from datetime import datetime, timedelta
import logging
import asyncio
from auth import auth_verifier

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI(title="My Research Digest Python Service")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
