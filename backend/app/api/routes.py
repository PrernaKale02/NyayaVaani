from pathlib import Path
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models.schemas import AskRequest, AskResponse

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
    search_documents
)

from app.services.llm_service import generate_answer


router = APIRouter()

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_pdf(
        str(file_path)
    )

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from PDF."
        )

    chunks = chunk_text(text)

    embeddings = generate_embeddings(chunks)

    initialize_collection(
        vector_size=len(embeddings[0])
    )

    add_documents(
        embeddings,
        chunks,
        file.filename
    )

    return {
        "message": "Document indexed successfully",
        "document": file.filename,
        "chunks": len(chunks)
    }


@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    query_embedding = generate_query_embedding(request.question)

    results = search_documents(
        query_embedding,
        limit=5
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