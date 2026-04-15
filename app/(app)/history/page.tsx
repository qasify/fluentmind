"use client";

import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function HistoryPage() {
  const { sessions, setCurrentSession } = useAppStore();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📂 Session History</h1>
        <p className="page-subtitle">{sessions.length} sessions recorded</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-background-elevated rounded-2xl border border-[rgba(255,255,255,0.06)]">
          <div className="text-5xl mb-4 opacity-50">📂</div>
          <h3 className="heading-4 mb-2">No sessions yet</h3>
          <p className="text-[#a0a0b5] max-w-sm mx-auto mb-6">
            Your practice history will appear here after your first session.
          </p>
          <Link href="/practice/record" className="btn btn-primary">🎙️ Start Recording</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => {
            const scoreColor =
              session.analysis.overall.score >= 80 ? "text-success-400"
              : session.analysis.overall.score >= 60 ? "text-warning-400"
              : "text-danger-400";

            return (
              <Link
                key={session.id}
                href={`/evaluation/${session.id}`}
                onClick={() => setCurrentSession(session)}
                className="card flex items-center gap-4 hover:-translate-y-[1px]"
              >
                <div className="w-11 h-11 shrink-0 rounded-xl bg-background-elevated flex items-center justify-center text-xl">
                  {session.type === "recording" ? "🎙️" : session.type === "conversation" ? "🗣️" : "🎓"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{session.topic}</div>
                  <div className="text-xs text-[#6b6b80] flex items-center gap-2">
                    <span>{session.category}</span>
                    <span>·</span>
                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{Math.round(session.audioMetadata.totalDurationSeconds / 60)}m {session.audioMetadata.totalDurationSeconds % 60}s</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-2xl font-extrabold ${scoreColor}`}>
                    {session.analysis.overall.score}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#6b6b80]">Score</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
