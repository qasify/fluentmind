"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";

export default function ProgressPage() {
  const { totalXp, currentLevel, currentLevelTitle, currentStreak, longestStreak, sessions } = useAppStore();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📈 Your Progress</h1>
        <p className="page-subtitle">Track your growth over time</p>
      </div>

      {/* Level Card */}
      <div className="card-glow" style={{ marginBottom: "var(--space-6)", textAlign: "center", padding: "var(--space-10)" }}>
        <div style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }}>🏆</div>
        <div className="heading-3 gradient-text" style={{ marginBottom: "var(--space-2)" }}>
          Level {currentLevel}
        </div>
        <div className="heading-4" style={{ marginBottom: "var(--space-4)" }}>
          {currentLevelTitle}
        </div>
        <div className="progress-bar" style={{ maxWidth: 400, margin: "0 auto var(--space-2)" }}>
          <div className="progress-fill" style={{ width: `${(totalXp % 500) / 5}%` }} />
        </div>
        <div className="body-small text-secondary">
          {totalXp} XP total
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "var(--space-8)" }}>
        <div className="stat-card">
          <div className="stat-label">Current Streak</div>
          <div className="stat-value">🔥 {currentStreak}</div>
          <div className="stat-change">Days in a row</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Longest Streak</div>
          <div className="stat-value">{longestStreak}</div>
          <div className="stat-change">Personal best</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value">{sessions.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total XP</div>
          <div className="stat-value">{totalXp}</div>
        </div>
      </div>

      {/* Scores over time placeholder */}
      <div className="card" style={{ textAlign: "center", padding: "var(--space-12)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "var(--space-4)", opacity: 0.4 }}>📊</div>
        <h3 className="heading-4" style={{ marginBottom: "var(--space-2)" }}>
          Charts Coming Soon
        </h3>
        <p className="text-secondary" style={{ maxWidth: 400, margin: "0 auto var(--space-4)" }}>
          Complete a few sessions and your growth charts, skill radar, and streak heat map will appear here.
        </p>
        <Link href="/practice/record" className="btn btn-primary">
          🎙️ Start a Session
        </Link>
      </div>
    </div>
  );
}
