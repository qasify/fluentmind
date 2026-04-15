import Link from "next/link";

export default function ConversationPage() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center fade-in">
      <div className="text-6xl mb-6">🗣️</div>
      <h1 className="heading-2 mb-4">AI Conversation Partner</h1>
      <p className="text-lg text-[#a0a0b5] max-w-lg mx-auto mb-4">
        Talk back and forth with an AI that corrects your grammar naturally,
        introduces new vocabulary, and pushes you to elaborate. Coming soon!
      </p>
      <p className="text-sm text-[#6b6b80] max-w-sm mx-auto mb-8">
        For now, use the Recording Studio to practice monologues and get AI analysis on your speech.
      </p>
      <Link href="/practice/record" className="btn btn-primary px-8 py-3 text-lg">
        🎙️ Go to Recording Studio
      </Link>
    </div>
  );
}
