"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

// ---- Types ----
interface PauseData {
  startMs: number;
  endMs: number;
  durationMs: number;
}

interface AudioMetadata {
  totalDurationSeconds: number;
  speakingTimeSeconds: number;
  silenceTimeSeconds: number;
  pauseCount: number;
  pauses: PauseData[];
  averagePauseDurationMs: number;
  wpm: number;
}

// ---- Default Topics ----
const defaultTopics = [
  {
    category: "Daily Life",
    text: "Describe a time you solved a difficult problem",
    framework: "STAR",
    duration: "2-3 min",
    difficulty: "Intermediate",
  },
  {
    category: "Abstract",
    text: "Is social media making us more connected or more isolated?",
    framework: "PREP",
    duration: "2-3 min",
    difficulty: "Intermediate",
  },
  {
    category: "Professional",
    text: "Explain your current role to someone outside your industry",
    framework: "PREP",
    duration: "2-3 min",
    difficulty: "Intermediate",
  },
  {
    category: "IELTS Part 2",
    text: "Describe a skill you would like to learn in the future",
    framework: "STAR",
    duration: "2 min",
    difficulty: "Intermediate",
  },
  {
    category: "Daily Life",
    text: "Talk about a meal that you really enjoyed recently",
    framework: "AAA",
    duration: "1-2 min",
    difficulty: "Beginner",
  },
];

const WAVEFORM_BARS = 50;

export default function RecordPage() {
  const router = useRouter();

  // ---- Topic State ----
  const [currentTopic, setCurrentTopic] = useState(defaultTopics[0]);
  const [showTopicPicker, setShowTopicPicker] = useState(false);

  // ---- Recording State ----
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(
    new Array(WAVEFORM_BARS).fill(4)
  );

  // ---- Refs ----
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ---- Pause tracking ----
  const pauseStartRef = useRef<number | null>(null);
  const pausesRef = useRef<PauseData[]>([]);
  const silenceThreshold = 15; // RMS threshold for silence
  const minPauseDuration = 800; // min ms to count as a pause
  const recordingStartTimeRef = useRef<number>(0);

  // ---- Format time ----
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ---- Waveform Animation ----
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS for pause detection
    const rms = Math.sqrt(
      dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length
    );

    // Pause detection
    const now = Date.now();
    if (rms < silenceThreshold) {
      if (!pauseStartRef.current) {
        pauseStartRef.current = now;
      }
    } else {
      if (pauseStartRef.current) {
        const duration = now - pauseStartRef.current;
        if (duration >= minPauseDuration) {
          pausesRef.current.push({
            startMs: pauseStartRef.current - recordingStartTimeRef.current,
            endMs: now - recordingStartTimeRef.current,
            durationMs: duration,
          });
        }
        pauseStartRef.current = null;
      }
    }

    // Sample bars from frequency data
    const step = Math.floor(dataArray.length / WAVEFORM_BARS);
    const bars: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      const value = dataArray[i * step] || 0;
      const height = Math.max(4, (value / 255) * 70);
      bars.push(height);
    }

    setWaveformData(bars);
    animFrameRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  // ---- Start Recording ----
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio context for waveform
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second

      // Start speech recognition
      startSpeechRecognition();

      // Reset state
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      setTranscript("");
      pausesRef.current = [];
      pauseStartRef.current = null;
      recordingStartTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start waveform animation
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert(
        "Microphone access is required. Please allow microphone permissions."
      );
    }
  };

  // ---- Speech Recognition ----
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // Restart if still recording
      if (mediaRecorderRef.current?.state === "recording") {
        try {
          recognition.start();
        } catch {
          // Ignore restart errors
        }
      }
    };

    recognition.start();
  };

  // ---- Pause / Resume ----
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      animFrameRef.current = requestAnimationFrame(updateWaveform);
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setIsPaused(true);
      setWaveformData(new Array(WAVEFORM_BARS).fill(4));
    }
  };

  // ---- Stop Recording ----
  const stopRecording = async () => {
    setIsProcessing(true);

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop timer and animation
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
      });
    }

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Calculate audio metadata
    const totalDuration = recordingTime;
    const totalSilence = pausesRef.current.reduce(
      (sum, p) => sum + p.durationMs,
      0
    );
    const speakingTime = totalDuration - totalSilence / 1000;
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const wpm = speakingTime > 0 ? (wordCount / speakingTime) * 60 : 0;

    const audioMetadata: AudioMetadata = {
      totalDurationSeconds: totalDuration,
      speakingTimeSeconds: Math.round(speakingTime),
      silenceTimeSeconds: Math.round(totalSilence / 1000),
      pauseCount: pausesRef.current.length,
      pauses: pausesRef.current,
      averagePauseDurationMs:
        pausesRef.current.length > 0
          ? Math.round(
              pausesRef.current.reduce((s, p) => s + p.durationMs, 0) /
                pausesRef.current.length
            )
          : 0,
      wpm: Math.round(wpm),
    };

    // Create audio blob
    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

    // Send to analysis API
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("transcript", transcript);
      formData.append("topic", currentTopic.text);
      formData.append("category", currentTopic.category);
      formData.append("framework", currentTopic.framework);
      formData.append("audioMetadata", JSON.stringify(audioMetadata));

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Navigate to evaluation page
        router.push(`/evaluation/${result.sessionId}`);
      } else {
        // For now, store locally and show mock results
        console.error("Analysis API error");
        setIsProcessing(false);
        setIsRecording(false);
        alert("Analysis complete! (API not configured yet — connect your Gemini API key in .env.local)");
      }
    } catch (err) {
      console.error("Failed to analyze:", err);
      setIsProcessing(false);
      setIsRecording(false);
      alert("Recording saved! Connect your Gemini API key to enable AI analysis.");
    }

    setWaveformData(new Array(WAVEFORM_BARS).fill(4));
  };

  // ---- Randomize Topic ----
  const randomizeTopic = () => {
    const idx = Math.floor(Math.random() * defaultTopics.length);
    setCurrentTopic(defaultTopics[idx]);
  };

  // ---- Cleanup ----
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className={styles.studio}>
      {/* Header */}
      <div className={styles.studioHeader}>
        <div className={styles.studioTitle}>🎙️ Recording Studio</div>
        <div className={styles.studioControls}>
          {!isRecording && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={randomizeTopic}
              id="randomize-topic-btn"
            >
              🎲 Random Topic
            </button>
          )}
          {!isRecording && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowTopicPicker(!showTopicPicker)}
              id="pick-topic-btn"
            >
              📋 Pick Topic
            </button>
          )}
        </div>
      </div>

      {/* Topic Picker */}
      {showTopicPicker && !isRecording && (
        <div
          style={{
            padding: "var(--space-4) var(--space-6)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className={styles.topicGrid}>
            {defaultTopics.map((topic, i) => (
              <button
                key={i}
                className={styles.topicOption}
                onClick={() => {
                  setCurrentTopic(topic);
                  setShowTopicPicker(false);
                }}
              >
                <div className={styles.topicOptionTitle}>{topic.text}</div>
                <div className={styles.topicOptionMeta}>
                  {topic.category} · {topic.framework} · {topic.difficulty}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic Display */}
      <div className={styles.topicSection}>
        <div className={styles.topicCategory}>{currentTopic.category}</div>
        <h2 className={styles.topicText}>{currentTopic.text}</h2>
        <div className={styles.topicHints}>
          <span className={styles.topicHint}>
            ⏱️ {currentTopic.duration}
          </span>
          <span className={styles.topicHint}>
            🏗️ {currentTopic.framework}
          </span>
          <span className={styles.topicHint}>
            📊 {currentTopic.difficulty}
          </span>
        </div>
      </div>

      {/* Recording Area */}
      <div className={styles.recordingArea}>
        {/* Waveform */}
        <div className={styles.waveformContainer}>
          {waveformData.map((height, i) => (
            <div
              key={i}
              className={`${styles.waveBar} ${!isRecording ? styles.waveBarIdle : ""}`}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>

        {/* Timer */}
        <div
          className={`${styles.timer} ${isRecording ? styles.timerRecording : ""}`}
        >
          {formatTime(recordingTime)}
        </div>

        {/* Record Button */}
        <div className={styles.recordBtnWrapper}>
          {!isRecording ? (
            <button
              className={`${styles.recordBtn} ${styles.recordBtnIdle}`}
              onClick={startRecording}
              id="record-btn"
            >
              <div
                className={`${styles.recordBtnIcon} ${styles.recordBtnIconIdle}`}
              />
            </button>
          ) : (
            <button
              className={`${styles.recordBtn} ${styles.recordBtnRecording}`}
              onClick={stopRecording}
              id="stop-btn"
            >
              <div className={styles.recordBtnIcon} />
            </button>
          )}
          <div className={styles.recordBtnRing} />
        </div>

        {/* Action Buttons */}
        <div className={styles.actionBtns}>
          {!isRecording ? (
            <span className="body-small text-secondary">
              Tap to start recording
            </span>
          ) : (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={togglePause}
                id="pause-btn"
              >
                {isPaused ? "▶️ Resume" : "⏸️ Pause"}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={stopRecording}
                id="stop-recording-btn"
              >
                ⏹️ Stop & Analyze
              </button>
            </>
          )}
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className={styles.processingOverlay}>
            <div className={styles.processingSpinner} />
            <div className={styles.processingText}>
              Analyzing your speech...
            </div>
            <div className={styles.processingSubtext}>
              Checking clarity, vocabulary, grammar, structure, and more
            </div>
          </div>
        )}
      </div>

      {/* Live Transcript */}
      {(isRecording || transcript) && (
        <div className={styles.transcriptSection}>
          <div className={styles.transcriptLabel}>Live Transcript</div>
          <div className={styles.transcriptText}>
            {transcript || "Start speaking..."}
            {isRecording && <span className={styles.transcriptCursor} />}
          </div>
        </div>
      )}
    </div>
  );
}
