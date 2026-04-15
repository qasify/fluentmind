"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { motion, type Variants } from "framer-motion";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export default function ProgressPage() {
  const {
    totalXp, currentLevel, currentLevelTitle, currentStreak, longestStreak,
    sessions, vocabularyBank, badges, profile
  } = useAppStore();

  // Calculate averages from sessions
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.analysis.overall.score, 0) / sessions.length)
    : 0;

  const avgWpm = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + s.audioMetadata.wpm, 0) / sessions.length)
    : 0;

  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + s.audioMetadata.totalDurationSeconds, 0) / 60
  );

  const unlockedBadges = badges.filter((b) => b.unlockedAt);

  // Dimension averages for radar
  const dimLabels = ["Clarity", "Vocabulary", "Grammar", "Structure", "Fluency", "Confidence"];
  const dimKeys = ["clarity", "vocabulary", "grammar", "structure", "fluency", "confidence"] as const;
  const dimAverages = dimKeys.map((key) =>
    sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.analysis[key]?.score ?? 0), 0) / sessions.length)
      : 0
  );

  // Session score trend (last 10)
  const scoreTrend = sessions.slice(0, 10).reverse().map((s, i) => ({
    label: `S${i + 1}`,
    score: s.analysis.overall.score,
  }));

  // XP milestones
  const LEVELS = [
    { xp: 0, title: "Novice" }, { xp: 500, title: "Emerging" }, { xp: 1500, title: "Developing" },
    { xp: 4000, title: "Confident" }, { xp: 8000, title: "Articulate" }, { xp: 15000, title: "Persuasive" },
    { xp: 25000, title: "Eloquent" }, { xp: 40000, title: "Distinguished" }, { xp: 60000, title: "Master" },
    { xp: 100000, title: "Legendary" },
  ];
  const nextLevel = LEVELS[currentLevel] || LEVELS[LEVELS.length - 1];
  const prevLevel = LEVELS[currentLevel - 1] || LEVELS[0];
  const progressToNext = nextLevel.xp > prevLevel.xp
    ? ((totalXp - prevLevel.xp) / (nextLevel.xp - prevLevel.xp)) * 100
    : 100;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">📈 Your Progress</h1>
        <p className="page-subtitle">
          {profile.displayName ? `${profile.displayName}'s` : "Your"} growth over time
        </p>
      </div>

      {/* Level Card */}
      <div className="card-glow text-center p-10 mb-8">
        <div className="text-4xl mb-3">🏆</div>
        <div className="heading-2 gradient-text mb-1">Level {currentLevel}</div>
        <div className="heading-4 mb-4">{currentLevelTitle}</div>
        <div className="max-w-md mx-auto mb-2">
          <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-primary rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, progressToNext)}%` }}
            />
          </div>
        </div>
        <div className="text-sm text-[#a0a0b5]">
          {totalXp} / {nextLevel.xp} XP to {nextLevel.title}
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp} className="stat-card">
          <div className="stat-label">Streak</div>
          <div className="stat-value text-warning-400">🔥 {currentStreak}</div>
          <div className="stat-change text-[#6b6b80]">Best: {longestStreak}</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="stat-card">
          <div className="stat-label">Sessions</div>
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-change text-[#6b6b80]">{totalMinutes} min total</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="stat-card">
          <div className="stat-label">Avg Score</div>
          <div className={`stat-value ${avgScore >= 80 ? "text-success-400" : avgScore >= 60 ? "text-warning-400" : "text-danger-400"}`}>
            {avgScore || "—"}
          </div>
          <div className="stat-change text-[#6b6b80]">Out of 100</div>
        </motion.div>
        <motion.div variants={fadeInUp} className="stat-card">
          <div className="stat-label">Avg WPM</div>
          <div className="stat-value">{avgWpm || "—"}</div>
          <div className="stat-change text-[#6b6b80]">Target: 120-150</div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Skill Radar */}
        <div className="card p-6">
          <h3 className="heading-5 mb-6">Skill Breakdown</h3>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-[#6b6b80]">Complete sessions to see your skill radar</div>
          ) : (
            <div className="grid gap-3">
              {dimLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm font-semibold w-24 text-[#a0a0b5]">{label}</span>
                  <div className="flex-1 h-3 bg-background-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dimAverages[i]}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        dimAverages[i] >= 80 ? "bg-success-400" : dimAverages[i] >= 60 ? "bg-warning-400" : "bg-danger-400"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-bold w-8 text-right">{dimAverages[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score Trend */}
        <div className="card p-6">
          <h3 className="heading-5 mb-6">Score Trend (Last 10)</h3>
          {scoreTrend.length === 0 ? (
            <div className="text-center py-8 text-[#6b6b80]">Complete sessions to see your score trend</div>
          ) : (
            <div className="flex items-end gap-2 h-48">
              {scoreTrend.map((item, i) => {
                const color = item.score >= 80 ? "bg-success-400" : item.score >= 60 ? "bg-warning-400" : "bg-danger-400";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold">{item.score}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${item.score}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                      className={`w-full rounded-t-md ${color} min-h-[4px]`}
                    />
                    <span className="text-[10px] text-[#6b6b80]">{item.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Vocabulary Stats */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-5">Vocabulary Progress</h3>
          <Link href="/vocabulary" className="text-sm font-semibold text-primary-400 hover:text-primary-300">
            View Bank →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-primary-400">{vocabularyBank.length}</div>
            <div className="text-xs text-[#6b6b80] mt-1 uppercase tracking-wider">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-success-400">
              {vocabularyBank.filter((w) => w.masteryLevel === "mastered").length}
            </div>
            <div className="text-xs text-[#6b6b80] mt-1 uppercase tracking-wider">Mastered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-warning-400">
              {vocabularyBank.filter((w) => w.masteryLevel === "learning").length}
            </div>
            <div className="text-xs text-[#6b6b80] mt-1 uppercase tracking-wider">Learning</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-accent-400">
              {vocabularyBank.filter((w) => w.masteryLevel === "new").length}
            </div>
            <div className="text-xs text-[#6b6b80] mt-1 uppercase tracking-wider">New</div>
          </div>
        </div>
        {vocabularyBank.length > 0 && (
          <div className="mt-6 text-center">
            <Link href="/vocabulary/review" className="btn btn-secondary btn-sm">
              🧠 Start Review Quiz
            </Link>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-5">🏅 Badges ({unlockedBadges.length}/{badges.length})</h3>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
                badge.unlockedAt
                  ? "bg-primary-500/5 border-primary-500/20"
                  : "bg-background-tertiary border-[rgba(255,255,255,0.04)] opacity-40 grayscale"
              }`}
              title={badge.description}
            >
              <span className="text-2xl mb-2">{badge.icon}</span>
              <span className="text-xs font-semibold leading-tight">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
