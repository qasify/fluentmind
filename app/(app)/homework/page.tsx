import Link from "next/link";

export default function HomeworkPage() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center fade-in">
      <div className="text-6xl mb-6">📝</div>
      <h1 className="heading-2 mb-4">Homework</h1>
      <p className="text-lg text-[#a0a0b5] max-w-lg mx-auto mb-8">
        After each session, your AI coach generates micro-tasks targeting your weakest areas.
        Complete sessions to unlock homework assignments.
      </p>
      <Link href="/practice/record" className="btn btn-primary px-8 py-3 text-lg">
        🎙️ Start a Session
      </Link>
    </div>
  );
}
