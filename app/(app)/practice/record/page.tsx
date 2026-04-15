"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

// Extended Window interface for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: "no-speech" | "audio-capture" | "not-allowed" | "network" | "aborted" | "language-not-supported" | "service-not-allowed" | "bad-grammar";
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type RecordingState = "idle" | "recording" | "processing" | "completed";

// Types for our local audio engine
interface AudioAnalysis {
  pauseCount: number;
  totalSilenceSeconds: number;
  speakingSeconds: number;
}

export default function RecordPage() {
  const router = useRouter();
  const { addSession, addXp, updateStreak } = useAppStore();

  const [state, setState] = useState<RecordingState>("idle");
  const [topic, setTopic] = useState("Describe your ideal weekend");
  const [category, setCategory] = useState("Daily Life");
  
  // Timer state
  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  
  // Transcript
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  
  // Visualizer DB level
  const [dbLevel, setDbLevel] = useState(0);

  // Refs for underlying engines
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio Analysis Refs
  const audioAnalysisRef = useRef<AudioAnalysis>({
    pauseCount: 0,
    totalSilenceSeconds: 0,
    speakingSeconds: 0,
  });
  const isSilentRef = useRef(true);
  const silenceStartRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingEngine();
    };
  }, []);

  const initSpeechRecognition = () => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Speech Recognition is not supported in this browser. Please use Chrome.");
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalStr = "";
      let interimStr = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript + " ";
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (finalStr) {
        setTranscript((prev) => prev + finalStr);
      }
      setInterimTranscript(interimStr);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
    };

    recognition.onend = () => {
      if (state === "recording") {
        recognition.start(); // auto-restart if still recording but timeout hit
      }
    };

    return recognition;
  };

  const processAudioVisualizer = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Map to a roughly 0-100 scale for CSS
    const scaled = Math.min(100, (average / 256) * 200);
    setDbLevel(scaled);

    const RMS_SILENCE_THRESHOLD = 15; // Tunable
    const now = Date.now();

    if (scaled < RMS_SILENCE_THRESHOLD) {
      if (!isSilentRef.current) {
        isSilentRef.current = true;
        silenceStartRef.current = now;
      }
    } else {
      if (isSilentRef.current) {
        isSilentRef.current = false;
        const silenceDuration = (now - silenceStartRef.current) / 1000;
        if (silenceDuration > 1.5) {
          audioAnalysisRef.current.pauseCount += 1;
        }
        audioAnalysisRef.current.totalSilenceSeconds += Math.min(silenceDuration, 20); // cap max silence
      }
    }

    animationFrameRef.current = requestAnimationFrame(processAudioVisualizer);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 1. Setup Audio Context & Visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      
      // 2. Setup MediaRecorder for blob saving
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = mediaRecorder;
      
      // 3. Setup Transcription
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }

      // Reset state variables
      setTranscript("");
      setInterimTranscript("");
      setSecondsElapsed(0);
      setTimerDisplay("00:00");
      audioAnalysisRef.current = { pauseCount: 0, totalSilenceSeconds: 0, speakingSeconds: 0 };
      isSilentRef.current = true;
      silenceStartRef.current = Date.now();
      
      // Start engines
      mediaRecorder.start(1000);
      setState("recording");
      
      // Start visualizer loop
      processAudioVisualizer();

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          const m = String(Math.floor(next / 60)).padStart(2, '0');
          const s = String(next % 60).padStart(2, '0');
          setTimerDisplay(`${m}:${s}`);
          return next;
        });
      }, 1000);

    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Microphone access is required to use the recording studio.");
    }
  };

  const stopRecordingEngine = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      recognitionRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close();
    }
  };

  const handleFinish = async () => {
    stopRecordingEngine();
    setState("processing");

    // Close out any ongoing silence
    if (isSilentRef.current) {
      const silenceDuration = (Date.now() - silenceStartRef.current) / 1000;
      audioAnalysisRef.current.totalSilenceSeconds += Math.min(silenceDuration, 20);
    }

    const { pauseCount, totalSilenceSeconds } = audioAnalysisRef.current;
    
    // In a real app we'd upload the audio blob here using chunksRef.current
    // const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

    const finalFullText = transcript + " " + interimTranscript;
    const wpm = secondsElapsed > 0 ? (finalFullText.split(" ").length / (secondsElapsed / 60)) : 0;

    // Call our AI Endpoint
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: finalFullText,
          duration: secondsElapsed,
          wpm: Math.round(wpm),
          pauseCount,
          topic
        })
      });

      if (!response.ok) throw new Error("Analysis failed");
      
      const analysisData = await response.json();

      // Create session object
      const sessionId = `ses_${Date.now()}`;
      addSession({
        id: sessionId,
        type: "recording",
        topic,
        category,
        transcript: finalFullText,
        analysis: analysisData,
        audioMetadata: {
          totalDurationSeconds: secondsElapsed,
          speakingTimeSeconds: secondsElapsed - totalSilenceSeconds,
          silenceTimeSeconds: totalSilenceSeconds,
          pauseCount,
          wpm: Math.round(wpm)
        },
        xpEarned: 50,
        createdAt: new Date().toISOString()
      });

      // Update XP and Streak
      addXp(50);
      updateStreak();

      // Navigate to results
      router.push(`/evaluation/${sessionId}`);
      
    } catch (error) {
      console.error(error);
      alert("Failed to analyze recording. Please try again.");
      setState("idle");
    }
  };

  // Generate some bars for the visualizer
  const renderBars = () => {
    const bars = [];
    const numBars = 40;
    for (let i = 0; i < numBars; i++) {
      // Create a wave effect centered around the middle
      const distFromCenter = Math.abs(i - numBars / 2) / (numBars / 2);
      const intensity = Math.max(0.1, 1 - distFromCenter);
      const height = state === "recording" ? Math.max(5, dbLevel * intensity * (Math.random() * 0.5 + 0.5)) : 5;
      
      bars.push(
        <div
          key={i}
          className="w-1.5 md:w-2 bg-gradient-primary rounded-full transition-all duration-75"
          style={{ height: `${height}%`, opacity: state === "recording" ? 1 : 0.3 }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="page-container h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
        <div>
          <h1 className="heading-3 mb-1">Recording Studio</h1>
          <p className="text-secondary text-base">Clear your mind and speak naturally.</p>
        </div>
        
        {state === "idle" && (
          <div className="flex items-center gap-2 border border-[rgba(255,255,255,0.06)] rounded-lg p-1 bg-background-tertiary">
             <button className="btn btn-sm hover:bg-[rgba(255,255,255,0.06)]">Change Topic</button>
             <button className="btn btn-sm hover:bg-[rgba(255,255,255,0.06)]">IELTS Mode</button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
        {/* Topic Card */}
        <div className={`w-full text-center transition-all duration-500 mb-8 ${state === "recording" ? "scale-105" : ""}`}>
          <div className="inline-block px-3 py-1 bg-background-elevated border border-[rgba(255,255,255,0.06)] rounded-full text-xs font-semibold uppercase tracking-widest text-primary-400 mb-4">
            {category}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-2">
            {topic}
          </h2>
        </div>

        {/* Live Transcript / Empty state */}
        <div className="w-full h-48 md:h-64 bg-background-tertiary border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 mb-8 overflow-y-auto flex flex-col relative text-center">
          {state === "idle" && (
             <div className="m-auto text-[#6b6b80] max-w-sm">
               Hit record when you&apos;re ready. Try to speak continuously without worrying too much about mistakes.
             </div>
          )}
          {state === "recording" && (
            <div className="text-xl leading-relaxed">
              <span className="text-[#f0f0f5]">{transcript}</span>
              <span className="text-[#a0a0b5]">{interimTranscript}</span>
            </div>
          )}
          {state === "processing" && (
             <div className="m-auto">
               <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
               <div className="text-lg font-semibold gradient-text animate-pulse">AI is analyzing your speech...</div>
               <div className="text-sm text-secondary mt-2">Checking grammar, calculating fluency, and identifying filler words.</div>
             </div>
          )}
        </div>

        {/* Controls & Visualizer */}
        {state !== "processing" && (
          <div className="w-full flex flex-col items-center gap-8">
            <div className="text-4xl md:text-5xl font-mono font-medium tracking-tight">
              {timerDisplay}
            </div>

            {/* Audio Wave Visualizer Placeholder */}
            <div className="flex items-center justify-center gap-1 h-16 md:h-24 w-full max-w-lg mb-4">
              {renderBars()}
            </div>

            <div className="flex justify-center flex-wrap gap-4 w-full">
              {state === "idle" && (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 bg-danger-500 rounded-full shadow-[0_0_0_8px_rgba(244,63,94,0.15)] flex items-center justify-center transition-all hover:scale-105"
                  aria-label="Start recording"
                >
                  <div className="w-8 h-8 bg-white rounded-full" />
                </button>
              )}

              {state === "recording" && (
                <>
                  <button
                    className="w-20 h-20 bg-transparent border-2 border-danger-500 text-danger-500 rounded-full flex justify-center items-center font-bold"
                    aria-label="pause"
                  >
                     Pause
                  </button>
                  <button
                    onClick={handleFinish}
                    className="w-20 h-20 bg-danger-500 rounded-full shadow-[0_0_0_8px_rgba(244,63,94,0.15)] animate-recordPulse flex items-center justify-center hover:scale-105"
                    aria-label="Finish recording"
                  >
                    <div className="w-8 h-8 bg-white rounded-md" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
