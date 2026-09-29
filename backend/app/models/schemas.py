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


class ExplainRequest(BaseModel):
    text: str


class ExplainResponse(BaseModel):
    text: str
    explanation: str


class TranslateRequest(BaseModel):
    text: str
    target_language: str


class TranslateResponse(BaseModel):
    translation: str