from pydantic import BaseModel, Field
from typing import Literal, List



class QueryGeneratorOutput(BaseModel):
    queries: List[str]

class RelevanceOutput(BaseModel):
    is_relevant: Literal["yes", "no"]
    reason: str = Field(
        description="One sentence on why the paper's primary contribution does "
                    "or does not fall inside the newsletter's scope."
    )

class PaperAnalyzerOutput(BaseModel):
    synthesis: str = Field(..., description="A brief synthesis of the paper. Explain the paper’s contribution in simple terms. (2–4 sentences)")
    usefulness: str = Field(..., description="Explain why the paper matters, particularly given the newsletter topic / why should the reader should read it? (1–3 sentences)")

class NewsletterWriterOutput(BaseModel):
    title: str = Field(..., description="A concise, descriptive title for the review.")
    introduction: str = Field(..., description="A brief introduction for the newsletter.")
    conclusion: str = Field(..., description="A conclusion for the newsletter, summarizing key takeaways and identifying potential future trends.")

class SotANewsletterOutput(BaseModel):
    title: str = Field(..., description="A concise, descriptive title for the review.")
    content_markdown: str = Field(..., description="Full state-of-the-art review in Markdown with inline [Title](url) citations.")