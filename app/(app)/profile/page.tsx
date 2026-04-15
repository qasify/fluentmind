"use client";

import { useAppStore } from "@/lib/store";

export default function ProfilePage() {
  const { totalXp, currentLevel, currentLevelTitle, currentStreak, longestStreak, sessions, vocabularyBank } =
    useAppStore();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👤 Your Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="card-glow" style={{ textAlign: "center", padding: "var(--space-10)", marginBottom: "var(--space-6)" }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "var(--radius-full)",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            margin: "0 auto var(--space-4)",
          }}
        >
          👤
        </div>
        <div className="heading-3" style={{ marginBottom: "var(--space-1)" }}>
          FluentMind User
        </div>
        <div className="gradient-text heading-5" style={{ marginBottom: "var(--space-2)" }}>
          {currentLevelTitle}
        </div>
        <div className="text-secondary body-base">Level {currentLevel} · {totalXp} XP</div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <div className="stat-label">Current Streak</div>
          <div className="stat-value">🔥 {currentStreak}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Longest Streak</div>
          <div className="stat-value">{longestStreak}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sessions</div>
          <div className="stat-value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Words Learned</div>
          <div className="stat-value">{vocabularyBank.length}</div>
        </div>
      </div>

      {/* Badges Placeholder */}
      <div className="card" style={{ textAlign: "center", padding: "var(--space-10)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "var(--space-4)", opacity: 0.4 }}>🏅</div>
        <h3 className="heading-5" style={{ marginBottom: "var(--space-2)" }}>Badges & Achievements</h3>
        <p className="text-secondary body-base">
          Earn badges by maintaining streaks, reaching score milestones, and leveling up.
        </p>
      </div>
    </div>
  );
}
