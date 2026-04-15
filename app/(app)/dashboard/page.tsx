import Link from "next/link";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <div className={styles.dashboard}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <h1 className={styles.greetingText}>
          Good afternoon! 👋
        </h1>
        <p className={styles.greetingSubtext}>
          Ready to practice? Your streak is on the line.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <div className="stat-label">Current Streak</div>
          <div className="stat-value">
            <span className="streak-fire">🔥</span> 0
          </div>
          <div className="stat-change">Start your first day!</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today&apos;s Practice</div>
          <div className="stat-value">0 min</div>
          <div className="stat-change">Goal: 5 min</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clarity Score</div>
          <div className="stat-value">—</div>
          <div className="stat-change">Complete a session first</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Words Learned</div>
          <div className="stat-value">0</div>
          <div className="stat-change">Start building your bank</div>
        </div>
      </div>

      {/* Today's Plan */}
      <div className={styles.todayCard}>
        <div className={styles.todayLabel}>📅 Today&apos;s Challenge</div>
        <h2 className={styles.todayTitle}>
          Describe a time you solved a difficult problem
        </h2>
        <p className={styles.todayDesc}>
          Think about a challenge you faced — at work, school, or in your personal
          life. What was the problem? How did you approach it? What was the
          outcome?
        </p>
        <div className={styles.todayMeta}>
          <span className={styles.todayMetaItem}>⏱️ 2-3 minutes</span>
          <span className={styles.todayMetaItem}>🏗️ STAR Framework</span>
          <span className={styles.todayMetaItem}>📊 Intermediate</span>
        </div>
        <Link href="/practice/record" className="btn btn-primary btn-lg" id="start-practice-btn">
          🎙️ Start Recording
        </Link>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link href="/practice/record" className={styles.quickAction}>
          <div className={`${styles.quickActionIcon} ${styles.quickActionIcon1}`}>
            🎙️
          </div>
          <div>
            <div className={styles.quickActionLabel}>Record</div>
            <div className={styles.quickActionDesc}>Practice a monologue</div>
          </div>
        </Link>
        <Link href="/practice/conversation" className={styles.quickAction}>
          <div className={`${styles.quickActionIcon} ${styles.quickActionIcon2}`}>
            🗣️
          </div>
          <div>
            <div className={styles.quickActionLabel}>Conversation</div>
            <div className={styles.quickActionDesc}>Talk with your AI coach</div>
          </div>
        </Link>
        <Link href="/vocabulary" className={styles.quickAction}>
          <div className={`${styles.quickActionIcon} ${styles.quickActionIcon3}`}>
            📚
          </div>
          <div>
            <div className={styles.quickActionLabel}>Vocabulary</div>
            <div className={styles.quickActionDesc}>Review your word bank</div>
          </div>
        </Link>
        <Link href="/progress" className={styles.quickAction}>
          <div className={`${styles.quickActionIcon} ${styles.quickActionIcon4}`}>
            📈
          </div>
          <div>
            <div className={styles.quickActionLabel}>Progress</div>
            <div className={styles.quickActionDesc}>View your growth</div>
          </div>
        </Link>
      </div>

      {/* Recent Sessions */}
      <h3 className={styles.sectionTitle}>📂 Recent Sessions</h3>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎙️</div>
        <h4 className={styles.emptyTitle}>No sessions yet</h4>
        <p className={styles.emptyDesc}>
          Your journey starts with a single recording. Hit the button above and
          speak for just 2 minutes — your AI coach will handle the rest.
        </p>
        <Link href="/practice/record" className="btn btn-primary">
          Start Your First Session →
        </Link>
      </div>
    </div>
  );
}
