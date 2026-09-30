from pathlib import Path
import shutil
from fastapi import Form

from app.services.pdf_service import extract_pages_from_pdf, chunk_text

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.schemas import (
    AskRequest,
    AskResponse,
    ExplainRequest,
    ExplainResponse,
    TranslateRequest,
    TranslateResponse
)
from app.services.groq_service import (
    explain_text,
    translate_text
)

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.services.pdf_service import (
    extract_text_from_pdf,
    chunk_text
)

from app.services.embedding_service import (
    generate_embeddings,
    generate_query_embedding
)

from app.services.vector_service import (
    initialize_collection,
    add_documents,
    search_documents,
    get_document_version
)

from app.services.llm_service import generate_answer


router = APIRouter()

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = Form(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pages = extract_pages_from_pdf(str(file_path))

    if not pages:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from PDF."
        )

    chunks = chunk_text(pages)
    texts = [chunk["text"] for chunk in chunks]

    embeddings = generate_embeddings(texts)

    initialize_collection(len(embeddings[0]))

    current_version = get_document_version(
        file.filename,
        session_id
    )

    version = current_version + 1

    add_documents(
        embeddings,
        chunks,
        session_id,
        file.filename,
        version
    )

    return {
        "message": "Document indexed successfully",
        "document": file.filename,
        "version": version,
        "pages": len(pages),
        "chunks_added": len(chunks),
        "session_id": session_id,
        "incremental": True
    }


@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    query_embedding = generate_query_embedding(request.question)

    results = search_documents(
        query_embedding,
        session_id=request.session_id,
        limit=10
    )

    if not results:
        return AskResponse(
            answer="I could not find relevant information.",
            sources=[]
        )

    sources = []

    for i, result in enumerate(results, start=1):
        sources.append({
            "id": i,
            "document": result.payload["document"],
            "page": result.payload.get("page"),
            "section": result.payload.get("section"),
            "chunk": result.payload["chunk_index"],
            "score": float(result.score) if result.score is not None else 0.0,
            "text": result.payload["text"],
        })

    answer = generate_answer(
        question=request.question,
        retrieved_chunks=results,
        language=request.language
    )

    return AskResponse(
        answer=answer,
        sources=sources
    )

@router.post("/explain", response_model=ExplainResponse)
async def explain_selected_text(request: ExplainRequest):

    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="No text selected."
        )

    if len(text) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Please select a shorter piece of text."
        )

    explanation = explain_text(text)

    return {
        "text": text,
        "explanation": explanation
    }


@router.post("/translate", response_model=TranslateResponse)
async def translate_selected_text(request: TranslateRequest):

    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="No text provided."
        )

    translation = translate_text(
        text,
        request.target_language
    )

    return {
        "translation": translation
    }