"use client";

import { useState, useCallback } from "react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { translateText, translateAudio, TranslateResponse } from "@/services/api";

type Mode = "voice" | "text";
type Lang = "ta" | "en";

const LANG_LABELS: Record<Lang, string> = { ta: "Tamil", en: "English" };
const LANG_DISPLAY: Record<string, string> = {
  hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi",
  ta: "Tamil", en: "English", kn: "Kannada", ml: "Malayalam",
  gu: "Gujarati", pa: "Punjabi",
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("voice");
  const [targetLang, setTargetLang] = useState<Lang>("ta");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { play } = useAudioPlayer();

  const handleResult = useCallback((res: TranslateResponse) => {
    setResult(res);
    setError(null);
    setLoading(false);
    play(res.audio_base64);
  }, [play]);

  const handleError = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : "Something went wrong");
    setLoading(false);
  }, []);

  const { state: recState, start, stop, reset } = useVoiceRecorder(
    async (blob) => {
      try {
        const res = await translateAudio(blob, targetLang);
        handleResult(res);
        reset();
      } catch (e) {
        handleError(e);
        reset();
      }
    }
  );

  const handleTextTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await translateText(inputText.trim(), targetLang);
      handleResult(res);
    } catch (e) {
      handleError(e);
    }
  };

  const isRecording = recState === "recording";
  const isProcessing = recState === "processing" || loading;

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%), var(--bg)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          className="animate-float"
          style={{ fontSize: "2.5rem", marginBottom: "8px" }}
        >
          🌍
        </div>
        <h1
          className="gradient-text"
          style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.5px" }}
        >
          TravelTalk AI
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          Speak. Translate. Understand.
        </p>
      </div>

      {/* Card */}
      <div
        className="glass"
        style={{ width: "100%", maxWidth: "420px", padding: "28px 24px" }}
      >
        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "var(--surface2)",
            borderRadius: "14px",
            padding: "4px",
            marginBottom: "24px",
          }}
        >
          {(["voice", "text"] as Mode[]).map((m) => (
            <button
              key={m}
              id={`mode-${m}`}
              onClick={() => { setMode(m); setResult(null); setError(null); }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
                transition: "all 0.2s",
                background: mode === m
                  ? "linear-gradient(135deg, var(--accent), var(--accent2))"
                  : "transparent",
                color: mode === m ? "#fff" : "var(--muted)",
              }}
            >
              {m === "voice" ? "🎤 Voice" : "⌨️ Text"}
            </button>
          ))}
        </div>

        {/* Target Language */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Translate to
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {(["ta", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                id={`lang-${l}`}
                onClick={() => setTargetLang(l)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: `1px solid ${targetLang === l ? "var(--accent)" : "var(--border)"}`,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  transition: "all 0.2s",
                  background: targetLang === l ? "rgba(139,92,246,0.15)" : "transparent",
                  color: targetLang === l ? "var(--accent)" : "var(--muted)",
                }}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Mode */}
        {mode === "voice" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isRecording && (
                <div
                  className="animate-pulse-ring"
                  style={{
                    position: "absolute",
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    border: "2px solid var(--accent)",
                  }}
                />
              )}
              <button
                id="mic-button"
                onMouseDown={start}
                onMouseUp={stop}
                onTouchStart={(e) => { e.preventDefault(); start(); }}
                onTouchEnd={(e) => { e.preventDefault(); stop(); }}
                disabled={isProcessing}
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  border: "none",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  fontSize: "2rem",
                  transition: "all 0.2s",
                  background: isRecording
                    ? "linear-gradient(135deg, #ef4444, #dc2626)"
                    : "linear-gradient(135deg, var(--accent), var(--accent2))",
                  boxShadow: isRecording
                    ? "0 0 30px rgba(239,68,68,0.4)"
                    : "0 0 30px rgba(139,92,246,0.3)",
                  transform: isRecording ? "scale(1.1)" : "scale(1)",
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                {isRecording ? "🔴" : "🎤"}
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              {isProcessing
                ? "Processing…"
                : isRecording
                ? "Release to translate"
                : "Hold to speak"}
            </p>
          </div>
        )}

        {/* Text Mode */}
        {mode === "text" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <textarea
              id="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste text here…"
              rows={4}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px",
                color: "var(--text)",
                fontSize: "1rem",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              id="translate-button"
              onClick={handleTextTranslate}
              disabled={loading || !inputText.trim()}
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                cursor: loading || !inputText.trim() ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: "1rem",
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: "#fff",
                opacity: loading || !inputText.trim() ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Translating…" : "Translate →"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444",
              fontSize: "0.85rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "14px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {/* Detected Language */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Detected
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--accent2)",
                  background: "rgba(6,182,212,0.1)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                }}
              >
                {LANG_DISPLAY[result.source_language] ?? result.source_language.toUpperCase()}
              </span>
            </div>

            {/* Transcription (voice only) */}
            {result.transcription && (
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>
                "{result.transcription}"
              </p>
            )}

            {/* Translation */}
            <p style={{ fontSize: "1.2rem", fontWeight: 600, lineHeight: 1.5, color: "var(--text)" }}>
              {result.translation}
            </p>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                id="play-button"
                onClick={() => play(result.audio_base64)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
              >
                🔊 Play
              </button>
              <button
                id="copy-button"
                onClick={() => navigator.clipboard.writeText(result.translation)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}
      </div>

      <p style={{ marginTop: "20px", color: "var(--muted)", fontSize: "0.75rem" }}>
        Supports Hindi · Bengali · Telugu · Marathi · and 100+ more
      </p>
    </main>
  );
}
