import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")


def generate_answer(
    question: str,
    retrieved_chunks: list,
    language: str = "English"
) -> str:

    context_parts = []

    for i, chunk in enumerate(retrieved_chunks, start=1):
        text = chunk.payload["text"]
        document = chunk.payload["document"]
        chunk_index = chunk.payload["chunk_index"]

        context_parts.append(f"""
            SOURCE [{i}]
            Document: {document}
            Page: {chunk.payload.get("page")}
            Section: {chunk.payload.get("section")}
            Chunk: {chunk.payload.get("chunk_index")}
            {text}
            """)

    context = "\n".join(context_parts)

    prompt = f"""
You are NyayaVaani, a multilingual legal information assistant.

Your task is to answer the user's question using ONLY the
provided legal document context.

USER QUESTION:
{question}

RESPONSE LANGUAGE:
{language}

LEGAL CONTEXT:
{context}

INSTRUCTIONS:
1. Use only information supported by the provided legal context.
2. Do not invent legal provisions, sections, cases, or facts.
3. If the context does not contain enough information, clearly say so.
4. Explain legal terminology in simple language.
5. Write the entire answer in the requested response language.
6. Do not switch to English unless a legal term has no clear natural equivalent.
7. Preserve important legal terms in their original English form in parentheses when useful.
8. Cite supporting sources using [1], [2], etc.
9. Place citations immediately after the claim they support.
10. Do not create a separate Sources or Source Reference section.
11. Do not repeat the retrieved source text unnecessarily.
12. Do not present yourself as a lawyer.
13. Do not give a definitive legal opinion.
14. Clearly distinguish explanation from the source material.

The requested response language is: {language}

Return a concise, well-structured Markdown answer.
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )

    return response.text