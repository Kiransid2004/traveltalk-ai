"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback, useRef, useEffect } from "react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { translateText, translateAudio, TranslateResponse } from "@/services/api";

type Mode = "menu" | "voice" | "text";
type Lang = "ta" | "en";

type Message = {
  id: string;
  sender: "ME" | "Robot";
  text: string;
  audioBase64?: string;
  isProcessing?: boolean;
};

const LANG_LABELS: Record<Lang, string> = { ta: "Tamil", en: "English" };
const LANG_DISPLAY: Record<string, string> = {
  hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi",
  ta: "Tamil", en: "English", kn: "Kannada", ml: "Malayalam",
  gu: "Gujarati", pa: "Punjabi",
};

const SPEAK_LANGS = [
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
  const [mode, setMode] = useState<Mode>("menu");
  const [targetLang, setTargetLang] = useState<Lang>("ta");
  const [speakLang, setSpeakLang] = useState("en");
  const [inputText, setInputText] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [textResult, setTextResult] = useState<TranslateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { play } = useAudioPlayer();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const initVoiceChat = useCallback(() => {
    setMode("voice");
    setChatHistory([
      { id: "greeting", sender: "Robot", text: `Hello! Tap the microphone and say something. I will translate it to ${LANG_LABELS[targetLang]}.` }
    ]);
    setError(null);
  }, [targetLang]);

  useEffect(() => {
    if (mode === "voice" && chatHistory.length <= 1) {
       setChatHistory([
        { id: "greeting", sender: "Robot", text: `Hello! Tap the microphone and say something. I will translate it to ${LANG_LABELS[targetLang]}.` }
      ]);
    }
  }, [targetLang, mode]);

  const { state: recState, start, stop, reset, init } = useVoiceRecorder(
    async (blob) => {
      const processingId = Date.now().toString();
      setChatHistory(prev => [...prev, { id: processingId, sender: "ME", text: "🎙️ Processing...", isProcessing: true }]);
      
      try {
        const res = await translateAudio(blob, targetLang);
        setChatHistory(prev => prev.map(msg => 
          msg.id === processingId ? { ...msg, text: res.transcription || "🗣️ (Voice)", isProcessing: false } : msg
        ));
        
        setChatHistory(prev => [...prev, {
          id: Date.now().toString() + "-bot",
          sender: "Robot",
          text: res.translation,
          audioBase64: res.audio_base64
        }]);
        
        play(res.audio_base64);
        reset();
      } catch (e) {
        setChatHistory(prev => prev.filter(msg => msg.id !== processingId));
        setError(e instanceof Error ? e.message : "Something went wrong");
        reset();
      }
    }
  );

  const handleSpeakText = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setTextResult(null);
    setError(null);
    try {
      const res = await translateText(inputText.trim(), speakLang);
      setTextResult(res);
      play(res.audio_base64);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
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
        background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%), var(--bg)",
      }}
    >
      {/* ─── MENU MODE ─── */}
      {mode === "menu" && (
        <div className="animate-fade-in" style={{ textAlign: "center", width: "100%", maxWidth: "420px" }}>
          <div className="animate-float" style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🌍</div>
          <h1 className="gradient-text" style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.5px", marginBottom: "8px" }}>
            TravelTalk AI
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1rem", marginBottom: "48px" }}>
            Speak. Translate. Understand.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <button
              onClick={() => { init(); initVoiceChat(); }}
              className="glass"
              style={{ ...btnBase, padding: "24px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "16px", background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <div style={{ fontSize: "2.5rem" }}>🎤</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--text)" }}>Voice Chat</div>
                <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>Talk to the AI for instant translation</div>
              </div>
            </button>
            
            <button
              onClick={() => { setMode("text"); setTextResult(null); setError(null); }}
              className="glass"
              style={{ ...btnBase, padding: "24px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "16px", border: "1px solid var(--border)" }}
            >
              <div style={{ fontSize: "2.5rem" }}>💬</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--text)" }}>Read Aloud</div>
                <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>Type text to be spoken in another language</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ─── SHARED HEADER FOR VOICE/TEXT MODES ─── */}
      {mode !== "menu" && (
        <div className="animate-fade-in" style={{ width: "100%", maxWidth: "420px", display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <button
            onClick={() => setMode("menu")}
            style={{ ...btnBase, background: "transparent", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px", padding: "8px", fontWeight: 500 }}
          >
            ← Exit to Menu
          </button>
          <div style={{ flex: 1 }} />
          {mode === "voice" && (
            <div style={{ display: "flex", gap: "4px", background: "var(--surface)", padding: "4px", borderRadius: "20px" }}>
              {(["ta", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setTargetLang(l)}
                  style={{
                    ...btnBase,
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    background: targetLang === l ? "var(--accent)" : "transparent",
                    color: targetLang === l ? "#fff" : "var(--muted)",
                    border: "none"
                  }}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── VOICE CHAT MODE ─── */}
      {mode === "voice" && (
        <div className="glass animate-fade-in" style={{ width: "100%", maxWidth: "420px", height: "70vh", display: "flex", flexDirection: "column", borderRadius: "24px", overflow: "hidden", position: "relative" }}>
          {/* Chat History Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {chatHistory.map((msg) => (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "ME" ? "flex-end" : "flex-start" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "6px", marginLeft: "8px", marginRight: "8px", fontWeight: 600 }}>
                  {msg.sender === "ME" ? "ME 🗣️" : "🤖 Robot"}
                </span>
                <div style={{
                  maxWidth: "85%",
                  padding: "12px 16px",
                  borderRadius: msg.sender === "ME" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                  background: msg.sender === "ME" ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--surface2)",
                  color: msg.sender === "ME" ? "#fff" : "var(--text)",
                  fontSize: "1rem",
                  lineHeight: 1.5,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  opacity: msg.isProcessing ? 0.7 : 1
                }}>
                  {msg.text}
                  {msg.audioBase64 && (
                    <button
                      onClick={() => play(msg.audioBase64!)}
                      style={{ ...btnBase, display: "flex", alignItems: "center", gap: "6px", marginTop: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "20px", padding: "6px 12px", color: "inherit", fontSize: "0.85rem", fontWeight: 500 }}
                    >
                      ▶ Replay Voice
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Area */}
          <div style={{ padding: "20px", background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
            {error && <div style={{ color: "var(--error)", fontSize: "0.85rem", marginBottom: "12px" }}>{error}</div>}
            
            <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {isRecording && (
                <div className="animate-pulse-ring" style={{ position: "absolute", width: "90px", height: "90px", borderRadius: "50%", border: "2px solid var(--accent)" }} />
              )}
              <button
                onClick={() => {
                  if (isRecording) {
                    stop();
                  } else if (!isProcessing) {
                    start();
                  }
                }}
                disabled={isProcessing && !isRecording}
                style={{
                  ...btnBase,
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: isRecording ? "var(--error)" : isProcessing ? "var(--surface2)" : "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: "#fff",
                  fontSize: "1.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isRecording ? "0 4px 16px rgba(239,68,68,0.4)" : "0 4px 16px rgba(139,92,246,0.3)",
                  zIndex: 2,
                }}
              >
                {isRecording ? "⏹" : "🎤"}
              </button>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 500, marginTop: "16px" }}>
              {isRecording ? "Tap to SEND" : isProcessing ? "Translating..." : "Tap to RECORD"}
            </div>
          </div>
        </div>
      )}

      {/* ─── TEXT MODE (READ ALOUD) ─── */}
      {mode === "text" && (
        <div className="glass animate-fade-in" style={{ width: "100%", maxWidth: "420px", padding: "28px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Language to read in
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              {SPEAK_LANGS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSpeakLang(lang.code)}
                  style={{
                    ...btnBase,
                    padding: "8px 14px",
                    borderRadius: "20px",
                    border: `1px solid ${speakLang === lang.code ? "var(--accent)" : "var(--border)"}`,
                    background: speakLang === lang.code ? "rgba(139,92,246,0.15)" : "transparent",
                    color: speakLang === lang.code ? "var(--accent)" : "var(--muted)",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Type something to read aloud..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                width: "100%",
                height: "120px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: "1rem",
                resize: "none",
                outline: "none",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </div>

          {error && <div style={{ color: "var(--error)", fontSize: "0.85rem", marginTop: "16px", textAlign: "center" }}>{error}</div>}

          <button
            onClick={handleSpeakText}
            disabled={loading || !inputText.trim()}
            style={{
              ...btnBase,
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              marginTop: "24px",
              opacity: (loading || !inputText.trim()) ? 0.6 : 1,
              boxShadow: "0 4px 16px rgba(139,92,246,0.2)",
            }}
          >
            {loading ? "Processing..." : "🔊 Read Aloud"}
          </button>

          {textResult && (
            <div className="animate-fade-in" style={{ marginTop: "24px", padding: "16px", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--accent)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Translation ({LANG_DISPLAY[speakLang]})
              </p>
              <p style={{ color: "var(--text)", fontSize: "1.1rem", lineHeight: 1.4 }}>
                {textResult.translation}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
