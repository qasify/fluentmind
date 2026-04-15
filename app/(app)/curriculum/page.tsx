import Link from "next/link";

export default function CurriculumPage() {
  return (
    <div className="page-container" style={{ textAlign: "center" }}>
      <div style={{ padding: "var(--space-16) var(--space-4)" }}>
        <div style={{ fontSize: "4rem", marginBottom: "var(--space-6)" }}>📋</div>
        <h1 className="heading-2" style={{ marginBottom: "var(--space-4)" }}>Weekly Curriculum</h1>
        <p className="body-large text-secondary" style={{ maxWidth: 500, margin: "0 auto var(--space-8)" }}>
          Your AI coach will generate a personalized weekly lesson plan based on your performance.
          Complete a few sessions first so we can understand your strengths and weaknesses.
        </p>
        <Link href="/practice/record" className="btn btn-primary btn-lg">🎙️ Start a Session</Link>
      </div>
    </div>
  );
}
