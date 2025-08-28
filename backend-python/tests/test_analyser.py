import unittest
from unittest.mock import patch, MagicMock
from analyser import analyze_paper

class TestAnalyser(unittest.TestCase):

    @patch('analyser.ChatOpenAI')
    async def test_analyze_paper_success(self, mock_chat_openai):
        mock_llm = MagicMock()
        mock_llm.ainvoke.return_value = {'synthesis': 'Test Synthesis', 'usefulness': 'Test Usefulness'}
        mock_chat_openai.return_value = mock_llm

        paper = {'title': 'Test Paper', 'abstract': 'Test Abstract', 'authors': []}
        analysis = await analyze_paper('test', paper)

        self.assertEqual(analysis['synthesis'], 'Test Synthesis')
        self.assertEqual(analysis['usefulness'], 'Test Usefulness')

if __name__ == '__main__':
    unittest.main()