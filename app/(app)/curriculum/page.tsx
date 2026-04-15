import Link from "next/link";

export default function CurriculumPage() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center fade-in">
      <div className="text-6xl mb-6">📋</div>
      <h1 className="heading-2 mb-4">Weekly Curriculum</h1>
      <p className="text-lg text-[#a0a0b5] max-w-lg mx-auto mb-8">
        Your AI coach will generate a personalized weekly lesson plan based on your performance.
        Complete a few sessions first so we can understand your strengths and weaknesses.
      </p>
      <Link href="/practice/record" className="btn btn-primary px-8 py-3 text-lg">
        🎙️ Start a Session
      </Link>
    </div>
  );
}
