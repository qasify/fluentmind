import Link from "next/link";
import styles from "./page.module.css";

const features = [
  {
    icon: "🎙️",
    title: "AI-Powered Recording Studio",
    desc: "Record yourself speaking on daily challenges. The app captures every pause, filler word, and hesitation — then feeds it to our AI brain for deep, 6-dimensional analysis.",
  },
  {
    icon: "🗣️",
    title: "Live AI Conversation",
    desc: "Talk back and forth with an AI that acts as your personal speaking partner. It adapts to your level, corrects you naturally, and pushes you to elaborate — like a real tutor.",
  },
  {
    icon: "🧠",
    title: "6-Dimension Evaluation",
    desc: "Every session is scored across Clarity, Vocabulary, Grammar, Structure, Fluency, and Confidence. See highlighted transcripts, word upgrades, and framework coaching.",
  },
  {
    icon: "📖",
    title: "Adaptive Curriculum",
    desc: "Every week, your AI coach generates a personalized lesson plan targeting your weakest areas. Complete daily tasks, homework, and gradually level up from B1 to C2.",
  },
  {
    icon: "📚",
    title: "Smart Vocabulary System",
    desc: "Save new words to your personal bank. The FSRS spaced repetition algorithm ensures you actually remember them — with quizzes before every practice session.",
  },
  {
    icon: "🏆",
    title: "Gamified Progress Tracking",
    desc: "Streaks, XP, levels, badges, and heat maps. Every minute you practice earns progress. Level up from Novice Communicator to Master Communicator.",
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
    <div className={styles.landing}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <div className={styles.navLogoIcon}>F</div>
          <span>
            Fluent<span className="gradient-text">Mind</span>
          </span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/login" className="btn btn-ghost">
            Log In
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            ✨ AI-Powered Speaking Coach
          </div>
          <h1 className={styles.heroTitle}>
            Speak English Like{" "}
            <span className="gradient-text">You Always Wanted To</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Your personal AI tutor that listens to you speak, analyzes every word,
            detects your bad habits, and coaches you to fluency — 24/7, completely
            free. No more $30/hour tutoring sessions.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup" className="btn btn-primary btn-lg" id="hero-cta">
              Start Practicing Now →
            </Link>
            <Link href="#features" className="btn btn-secondary btn-lg">
              See How It Works
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <div className={`${styles.heroStatValue} gradient-text`}>6</div>
              <div className={styles.heroStatLabel}>Analysis Dimensions</div>
            </div>
            <div className={styles.heroStat}>
              <div className={`${styles.heroStatValue} gradient-text`}>24/7</div>
              <div className={styles.heroStatLabel}>Available Anytime</div>
            </div>
            <div className={styles.heroStat}>
              <div className={`${styles.heroStatValue} gradient-text`}>$0</div>
              <div className={styles.heroStatLabel}>Completely Free</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features} id="features">
        <h2 className={styles.featuresTitle}>
          Everything a Human Tutor Does.{" "}
          <span className="gradient-text">But Better.</span>
        </h2>
        <p className={styles.featuresSubtitle}>
          Built to replace expensive Preply sessions with intelligent,
          always-available AI coaching that never forgets your mistakes.
        </p>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <div className={styles.howContent}>
          <h2 className={styles.howTitle}>
            Three Steps to{" "}
            <span className="gradient-text">Better English</span>
          </h2>
          <div className={styles.steps}>
            {steps.map((s, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>
          Ready to <span className="gradient-text">Level Up?</span>
        </h2>
        <p className={styles.ctaSubtitle}>
          Join FluentMind and start your journey from Novice to Master
          Communicator. It takes less than 5 minutes a day.
        </p>
        <Link href="/signup" className="btn btn-primary btn-lg">
          Create Free Account →
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} FluentMind AI. Your intelligent speaking coach.</p>
      </footer>
    </div>
  );
}
