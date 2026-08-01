export interface TranslateResponse {
  source_language: string;
  transcription?: string;
  translation: string;
  audio_base64: string;
}

// Uses Next.js proxy rewrite: /api/* → backend:8000/api/*
const API_BASE = "/api";

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<TranslateResponse> {
  const form = new FormData();
  form.append("text", text);
  form.append("target_language", targetLanguage);

  const res = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Translation failed");
  }
  return res.json();
}

export async function translateAudio(
  audioBlob: Blob,
  targetLanguage: string
): Promise<TranslateResponse> {
  const form = new FormData();
  form.append("audio", audioBlob, "recording.webm");
  form.append("target_language", targetLanguage);

  const res = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Translation failed");
  }
  return res.json();
}
