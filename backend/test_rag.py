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


PDF_PATH = "data/uploads/sample.pdf"


# Extract PDF text
text = extract_text_from_pdf(PDF_PATH)

print("\nExtracted characters:", len(text))


# Chunk document
chunks = chunk_text(text)

print("Number of chunks:", len(chunks))


# Generate embeddings
embeddings = generate_embeddings(chunks)

print("Embedding dimension:", len(embeddings[0]))


# Initialize vector database
initialize_collection(
    vector_size=len(embeddings[0])
)


# Store document
add_documents(
    embeddings,
    chunks,
    "sample.pdf"
)


# Ask question
query = input("\nAsk a question: ")

query_embedding = generate_query_embedding(query)


# Retrieve relevant chunks
results = search_documents(
    query_embedding,
    limit=5
)


print("\nRetrieved", len(results), "relevant chunks.")


# Generate grounded answer
answer = generate_answer(
    question=query,
    retrieved_chunks=results,
    language="English"
)


print("\n========== NYAYAVAANI ==========\n")
print(answer)