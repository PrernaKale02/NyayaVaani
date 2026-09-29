from app.services.embedding_service import (
    generate_query_embedding
)

from app.services.vector_service import (
    search_documents
)

from app.services.llm_service import (
    generate_answer
)


def ask_question(question: str):

    query_embedding = generate_query_embedding(
        question
    )

    results = search_documents(
        query_embedding,
        limit=5
    )

    print(f"\nRetrieved {len(results)} chunks.")

    answer = generate_answer(
        question=question,
        retrieved_chunks=results,
        language="English"
    )

    print("\n========== NYAYAVAANI ==========\n")
    print(answer)


if __name__ == "__main__":

    question = input("\nAsk a question: ")

    ask_question(question)