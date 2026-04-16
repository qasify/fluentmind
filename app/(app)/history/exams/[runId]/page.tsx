"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppStore, type Session } from "@/lib/store";
import { useParams } from "next/navigation";

function getBand(session: Session): number {
  return Number(session.analysis?.fluency?.ieltsBandEstimate || 0);
}

function avgBand(bands: number[]): number {
  if (bands.length === 0) return 0;
  return Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 2) / 2;
}

export default function ExamRunDetailPage() {
  const { runId } = useParams() as { runId: string };
  const { sessions, setCurrentSession } = useAppStore();

  const runSessions = useMemo(() => {
    const filtered = sessions
      .filter((s) => s.type === "exam" && s.audioMetadata?.exam?.runId === runId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return filtered;
  }, [runId, sessions]);

  const meta = runSessions[0]?.audioMetadata?.exam;
  const mode = meta?.mode || "full";

  const perPart = useMemo(() => {
    const map = new Map<1 | 2 | 3, Session[]>();
    for (const s of runSessions) {
      const p = s.audioMetadata.exam!.part;
      map.set(p, [...(map.get(p) || []), s]);
    }
    return map;
  }, [runSessions]);

  const partsSummary = ([1, 2, 3] as const)
    .filter((p) => perPart.has(p))
    .map((p) => {
      const list = perPart.get(p) || [];
      const bands = list.map(getBand).filter((b) => b > 0);
      return { part: p, band: avgBand(bands), sessions: list };
    });

  const overallBand = avgBand(partsSummary.map((p) => p.band).filter((b) => b > 0));

  return (
    <div className="page-container fade-in !max-w-4xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#6b6b80] mb-1">
            IELTS Speaking · {mode === "full" ? "Full Exam" : "Single Part"}
          </div>
          <h1 className="page-title">Exam Run Review</h1>
          <p className="page-subtitle">Deep review of each step and band estimates per part.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/history/exams" className="btn btn-secondary btn-sm">← Exam History</Link>
          <Link href="/exam" className="btn btn-primary btn-sm">Start New</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 text-center">
          <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Overall band</div>
          <div className="text-4xl font-extrabold text-primary-400">{overallBand || "—"}</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Steps</div>
          <div className="text-4xl font-extrabold">{runSessions.length}</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Run ID</div>
          <div className="text-sm font-mono text-[#a0a0b5] break-all">{runId}</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Date</div>
          <div className="text-sm text-[#a0a0b5]">{runSessions[0] ? new Date(runSessions[0].createdAt).toLocaleString() : "—"}</div>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        {partsSummary.map((p) => (
          <div key={p.part} className="card p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#6b6b80] mb-1">Part {p.part}</div>
                <div className="text-xl font-bold text-[#f0f0f5]">Band {p.band || "—"}</div>
              </div>
              <div className="text-xs text-[#6b6b80]">{p.sessions.length} step{p.sessions.length === 1 ? "" : "s"}</div>
            </div>

            <div className="space-y-3">
              {p.sessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/evaluation/${s.id}`}
                  onClick={() => setCurrentSession(s)}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[rgba(255,255,255,0.06)] hover:bg-background-elevated transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[#f0f0f5] truncate">{s.topic}</div>
                    <div className="text-xs text-[#6b6b80] mt-1">
                      {new Date(s.createdAt).toLocaleString()} · Band {getBand(s) || "—"}
                    </div>
                  </div>
                  <div className="text-[#6b6b80] text-xl">→</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {runSessions.length === 0 && (
        <div className="text-center text-[#a0a0b5]">No sessions found for this run.</div>
      )}
    </div>
  );
}

