"use client";
import { useRef } from "react";

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = (base64: string) => {
    // Stop any currently playing audio before starting a new one
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audioRef.current = audio;
    // audio.play() returns a Promise; catch rejection to avoid unhandled
    // promise errors when the browser blocks autoplay
    audio.play().catch(() => {
      // Autoplay was blocked or playback failed — ignore silently
    });
  };

  const stop = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  return { play, stop };
}
