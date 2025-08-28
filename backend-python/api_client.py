import requests
import logging
import os
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        retry = Retry(
            total=3,
            read=3,
            connect=3,
            backoff_factor=0.3,
            status_forcelist=(500, 502, 504)
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

    def get_user_info(self, user_id):
        """Retrieves the email and name of a user from the backend API."""
        try:
            response = self.session.get(f"{self.base_url}/users/{user_id}")
            response.raise_for_status()
            user_data = response.json()
            return {'email': user_data.get('email'), 'name': user_data.get('name')}
        except requests.exceptions.RequestException as e:
            logging.error(f"Error retrieving user {user_id} email and name: {e}")
            return None

    def get_newsletters(self):
        """Retrieves all newsletters from the backend API."""
        try:
            response = self.session.get(f"{self.base_url}/newsletters")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error retrieving newsletters: {e}")
            return None

    def get_latest_issue(self, newsletter_id):
        """Retrieves the latest issue for a given newsletter."""
        try:
            response = self.session.get(f"{self.base_url}/newsletters/{newsletter_id}/issues?limit=1&sort=-publicationDate")
            response.raise_for_status()
            issues = response.json()
            return issues[0] if issues else None
        except requests.exceptions.RequestException as e:
            logging.error(f"Error retrieving latest issue for newsletter {newsletter_id}: {e}")
            return None

    def create_papers(self, papers):
        """
        Creates papers in the database through the backend API.
        The user needs to make sure the backend API supports this endpoint 
        and the paper model includes 'synthesis' and 'usefulness' fields.
        """
        try:
            response = self.session.post(f"{self.base_url}/papers", json=papers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error creating papers: {e}")
            return []

    def create_issue(self, newsletter_id, issue_data):
        """
        Creates a new issue for a newsletter through the backend API.
        The user needs to make sure the backend API supports this endpoint
        and the issue model includes 'introduction', 'conclusion', and 'contentMarkdown' fields.
        """
        try:
            response = self.session.post(f"{self.base_url}/newsletters/{newsletter_id}/issues", json=issue_data)
            response.raise_for_status()
            logging.info(f"Successfully created issue for newsletter {newsletter_id}")
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error creating issue for newsletter {newsletter_id}: {e}")
            return None
