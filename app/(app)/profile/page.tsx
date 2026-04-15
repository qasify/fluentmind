"use client";

import { useAppStore } from "@/lib/store";
import { motion, type Variants } from "framer-motion";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function ProfilePage() {
  const {
    totalXp, currentLevel, currentLevelTitle, currentStreak, longestStreak,
    sessions, vocabularyBank, badges, profile
  } = useAppStore();

  const unlockedBadges = badges.filter((b) => b.unlockedAt);
  const displayName = profile.displayName || "FluentMind User";

  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + s.audioMetadata.totalDurationSeconds, 0) / 60
  );

  const goalLabels: Record<string, string> = {
    ielts: "IELTS / Exam Prep",
    professional: "Professional Growth",
    casual: "Casual Conversation",
    academic: "Academic English",
  };

  const levelLabels: Record<string, string> = {
    beginner: "Beginner (A1-A2)",
    intermediate: "Intermediate (B1-B2)",
    advanced: "Advanced (C1-C2)",
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👤 Your Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="card-glow text-center p-10 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-3xl mb-4 mx-auto shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          {displayName[0]?.toUpperCase() || "F"}
        </div>
        <div className="heading-3 mb-1">{displayName}</div>
        <div className="gradient-text heading-5 mb-2">{currentLevelTitle}</div>
        <div className="text-[#a0a0b5] text-base">Level {currentLevel} · {totalXp} XP</div>

        {profile.goal && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="badge badge-primary">{goalLabels[profile.goal] || profile.goal}</span>
            {profile.currentLevel && (
              <span className="badge badge-accent">{levelLabels[profile.currentLevel] || profile.currentLevel}</span>
            )}
            {profile.nativeLanguage && (
              <span className="badge badge-warning">🌍 {profile.nativeLanguage}</span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeIn} className="stat-card">
          <div className="stat-label">Current Streak</div>
          <div className="stat-value text-warning-400">🔥 {currentStreak}</div>
        </motion.div>
        <motion.div variants={fadeIn} className="stat-card">
          <div className="stat-label">Longest Streak</div>
          <div className="stat-value">{longestStreak}</div>
        </motion.div>
        <motion.div variants={fadeIn} className="stat-card">
          <div className="stat-label">Sessions</div>
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-change text-[#6b6b80]">{totalMinutes} min</div>
        </motion.div>
        <motion.div variants={fadeIn} className="stat-card">
          <div className="stat-label">Words Learned</div>
          <div className="stat-value text-primary-400">{vocabularyBank.length}</div>
        </motion.div>
      </motion.div>

      {/* Badges */}
      <div className="card p-6">
        <h3 className="heading-5 mb-6">🏅 Badges ({unlockedBadges.length}/{badges.length})</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center p-4 rounded-xl border text-center transition-all ${
                badge.unlockedAt
                  ? "bg-primary-500/5 border-primary-500/20"
                  : "bg-background-tertiary border-[rgba(255,255,255,0.04)] opacity-30 grayscale"
              }`}
              title={badge.description}
            >
              <span className="text-2xl mb-2">{badge.icon}</span>
              <span className="text-xs font-semibold leading-tight">{badge.name}</span>
              {badge.unlockedAt && (
                <span className="text-[10px] text-primary-400 mt-1">
                  {new Date(badge.unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
