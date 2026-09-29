import os

from groq import Groq


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def explain_text(text: str) -> str:
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": """
You are a legal terminology assistant.

Explain the selected text like a dictionary.

Rules:
- Give only 1-2 short sentences.
- Use simple language.
- Explain the legal meaning when applicable.
- Do not give legal advice.
- Do not invent laws, cases, sections, or facts.
- If the text is an ordinary word or phrase, simply explain its meaning.
- Return only the explanation. No headings, JSON, or quotation marks.
"""
            },
            {
                "role": "user",
                "content": f'Explain this selected text: "{text}"'
            }
        ],
        max_completion_tokens=120,
        reasoning_effort="low"
    )

    return response.choices[0].message.content.strip()
     


def translate_text(text: str, target_language: str) -> str:
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": f"""
Translate the provided text into {target_language}.

Rules:
- Preserve the meaning accurately.
- Keep legal terminology appropriate to the target language.
- Do not add explanations.
- Return only the translation.
"""
            },
            {
                "role": "user",
                "content": text
            }
        ],
        max_completion_tokens=200
    )

    return response.choices[0].message.content.strip()