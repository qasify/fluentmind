import Link from "next/link";

export default function HomeworkPage() {
  return (
    <div className="page-container" style={{ textAlign: "center" }}>
      <div style={{ padding: "var(--space-16) var(--space-4)" }}>
        <div style={{ fontSize: "4rem", marginBottom: "var(--space-6)" }}>📝</div>
        <h1 className="heading-2" style={{ marginBottom: "var(--space-4)" }}>Homework</h1>
        <p className="body-large text-secondary" style={{ maxWidth: 500, margin: "0 auto var(--space-8)" }}>
          After each session, your AI coach generates micro-tasks targeting your weakest areas.
          Complete sessions to unlock homework assignments.
        </p>
        <Link href="/practice/record" className="btn btn-primary btn-lg">🎙️ Start a Session</Link>
      </div>
    </div>
  );
}
