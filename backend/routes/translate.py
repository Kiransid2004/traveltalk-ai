import asyncio
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from models.schemas import TranslateResponse, SpeakResponse
from services import speech, translation, tts, ocr

router = APIRouter()


@router.post("/speak")
async def speak_endpoint(
    text: str = Form(...),
    language: str = Form(...),
):
    """TTS-only: read aloud the given text in the given language."""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")
    audio_b64 = await tts.synthesize(text.strip(), language)
    return SpeakResponse(audio_base64=audio_b64)


@router.post("/translate", response_model=TranslateResponse)
async def translate_endpoint(
    target_language: str = Form(...),
    text: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
):
    if not text and not audio:
        raise HTTPException(status_code=400, detail="Provide 'text' or 'audio'")

    transcription: Optional[str] = None
    source_lang = "auto"

    # --- Voice path: Whisper detects language reliably ---
    if audio:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        transcription, source_lang = await asyncio.to_thread(
            speech.transcribe, audio_bytes
        )
        if not transcription:
            raise HTTPException(status_code=400, detail="No speech detected in audio")
        input_text = transcription
    else:
        # --- Text path: pass 'auto' so Google detects language server-side ---
        input_text = text
        source_lang = "auto"

    # Translate
    try:
        translated = await asyncio.to_thread(
            translation.translate, input_text, target_language, "auto"
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # TTS
    audio_b64 = await tts.synthesize(translated, target_language)

    return TranslateResponse(
        source_language=source_lang,
        transcription=transcription,
        translation=translated,
        audio_base64=audio_b64,
    )

@router.post("/translate/image", response_model=TranslateResponse)
async def translate_image_endpoint(
    target_language: str = Form(...),
    image: UploadFile = File(...),
):
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image file is empty")

    try:
        # Extract text using OCR
        extracted_text = await asyncio.to_thread(ocr.extract_text, image_bytes)
        if not extracted_text:
            raise HTTPException(status_code=400, detail="No text detected in image")

        # Translate extracted text
        translated = await asyncio.to_thread(
            translation.translate, extracted_text, target_language, "auto"
        )
        
        # TTS for the translated text
        audio_b64 = await tts.synthesize(translated, target_language)

        return TranslateResponse(
            source_language="auto",
            extracted_text=extracted_text,
            translation=translated,
            audio_base64=audio_b64,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
