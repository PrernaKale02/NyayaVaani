from uuid import uuid5, NAMESPACE_DNS

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct


COLLECTION_NAME = "nyayavaani_documents"

client = QdrantClient(path="./qdrant_data")


def initialize_collection(vector_size: int):
    collections = client.get_collections().collections

    exists = any(
        collection.name == COLLECTION_NAME
        for collection in collections
    )

    if not exists:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE
            )
        )


def add_documents(
    embeddings: list[list[float]],
    chunks: list[dict],
    document_name: str,
    version: int = 1
):
    points = []

    for embedding, chunk in zip(embeddings, chunks):
        chunk_index = chunk["chunk_index"]

        point_id = str(
            uuid5(
                NAMESPACE_DNS,
                f"{document_name}-v{version}-{chunk_index}"
            )
        )

        points.append(
            PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "text": chunk["text"],
                    "document": document_name,
                    "document_id": document_name,
                    "version": version,
                    "page": chunk["page"],
                    "section": chunk["section"],
                    "chunk_index": chunk_index
                }
            )
        )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )


def search_documents(
    query_embedding: list[float],
    limit: int = 5
):
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        limit=limit
    )

    return results.points