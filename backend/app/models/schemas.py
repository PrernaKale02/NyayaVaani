from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str
    language: str = "English"


class Source(BaseModel):
    id: int
    document: str
    chunk: int
    score: float
    text: str


class AskResponse(BaseModel):
    answer: str
    sources: list[Source] = []