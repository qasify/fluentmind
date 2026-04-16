import Link from "next/link";

export default function AssessmentWizard() {
  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center fade-in">
      <div className="text-6xl mb-6">🎙️</div>
      <h1 className="heading-2 mb-4 gradient-text">Baseline Assessment</h1>
      <p className="text-lg text-[#a0a0b5] max-w-2xl mx-auto mb-8">
        Before we can generate your personalized weekly curriculum, we need to understand your current English level, speaking habits, and recurring grammar mistakes.
      </p>
      
      <div className="grid md:grid-cols-3 gap-4 w-full max-w-4xl mb-10 text-left">
        <div className="card p-5 border border-[rgba(255,255,255,0.05)]">
          <div className="text-primary-400 text-2xl mb-3">1️⃣</div>
          <h3 className="font-bold text-[#f0f0f5] mb-2">Introduce Yourself</h3>
          <p className="text-sm text-[#8b8b9d]">Tell us who you are, what you do, and why you are learning English.</p>
        </div>
        <div className="card p-5 border border-[rgba(255,255,255,0.05)]">
          <div className="text-warning-400 text-2xl mb-3">2️⃣</div>
          <h3 className="font-bold text-[#f0f0f5] mb-2">Share an Opinion</h3>
          <p className="text-sm text-[#8b8b9d]">Do you think Artificial Intelligence will help or harm society in the long run?</p>
        </div>
        <div className="card p-5 border border-[rgba(255,255,255,0.05)]">
          <div className="text-success-400 text-2xl mb-3">3️⃣</div>
          <h3 className="font-bold text-[#f0f0f5] mb-2">Describe a Challenge</h3>
          <p className="text-sm text-[#8b8b9d]">Talk about a recent challenge you faced and how you overcame it.</p>
        </div>
      </div>

      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-4 mb-8 inline-block">
        <p className="text-sm font-medium text-warning-400">
          💡 Try to speak continuously for at least 60 seconds answering all three prompts.
        </p>
      </div>

      <Link 
        href="/practice/record?topic=Baseline%20Assessment%3A%20Self-Introduction%2C%20Opinion%20on%20AI%2C%20and%20Recent%20Challenge&category=Assessment" 
        className="btn btn-primary px-8 py-4 text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(37,99,235,0.3)]"
      >
        Start Baseline Recording
      </Link>
      
      <Link href="/curriculum" className="mt-4 text-sm text-[#6b6b80] hover:text-[#a0a0b5] transition-colors">
        Wait, take me back
      </Link>
    </div>
  );
}
