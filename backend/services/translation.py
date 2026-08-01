from deep_translator import GoogleTranslator


def translate(text: str, target_lang: str, source_lang: str = "auto") -> str:
    """Translate text using Google Translate via deep-translator."""
    translator = GoogleTranslator(source=source_lang, target=target_lang)
    result = translator.translate(text)
    if result is None:
        raise ValueError(f"Translation returned no result for target='{target_lang}'")
    return result
