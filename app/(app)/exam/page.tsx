import Link from "next/link";

export default function ExamPage() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center fade-in">
      <div className="text-6xl mb-6">🎓</div>
      <h1 className="heading-2 mb-4">Exam Center</h1>
      <p className="text-lg text-[#a0a0b5] max-w-lg mx-auto mb-8">
        Simulate full IELTS Speaking tests (Part 1, 2, 3) with AI-estimated band scores.
        TOEFL and CEFR assessments coming too. Build your skills first!
      </p>
      <Link href="/practice/record" className="btn btn-primary px-8 py-3 text-lg">
        🎙️ Practice First
      </Link>
    </div>
  );
}
