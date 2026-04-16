"use client";

import { useState, useCallback, useEffect } from "react";

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    
    // Voices are loaded asynchronously
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    if (isPlaying && currentText === text) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a good American English voice
    // Preferred voices: "Samantha", "Daniel", or any en-US voice
    const usVoices = voices.filter(v => v.lang === 'en-US');
    const preferredVoice = usVoices.find(v => v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Siri")) || usVoices[0] || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentText("");
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentText("");
    };

    window.speechSynthesis.speak(utterance);
  }, [voices, isPlaying, currentText]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentText("");
    }
  }, []);

  return { speak, stop, isPlaying, currentText };
}
