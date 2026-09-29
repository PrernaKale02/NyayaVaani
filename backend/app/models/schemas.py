from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str
    language: str = "English"


class Source(BaseModel):
    id: int
    document: str
    page: int | None = None
    section: str | None = None
    chunk: int
    score: float
    text: str


class AskResponse(BaseModel):
    answer: str
    sources: list[Source] = []