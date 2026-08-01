"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useRef } from "react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { translateAudio, speakText, TranslateResponse } from "@/services/api";

type Mode = "voice" | "text";
type Lang = "ta" | "en";

const LANG_LABELS: Record<Lang, string> = { ta: "Tamil", en: "English" };
const LANG_DISPLAY: Record<string, string> = {
  hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi",
  ta: "Tamil", en: "English", kn: "Kannada", ml: "Malayalam",
  gu: "Gujarati", pa: "Punjabi",
};

// Languages available for Read Aloud (text mode)
const SPEAK_LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
];

const btnBase: React.CSSProperties = {
  border: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  WebkitTapHighlightColor: "rgba(139,92,246,0.3)",
  transition: "all 0.15s",
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("voice");
  const [targetLang, setTargetLang] = useState<Lang>("ta");
  const [speakLang, setSpeakLang] = useState("en");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<TranslateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { play } = useAudioPlayer();
  const isTouching = useRef(false);

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

  const { state: recState, start, stop, reset, init } = useVoiceRecorder(
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

  const handleSpeak = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await translateText(inputText.trim(), speakLang);
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
        <div className="animate-float" style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🌍</div>
        <h1 className="gradient-text" style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.5px" }}>
          TravelTalk AI
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>
          Speak. Translate. Understand.
        </p>
      </div>

      {/* Card */}
      <div className="glass" style={{ width: "100%", maxWidth: "420px", padding: "28px 24px" }}>

        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: "8px", background: "var(--surface2)", borderRadius: "14px", padding: "4px", marginBottom: "24px" }}>
          {(["voice", "text"] as Mode[]).map((m) => (
            <button
              key={m}
              id={`mode-${m}`}
              onClick={() => {
                setMode(m);
                setResult(null);
                setError(null);
                if (m === "voice") init();
              }}
              style={{
                ...btnBase,
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.9rem",
                background: mode === m
                  ? "linear-gradient(135deg, var(--accent), var(--accent2))"
                  : "transparent",
                color: mode === m ? "#fff" : "var(--muted)",
                boxShadow: mode === m ? "0 2px 12px rgba(139,92,246,0.4)" : "none",
              }}
            >
              {m === "voice" ? "🎤 Voice" : "💬 Read Aloud"}
            </button>
          ))}
        </div>

        {/* Voice Mode — Target Language */}
        {mode === "voice" && (
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
                    ...btnBase,
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: `1px solid ${targetLang === l ? "var(--accent)" : "var(--border)"}`,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    background: targetLang === l ? "rgba(139,92,246,0.2)" : "transparent",
                    color: targetLang === l ? "var(--accent)" : "var(--muted)",
                    boxShadow: targetLang === l ? "0 0 0 1px var(--accent)" : "none",
                  }}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Voice Mode — Mic */}
        {mode === "voice" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isRecording && (
                <div
                  className="animate-pulse-ring"
                  style={{ position: "absolute", width: "100px", height: "100px", borderRadius: "50%", border: "2px solid var(--accent)" }}
                />
              )}
              <button
                id="mic-button"
                onTouchStart={(e) => { e.preventDefault(); isTouching.current = true; start(); }}
                onTouchEnd={(e) => { e.preventDefault(); stop(); }}
                onTouchCancel={(e) => { e.preventDefault(); stop(); }}
                onMouseDown={() => { if (!isTouching.current) start(); }}
                onMouseUp={() => { if (!isTouching.current) stop(); }}
                onMouseLeave={() => { if (!isTouching.current && isRecording) stop(); }}
                disabled={isProcessing}
                style={{
                  ...btnBase,
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  fontSize: "2rem",
                  background: isRecording
                    ? "linear-gradient(135deg, #ef4444, #dc2626)"
                    : "linear-gradient(135deg, var(--accent), var(--accent2))",
                  boxShadow: isRecording
                    ? "0 0 30px rgba(239,68,68,0.5)"
                    : "0 0 30px rgba(139,92,246,0.4)",
                  transform: isRecording ? "scale(1.12)" : "scale(1)",
                  opacity: isProcessing ? 0.5 : 1,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                {isProcessing ? "⏳" : isRecording ? "🔴" : "🎤"}
              </button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              {isProcessing ? "Processing…" : isRecording ? "Release to translate" : "Hold to speak"}
            </p>
          </div>
        )}

        {/* Text Mode — Read Aloud */}
        {mode === "text" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Language to read in
            </p>
            {/* Language pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
              {SPEAK_LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setSpeakLang(l.code)}
                  style={{
                    ...btnBase,
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    border: `1px solid ${speakLang === l.code ? "var(--accent)" : "var(--border)"}`,
                    background: speakLang === l.code ? "rgba(139,92,246,0.2)" : "transparent",
                    color: speakLang === l.code ? "var(--accent)" : "var(--muted)",
                    boxShadow: speakLang === l.code ? "0 0 0 1px var(--accent)" : "none",
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <textarea
              id="text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type what you want to say in ${SPEAK_LANGS.find(l => l.code === speakLang)?.label ?? speakLang}…`}
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
              id="speak-button"
              onClick={handleSpeak}
              disabled={loading || !inputText.trim()}
              style={{
                ...btnBase,
                padding: "14px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "1rem",
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: "#fff",
                opacity: loading || !inputText.trim() ? 0.5 : 1,
                cursor: loading || !inputText.trim() ? "not-allowed" : "pointer",
                boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
              }}
            >
              {loading ? "Generating audio…" : "🔊 Read Aloud"}
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Detected</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--accent2)", background: "rgba(6,182,212,0.1)", padding: "2px 8px", borderRadius: "6px" }}>
                {LANG_DISPLAY[result.source_language] ?? result.source_language.toUpperCase()}
              </span>
            </div>

            {result.transcription && (
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", fontStyle: "italic" }}>
                "{result.transcription}"
              </p>
            )}

            <p style={{ fontSize: "1.2rem", fontWeight: 600, lineHeight: 1.5, color: "var(--text)" }}>
              {result.translation}
            </p>

            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                id="play-button"
                onClick={() => play(result.audio_base64)}
                style={{ ...btnBase, flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.85rem", fontWeight: 600 }}
              >
                🔊 Play
              </button>
              <button
                id="copy-button"
                onClick={() => navigator.clipboard.writeText(result.translation)}
                style={{ ...btnBase, flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "0.85rem", fontWeight: 600 }}
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
