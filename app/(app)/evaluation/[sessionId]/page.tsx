"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useAppStore, type SessionAnalysis } from "@/lib/store";
import styles from "./page.module.css";

type Dimension = "clarity" | "vocabulary" | "grammar" | "structure" | "fluency" | "confidence";

const dimensions: { key: Dimension; icon: string; label: string }[] = [
  { key: "clarity", icon: "📊", label: "Clarity" },
  { key: "vocabulary", icon: "📚", label: "Vocabulary" },
  { key: "grammar", icon: "✏️", label: "Grammar" },
  { key: "structure", icon: "🏗️", label: "Structure" },
  { key: "fluency", icon: "🗣️", label: "Fluency" },
  { key: "confidence", icon: "💪", label: "Confidence" },
];

function ScoreCircle({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "var(--color-success-400)"
      : score >= 60
        ? "var(--color-warning-400)"
        : "var(--color-danger-400)";

  return (
    <div className={styles.overallScoreCircle}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease" }}
        />
      </svg>
      <div className={styles.overallScoreValue}>
        <span className={styles.overallScoreNumber}>{score}</span>
        <span className={styles.overallScoreLabel}>Overall</span>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--color-success-400)";
  if (score >= 60) return "var(--color-warning-400)";
  return "var(--color-danger-400)";
}

export default function EvaluationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [activeDimension, setActiveDimension] = useState<Dimension>("clarity");
  const { currentSession, addVocabWord } = useAppStore();

  // Use the current session from store, or show a placeholder
  const analysis: SessionAnalysis | null = currentSession?.analysis || null;

  if (!analysis) {
    return (
      <div className={styles.evaluation}>
        <div style={{ textAlign: "center", padding: "var(--space-16)" }}>
          <h2 className="heading-3" style={{ marginBottom: "var(--space-4)" }}>
            Session: {sessionId}
          </h2>
          <p className="text-secondary" style={{ marginBottom: "var(--space-6)" }}>
            No analysis data available for this session. Record a new session to see your results.
          </p>
          <Link href="/practice/record" className="btn btn-primary">
            🎙️ Record Now
          </Link>
        </div>
      </div>
    );
  }

  const activeData = analysis[activeDimension];

  return (
    <div className={`${styles.evaluation} fade-in`}>
      {/* Overall Score */}
      <div className={styles.scoreHero}>
        <ScoreCircle score={analysis.overall.score} />
        <p className={styles.overallSummary}>{analysis.overall.summary}</p>
        <div className={styles.strengthWeakness}>
          <div className={styles.strengthCard}>
            ✅ {analysis.overall.topStrength}
          </div>
          <div className={styles.weaknessCard}>
            ⚠️ {analysis.overall.topWeakness}
          </div>
        </div>
      </div>

      {/* Score Grid (clickable tabs) */}
      <div className={styles.scoreGrid}>
        {dimensions.map((dim) => {
          const score = analysis[dim.key]?.score ?? 0;
          return (
            <button
              key={dim.key}
              className={`${styles.scoreItem} ${activeDimension === dim.key ? styles.scoreItemActive : ""}`}
              onClick={() => setActiveDimension(dim.key)}
            >
              <div className={styles.scoreItemIcon}>{dim.icon}</div>
              <div
                className={styles.scoreItemValue}
                style={{ color: getScoreColor(score) }}
              >
                {score}
              </div>
              <div className={styles.scoreItemLabel}>{dim.label}</div>
            </button>
          );
        })}
      </div>

      {/* Detail Panel */}
      <div className={styles.detailPanel}>
        <h3 className={styles.detailTitle}>
          {dimensions.find((d) => d.key === activeDimension)?.icon}{" "}
          {dimensions.find((d) => d.key === activeDimension)?.label} Analysis
        </h3>

        <div className={styles.detailFeedback}>
          {(activeData as { feedback?: string })?.feedback || "No feedback available."}
        </div>

        {/* Clarity: Filler words */}
        {activeDimension === "clarity" && analysis.clarity.fillerWords.length > 0 && (
          <>
            <h4 className="heading-5" style={{ marginBottom: "var(--space-3)" }}>
              Filler Words Detected
            </h4>
            <div className={styles.fillerList}>
              {analysis.clarity.fillerWords.map((f, i) => (
                <div key={i} className={styles.fillerItem}>
                  <span className={styles.fillerWord}>&quot;{f.word}&quot;</span>
                  <span className={styles.fillerCount}>×{f.count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Vocabulary: Suggestions */}
        {activeDimension === "vocabulary" &&
          analysis.vocabulary.basicWordsFlagged.length > 0 && (
            <>
              <h4 className="heading-5" style={{ marginBottom: "var(--space-3)" }}>
                Word Upgrade Suggestions
              </h4>
              {analysis.vocabulary.basicWordsFlagged.map((item, i) => (
                <div key={i} className={styles.vocabSuggestion}>
                  <div className={styles.vocabOriginal}>
                    <span className={styles.vocabOriginalWord}>
                      {item.original}
                    </span>
                    <span className={styles.vocabArrow}>→</span>
                  </div>
                  <div className={styles.vocabContext}>
                    &quot;{item.context}&quot;
                  </div>
                  <div className={styles.vocabOptions}>
                    {item.suggestions.map((s, j) => (
                      <button
                        key={j}
                        className={styles.vocabOption}
                        onClick={() => {
                          addVocabWord({
                            id: `vocab-${Date.now()}-${j}`,
                            word: s.word,
                            definition: s.definition,
                            register: s.register,
                            context: item.context,
                            cefrLevel: analysis.vocabulary.cefrLevel,
                            masteryLevel: "new",
                            nextReviewDate: new Date().toISOString(),
                            reps: 0,
                            addedAt: new Date().toISOString(),
                          });
                        }}
                      >
                        <div className={styles.vocabOptionWord}>{s.word}</div>
                        <div className={styles.vocabOptionRegister}>
                          {s.register} · {s.definition}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

        {/* Grammar: Errors */}
        {activeDimension === "grammar" &&
          analysis.grammar.errors.length > 0 && (
            <>
              <h4 className="heading-5" style={{ marginBottom: "var(--space-3)" }}>
                Grammar Issues Found
              </h4>
              {analysis.grammar.errors.map((err, i) => (
                <div key={i} className={styles.grammarError}>
                  <div className={styles.grammarOriginal}>
                    {err.originalText}
                  </div>
                  <div className={styles.grammarCorrected}>
                    ✓ {err.correctedText}
                  </div>
                  <div className={styles.grammarExplanation}>
                    <strong>{err.errorType}:</strong> {err.explanation}
                  </div>
                </div>
              ))}
            </>
          )}

        {/* Structure: Framework */}
        {activeDimension === "structure" && (
          <>
            <h4 className="heading-5" style={{ marginBottom: "var(--space-3)" }}>
              Framework:{" "}
              {analysis.structure.frameworkDetected !== "none"
                ? analysis.structure.frameworkDetected
                : analysis.structure.suggestedFramework + " (Suggested)"}
            </h4>
            {analysis.structure.frameworkAdherence.segments.length > 0 && (
              <div className={styles.frameworkSegments}>
                {analysis.structure.frameworkAdherence.segments.map((seg, i) => (
                  <div
                    key={i}
                    className={`${styles.frameworkSegment} ${seg.present ? styles.segmentPresent : styles.segmentMissing}`}
                  >
                    <span className={styles.segmentIcon}>
                      {seg.present ? "✅" : "❌"}
                    </span>
                    <span className={styles.segmentLabel}>{seg.label}</span>
                  </div>
                ))}
              </div>
            )}
            {analysis.structure.frameworkAdherence.missingElements.length > 0 && (
              <p className="body-small text-secondary">
                Missing:{" "}
                {analysis.structure.frameworkAdherence.missingElements.join(", ")}
              </p>
            )}
          </>
        )}

        {/* Fluency: Stats */}
        {activeDimension === "fluency" && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Words/Min</div>
              <div className="stat-value">{analysis.fluency.wordsPerMinute}</div>
              <div className="stat-change">Native: 120-150</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">IELTS Band Est.</div>
              <div className="stat-value">{analysis.fluency.ieltsBandEstimate}</div>
              <div className="stat-change">Out of 9.0</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Self-Corrections</div>
              <div className="stat-value">
                {analysis.fluency.selfCorrectionCount}
              </div>
              <div className="stat-change">Lower is better</div>
            </div>
          </div>
        )}

        {/* Confidence: Phrases */}
        {activeDimension === "confidence" && (
          <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            {analysis.confidence.assertivePhrases.length > 0 && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <h4 className="heading-5" style={{ color: "var(--color-success-400)", marginBottom: "var(--space-2)" }}>
                  ✅ Assertive Phrases
                </h4>
                {analysis.confidence.assertivePhrases.map((p, i) => (
                  <div key={i} className="badge badge-success" style={{ margin: "var(--space-1)" }}>
                    {p}
                  </div>
                ))}
              </div>
            )}
            {analysis.confidence.hedgingPhrases.length > 0 && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <h4 className="heading-5" style={{ color: "var(--color-warning-400)", marginBottom: "var(--space-2)" }}>
                  ⚠️ Hedging Phrases
                </h4>
                {analysis.confidence.hedgingPhrases.map((p, i) => (
                  <div key={i} className="badge badge-warning" style={{ margin: "var(--space-1)" }}>
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actionable Tip */}
      <div className={styles.actionableTip}>
        <div className={styles.tipLabel}>💡 Your Next Step</div>
        <div className={styles.tipText}>{analysis.overall.actionableTip}</div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/practice/record" className="btn btn-primary btn-lg">
          🎙️ Record Again
        </Link>
        <Link href="/vocabulary" className="btn btn-secondary btn-lg">
          📚 Vocabulary Bank
        </Link>
        <Link href="/dashboard" className="btn btn-ghost btn-lg">
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}
