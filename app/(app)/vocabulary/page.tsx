"use client";

import { useAppStore } from "@/lib/store";
import styles from "./page.module.css";

export default function VocabularyPage() {
  const { vocabularyBank, removeVocabWord } = useAppStore();

  return (
    <div className={styles.vocabPage}>
      <div className="page-header">
        <h1 className="page-title">📚 Vocabulary Bank</h1>
        <p className="page-subtitle">
          {vocabularyBank.length} words saved ·{" "}
          {vocabularyBank.filter((w) => w.masteryLevel === "mastered").length} mastered
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <div className="stat-label">Total Words</div>
          <div className="stat-value">{vocabularyBank.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Due for Review</div>
          <div className="stat-value">
            {vocabularyBank.filter(
              (w) => new Date(w.nextReviewDate) <= new Date()
            ).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mastered</div>
          <div className="stat-value">
            {vocabularyBank.filter((w) => w.masteryLevel === "mastered").length}
          </div>
        </div>
      </div>

      {/* Word List */}
      {vocabularyBank.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)", opacity: 0.5 }}>📚</div>
          <h3 className="heading-4" style={{ marginBottom: "var(--space-2)", color: "var(--text-primary)" }}>
            Your vocabulary bank is empty
          </h3>
          <p style={{ maxWidth: 400, margin: "0 auto" }}>
            Complete a recording session and click &quot;Add to Bank&quot; on any vocabulary
            suggestion to start building your personal word collection.
          </p>
        </div>
      ) : (
        <div className={styles.wordGrid}>
          {vocabularyBank.map((word) => (
            <div key={word.id} className={styles.wordCard}>
              <div className={styles.wordHeader}>
                <span className={styles.wordWord}>{word.word}</span>
                <span
                  className={`badge ${
                    word.masteryLevel === "mastered"
                      ? "badge-success"
                      : word.masteryLevel === "familiar"
                        ? "badge-primary"
                        : word.masteryLevel === "learning"
                          ? "badge-warning"
                          : "badge-accent"
                  }`}
                >
                  {word.masteryLevel}
                </span>
              </div>
              <div className={styles.wordDef}>{word.definition}</div>
              <div className={styles.wordContext}>
                &quot;{word.context}&quot;
              </div>
              <div className={styles.wordMeta}>
                <span className="badge badge-primary">{word.register}</span>
                <span className="badge badge-accent">{word.cefrLevel}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeVocabWord(word.id)}
                  style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
