import Link from "next/link";

const features = [
  {
    icon: "🎙️",
    title: "AI-Powered Recording Studio",
    desc: "Record yourself speaking on daily challenges. The app captures every pause, filler word, and hesitation — then feeds it to our AI brain for deep, 6-dimensional analysis.",
    gradient: "from-[#06b6d4] to-[#22d3ee]",
  },
  {
    icon: "🗣️",
    title: "Live AI Conversation",
    desc: "Talk back and forth with an AI that acts as your personal speaking partner. It adapts to your level, corrects you naturally, and pushes you to elaborate — like a real tutor.",
    gradient: "from-[#8b5cf6] to-[#a78bfa]",
  },
  {
    icon: "🧠",
    title: "6-Dimension Evaluation",
    desc: "Every session is scored across Clarity, Vocabulary, Grammar, Structure, Fluency, and Confidence. See highlighted transcripts, word upgrades, and framework coaching.",
    gradient: "from-[#10b981] to-[#34d399]",
  },
  {
    icon: "📖",
    title: "Adaptive Curriculum",
    desc: "Every week, your AI coach generates a personalized lesson plan targeting your weakest areas. Complete daily tasks, homework, and gradually level up from B1 to C2.",
    gradient: "from-[#f59e0b] to-[#fbbf24]",
  },
  {
    icon: "📚",
    title: "Smart Vocabulary System",
    desc: "Save new words to your personal bank. The FSRS spaced repetition algorithm ensures you actually remember them — with quizzes before every practice session.",
    gradient: "from-[#f43f5e] to-[#fb7185]",
  },
  {
    icon: "🏆",
    title: "Gamified Progress Tracking",
    desc: "Streaks, XP, levels, badges, and heat maps. Every minute you practice earns progress. Level up from Novice Communicator to Master Communicator.",
    gradient: "from-[#06b6d4] to-[#8b5cf6]",
  },
];

const steps = [
  {
    title: "Speak for 5 Minutes",
    desc: "Open the app, pick a topic or accept today's daily challenge, and hit record. Speak naturally — the app captures everything: your words, your pauses, your confidence.",
  },
  {
    title: "AI Analyzes Everything",
    desc: "Your speech is analyzed across 6 dimensions. Fillers are highlighted in red. Basic words get upgrade suggestions. Grammar errors get corrections. Your structure is graded.",
  },
  {
    title: "Learn & Level Up",
    desc: "Save new vocabulary, complete homework tasks, review your progress charts. Every day you practice, your streak grows and your skills improve measurably.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4 flex items-center justify-between bg-[rgba(10,10,15,0.7)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[#f0f0f5]">
          <div className="w-8 h-8 rounded-md bg-gradient-primary flex items-center justify-center font-extrabold text-base text-white">F</div>
          <span>
            Fluent<span className="gradient-text">Mind</span>
          </span>
        </Link>
        <div className="flex gap-3 items-center">
          <Link href="/login" className="btn btn-ghost">
            Log In
          </Link>
          <Link href="/signup" className="btn btn-primary hidden sm:inline-flex">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-8 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full text-transparent bg-[radial-gradient(circle,rgba(6,182,212,0.12)_0%,transparent_70%)]" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full text-transparent bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_70%)]" />
        </div>
        
        <div className="relative z-10 max-w-4xl w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-sm font-medium text-primary-400 mb-8 mx-auto">
            ✨ AI-Powered Speaking Coach
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            Speak English Like <span className="gradient-text">You Always Wanted To</span>
          </h1>
          <p className="text-base md:text-xl text-[#a0a0b5] leading-relaxed max-w-2xl mx-auto mb-10">
            Your personal AI tutor that listens to you speak, analyzes every word,
            detects your bad habits, and coaches you to fluency — 24/7, completely
            free. No more $30/hour tutoring sessions.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup" className="btn btn-primary btn-lg" id="hero-cta">
              Start Practicing Now →
            </Link>
            <Link href="#features" className="btn btn-secondary btn-lg">
              See How It Works
            </Link>
          </div>
          
          <div className="flex gap-6 md:gap-10 justify-center mt-16 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-extrabold tracking-tight gradient-text">6</div>
              <div className="text-sm text-[#6b6b80] mt-1">Analysis Dimensions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold tracking-tight gradient-text">24/7</div>
              <div className="text-sm text-[#6b6b80] mt-1">Available Anytime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold tracking-tight gradient-text">$0</div>
              <div className="text-sm text-[#6b6b80] mt-1">Completely Free</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 max-w-7xl mx-auto" id="features">
        <h2 className="text-3xl md:text-5xl font-bold text-center tracking-tight mb-3">
          Everything a Human Tutor Does. <span className="gradient-text">But Better.</span>
        </h2>
        <p className="text-center text-[#a0a0b5] text-lg max-w-2xl mx-auto mb-16">
          Built to replace expensive sessions with intelligent,
          always-available AI coaching that never forgets your mistakes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="relative bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 transition-all duration-250 overflow-hidden hover:border-[rgba(255,255,255,0.1)] hover:-translate-y-1 hover:shadow-xl group">
              <div className={`absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-250 bg-gradient-to-r ${f.gradient}`} />
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-background-elevated rounded-xl mb-5">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-[#a0a0b5] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24 bg-background-secondary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center tracking-tight mb-16">
            Three Steps to <span className="gradient-text">Better English</span>
          </h2>
          <div className="flex flex-col gap-8 md:gap-12">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
                <div className="w-12 h-12 shrink-0 flex items-center justify-center text-xl font-extrabold rounded-full bg-gradient-primary text-white">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                  <p className="text-[#a0a0b5] leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Ready to <span className="gradient-text">Level Up?</span>
        </h2>
        <p className="text-[#a0a0b5] text-lg max-w-xl mx-auto mb-8">
          Join FluentMind and start your journey from Novice to Master
          Communicator. It takes less than 5 minutes a day.
        </p>
        <Link href="/signup" className="btn btn-primary btn-lg">
          Create Free Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[rgba(255,255,255,0.06)] text-center text-[#6b6b80] text-sm">
        <p>© {new Date().getFullYear()} FluentMind AI. Your intelligent speaking coach.</p>
      </footer>
    </div>
  );
}
