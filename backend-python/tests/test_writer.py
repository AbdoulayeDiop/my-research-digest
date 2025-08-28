import unittest
from unittest.mock import patch, MagicMock
from writer import write_newsletter

class TestWriter(unittest.TestCase):

    @patch('writer.ChatOpenAI')
    def test_write_newsletter_success(self, mock_chat_openai):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = {'title': 'Test Title', 'introduction': 'Test Introduction', 'conclusion': 'Test Conclusion'}
        mock_chat_openai.return_value = mock_llm

        papers_with_analysis = [
            {
                'paper': {'title': 'Test Paper 1'},
                'analysis': {'synthesis': 'Test Synthesis 1', 'usefulness': 'Test Usefulness 1', 'pertinence': 5}
            },
            {
                'paper': {'title': 'Test Paper 2'},
                'analysis': {'synthesis': 'Test Synthesis 2', 'usefulness': 'Test Usefulness 2', 'pertinence': 4}
            }
        ]

        newsletter_data = write_newsletter('test', papers_with_analysis)

        self.assertEqual(newsletter_data['title'], 'Test Title')
        self.assertEqual(newsletter_data['introduction'], 'Test Introduction')
        self.assertEqual(newsletter_data['conclusion'], 'Test Conclusion')

if __name__ == '__main__':
    unittest.main()