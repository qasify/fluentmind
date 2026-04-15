import Link from "next/link";

export default function ExamPage() {
  return (
    <div className="page-container" style={{ textAlign: "center" }}>
      <div style={{ padding: "var(--space-16) var(--space-4)" }}>
        <div style={{ fontSize: "4rem", marginBottom: "var(--space-6)" }}>🎓</div>
        <h1 className="heading-2" style={{ marginBottom: "var(--space-4)" }}>Exam Center</h1>
        <p className="body-large text-secondary" style={{ maxWidth: 500, margin: "0 auto var(--space-8)" }}>
          Simulate full IELTS Speaking tests (Part 1, 2, 3) with AI-estimated band scores.
          TOEFL and CEFR assessments coming too. Build your skills first!
        </p>
        <Link href="/practice/record" className="btn btn-primary btn-lg">🎙️ Practice First</Link>
      </div>
    </div>
  );
}
