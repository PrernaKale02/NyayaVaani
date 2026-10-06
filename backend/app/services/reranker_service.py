from sentence_transformers import CrossEncoder

MODEL_NAME = "BAAI/bge-reranker-v2-m3"

reranker = CrossEncoder(
    MODEL_NAME,
    max_length=512
)


def rerank_documents(query: str, results: list, top_k: int = 5):
    if not results:
        return []

    pairs = [
        (query, result.payload["text"])
        for result in results
    ]

    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(results, scores),
        key=lambda x: float(x[1]),
        reverse=True
    )

    return [result for result, _ in ranked[:top_k]]