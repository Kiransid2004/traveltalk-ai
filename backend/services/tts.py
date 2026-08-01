import base64
import os
import tempfile
import edge_tts

VOICE_MAP = {
    "ta": "ta-IN-PallaviNeural",
    "en": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "bn": "bn-IN-TanishaaNeural",
    "te": "te-IN-ShrutiNeural",
    "mr": "mr-IN-AarohiNeural",
}

DEFAULT_VOICE = "en-US-EmmaMultilingualNeural"


async def synthesize(text: str, lang: str) -> str:
    """Returns base64-encoded MP3 audio."""
    voice = VOICE_MAP.get(lang, DEFAULT_VOICE)
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
            tmp_path = f.name
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(tmp_path)
        with open(tmp_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"TTS synthesis failed: {e}") from e
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

