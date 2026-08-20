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

class PaperEntry(BaseModel):
    paper_index: int = Field(..., description="1-based index of the paper as numbered in the input list")
    synthesis: str = Field(..., description="What the paper does, concretely")
    usefulness: str = Field(..., description="Why this specific paper is worth the reader's attention")

class ClassicNewsletterOutput(BaseModel):
    title: str = Field(..., description="Short editorial title for this issue. Not a paper title, no 'Research Digest' prefix.")
    introduction: str = Field(..., description="Frames what this batch collectively shows")
    entries: List[PaperEntry] = Field(..., description="Exactly one entry per input paper")
    reading_order: List[int] = Field(..., description="Every paper_index exactly once, in the order the entries should be presented: related papers adjacent, outliers last")
    conclusion: str = Field(..., description="Trends, tensions and splits visible across these papers")

class SotANewsletterOutput(BaseModel):
    title: str = Field(..., description="A concise, descriptive title for the review.")
    content_markdown: str = Field(..., description="Full state-of-the-art review in Markdown with inline [Title](url) citations.")