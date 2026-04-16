"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

type RunnerState = "idle" | "recording" | "processing";
type RateLimitState = { message: string; retryAfterSeconds: number } | null;

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

export default function ExamRunPage() {
  const router = useRouter();
  const {
    currentExamRun,
    currentExamStepIndex,
    goToExamStep,
    completeExamStep,
    finishExamRun,
    addSession,
    addXp,
    updateStreak,
    checkAndUnlockBadges,
    eloRating,
    profile,
  } = useAppStore();

  const step = currentExamRun?.steps?.[currentExamStepIndex] || null;
  const totalSteps = currentExamRun?.steps?.length || 0;

  const [runnerState, setRunnerState] = useState<RunnerState>("idle");
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [prepRemaining, setPrepRemaining] = useState<number | null>(null);
  const [prepNotes, setPrepNotes] = useState("");
  const [rateLimit, setRateLimit] = useState<RateLimitState>(null);
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null);
  const [pendingStorageUrl, setPendingStorageUrl] = useState<string | undefined>(undefined);
  const [pendingSessionId, setPendingSessionId] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pauseCountRef = useRef(0);
  const lastLoudAtRef = useRef<number>(Date.now());

  const isPrepStep = step?.kind === "prep";
  const targetSeconds = step?.speakSeconds || 0;

  const remainingSeconds = useMemo(() => {
    if (!step) return 0;
    if (isPrepStep) return prepRemaining ?? step.prepSeconds ?? 0;
    if (!targetSeconds) return 0;
    return Math.max(0, targetSeconds - secondsElapsed);
  }, [isPrepStep, prepRemaining, secondsElapsed, step, targetSeconds]);

  useEffect(() => {
    if (!currentExamRun) router.replace("/exam");
  }, [currentExamRun, router]);

  const stepPart = step?.part;

  useEffect(() => {
    // Reset per-step state
    setRunnerState("idle");
    setSecondsElapsed(0);
    setInterimTranscript("");
    setRateLimit(null);
    setPendingAudio(null);
    setPendingStorageUrl(undefined);
    setPendingSessionId("");
    pauseCountRef.current = 0;
    lastLoudAtRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    if (stepPart && stepPart !== 2) {
      setPrepNotes("");
    }

    if (step?.kind === "prep") {
      const initial = step.prepSeconds ?? 60;
      setPrepRemaining(initial);
      timerRef.current = setInterval(() => {
        setPrepRemaining((prev) => {
          const next = (prev ?? initial) - 1;
          if (next <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [step?.id, step?.kind, step?.prepSeconds, stepPart]);

  const nextStep = () => {
    if (!currentExamRun) return;
    const nextIdx = currentExamStepIndex + 1;
    if (nextIdx < currentExamRun.steps.length) {
      goToExamStep(nextIdx);
    } else {
      const runId = currentExamRun.id;
      finishExamRun();
      router.push(`/history/exams/${encodeURIComponent(runId)}`);
    }
  };

  const submitForScoring = async (args: {
    audioBlob: Blob;
    sessionId: string;
    storageUrl?: string;
    wpm: number;
  }) => {
    if (!step) return;
    const fd = new FormData();
    fd.append("audio", args.audioBlob, `${args.sessionId}.webm`);
    fd.append("examType", currentExamRun?.examType || "ielts_speaking");
    fd.append("part", String(step.part));
    fd.append("title", step.title);
    fd.append("prompt", step.prompt);
    fd.append("duration", String(secondsElapsed));
    fd.append("wpm", String(args.wpm));
    fd.append("pauseCount", String(pauseCountRef.current));
    fd.append("eloRating", String(eloRating));
    fd.append("aiPersonality", profile.aiPersonality);

    const res = await fetch("/api/ai/exam-analyze", { method: "POST", body: fd });
    const json = await res.json();

    if (json?.rateLimited) {
      setRateLimit({
        message: json.message || "Scoring is temporarily rate-limited. Please retry in a moment.",
        retryAfterSeconds: Number(json.retryAfterSeconds || 30),
      });
      setPendingAudio(args.audioBlob);
      setPendingStorageUrl(args.storageUrl);
      setPendingSessionId(args.sessionId);
      setRunnerState("idle");
      return;
    }

    if (!res.ok) throw new Error(json.error || "Exam analysis failed.");

    const bands = json.bands;
    const rawAnalysis = json.rawAnalysis || {};
    const overallScore100 = bands?.overall ? Math.round((bands.overall / 9) * 100) : (rawAnalysis?.overall?.score ?? 0);

    const normalizedAnalysis = {
      ...rawAnalysis,
      fluency: {
        ...(rawAnalysis.fluency || {}),
        ieltsBandEstimate: bands?.overall ?? rawAnalysis?.fluency?.ieltsBandEstimate ?? 0,
      },
      overall: {
        ...(rawAnalysis.overall || {}),
        score: overallScore100,
        summary: rawAnalysis?.overall?.summary || json.diagnostics?.overall || "Exam evaluation complete.",
      },
    };

    const mode = currentExamRun?.mode || "full";
    const runId = currentExamRun?.id || "unknown";

    await addSession({
      id: args.sessionId,
      type: "exam",
      topic: step.title,
      category: "IELTS Exam",
      transcript: json.transcript || "",
      audioUrl: args.storageUrl,
      analysis: normalizedAnalysis,
      audioMetadata: {
        totalDurationSeconds: secondsElapsed,
        speakingTimeSeconds: secondsElapsed,
        silenceTimeSeconds: 0,
        pauseCount: pauseCountRef.current,
        wpm: args.wpm,
        exam: {
          runId,
          examType: "ielts_speaking",
          part: step.part,
          stepId: step.id,
          stepIndex: step.stepIndex,
          mode,
        },
      },
      xpEarned: 75,
      createdAt: new Date().toISOString(),
    });

    completeExamStep({ sessionId: args.sessionId, step, bands });
    await addXp(75);
    await updateStreak();
    await checkAndUnlockBadges();

    nextStep();
  };

  const startRecording = async () => {
    if (!step || runnerState !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      setRunnerState("recording");

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
        const now = Date.now();
        // crude pause count heuristic without analyzer: count a pause if no sound "event" for 2s.
        if (now - lastLoudAtRef.current > 2000) {
          pauseCountRef.current += 1;
          lastLoudAtRef.current = now;
        }
      }, 1000);

      // Optional interim STT (best-effort)
      const w = window as any;
      const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";
        let finalTranscriptLocal = "";
        rec.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscriptLocal += event.results[i][0].transcript + " ";
            else interim += event.results[i][0].transcript;
          }
          setInterimTranscript((finalTranscriptLocal + interim).trim());
          lastLoudAtRef.current = Date.now();
        };
        rec.onerror = () => {};
        rec.start();
        // store on recorder instance for stop
        (mediaRecorderRef.current as any).__speechRec = rec;
      }
    } catch (e) {
      console.error(e);
      alert("Microphone access is required for exam mode.");
    }
  };

  const stopRecording = async () => {
    if (!step || runnerState !== "recording") return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    setRunnerState("processing");

    const speechRec = (mediaRecorder as any).__speechRec;
    if (speechRec) {
      try {
        speechRec.stop();
      } catch {}
    }

    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve();
      try {
        mediaRecorder.stop();
      } catch {
        resolve();
      }
      try {
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      } catch {}
    });

    const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
    const sessionId = `exam_ses_${Date.now()}`;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let storageUrl: string | undefined = undefined;
      if (user) {
        const filePath = `${user.id}/${sessionId}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("sessions_audio")
          .upload(filePath, audioBlob, { contentType: "audio/webm" });
        if (!uploadError) {
          const { data } = supabase.storage.from("sessions_audio").getPublicUrl(filePath);
          storageUrl = data.publicUrl;
        }
      }

      const wpm = secondsElapsed > 0 ? Math.round((interimTranscript.split(/\s+/).filter(Boolean).length / (secondsElapsed / 60))) : 0;
      await submitForScoring({ audioBlob, sessionId, storageUrl, wpm });
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to analyze exam response.");
      setRunnerState("idle");
    }
  };

  if (!currentExamRun || !step) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-[#a0a0b5]">Loading exam...</div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in !max-w-5xl">
      {/* Top Bar: Header & Timer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 card p-6 border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] shadow-none">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-1">
            IELTS Speaking · {currentExamRun.mode === "full" ? "Full Exam" : `Part ${step.part}`}
          </div>
          <h1 className="heading-3 mb-1">{step.title}</h1>
          <p className="text-sm text-[#8b8b9d]">
            Step {currentExamStepIndex + 1} of {totalSteps}
          </p>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          <div className="text-right">
            <div className="text-4xl font-mono font-medium tracking-tight mb-1">
              {isPrepStep ? formatTime(remainingSeconds) : formatTime(targetSeconds ? remainingSeconds : secondsElapsed)}
            </div>
            <div className="text-xs text-[#a0a0b5] uppercase tracking-widest font-semibold flex items-center justify-end gap-2">
              {isPrepStep ? (
                <>⏳ Prep Time</>
              ) : runnerState === "recording" ? (
                <><span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse"></span> Recording</>
              ) : targetSeconds ? (
                `Target: ${formatTime(targetSeconds)}`
              ) : (
                "Recording"
              )}
            </div>
          </div>
          <div className="w-px h-12 bg-[rgba(255,255,255,0.1)] hidden md:block" />
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (confirm("End this exam run? Your progress for this run will stop here.")) {
                const runId = currentExamRun.id;
                finishExamRun();
                router.push(`/history/exams/${encodeURIComponent(runId)}`);
              }
            }}
          >
            Exit
          </button>
        </div>
      </div>

      {rateLimit && (
        <div className="card p-6 mb-6 border border-warning-400/20 bg-warning-400/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-warning-400 mb-1">Scoring temporarily unavailable</div>
              <div className="text-sm text-[#a0a0b5]">
                {rateLimit.message} Try again in ~{rateLimit.retryAfterSeconds}s.
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={async () => {
                  if (!pendingAudio || !pendingSessionId) return;
                  setRunnerState("processing");
                  setRateLimit(null);
                  const wpm = secondsElapsed > 0 ? Math.round((interimTranscript.split(/\s+/).filter(Boolean).length / (secondsElapsed / 60))) : 0;
                  try {
                    await submitForScoring({
                      audioBlob: pendingAudio,
                      sessionId: pendingSessionId,
                      storageUrl: pendingStorageUrl,
                      wpm,
                    });
                  } catch (e: any) {
                    console.error(e);
                    alert(e?.message || "Retry failed.");
                    setRunnerState("idle");
                  }
                }}
              >
                Retry scoring
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  // Continue without scoring: advance but keep run consistent.
                  setRateLimit(null);
                  setPendingAudio(null);
                  setPendingStorageUrl(undefined);
                  setPendingSessionId("");
                  nextStep();
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area: Prompt & Scratchpad */}
      <div className={`grid gap-6 mb-8 ${step.part === 2 ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'}`}>
        <div className="card p-6 flex flex-col">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6b6b80] mb-4">Prompt</p>
          <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[40vh]">
            {step.prompt}
          </div>
        </div>

        {step.part === 2 && (
          <div className="card p-6 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6b6b80] mb-4 flex justify-between items-center">
              <span className="flex items-center gap-2">📝 Scratchpad</span>
              <span className="text-[10px] text-warning-400/80 normal-case tracking-normal">(Notes not graded)</span>
            </p>
            <textarea
              className="w-full flex-1 bg-background-tertiary rounded-lg border border-[rgba(255,255,255,0.05)] p-5 text-sm md:text-base text-[#f0f0f5] placeholder:text-[#6b6b80] focus:ring-1 focus:ring-primary-500/50 outline-none resize-none min-h-[250px]"
              placeholder="Jot down bullet points for your story... (e.g. Who, What, When, Why)"
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
            />
          </div>
        )}
      </div>

      {isPrepStep ? (
        <div className="flex justify-center">
          <button
            className="btn btn-primary px-10 py-4"
            onClick={nextStep}
            disabled={prepRemaining !== 0 && prepRemaining !== null}
          >
            Continue to Recording
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          {runnerState === "idle" && (
            <button
              onClick={startRecording}
              className="w-20 h-20 bg-danger-500 rounded-full shadow-[0_0_0_8px_rgba(244,63,94,0.15)] flex items-center justify-center transition-all hover:scale-105"
              aria-label="Start recording"
            >
              <div className="w-8 h-8 bg-white rounded-full" />
            </button>
          )}

          {runnerState === "recording" && (
            <button
              onClick={stopRecording}
              className="w-20 h-20 bg-danger-500 rounded-full shadow-[0_0_0_8px_rgba(244,63,94,0.15)] animate-recordPulse flex items-center justify-center hover:scale-105"
              aria-label="Stop recording"
            >
              <div className="w-8 h-8 bg-white rounded-md" />
            </button>
          )}

          {runnerState === "processing" && (
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
              <div className="text-lg font-semibold gradient-text animate-pulse">Scoring like IELTS...</div>
              <div className="text-sm text-[#a0a0b5] mt-2">Transcribing and grading your response.</div>
            </div>
          )}

          {interimTranscript && runnerState !== "processing" && (
            <div className="w-full card p-4 text-sm text-[#a0a0b5] italic">
              {interimTranscript}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

