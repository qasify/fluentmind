"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppStore } from "@/lib/store";

function getDifficultyBand(eloRating: number): string {
  if (eloRating < 1000) return "Beginner-Safe";
  if (eloRating < 1300) return "Intermediate Structured";
  if (eloRating < 1600) return "Advanced Applied";
  return "Expert Precision";
}

export default function HomeworkPage() {
  const { activeCurriculum, markTaskCompleted, mistakes, sessions, eloRating } = useAppStore();

  const homeworkTasks = useMemo(
    () =>
      (activeCurriculum?.tasks || [])
        .filter((task) => ["writing", "grammar", "homework"].includes(task.type))
        .sort((a, b) => a.dayNumber - b.dayNumber),
    [activeCurriculum]
  );

  const activePatterns = mistakes.filter((m) => m.status === "active");
  const fixedPatterns = mistakes.filter((m) => m.status === "fixed");
  const recentAverageScore = sessions.length
    ? Math.round(
        sessions.slice(0, 5).reduce((sum, s) => sum + (s.analysis?.overall?.score || 0), 0) /
          Math.min(5, sessions.length)
      )
    : 0;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Homework Lab</h1>
        <p className="page-subtitle">Generated writing and grammar drills aligned to your weak patterns.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-5">
          <p className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Adaptive Difficulty</p>
          <p className="text-2xl font-bold text-primary-400">{getDifficultyBand(eloRating)}</p>
          <p className="text-sm text-[#8b8b9d] mt-2">ELO {eloRating}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Recent Avg Score</p>
          <p className="text-2xl font-bold">{recentAverageScore || "--"}</p>
          <p className="text-sm text-[#8b8b9d] mt-2">Last 5 sessions</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Error Patterns</p>
          <p className="text-2xl font-bold text-warning-400">{activePatterns.length} active</p>
          <p className="text-sm text-[#8b8b9d] mt-2">{fixedPatterns.length} fixed so far</p>
        </div>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="heading-4 mb-4">Assigned Homework Tasks</h2>
        {homeworkTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#a0a0b5] mb-4">
              No writing/grammar tasks in the active curriculum yet. Generate or regenerate your weekly curriculum.
            </p>
            <Link href="/curriculum" className="btn btn-primary btn-sm">
              Open Curriculum
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {homeworkTasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-xl border ${task.isCompleted ? "border-success-400/20 bg-success-400/5" : "border-[rgba(255,255,255,0.08)]"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-primary-400 mb-1">Day {task.dayNumber}</p>
                    <h3 className={`font-bold ${task.isCompleted ? "line-through text-[#6b6b80]" : "text-[#f0f0f5]"}`}>
                      {task.title}
                    </h3>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-background-tertiary uppercase">{task.type}</span>
                </div>
                <p className="text-sm text-[#a0a0b5] mb-3">{task.description}</p>
                <div className="flex flex-wrap gap-2">
                  {!task.isCompleted && (
                    <>
                      <Link
                        href={`/practice/write?title=${encodeURIComponent(task.title)}&prompt=${encodeURIComponent(`${task.title}. ${task.description || ""}`)}&focus=${encodeURIComponent(task.targetFocus || "")}`}
                        className="btn btn-primary btn-sm"
                      >
                        Start Submission
                      </Link>
                      {activeCurriculum && (
                        <button
                          onClick={() => markTaskCompleted(activeCurriculum.id, task.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                    </>
                  )}
                  {task.isCompleted && <span className="text-success-400 text-sm font-medium">Completed</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="heading-4 mb-4">Error Pattern Tracker</h2>
        {mistakes.length === 0 ? (
          <p className="text-[#a0a0b5]">No tracked error patterns yet. Complete a session to start tracking.</p>
        ) : (
          <div className="space-y-3">
            {mistakes.slice(0, 8).map((mistake) => (
              <div key={mistake.id} className="p-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-background-tertiary">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{mistake.rule}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      mistake.status === "active" ? "bg-warning-400/10 text-warning-400" : "bg-success-400/10 text-success-400"
                    }`}
                  >
                    {mistake.status}
                  </span>
                </div>
                <p className="text-xs text-[#8b8b9d] mt-1">Avoidance streak: {mistake.avoidanceCount}/3</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
