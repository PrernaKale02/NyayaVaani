from pathlib import Path
import shutil
from fastapi import Form

from app.services.pdf_service import extract_pages_from_pdf, chunk_text

from fastapi import APIRouter, UploadFile, File, HTTPException

from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.firebase_service import verify_token
from app.services.reranker_service import rerank_documents

from app.services.translation_service import (
    translate_from_english,
    translate_to_english
)
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

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        return verify_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token."
        )

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["uid"]
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
        user_id
    )

    version = current_version + 1

    add_documents(
        embeddings,
        chunks,
        file.filename,
        user_id,
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
async def ask_question(
    request: AskRequest,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["uid"]

    search_question = translate_to_english(
        request.question,
        request.language
    )

    query_embedding = generate_query_embedding(search_question)

    results = search_documents(
        query_embedding,
        session_id=user_id,
        limit=10
    )
    results = rerank_documents(
        search_question,
        results,
        top_k=5
    )
    print("\nRERANKED RESULTS:")
    for i, result in enumerate(results, start=1):
        print(
            f"{i}. page={result.payload.get('page')} "
            f"section={result.payload.get('section')} "
            f"text={result.payload.get('text', '')[:120]}"
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
        question=search_question,
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

    translation = translate_from_english(
        text,
        request.target_language
    )

    return {
        "translation": translation
    }