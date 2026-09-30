from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from IndicTransToolkit import IndicProcessor

MODEL_NAME = "ai4bharat/indictrans2-en-indic-dist-200M"

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True
)

processor = IndicProcessor(inference=True)

LANGUAGE_CODES = {
    "Hindi": "hin_Deva",
    "Marathi": "mar_Deva",
    "Malayalam": "mal_Mlym"
}


def translate_from_english(text: str, target_language: str) -> str:
    if target_language == "English":
        return text

    if target_language not in LANGUAGE_CODES:
        raise ValueError(f"Unsupported language: {target_language}")

    tgt_lang = LANGUAGE_CODES[target_language]

    batch = processor.preprocess_batch(
        [text],
        src_lang="eng_Latn",
        tgt_lang=tgt_lang
    )

    inputs = tokenizer(
        batch,
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    outputs = model.generate(
        **inputs,
        max_length=256
    )

    decoded = tokenizer.batch_decode(
        outputs,
        skip_special_tokens=True
    )

    result = processor.postprocess_batch(
        decoded,
        lang=tgt_lang
    )

    return result[0]