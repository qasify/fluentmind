import Link from "next/link";

export default function ConversationPage() {
  return (
    <div className="page-container" style={{ textAlign: "center" }}>
      <div style={{ padding: "var(--space-16) var(--space-4)" }}>
        <div style={{ fontSize: "4rem", marginBottom: "var(--space-6)" }}>🗣️</div>
        <h1 className="heading-2" style={{ marginBottom: "var(--space-4)" }}>
          AI Conversation Partner
        </h1>
        <p className="body-large text-secondary" style={{ maxWidth: 500, margin: "0 auto var(--space-6)" }}>
          Talk back and forth with an AI that corrects your grammar naturally,
          introduces new vocabulary, and pushes you to elaborate. Coming soon!
        </p>
        <p className="body-base text-tertiary" style={{ maxWidth: 500, margin: "0 auto var(--space-8)" }}>
          For now, use the Recording Studio to practice monologues and get AI analysis on your speech.
        </p>
        <Link href="/practice/record" className="btn btn-primary btn-lg">
          🎙️ Go to Recording Studio
        </Link>
      </div>
    </div>
  );
}
