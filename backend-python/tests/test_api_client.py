import unittest
from unittest.mock import patch, MagicMock
from api_client import ApiClient

class TestApiClient(unittest.TestCase):

    def setUp(self):
        self.api_client = ApiClient(base_url="http://test.com")

    @patch('requests.Session.get')
    def test_get_user_info_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'email': 'test@test.com', 'name': 'Test User'}
        mock_get.return_value = mock_response

        user_info = self.api_client.get_user_info('123')
        self.assertEqual(user_info, {'email': 'test@test.com', 'name': 'Test User'})

    @patch('requests.Session.get')
    def test_get_user_info_failure(self, mock_get):
        mock_get.side_effect = requests.exceptions.RequestException("Test error")

        user_info = self.api_client.get_user_info('123')
        self.assertIsNone(user_info)

    @patch('requests.Session.get')
    def test_get_newsletters_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [{'topic': 'Test Topic'}]
        mock_get.return_value = mock_response

        newsletters = self.api_client.get_newsletters()
        self.assertEqual(newsletters, [{'topic': 'Test Topic'}])

    @patch('requests.Session.get')
    def test_get_newsletters_failure(self, mock_get):
        mock_get.side_effect = requests.exceptions.RequestException("Test error")

        newsletters = self.api_client.get_newsletters()
        self.assertIsNone(newsletters)

    @patch('requests.Session.get')
    def test_get_latest_issue_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [{'title': 'Test Issue'}]
        mock_get.return_value = mock_response

        latest_issue = self.api_client.get_latest_issue('123')
        self.assertEqual(latest_issue, {'title': 'Test Issue'})

    @patch('requests.Session.get')
    def test_get_latest_issue_failure(self, mock_get):
        mock_get.side_effect = requests.exceptions.RequestException("Test error")

        latest_issue = self.api_client.get_latest_issue('123')
        self.assertIsNone(latest_issue)

    @patch('requests.Session.post')
    def test_create_papers_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [{'title': 'Test Paper'}]
        mock_post.return_value = mock_response

        created_papers = self.api_client.create_papers([{'title': 'Test Paper'}])
        self.assertEqual(created_papers, [{'title': 'Test Paper'}])

    @patch('requests.Session.post')
    def test_create_papers_failure(self, mock_post):
        mock_post.side_effect = requests.exceptions.RequestException("Test error")

        created_papers = self.api_client.create_papers([{'title': 'Test Paper'}])
        self.assertEqual(created_papers, [])

    @patch('requests.Session.post')
    def test_create_issue_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'title': 'Test Issue'}
        mock_post.return_value = mock_response

        created_issue = self.api_client.create_issue('123', {'title': 'Test Issue'})
        self.assertEqual(created_issue, {'title': 'Test Issue'})

    @patch('requests.Session.post')
    def test_create_issue_failure(self, mock_post):
        mock_post.side_effect = requests.exceptions.RequestException("Test error")

        created_issue = self.api_client.create_issue('123', {'title': 'Test Issue'})
        self.assertIsNone(created_issue)

    @patch('requests.Session.get')
    def test_retry_logic(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response

        with self.assertRaises(requests.exceptions.RetryError):
            self.api_client.get_newsletters()

if __name__ == '__main__':
    unittest.main()