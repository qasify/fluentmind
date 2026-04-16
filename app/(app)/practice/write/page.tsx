"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";

type WritingState = "idle" | "evaluating" | "completed";

export default function PracticeWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTopic = searchParams.get("topic") || searchParams.get("prompt");
  const rawTitle = searchParams.get("title");
  const rawFocus = searchParams.get("focus");
  const defaultTopic = "Write a 150-word essay about the impact of artificial intelligence on modern education.";
  const topic = rawTopic ? decodeURIComponent(rawTopic) : defaultTopic;
  const title = rawTitle ? decodeURIComponent(rawTitle) : "Written Assignment";
  const focus = rawFocus ? decodeURIComponent(rawFocus) : "";
  
  const [text, setText] = useState("");
  const [state, setState] = useState<WritingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    mistakes,
    addSession,
    addXp,
    updateStreak,
    checkAndUnlockBadges,
    markMistakesAvoided,
    markMistakesRepeated,
    addMistakes
  } = useAppStore();

  const handleEvaluate = async () => {
    if (text.trim().length < 20) {
      setError("Your response is too short. Please provide a more detailed answer.");
      return;
    }

    setState("evaluating");
    setError(null);

    try {
      const activeMistakesText = mistakes
        .filter((m) => m.status === "active")
        .map((m) => `[${m.id}] Rule: ${m.rule} (Ex: ${m.examples?.[0]?.originalText} -> ${m.examples?.[0]?.suggestion})`)
        .join("\n");

      const res = await fetch("/api/ai/evaluate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          topic,
          category: "Writing/Grammar",
          pastContext: activeMistakesText
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to evaluate text.");

      const analysisData = json.data;
      const sessionId = `sess_write_${Date.now()}`;
      const normalizedAnalysis = {
        ...analysisData,
        confidence: analysisData.confidence || {
          score: 50,
          hedgingPhrases: [],
          assertivePhrases: [],
          feedback: "Confidence is estimated from writing tone and certainty.",
        },
        structure: {
          frameworkDetected: "none",
          frameworkAdherence: { segments: [], missingElements: [] },
          bestFrameworks: [],
          suggestedFramework: "PREP",
          ...(analysisData.structure || {}),
        },
      };

      // 1. Process Mistakes
      if (analysisData.overall?.mistakesAvoided?.length > 0) {
        await markMistakesAvoided(analysisData.overall.mistakesAvoided);
      }
      if (analysisData.overall?.mistakesRepeated?.length > 0) {
        await markMistakesRepeated(analysisData.overall.mistakesRepeated);
      }
      if (analysisData.overall?.newMistakesToTrack?.length > 0) {
        await addMistakes(analysisData.overall.newMistakesToTrack);
      }

      // 2. Save Session
      addSession({
        id: sessionId,
        type: "exam", // Can be repurposed as 'exam' or left as 'recording' for ease in frontend if 'writing' unsupported. Let's cast to 'exam' as it doesn't try to render audio player.
        topic,
        category: "Writing",
        transcript: text,
        analysis: normalizedAnalysis,
        audioMetadata: {
          totalDurationSeconds: 0,
          speakingTimeSeconds: 0,
          silenceTimeSeconds: 0,
          pauseCount: 0,
          wpm: 0
        },
        xpEarned: 50,
        createdAt: new Date().toISOString()
      });

      // 3. Rewards & Redirect
      addXp(50);
      updateStreak();
      checkAndUnlockBadges();

      router.push(`/evaluation/${sessionId}`);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during evaluation.");
      setState("idle");
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">Draft your response and receive instant AI feedback.</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card p-6 border-l-4 border-l-primary-500">
          <h2 className="text-sm font-bold text-primary-400 uppercase tracking-widest mb-2">Prompt</h2>
          <p className="text-lg leading-relaxed">{topic}</p>
          {focus && (
            <p className="text-xs font-mono text-[#8b8b9d] mt-3">
              Focus: <span className="text-primary-300">{focus}</span>
            </p>
          )}
        </div>

        <div className="card p-6 relative">
          <textarea
            className="w-full h-64 bg-background-tertiary border border-[rgba(255,255,255,0.05)] rounded-lg p-4 text-[#f0f0f5] placeholder:text-[#6b6b80] focus:ring-2 focus:ring-primary-500/50 outline-none resize-y transition-all"
            placeholder="Start writing your response here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={state === "evaluating"}
          />
          <div className="absolute bottom-10 right-10 text-xs font-mono text-[#6b6b80]">
            {text.trim().split(/\\s+/).filter(w => w.length > 0).length} words
          </div>
        </div>

        {error && (
          <div className="p-4 bg-danger-500/10 border border-danger-500/20 text-danger-400 rounded-lg text-sm flex items-center gap-3">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            className="btn btn-primary px-8 py-3 text-lg"
            onClick={handleEvaluate}
            disabled={state === "evaluating" || text.trim().length === 0}
          >
            {state === "evaluating" ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-[#fff] border-t-transparent rounded-full animate-spin"></span>
                Evaluating Response...
              </span>
            ) : "Submit for Evaluation"}
          </button>
        </div>
      </div>
    </div>
  );
}
