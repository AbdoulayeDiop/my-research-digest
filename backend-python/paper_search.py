import requests
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class PaperSearch(ABC):
    """
    Abstract base class for a paper searcher.
    """
    @abstractmethod
    def search(self, query: str, start_date: str, nb_papers: int, end_date: Optional[str] = None) -> List[Dict]:
        """
        Searches for papers matching the query and date range.

        Args:
            query: The search query.
            start_date: The start date of the search range (YYYY-MM-DD).
            nb_papers: The maximum number of papers to return.
            end_date: The end date of the search range (YYYY-MM-DD). Optional.

        Returns:
            A list of dictionaries, where each dictionary represents a paper.
        """
        pass

from config import FIELDS

class SemanticSearch(PaperSearch):
    """
    A paper searcher that uses the Semantic Scholar API.
    """
    def search(self, query: str, start_date: str, nb_papers: int, end_date: Optional[str] = None) -> List[Dict]:
        """
        Searches for papers using the Semantic Scholar API.

        Args:
            query: The search query.
            start_date: The start date of the search range (YYYY-MM-DD).
            nb_papers: The maximum number of papers to return.
            end_date: The end date of the search range (YYYY-MM-DD). Optional.

        Returns:
            A list of dictionaries, where each dictionary represents a paper.
        """
        url = f"https://api.semanticscholar.org/graph/v1/paper/search?query={query}&publicationDateOrYear={start_date}:{end_date or ''}&limit={nb_papers}&fields={FIELDS}"
        
        logging.info(f"Searching for papers with URL: {url}")
        response = requests.get(url)
        
        if response.status_code == 200:
            logging.info("Successfully retrieved papers from Semantic Scholar API.")
            data = response.json()
            return data.get('data', [])
            
        logging.error(f"Failed to retrieve papers from Semantic Scholar API. Status code: {response.status_code}")
        return []

if __name__ == "__main__":
    searcher = SemanticSearch()
    results = searcher.search("generative ai", "2025-08-17", 20, end_date="2025-08-23")
    for paper in results:
        print(paper)