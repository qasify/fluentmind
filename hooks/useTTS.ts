"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [activeChunk, setActiveChunk] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    if (isPlaying && currentText === text) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setCurrentText("");
      setActiveChunk("");
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(true);
    setCurrentText(text);

    try {
      let chunks: string[] = [];
      
      // 1. Initial split by logical pauses (punctuation)
      const parts = text.split(/([.,!?;:]+)/); 
      
      let logicalPhrases: string[] = [];
      let temp = "";
      for (let i = 0; i < parts.length; i++) {
        temp += parts[i];
        if (i % 2 !== 0 || i === parts.length - 1) { 
          if (temp.trim()) {
            logicalPhrases.push(temp.trim());
          }
          temp = "";
        }
      }

      // 2. Assemble phrases into chunks under 180 chars limit
      let currentC = "";
      for (const phrase of logicalPhrases) {
        if ((currentC + " " + phrase).length <= 160) {
          currentC += (currentC ? " " : "") + phrase;
        } else {
          if (currentC) chunks.push(currentC);
          
          // Emergency fallback if a single unbroken sentence exceeds 160 chars
          if (phrase.length > 160) {
            const words = phrase.split(" ");
            let emergencyChunk = "";
            for (const word of words) {
              if ((emergencyChunk + " " + word).length > 160) {
                chunks.push(emergencyChunk.trim());
                emergencyChunk = word;
              } else {
                emergencyChunk += (emergencyChunk ? " " : "") + word;
              }
            }
            currentC = emergencyChunk.trim();
          } else {
            currentC = phrase;
          }
        }
      }
      if (currentC) {
        chunks.push(currentC.trim());
      }

      if (chunks.length === 0) {
        setIsPlaying(false);
        setCurrentText("");
        setActiveChunk("");
        return;
      }

      const urls = chunks.map(chunk => `/api/tts?q=${encodeURIComponent(chunk)}`);

      let idx = 0;
      const playNext = () => {
        if (idx >= urls.length) {
          setIsPlaying(false);
          setCurrentText("");
          setActiveChunk("");
          audioRef.current = null;
          return;
        }
        
        setActiveChunk(chunks[idx]);
        const audio = new Audio(urls[idx]);
        audioRef.current = audio;
        audio.onended = () => {
          idx++;
          playNext();
        };
        audio.onerror = () => {
          console.error("Audio playback error");
          setIsPlaying(false);
          setCurrentText("");
          setActiveChunk("");
        };
        audio.play().catch(e => {
          console.error("Audio playback interrupted", e);
          setIsPlaying(false);
          setCurrentText("");
          setActiveChunk("");
        });
      };

      playNext();

    } catch (e) {
      console.error(e);
      setIsPlaying(false);
      setCurrentText("");
      setActiveChunk("");
    }
  }, [isPlaying, currentText]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentText("");
    setActiveChunk("");
  }, []);

  return { speak, stop, isPlaying, currentText, activeChunk };
}
