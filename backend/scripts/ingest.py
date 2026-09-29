from pathlib import Path

from app.services.pdf_service import (
    extract_text_from_pdf,
    chunk_text
)

from app.services.embedding_service import (
    generate_embeddings
)

from app.services.vector_service import (
    initialize_collection,
    add_documents
)


UPLOAD_DIR = Path("data/uploads")


def ingest_pdf(pdf_path: Path):

    print(f"\nProcessing: {pdf_path.name}")

    text = extract_text_from_pdf(str(pdf_path))

    print(f"Extracted characters: {len(text)}")

    chunks = chunk_text(text)

    print(f"Created {len(chunks)} chunks")

    embeddings = generate_embeddings(chunks)

    print(f"Embedding dimension: {len(embeddings[0])}")

    initialize_collection(
        vector_size=len(embeddings[0])
    )

    add_documents(
        embeddings,
        chunks,
        pdf_path.name
    )

    print(f"✓ {pdf_path.name} indexed successfully")


if __name__ == "__main__":

    pdf_files = list(UPLOAD_DIR.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found.")
        exit()

    for pdf in pdf_files:
        ingest_pdf(pdf)

    print("\n✓ Ingestion complete.")