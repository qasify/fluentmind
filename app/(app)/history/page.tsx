"use client";

import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function HistoryPage() {
  const { sessions } = useAppStore();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📂 Session History</h1>
        <p className="page-subtitle">{sessions.length} sessions recorded</p>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)", opacity: 0.5 }}>📂</div>
          <h3 className="heading-4" style={{ marginBottom: "var(--space-2)" }}>No sessions yet</h3>
          <p className="text-secondary" style={{ maxWidth: 400, margin: "0 auto var(--space-6)" }}>
            Your practice history will appear here after your first session.
          </p>
          <Link href="/practice/record" className="btn btn-primary">🎙️ Start Recording</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/evaluation/${session.id}`}
              className="card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="flex items-center gap-4">
                <span style={{ fontSize: "var(--text-xl)" }}>
                  {session.type === "recording" ? "🎙️" : session.type === "conversation" ? "🗣️" : "🎓"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{session.topic}</div>
                  <div className="body-small text-tertiary">
                    {session.category} · {new Date(session.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>
                    {session.analysis.overall.score}
                  </div>
                  <div className="body-small text-tertiary">Overall</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
