"use client";

import { useAppStore } from "@/lib/store";

export default function VocabularyPage() {
  const { vocabularyBank, removeVocabWord } = useAppStore();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📚 Vocabulary Bank</h1>
        <p className="page-subtitle">
          {vocabularyBank.length} words saved ·{" "}
          {vocabularyBank.filter((w) => w.masteryLevel === "mastered").length} mastered
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
        <div className="text-center py-20 text-[#a0a0b5] bg-background-elevated rounded-2xl border border-[rgba(255,255,255,0.06)]">
          <div className="text-5xl mb-4 opacity-50">📚</div>
          <h3 className="heading-4 mb-2 text-[#f0f0f5]">
            Your vocabulary bank is empty
          </h3>
          <p className="max-w-md mx-auto">
            Complete a recording session and click &quot;Add to Bank&quot; on any vocabulary
            suggestion to start building your personal word collection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vocabularyBank.map((word) => (
            <div key={word.id} className="card flex flex-col hover:-translate-y-[2px]">
              <div className="flex items-center justify-between mb-3 border-b border-[rgba(255,255,255,0.06)] pb-3">
                <span className="text-xl font-bold text-primary-400">{word.word}</span>
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
              <div className="text-base text-secondary mb-3 leading-relaxed flex-1">
                {word.definition}
              </div>
              <div className="text-sm text-[#6b6b80] italic mb-4 bg-background-tertiary p-3 rounded-lg border border-[rgba(255,255,255,0.03)] selection:bg-primary-500/30">
                &quot;{word.context}&quot;
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="badge badge-primary">{word.register}</span>
                <span className="badge badge-accent">{word.cefrLevel}</span>
                <button
                  className="ml-auto text-xs font-semibold text-danger-400 hover:text-danger-300 transition-colors"
                  onClick={() => removeVocabWord(word.id)}
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
