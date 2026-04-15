import Link from "next/link";

export default function DebatePage() {
  return (
    <div className="page-container" style={{ textAlign: "center" }}>
      <div style={{ padding: "var(--space-16) var(--space-4)" }}>
        <div style={{ fontSize: "4rem", marginBottom: "var(--space-6)" }}>⚔️</div>
        <h1 className="heading-2" style={{ marginBottom: "var(--space-4)" }}>
          Debate Mode
        </h1>
        <p className="body-large text-secondary" style={{ maxWidth: 500, margin: "0 auto var(--space-8)" }}>
          Practice argumentation by debating the AI on provocative topics. The AI takes the opposing
          view and pushes you to defend your position. Coming soon!
        </p>
        <Link href="/practice/record" className="btn btn-primary btn-lg">
          🎙️ Practice Recording Instead
        </Link>
      </div>
    </div>
  );
}
