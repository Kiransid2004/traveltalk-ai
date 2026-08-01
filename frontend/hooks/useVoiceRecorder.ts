"use client";
import { useRef, useState, useCallback } from "react";

export type RecorderState = "idle" | "recording" | "processing";

export function useVoiceRecorder(onRecorded: (blob: Blob) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Permission denied or hardware error — stay in idle state
      return;
    }
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      stream.getTracks().forEach((t) => t.stop());
      setState("processing");
      onRecorded(blob);
    };

    mediaRef.current = recorder;
    recorder.start();
    setState("recording");
  }, [onRecorded]);

  const stop = useCallback(() => {
    mediaRef.current?.stop();
  }, []);

  const reset = useCallback(() => setState("idle"), []);

  return { state, start, stop, reset };
}
