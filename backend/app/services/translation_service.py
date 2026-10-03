from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from IndicTransToolkit import IndicProcessor


# Models
EN_INDIC_MODEL = "ai4bharat/indictrans2-en-indic-dist-200M"
INDIC_EN_MODEL = "ai4bharat/indictrans2-indic-en-dist-200M"


# English → Indian languages
en_indic_tokenizer = AutoTokenizer.from_pretrained(
    EN_INDIC_MODEL,
    trust_remote_code=True
)

en_indic_model = AutoModelForSeq2SeqLM.from_pretrained(
    EN_INDIC_MODEL,
    trust_remote_code=True
)


# Indian languages → English
indic_en_tokenizer = AutoTokenizer.from_pretrained(
    INDIC_EN_MODEL,
    trust_remote_code=True
)

indic_en_model = AutoModelForSeq2SeqLM.from_pretrained(
    INDIC_EN_MODEL,
    trust_remote_code=True
)


processor = IndicProcessor(inference=True)


LANGUAGE_CODES = {
    "Hindi": "hin_Deva",
    "Marathi": "mar_Deva",
    "Malayalam": "mal_Mlym"
}


def translate_from_english(
    text: str,
    target_language: str
) -> str:

    if target_language == "English":
        return text

    if target_language not in LANGUAGE_CODES:
        raise ValueError(
            f"Unsupported language: {target_language}"
        )

    tgt_lang = LANGUAGE_CODES[target_language]

    batch = processor.preprocess_batch(
        [text],
        src_lang="eng_Latn",
        tgt_lang=tgt_lang
    )

    inputs = en_indic_tokenizer(
        batch,
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    outputs = en_indic_model.generate(
        **inputs,
        max_length=256
    )

    decoded = en_indic_tokenizer.batch_decode(
        outputs,
        skip_special_tokens=True
    )

    result = processor.postprocess_batch(
        decoded,
        lang=tgt_lang
    )

    return result[0]


def translate_to_english(
    text: str,
    source_language: str
) -> str:

    if source_language == "English":
        return text

    if source_language not in LANGUAGE_CODES:
        raise ValueError(
            f"Unsupported language: {source_language}"
        )

    src_lang = LANGUAGE_CODES[source_language]

    batch = processor.preprocess_batch(
        [text],
        src_lang=src_lang,
        tgt_lang="eng_Latn"
    )

    inputs = indic_en_tokenizer(
        batch,
        padding=True,
        truncation=True,
        return_tensors="pt"
    )

    outputs = indic_en_model.generate(
        **inputs,
        max_length=256
    )

    decoded = indic_en_tokenizer.batch_decode(
        outputs,
        skip_special_tokens=True
    )

    result = processor.postprocess_batch(
        decoded,
        lang="eng_Latn"
    )

    return result[0]