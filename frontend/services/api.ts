export interface TranslateResponse {
  source_language: string;
  transcription?: string;
  translation: string;
  audio_base64: string;
}

export interface SpeakResponse {
  audio_base64: string;
}

// Bypass Vercel's 10-second timeout limit by calling the backend directly from the browser!
const API_BASE = process.env.NODE_ENV === "development" 
  ? "http://localhost:8000/api" 
  : "https://traveltalk-ai.onrender.com/api";

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

export async function speakText(
  text: string,
  language: string
): Promise<SpeakResponse> {
  const form = new FormData();
  form.append("text", text);
  form.append("language", language);

  const res = await fetch(`${API_BASE}/speak`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "TTS failed");
  }
  return res.json();
}
