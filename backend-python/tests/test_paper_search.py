import unittest
from unittest.mock import patch, MagicMock
from paper_search import SemanticSearch

class TestSemanticSearch(unittest.TestCase):

    def setUp(self):
        self.searcher = SemanticSearch()

    @patch('requests.get')
    def test_search_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'data': [{'title': 'Test Paper'}]}
        mock_get.return_value = mock_response

        papers = self.searcher.search('test', '2022-01-01', 10)
        self.assertEqual(papers, [{'title': 'Test Paper'}])

    @patch('requests.get')
    def test_search_failure(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response

        papers = self.searcher.search('test', '2022-01-01', 10)
        self.assertEqual(papers, [])

if __name__ == '__main__':
    unittest.main()