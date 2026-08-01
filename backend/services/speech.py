import tempfile
import os
from faster_whisper import WhisperModel

# tiny model: ~75MB, CPU-friendly on Render
_model = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel("tiny", device="cpu", compute_type="int8")
    return _model


def transcribe(audio_bytes: bytes) -> tuple[str, str]:
    """Returns (transcribed_text, detected_language_code).
    
    Accepts any audio format supported by ffmpeg (webm, mp4, wav, ogg, etc.)
    """
    model = get_model()

    # Use .webm suffix — browser MediaRecorder defaults to webm/opus
    # libav (used by faster-whisper) handles format auto-detection
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        segments, info = model.transcribe(tmp_path, beam_size=1, vad_filter=True)
        text = " ".join(seg.text for seg in segments).strip()
        lang = info.language or "und"
        if not text:
            text = ""
    finally:
        os.unlink(tmp_path)

    return text, lang
