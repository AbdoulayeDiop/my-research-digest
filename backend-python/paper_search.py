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

def reconstruct_abstract(inverted_index: Dict[str, List[int]]) -> str:
    """
    Reconstructs the abstract from the OpenAlex inverted index format.
    """
    if not inverted_index:
        return ""
    
    # The inverted index is a dict where keys are words and values are lists of positions
    word_positions = []
    for word, positions in inverted_index.items():
        for pos in positions:
            word_positions.append((pos, word))
    
    # Sort by position and join words
    word_positions.sort()
    return " ".join([word for pos, word in word_positions])

class OpenAlexSearch(PaperSearch):
    """
    A paper searcher that uses the OpenAlex API.
    """
    def __init__(self, email: Optional[str] = None):
        # OpenAlex requests an email in the "mailto" parameter to enter their "polite pool" (faster/better limits)
        self.email = email or os.getenv("OPENALEX_EMAIL")
        if self.email:
            logging.info(f"OpenAlexSearch initialized in the polite pool with email: {self.email}")
        else:
            logging.warning("OpenAlexSearch initialized without email. You are in the 'public' pool.")

    def fetch_author_h_indexes(self, author_ids: List[str]) -> Dict[str, int]:
        """
        Fetches h-index for a list of OpenAlex author IDs in batches.
        """
        if not author_ids:
            return {}
        
        h_indexes = {}
        batch_size = 50
        for i in range(0, len(author_ids), batch_size):
            batch = author_ids[i:i + batch_size]
            clean_batch = [aid.split("/")[-1] for aid in batch]
            ids_str = "|".join(clean_batch)
            
            params = {"filter": f"openalex:{ids_str}"}
            if self.email:
                params["mailto"] = self.email
            
            try:
                response = requests.get("https://api.openalex.org/authors", params=params)
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    for author in results:
                        if not author: continue
                        h_index = author.get("summary_stats", {}).get("h_index", 0)
                        h_indexes[author.get("id")] = h_index
                else:
                    logging.error(f"Failed to fetch authors from OpenAlex: {response.status_code}")
            except Exception as e:
                logging.error(f"Error fetching author h-indexes: {e}")
        
        return h_indexes

    def search(self, query: str, start_date: str, nb_papers: int, end_date: Optional[str] = None, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Searches for papers using the OpenAlex API.
        """
        params = {
            "search": query,
            "per_page": nb_papers,
        }

        filter_parts = [f"from_publication_date:{start_date}"]
        if end_date:
            filter_parts.append(f"to_publication_date:{end_date}")
        
        if filters:
            if filters.get("openAccessPdf"):
                filter_parts.append("is_oa:true")

        params["filter"] = ",".join(filter_parts)
        
        if self.email:
            params["mailto"] = self.email

        logging.info(f"Searching OpenAlex with query: {query} and filters: {params['filter']}")
        
        try:
            response = requests.get("https://api.openalex.org/works", params=params)
            if response.status_code == 200:
                data = response.json().get('results', [])
                logging.info(f"Successfully retrieved {len(data)} papers from OpenAlex.")
                
                # First pass: collect all unique author IDs to fetch h-indexes in one go
                all_author_ids = set()
                for work in data:
                    if not work: continue
                    for au in work.get("authorships", []):
                        if not au: continue
                        author_id = au.get("author", {}).get("id")
                        if author_id:
                            all_author_ids.add(author_id)
                
                # Fetch h-indexes
                h_indexes = self.fetch_author_h_indexes(list(all_author_ids))
                
                # Transform OpenAlex format to match our internal 'FIELDS' (similar to Semantic Scholar)
                transformed_results = []
                for work in data:
                    if not work: continue
                    inverted_index = work.get("abstract_inverted_index")
                    abstract = reconstruct_abstract(inverted_index) if inverted_index else ""
                    
                    authors = []
                    for au in work.get("authorships", []):
                        if not au: continue
                        author_info = au.get("author", {})
                        author_id = author_info.get("id")
                        authors.append({
                            "name": author_info.get("display_name"),
                            "authorId": author_id,
                            "hIndex": h_indexes.get(author_id, 0)
                        })
                    
                    transformed_results.append({
                        "paperId": work.get("id"),
                        "title": work.get("title"),
                        "abstract": abstract,
                        "year": work.get("publication_year"),
                        "url": work.get("doi") or work.get("primary_location", {}).get("landing_page_url"),
                        "publicationDate": work.get("publication_date"),
                        "authors": authors,
                        "citationCount": work.get("cited_by_count", 0),
                        "venue": work.get("primary_location", {}).get("source", {}).get("display_name")
                    })
                return transformed_results
            else:
                logging.error(f"OpenAlex API error: {response.status_code} - {response.text}")
        except Exception as e:
            logging.error(f"Failed to query OpenAlex: {e}")
            
        return []

if __name__ == "__main__":
    searcher = SemanticSearch()
    results = searcher.search("clustering for mixed numerical and categorical features", "2025-02-05", 20, end_date="2026-01-12")
    for paper in results:
        print("\n##############################\n")
        print("title:", paper.get("title"))
        print("year:", paper.get("year"))
        print("abstract:", paper.get("abstract"))
