from pydantic import BaseModel
from typing import Optional


class TranslateResponse(BaseModel):
    source_language: str
    transcription: Optional[str] = None  # only for voice input
    translation: str
    audio_base64: str
