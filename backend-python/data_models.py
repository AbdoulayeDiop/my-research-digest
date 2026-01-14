from pydantic import BaseModel, Field
from typing import Literal, List



class QueryGeneratorOutput(BaseModel):
    queries: List[str]

class RelevanceOutput(BaseModel):
    reasonning: str
    is_relevant: Literal["yes", "no"]

class PaperAnalyzerOutput(BaseModel):
    synthesis: str = Field(..., description="A brief synthesis of the paper. Explain the paper’s contribution in simple terms. (2–4 sentences)")
    usefulness: str = Field(..., description="Explain why the paper matters, particularly given the newsletter topic / why should the reader should read it? (1–3 sentences)")

class NewsletterWriterOutput(BaseModel):
    title: str = Field(..., description="A catchy and relevant title for the newsletter.")
    introduction: str = Field(..., description="A brief introduction for the newsletter.")
    conclusion: str = Field(..., description="A conclusion for the newsletter, summarizing key takeaways and identifying potential future trends.")