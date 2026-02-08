import requests
import logging
import os
import time
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

AUTH0_DOMAIN = os.getenv('AUTH0_DOMAIN')
AUTH0_AUDIENCE = os.getenv('AUTH0_AUDIENCE')
AUTH0_CLIENT_ID = os.getenv('AUTH0_PYTHON_CLIENT_ID')
AUTH0_CLIENT_SECRET = os.getenv('AUTH0_PYTHON_CLIENT_SECRET')

class ApiClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.token_expires_at = 0
        retry = Retry(
            total=10,
            read=5,
            connect=5,
            backoff_factor=2,
            status_forcelist=(429, 500, 502, 503, 504)
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)

    def _get_access_token(self):
        if self.token and time.time() < self.token_expires_at:
            return self.token

        logging.info("Fetching new Auth0 access token...")
        token_url = f"https://{AUTH0_DOMAIN}/oauth/token"
        headers = {'content-type': 'application/json'}
        payload = {
            'client_id': AUTH0_CLIENT_ID,
            'client_secret': AUTH0_CLIENT_SECRET,
            'audience': AUTH0_AUDIENCE,
            'grant_type': 'client_credentials'
        }
        try:
            response = requests.post(token_url, headers=headers, json=payload)
            response.raise_for_status()
            token_data = response.json()
            self.token = token_data['access_token']
            self.token_expires_at = time.time() + token_data['expires_in'] - 300  # Refresh 5 minutes before expiry
            logging.info("Auth0 access token fetched successfully.")
            return self.token
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching Auth0 access token: {e}")
            return None
        # return "token"

    def get_user_info(self, user_id):
        """Retrieves the email and name of a user from the backend API."""
        token = self._get_access_token()
        if not token:
            return None
        headers = {'Authorization': f'Bearer {token}'}
        try:
            response = self.session.get(f"{self.base_url}/users/{user_id}", headers=headers)
            response.raise_for_status()
            user_data = response.json()
            return {'email': user_data.get('email'), 'name': user_data.get('name')}
        except requests.exceptions.RequestException as e:
            logging.error(f"Error retrieving user {user_id} email and name: {e}")
            return None

    def get_newsletters(self):
        """Retrieves all newsletters from the backend API."""
        token = self._get_access_token()
        if not token:
            return None
        headers = {'Authorization': f'Bearer {token}'}
        try:
            response = self.session.get(f"{self.base_url}/newsletters", headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error retrieving newsletters: {e}")
            return None

    def get_latest_issue(self, newsletter_id):
        """Retrieves the latest issue for a given newsletter."""
        token = self._get_access_token()
        if not token:
            return None
        headers = {'Authorization': f'Bearer {token}'}
        try:
            response = self.session.get(f"{self.base_url}/newsletters/{newsletter_id}/issues?limit=1&sort=-publicationDate", headers=headers)
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
        token = self._get_access_token()
        if not token:
            return []
        headers = {'Authorization': f'Bearer {token}'}
        try:
            response = self.session.post(f"{self.base_url}/papers", json=papers, headers=headers)
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
        token = self._get_access_token()
        if not token:
            return None
        headers = {'Authorization': f'Bearer {token}'}
        try:
            response = self.session.post(f"{self.base_url}/newsletters/{newsletter_id}/issues", json=issue_data, headers=headers)
            response.raise_for_status()
            logging.info(f"Successfully created issue for newsletter {newsletter_id}")
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error creating issue for newsletter {newsletter_id}: {e}")
            return None

    def update_newsletter(self, newsletter_id, newsletter_data):
        """Updates a newsletter's information."""
        token = self._get_access_token()
        if not token:
            return None
        headers = {'Authorization': f'Bearer {token}'}
        try:
            response = self.session.put(f"{self.base_url}/newsletters/{newsletter_id}", json=newsletter_data, headers=headers)
            response.raise_for_status()
            logging.info(f"Successfully updated newsletter {newsletter_id}")
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error updating newsletter {newsletter_id}: {e}")
            return None
