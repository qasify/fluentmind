"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppStore, type Session } from "@/lib/store";

type ExamRunGroup = {
  runId: string;
  mode: "full" | "part";
  createdAt: string;
  sessions: Session[];
  overallBand: number;
  parts: Array<{ part: 1 | 2 | 3; band: number }>;
};

function getBandFromSession(session: Session): number {
  return Number(session.analysis?.fluency?.ieltsBandEstimate || 0);
}

export default function ExamHistoryPage() {
  const { sessions } = useAppStore();

  const runs = useMemo(() => {
    const examSessions = sessions.filter((s) => s.type === "exam" && s.audioMetadata?.exam?.runId);
    const byRun = new Map<string, Session[]>();
    for (const s of examSessions) {
      const runId = s.audioMetadata.exam!.runId;
      byRun.set(runId, [...(byRun.get(runId) || []), s]);
    }

    const groups: ExamRunGroup[] = [];
    for (const [runId, runSessions] of byRun.entries()) {
      const sorted = [...runSessions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const createdAt = sorted[0]?.createdAt || new Date().toISOString();
      const mode = sorted[0]?.audioMetadata?.exam?.mode || "full";

      const perPart = new Map<1 | 2 | 3, number>();
      for (const s of sorted) {
        const p = s.audioMetadata.exam!.part;
        perPart.set(p, Math.max(perPart.get(p) || 0, getBandFromSession(s)));
      }
      const parts = ([1, 2, 3] as const)
        .filter((p) => perPart.has(p))
        .map((p) => ({ part: p, band: perPart.get(p) || 0 }));

      const overallBand =
        parts.length > 0
          ? Math.round((parts.reduce((sum, x) => sum + x.band, 0) / parts.length) * 2) / 2
          : 0;

      groups.push({
        runId,
        mode,
        createdAt,
        sessions: sorted,
        overallBand,
        parts,
      });
    }

    return groups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sessions]);

  return (
    <div className="page-container fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">📂 Exam History</h1>
          <p className="page-subtitle">Review every exam run with part-by-part bands and full evaluation.</p>
        </div>
        <Link href="/exam" className="btn btn-primary btn-sm">
          Start New Exam
        </Link>
      </div>

      {runs.length === 0 ? (
        <div className="text-center py-16 bg-background-elevated rounded-2xl border border-[rgba(255,255,255,0.06)]">
          <div className="text-5xl mb-4 opacity-50">🎓</div>
          <h3 className="heading-4 mb-2">No exams yet</h3>
          <p className="text-[#a0a0b5] max-w-sm mx-auto mb-6">
            Run an IELTS Speaking simulation to generate an exam history with deep review.
          </p>
          <Link href="/exam" className="btn btn-primary">Go to Exam Center</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {runs.map((run) => (
            <Link
              key={run.runId}
              href={`/history/exams/${encodeURIComponent(run.runId)}`}
              className="card p-6 border border-[rgba(255,255,255,0.05)] hover:border-primary-500/30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-[#6b6b80] mb-1">
                    IELTS Speaking · {run.mode === "full" ? "Full Exam" : "Single Part"}
                  </div>
                  <div className="font-bold text-[#f0f0f5] text-lg">
                    {new Date(run.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-[#a0a0b5] mt-1">
                    {run.sessions.length} step{run.sessions.length === 1 ? "" : "s"} · {run.parts.map((p) => `P${p.part}: ${p.band}`).join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-widest text-[#6b6b80]">Overall band</div>
                    <div className="text-3xl font-extrabold text-primary-400">{run.overallBand || "—"}</div>
                  </div>
                  <div className="text-2xl text-[#6b6b80]">→</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

