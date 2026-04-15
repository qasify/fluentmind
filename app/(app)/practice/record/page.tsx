"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

// Use window-level access for cross-browser Speech Recognition
function getSpeechRecognitionAPI(): (new () => SpeechRecognition) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SpeechRecognition) | null;
}


type RecordingState = "idle" | "recording" | "processing" | "completed";

interface AudioAnalysis {
  pauseCount: number;
  totalSilenceSeconds: number;
  speakingSeconds: number;
}

// Topic database
const TOPIC_CATEGORIES = [
  {
    name: "Daily Life",
    icon: "☀️",
    topics: [
      "Describe your ideal weekend",
      "Talk about your morning routine",
      "Describe your favorite meal and why you enjoy it",
      "Talk about a hobby you recently started",
      "Describe your neighborhood",
    ],
  },
  {
    name: "Professional",
    icon: "💼",
    topics: [
      "Describe the perfect work environment",
      "What qualities make a great leader?",
      "Talk about a challenge you overcame at work or school",
      "How do you handle disagreements with colleagues?",
      "Describe your dream job and why",
    ],
  },
  {
    name: "Abstract Ideas",
    icon: "💡",
    topics: [
      "Should social media have age restrictions?",
      "Is technology making us more or less connected?",
      "What role should AI play in education?",
      "Is it better to specialize or be a generalist?",
      "Do you think success is more about talent or hard work?",
    ],
  },
  {
    name: "IELTS Cue Cards",
    icon: "🎓",
    topics: [
      "Describe a book that you have recently read. You should say what it was about, why you decided to read it, and whether you would recommend it.",
      "Describe a place you have visited that left a strong impression. Include when you went, who you were with, and what made it memorable.",
      "Describe a person who has influenced you. Say who this person is, how you know them, and why they had such an impact.",
      "Describe a time when you helped someone. Include who the person was, what you did, and how you felt afterwards.",
      "Describe a skill you would like to learn. Explain what it is, why you are interested, and how you plan to learn it.",
    ],
  },
  {
    name: "Personal Growth",
    icon: "🌱",
    topics: [
      "What is the most important lesson you've learned in life?",
      "Describe a failure that taught you something valuable",
      "What does success mean to you?",
      "Talk about a goal you're currently working towards",
      "What advice would you give to your younger self?",
    ],
  },
];

function RecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addSession, addXp, updateStreak, checkAndUnlockBadges } = useAppStore();

  // Topic picker state
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

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

  // Load topic from URL params
  useEffect(() => {
    const urlTopic = searchParams.get("topic");
    const urlCategory = searchParams.get("category");
    if (urlTopic) setTopic(decodeURIComponent(urlTopic));
    if (urlCategory) setCategory(decodeURIComponent(urlCategory));
  }, [searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingEngine();
    };
  }, []);

  const selectRandomTopic = () => {
    const cat = TOPIC_CATEGORIES[Math.floor(Math.random() * TOPIC_CATEGORIES.length)];
    const t = cat.topics[Math.floor(Math.random() * cat.topics.length)];
    setTopic(t);
    setCategory(cat.name);
  };

  const selectTopic = (t: string, cat: string) => {
    setTopic(t);
    setCategory(cat);
    setShowTopicPicker(false);
  };

  const initSpeechRecognition = () => {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI();

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
        recognition.start();
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
    const scaled = Math.min(100, (average / 256) * 200);
    setDbLevel(scaled);

    const RMS_SILENCE_THRESHOLD = 15;
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
        audioAnalysisRef.current.totalSilenceSeconds += Math.min(silenceDuration, 20);
      }
    }

    animationFrameRef.current = requestAnimationFrame(processAudioVisualizer);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = mediaRecorder;
      
      const recognition = initSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }

      setTranscript("");
      setInterimTranscript("");
      setSecondsElapsed(0);
      setTimerDisplay("00:00");
      audioAnalysisRef.current = { pauseCount: 0, totalSilenceSeconds: 0, speakingSeconds: 0 };
      isSilentRef.current = true;
      silenceStartRef.current = Date.now();
      
      mediaRecorder.start(1000);
      setState("recording");
      
      processAudioVisualizer();

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
      recognitionRef.current.onend = null;
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

    if (isSilentRef.current) {
      const silenceDuration = (Date.now() - silenceStartRef.current) / 1000;
      audioAnalysisRef.current.totalSilenceSeconds += Math.min(silenceDuration, 20);
    }

    const { pauseCount, totalSilenceSeconds } = audioAnalysisRef.current;

    const finalFullText = transcript + " " + interimTranscript;
    const wpm = secondsElapsed > 0 ? (finalFullText.split(" ").length / (secondsElapsed / 60)) : 0;
    const sessionId = `ses_${Date.now()}`;

    try {
      // 1. Upload audio to Supabase Storage
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      let storageUrl = undefined;
      if (user) {
        const filePath = `${user.id}/${sessionId}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("sessions_audio")
          .upload(filePath, audioBlob, { contentType: "audio/webm" });

        if (!uploadError) {
          const { data } = supabase.storage.from("sessions_audio").getPublicUrl(filePath);
          storageUrl = data.publicUrl;
        } else {
          console.error("Audio upload failed:", uploadError.message);
        }
      }

      // 2. Fetch analysis from AI
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

      addSession({
        id: sessionId,
        type: "recording",
        topic,
        category,
        transcript: finalFullText,
        audioUrl: storageUrl,
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

      addXp(50);
      updateStreak();
      checkAndUnlockBadges();

      router.push(`/evaluation/${sessionId}`);
      
    } catch (error) {
      console.error(error);
      alert("Failed to analyze recording. Please try again.");
      setState("idle");
    }
  };

  const renderBars = () => {
    const bars = [];
    const numBars = 40;
    for (let i = 0; i < numBars; i++) {
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
    <div className="page-container min-h-[calc(100vh-2rem)] md:min-h-[calc(100vh-4rem)] flex flex-col relative py-4">

      {/* Topic Picker Modal */}
      {showTopicPicker && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTopicPicker(false)}>
          <div
            className="w-full max-w-2xl max-h-[80vh] bg-background-secondary border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="heading-4">Choose a Topic</h3>
              <button onClick={() => setShowTopicPicker(false)} className="btn btn-ghost btn-icon text-xl">✕</button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 px-4 pt-4 overflow-x-auto shrink-0">
              {TOPIC_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategoryIndex(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategoryIndex === i
                      ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                      : "text-[#a0a0b5] hover:text-[#f0f0f5] hover:bg-[rgba(255,255,255,0.03)]"
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>

            {/* Topic List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {TOPIC_CATEGORIES[selectedCategoryIndex].topics.map((t, i) => (
                <button
                  key={i}
                  onClick={() => selectTopic(t, TOPIC_CATEGORIES[selectedCategoryIndex].name)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    topic === t
                      ? "bg-primary-500/10 border-primary-500/30"
                      : "bg-background-tertiary border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] hover:bg-background-elevated"
                  }`}
                >
                  <div className="font-medium leading-relaxed">{t}</div>
                </button>
              ))}
            </div>

            {/* Random Topic Button */}
            <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => { selectRandomTopic(); setShowTopicPicker(false); }}
                className="btn btn-secondary w-full"
              >
                🎲 Random Topic
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0">
        <div>
          <h1 className="heading-3 mb-1">Recording Studio</h1>
          <p className="text-[#a0a0b5] text-base">Clear your mind and speak naturally.</p>
        </div>
        
        {state === "idle" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTopicPicker(true)}
              className="btn btn-secondary btn-sm"
            >
              📝 Change Topic
            </button>
            <button
              onClick={selectRandomTopic}
              className="btn btn-ghost btn-sm"
            >
              🎲 Random
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
        {/* Topic Card */}
        <div className={`w-full text-center transition-all duration-500 mb-6 ${state === "recording" ? "scale-105" : ""}`}>
          <div className="inline-block px-3 py-1 bg-background-elevated border border-[rgba(255,255,255,0.06)] rounded-full text-xs font-semibold uppercase tracking-widest text-primary-400 mb-2">
            {category}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-2">
            {topic}
          </h2>
        </div>

        {/* Live Transcript / Empty state */}
        <div className="w-full flex-1 min-h-[140px] max-h-[180px] md:max-h-[220px] bg-background-tertiary border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 mb-6 overflow-y-auto flex flex-col relative shrinks-0">
          {state === "idle" && (
             <div className="m-auto text-[#6b6b80] max-w-sm text-center">
               Hit record when you&apos;re ready. Try to speak continuously for at least 2 minutes without worrying about mistakes.
             </div>
          )}
          {state === "recording" && (
            <div className="text-xl leading-relaxed">
              <span className="text-[#f0f0f5]">{transcript}</span>
              <span className="text-[#a0a0b5]">{interimTranscript}</span>
              {!transcript && !interimTranscript && (
                <span className="text-[#6b6b80] animate-pulse">Listening...</span>
              )}
            </div>
          )}
          {state === "processing" && (
             <div className="m-auto text-center">
               <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
               <div className="text-lg font-semibold gradient-text animate-pulse">AI is analyzing your speech...</div>
               <div className="text-sm text-[#a0a0b5] mt-2">Checking grammar, calculating fluency, and identifying filler words.</div>
             </div>
          )}
        </div>

        {/* Controls & Visualizer */}
        {state !== "processing" && (
          <div className="w-full flex flex-col items-center gap-4">
            <div className="text-4xl md:text-5xl font-mono font-medium tracking-tight">
              {timerDisplay}
            </div>

            {/* Audio Wave Visualizer */}
            <div className="flex items-center justify-center gap-1 h-12 md:h-16 w-full max-w-lg mb-2">
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
                <button
                  onClick={handleFinish}
                  className="w-20 h-20 bg-danger-500 rounded-full shadow-[0_0_0_8px_rgba(244,63,94,0.15)] animate-recordPulse flex items-center justify-center hover:scale-105"
                  aria-label="Finish recording"
                >
                  <div className="w-8 h-8 bg-white rounded-md" />
                </button>
              )}
            </div>

            {state === "recording" && (
              <p className="text-sm text-[#6b6b80]">Click the stop button when you&apos;re done</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={<div className="page-container p-8 text-center text-[#a0a0b5]">Loading studio...</div>}>
      <RecordContent />
    </Suspense>
  );
}
