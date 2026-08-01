---
title: TravelTalk AI Backend
emoji: 🌍
colorFrom: purple
colorTo: cyan
sdk: docker
pinned: false
app_port: 7860
---

# TravelTalk AI 🌍

AI-powered travel translator for Indian languages.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.12 |
| STT | Faster-Whisper (tiny, CPU) |
| Translation | deep-translator (Google Translate) |
| TTS | Microsoft Edge TTS |

## Supported Languages (Input)

Hindi, Bengali, Telugu, Marathi, Tamil, and 100+ more (auto-detected)

## Output Languages

- Tamil (`ta`)
- English (`en`)

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API

`POST /api/translate`

Form data:
- `target_language`: `ta` or `en`
- `text` OR `audio` (multipart file)

Response:
```json
{
  "source_language": "hi",
  "transcription": "मुझे भूख लगी है",
  "translation": "எனக்கு பசிக்கிறது",
  "audio_base64": "..."
}
```
