"use client";
import { useRef, useState, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "processing";

export function useVoiceRecorder(onRecorded: (blob: Blob) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // cached — never re-request
  const chunksRef = useRef<Blob[]>([]);

  // Call once when entering voice mode — asks permission proactively
  const init = useCallback(async () => {
    if (streamRef.current) return; // already have it
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Permission denied — stay idle
    }
  }, []);

  const start = useCallback(async () => {
    // Reuse cached stream; only request if somehow lost
    if (!streamRef.current) {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        return;
      }
    }

    const recorder = new MediaRecorder(streamRef.current);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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

  // Release mic when component unmounts
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { state, start, stop, reset, init };
}
