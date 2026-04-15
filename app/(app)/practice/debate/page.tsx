import Link from "next/link";

export default function DebatePage() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center fade-in">
      <div className="text-6xl mb-6">⚔️</div>
      <h1 className="heading-2 mb-4">Debate Mode</h1>
      <p className="text-lg text-[#a0a0b5] max-w-lg mx-auto mb-8">
        Practice argumentation by debating the AI on provocative topics. The AI takes the opposing
        view and pushes you to defend your position. Coming soon!
      </p>
      <Link href="/practice/record" className="btn btn-primary px-8 py-3 text-lg">
        🎙️ Practice Recording Instead
      </Link>
    </div>
  );
}
