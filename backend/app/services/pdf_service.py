import re
import pymupdf


def extract_pages_from_pdf(file_path: str) -> list[dict]:
    document = pymupdf.open(file_path)

    pages = []

    for page_number, page in enumerate(document, start=1):
        text = page.get_text("text").strip()

        if text:
            pages.append({
                "page": page_number,
                "text": text
            })

    document.close()
    return pages


def extract_text_from_pdf(file_path: str) -> str:
    pages = extract_pages_from_pdf(file_path)
    return "\n".join(page["text"] for page in pages)


def detect_section(text: str) -> str | None:
    patterns = [
        r"\bSection\s+\d+[A-Za-z]?",
        r"\bSECTION\s+\d+[A-Za-z]?",
        r"\bArticle\s+\d+[A-Za-z]?",
        r"\bARTICLE\s+\d+[A-Za-z]?"
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)

    return None


def chunk_text(
    pages: list[dict],
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> list[dict]:

    chunks = []
    chunk_index = 0

    for page in pages:
        words = page["text"].split()
        page_number = page["page"]

        start = 0
        current_section = None

        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk = " ".join(words[start:end]).strip()

            if not chunk:
                start += chunk_size - chunk_overlap
                continue

            detected_section = detect_section(chunk)

            if detected_section:
                current_section = detected_section

            chunks.append({
                "text": chunk,
                "page": page_number,
                "section": current_section,
                "chunk_index": chunk_index
            })

            chunk_index += 1
            start += chunk_size - chunk_overlap

    return chunks