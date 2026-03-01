import requests
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class PaperSearch(ABC):
    """
    Abstract base class for a paper searcher.
    """
    @abstractmethod
    def search(self, query: str, start_date: str, nb_papers: int, end_date: Optional[str] = None, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Searches for papers matching the query and date range.

        Args:
            query: The search query.
            start_date: The start date of the search range (YYYY-MM-DD).
            nb_papers: The maximum number of papers to return.
            end_date: The end date of the search range (YYYY-MM-DD). Optional.
            filters: Search filters.

        Returns:
            A list of dictionaries, where each dictionary represents a paper.
        """
        pass

from config import FIELDS

class SemanticSearch(PaperSearch):
    """
    A paper searcher that uses the Semantic Scholar API.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("SEMANTIC_SCHOLAR_API_KEY")
        if self.api_key:
            logging.info("SemanticSearch initialized with API key.")
        else:
            logging.warning("SemanticSearch initialized without API key. Rate limits may apply.")
    
    def search(self, query: str, start_date: str, nb_papers: int, end_date: Optional[str] = None, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Searches for papers using the Semantic Scholar API.

        Args:
            query: The search query.
            start_date: The start date of the search range (YYYY-MM-DD).
            nb_papers: The maximum number of papers to return.
            end_date: The end date of the search range (YYYY-MM-DD). Optional.
            filters: A dictionary containing search filters (venues, publicationTypes, minCitationCount, openAccessPdf).

        Returns:
            A list of dictionaries, where each dictionary represents a paper.
        """
        params = {
            "query": query,
            "publicationDateOrYear": f"{start_date}:{end_date or ''}",
            "limit": nb_papers,
            "fields": FIELDS
        }

        if filters:
            if filters.get("venues"):
                params["venue"] = ",".join(filters["venues"])
            
            if filters.get("publicationTypes"):
                params["publicationTypes"] = ",".join(filters["publicationTypes"])
            
            if filters.get("minCitationCount"):
                params["minCitationCount"] = str(filters["minCitationCount"])
            
            if filters.get("openAccessPdf"):
                params["openAccessPdf"] = "" # Presence of key means true for this API

        headers = {"x-api-key": self.api_key}

        logging.info(f"Searching for papers with query: {query} and filters: {filters}")
        response = requests.get("https://api.semanticscholar.org/graph/v1/paper/search", params=params, headers=headers)
        
        if response.status_code == 200:
            data = response.json().get('data', [])
            logging.info(f"Successfully retrieved {len(data)} papers from Semantic Scholar API.")
            return data
            
        logging.error(f"Failed to retrieve papers from Semantic Scholar API. Status code: {response.status_code}")
        return []

if __name__ == "__main__":
    searcher = SemanticSearch()
    results = searcher.search("clustering for mixed numerical and categorical features", "2025-02-05", 20, end_date="2026-01-12")
    for paper in results:
        print("\n##############################\n")
        print("title:", paper.get("title"))
        print("year:", paper.get("year"))
        print("abstract:", paper.get("abstract"))
