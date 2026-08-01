"""
Pydantic schemas for the TravelTalk API.
"""
# pylint: disable=no-name-in-module,too-few-public-methods

from typing import Optional
from pydantic import BaseModel


class SpeakResponse(BaseModel):
    """Response schema for the /speak TTS endpoint."""
    audio_base64: str


class TranslateResponse(BaseModel):
    """Response schema for the /translate endpoint."""
    source_language: str
    transcription: Optional[str] = None  # only for voice input
    translation: str
    audio_base64: str