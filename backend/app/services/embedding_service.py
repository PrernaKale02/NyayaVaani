from sentence_transformers import SentenceTransformer

MODEL_NAME = "BAAI/bge-m3"

model = SentenceTransformer(MODEL_NAME)


def generate_embeddings(texts: list[str]):
    embeddings = model.encode(
        texts,
        batch_size=8,
        normalize_embeddings=True,
        show_progress_bar=True
    )
    return embeddings.tolist()


def generate_query_embedding(query: str):
    embedding = model.encode(
        query,
        normalize_embeddings=True
    )

    return embedding.tolist()