"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useAppStore, type SessionAnalysis } from "@/lib/store";
import AudioPlayer from "@/components/ui/AudioPlayer";
import { useTTS } from "@/hooks/useTTS";

type Dimension = "clarity" | "vocabulary" | "grammar" | "structure" | "fluency" | "confidence";

const dimensions: { key: Dimension; icon: string; label: string }[] = [
  { key: "clarity", icon: "📊", label: "Clarity" },
  { key: "vocabulary", icon: "📚", label: "Vocabulary" },
  { key: "grammar", icon: "✏️", label: "Grammar" },
  { key: "structure", icon: "🏗️", label: "Structure" },
  { key: "fluency", icon: "🗣️", label: "Fluency" },
  { key: "confidence", icon: "💪", label: "Confidence" },
];

function HighlightedText({ text, activeChunk }: { text: string; activeChunk: string }) {
  if (!activeChunk || !text) return <>&quot;{text}&quot;</>;

  const chunkIndex = text.indexOf(activeChunk);
  if (chunkIndex === -1) return <>&quot;{text}&quot;</>;

  const before = text.substring(0, chunkIndex);
  const highlighted = text.substring(chunkIndex, chunkIndex + activeChunk.length);
  const after = text.substring(chunkIndex + activeChunk.length);

  return (
    <>
      &quot;{before}
      <span className="bg-primary-500/25 text-[#f0f0f5] shadow-[0_0_15px_rgba(139,92,246,0.2)] rounded-md px-1 py-0.5 mx-[-4px] transition-colors duration-200">{highlighted}</span>
      {after}&quot;
    </>
  );
}

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
    <div className="relative inline-flex items-center justify-center mb-4">
      <svg width={size} height={size} className="-rotate-90">
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
          className="transition-all duration-[1500ms] ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-extrabold -tracking-[0.03em]">{score}</span>
        <span className="text-sm text-tertiary font-medium uppercase tracking-wider mt-1">Overall</span>
      </div>
    </div>
  );
}

function getScoreColorClass(score: number): string {
  if (score >= 80) return "text-success-400";
  if (score >= 60) return "text-warning-400";
  return "text-danger-400";
}


export default function EvaluationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [activeDimension, setActiveDimension] = useState<Dimension>("clarity");
  const [activeTab, setActiveTab] = useState<"transcript" | "c1" | "native">("transcript");
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const { sessions, addVocabWord, vocabularyBank } = useAppStore();
  const { speak, isPlaying, currentText, activeChunk } = useTTS();

  const session = sessions.find((s) => s.id === sessionId);
  const analysis: SessionAnalysis | null = session?.analysis || null;

  if (!analysis) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-16 bg-background-elevated rounded-2xl border border-[rgba(255,255,255,0.06)] max-w-lg w-full">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="heading-3 mb-4">Session: {sessionId}</h2>
          <p className="text-secondary mb-8">
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
    <div className="page-container fade-in !max-w-5xl self-center">
      {/* Overall Score */}
      <div className="text-center py-10 px-6 mb-8 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-3xl backdrop-blur-sm">
        <ScoreCircle score={analysis.overall?.score} />
        <p className="text-lg text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
          {analysis.overall?.summary}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="px-5 py-3 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] text-success-400 font-medium text-sm flex items-center gap-2 max-w-md w-full sm:w-auto">
            <span className="text-lg">✅</span> {analysis.overall?.topStrength}
          </div>
          <div className="px-5 py-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)] text-warning-400 font-medium text-sm flex items-center gap-2 max-w-md w-full sm:w-auto">
            <span className="text-lg">⚠️</span> {analysis.overall?.topWeakness}
          </div>
        </div>
      </div>

      {/* Score Grid (clickable tabs) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {dimensions.map((dim) => {
          const score = analysis[dim.key]?.score ?? 0;
          const isActive = activeDimension === dim.key;
          return (
            <button
              key={dim.key}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${isActive
                ? "bg-primary-500/10 border-primary-500/30 scale-[1.02] shadow-[0_4px_12px_rgba(6,182,212,0.1)]"
                : "bg-background-elevated border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)]"
                }`}
              onClick={() => setActiveDimension(dim.key)}
            >
              <div className="text-2xl mb-2 grayscale opacity-80">{dim.icon}</div>
              <div className={`text-2xl font-extrabold mb-1 ${getScoreColorClass(score)}`}>
                {score}
              </div>
              <div className="text-[10px] text-tertiary font-bold uppercase tracking-widest">
                {dim.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Panel */}
      <div className="bg-background-secondary border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 md:p-8 mb-8 shadow-xl">
        <h3 className="heading-4 mb-6 flex items-center gap-3">
          <span className="p-2 bg-background-elevated rounded-lg">
            {dimensions.find((d) => d.key === activeDimension)?.icon}
          </span>
          {dimensions.find((d) => d.key === activeDimension)?.label} Analysis
        </h3>

        <div className="text-base text-secondary bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-5 rounded-xl mb-8 leading-relaxed">
          {(activeData as { feedback?: string })?.feedback || "No feedback available."}
        </div>

        {/* Clarity: Filler words */}
        {activeDimension === "clarity" && analysis.clarity.fillerWords.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h4 className="heading-5 mb-4 text-primary-400">Filler Words Detected</h4>
            <div className="flex flex-wrap gap-3">
              {analysis.clarity.fillerWords.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.15)] rounded-lg text-sm">
                  <span className="text-danger-400 font-semibold">&quot;{f.word}&quot;</span>
                  <span className="text-xs text-tertiary font-mono bg-[rgba(244,63,94,0.15)] px-2 py-0.5 rounded-full">×{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vocabulary: Suggestions */}
        {activeDimension === "vocabulary" && analysis.vocabulary.basicWordsFlagged.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <h4 className="heading-5 mb-2 text-primary-400">Word Upgrades — C1/C2 Native Alternatives</h4>
            {analysis.vocabulary.basicWordsFlagged.map((item, i) => (
              <div key={i} className="p-5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl">
                <div className="flex items-center gap-3 mb-4 text-base">
                  <span className="line-through text-danger-400 font-medium px-2 py-1 bg-[rgba(244,63,94,0.1)] rounded">{item.original}</span>
                  <span className="text-tertiary">➜</span>
                  <span className="text-[#f0f0f5] italic text-sm border-l-2 border-[rgba(255,255,255,0.2)] pl-3 ml-1 py-1">
                    &quot;{item.context}&quot;
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(item.suggestions || []).map((s, j) => {
                    if (!s || !s.word) return null; // Safe guard if AI generated bad shapes

                    const wordKey = `${s.word}-${i}-${j}`;
                    const isAlreadyInBank = vocabularyBank.some((w) => w.word?.toLowerCase() === s.word?.toLowerCase());
                    const justAdded = addedWords.has(wordKey);
                    const isAdded = isAlreadyInBank || justAdded;

                    return (
                      <div key={j} className="flex flex-col p-4 bg-background-primary border border-[rgba(255,255,255,0.06)] rounded-xl group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                        <div className="flex justify-between items-start mb-2 relative z-10">
                          <div>
                            <div className="font-bold text-primary-400 mb-1 flex items-center gap-2">
                              {s.word}
                              <span className="text-[10px] uppercase tracking-wider text-tertiary border border-[rgba(255,255,255,0.1)] px-1.5 py-0.5 rounded">{s.register}</span>
                            </div>
                            {(s as { pronunciation?: string }).pronunciation && (
                              <div className="text-[11px] text-[#6b6b80] font-mono mt-0.5 flex items-center gap-2">
                                🇺🇸 {(s as { pronunciation?: string }).pronunciation}
                                <button
                                  onClick={() => speak(s.word)}
                                  className={`p-1 rounded-full text-xs hover:bg-[rgba(255,255,255,0.1)] transition-colors ${isPlaying && currentText === s.word ? "text-primary-400" : ""}`}
                                  title="Listen to pronunciation"
                                >
                                  {isPlaying && currentText === s.word ? "⏸" : "🔊"}
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            disabled={isAdded}
                            className={`btn btn-sm text-xs px-3 shadow-none min-w-[90px] transition-all duration-300 ${isAdded
                              ? "bg-success-400/15 text-success-400 border border-success-400/25 cursor-default"
                              : "bg-primary-500/10 text-primary-400 hover:bg-primary-500 hover:text-white border border-primary-500/20"
                              }`}
                            onClick={() => {
                              if (isAdded) return;
                              addVocabWord({
                                id: `vocab-${Date.now()}-${j}`,
                                word: s.word,
                                definition: s.definition,
                                register: s.register,
                                context: item.context,
                                cefrLevel: "C1",
                                masteryLevel: "new",
                                nextReviewDate: new Date().toISOString(),
                                reps: 0,
                                addedAt: new Date().toISOString(),
                              });
                              setAddedWords((prev) => new Set(prev).add(wordKey));
                            }}
                          >
                            {isAdded ? "✓ Added" : "+ Bank"}
                          </button>
                        </div>
                        <div className="text-sm text-[#a0a0b5] leading-relaxed relative z-10">
                          {s.definition}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phrase Upgrades */}
        {activeDimension === "vocabulary" && analysis.vocabulary.phraseUpgrades?.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4 mt-8">
            <h4 className="heading-5 mb-2 text-primary-400">Phrase Upgrades & Chunking</h4>
            {analysis.vocabulary.phraseUpgrades.map((item, i) => (
              <div key={i} className="p-5 bg-[rgba(139,92,246,0.04)] border border-[rgba(139,92,246,0.15)] rounded-xl relative overflow-hidden group">
                <div className="flex flex-col md:flex-row gap-4 mb-3">
                  <div className="flex-1 bg-background-primary p-3 rounded-lg border border-[rgba(255,255,255,0.04)]">
                    <div className="text-xs text-danger-400 font-bold uppercase tracking-wider mb-1">You Said:</div>
                    <div className="text-sm line-through text-[#6b6b80]">&quot;{item.original}&quot;</div>
                  </div>
                  <div className="flex items-center justify-center text-tertiary hidden md:flex">➜</div>
                  <div className="flex-1 bg-[rgba(16,185,129,0.05)] p-3 rounded-lg border border-[rgba(16,185,129,0.1)]">
                    <div className="text-xs text-success-400 font-bold uppercase tracking-wider mb-1 flex justify-between items-center">
                      <span>Better phrasing:</span>
                      <button onClick={() => speak(item.suggestion)} className={`hover:scale-110 transition-transform ${isPlaying && currentText === item.suggestion ? "text-primary-400" : ""}`}>🔊</button>
                    </div>
                    <div className="text-sm font-medium text-[#f0f0f5]">
                      <HighlightedText text={item.suggestion} activeChunk={isPlaying && currentText === item.suggestion ? activeChunk : ""} />
                    </div>
                  </div>
                </div>
                <div className="text-sm text-[#a0a0b5] border-t border-[rgba(255,255,255,0.04)] pt-3">
                  <strong className="text-primary-400">Why?</strong> {item.explanation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grammar: Errors */}
        {activeDimension === "grammar" && analysis.grammar.errors.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
            <h4 className="heading-5 mb-2 text-primary-400">Grammar Issues Found</h4>
            {analysis.grammar.errors.map((err, i) => (
              <div key={i} className="p-5 bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)] rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-warning-500" />
                <div className="text-lg line-through text-[#6b6b80] mb-2">{err.originalText}</div>
                <div className="text-lg text-success-400 font-bold mb-4 flex items-center gap-2">
                  <span>✓</span> {err.correctedText}
                </div>
                <div className="text-sm bg-[rgba(255,255,255,0.05)] p-3 rounded-lg text-[#a0a0b5]">
                  <strong className="text-warning-400 font-semibold">{err.errorType}:</strong> {err.explanation}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Structure: Framework */}
        {activeDimension === "structure" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h4 className="heading-5 mb-4 text-primary-400">
              Framework Detected: <span className="text-[#f0f0f5]">
                {analysis.structure.frameworkDetected !== "none"
                  ? analysis.structure.frameworkDetected
                  : "None"}
              </span>
            </h4>

            {analysis.structure.frameworkAdherence.segments.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {analysis.structure.frameworkAdherence.segments.map((seg, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-4 rounded-xl border ${seg.present
                      ? "bg-[rgba(16,185,129,0.06)] border-[rgba(16,185,129,0.15)]"
                      : "bg-[rgba(244,63,94,0.04)] border-[rgba(244,63,94,0.1)] opacity-70"
                      }`}
                  >
                    <div className={`p-1.5 rounded-full ${seg.present ? "bg-success-400/20 text-success-400" : "bg-danger-400/20 text-danger-400"}`}>
                      {seg.present ? "✓" : "✗"}
                    </div>
                    <span className={`font-semibold ${seg.present ? "text-[#f0f0f5]" : "text-[#a0a0b5]"}`}>{seg.label}</span>
                  </div>
                ))}
              </div>
            )}

            {analysis.structure.frameworkAdherence.missingElements.length > 0 && (
              <div className="bg-[rgba(244,63,94,0.08)] text-danger-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2 mb-6">
                <span className="mt-0.5">⚠️</span>
                <div>
                  <span className="font-semibold block mb-1">Missing Elements:</span>
                  {analysis.structure.frameworkAdherence.missingElements.join(", ")}
                </div>
              </div>
            )}

            {/* Best Frameworks for this topic */}
            {analysis.structure.bestFrameworks && analysis.structure.bestFrameworks.length > 0 && (
              <div className="mt-2">
                <h4 className="heading-5 mb-3 text-primary-400">💡 Best Frameworks for This Topic</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.structure.bestFrameworks.map((fw, i) => (
                    <div key={i} className="p-4 bg-[rgba(6,182,212,0.04)] border border-[rgba(6,182,212,0.12)] rounded-xl">
                      <div className="font-bold text-[#f0f0f5] mb-1 flex items-center gap-2">
                        <span className="text-primary-400 text-lg">⬡</span> {fw.name}
                      </div>
                      <div className="text-sm text-[#a0a0b5] leading-relaxed">{fw.fit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fluency: Stats */}
        {activeDimension === "fluency" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card border-t-4 border-t-primary-500">
              <div className="stat-label">Words Per Min</div>
              <div className="stat-value">{analysis.fluency.wordsPerMinute}</div>
              <div className="stat-change text-[#6b6b80]">Native range: 120-150</div>
            </div>
            <div className="stat-card border-t-4 border-t-accent-500">
              <div className="stat-label">IELTS Band Est.</div>
              <div className="stat-value">{analysis.fluency.ieltsBandEstimate}</div>
              <div className="stat-change text-[#6b6b80]">Out of 9.0</div>
            </div>
            <div className="stat-card border-t-4 border-t-warning-500">
              <div className="stat-label">Self-Corrections</div>
              <div className="stat-value text-warning-400">{analysis.fluency.selfCorrectionCount}</div>
              <div className="stat-change text-[#6b6b80]">Lower is better</div>
            </div>
          </div>
        )}

        {/* Confidence: Phrases */}
        {activeDimension === "confidence" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.confidence.assertivePhrases.length > 0 && (
              <div className="bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.1)] rounded-xl p-5">
                <h4 className="heading-5 text-success-400 mb-4 flex items-center gap-2">
                  <span>✅</span> Strong Assertions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.confidence.assertivePhrases.map((p, i) => (
                    <div key={i} className="badge badge-success bg-background-primary shadow-sm text-sm py-1.5">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.confidence.hedgingPhrases.length > 0 && (
              <div className="bg-[rgba(244,63,94,0.05)] border border-[rgba(244,63,94,0.1)] rounded-xl p-5">
                <h4 className="heading-5 text-danger-400 mb-4 flex items-center gap-2">
                  <span>⚠️</span> Weak Hedging
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.confidence.hedgingPhrases.map((p, i) => (
                    <div key={i} className="badge badge-danger bg-background-primary shadow-sm text-sm py-1.5">
                      {p}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-secondary mt-4 bg-[rgba(255,255,255,0.05)] p-2 rounded">
                  Try replacing these with more definitive statements to sound more confident.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audio Playback & Transcript */}
      {session ? (
        <div className="bg-background-secondary border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 md:p-8 mb-8 shadow-xl">
          <h3 className="heading-4 flex items-center gap-3 mb-4">
            <span className="p-2 bg-background-elevated rounded-lg">{session.audioUrl ? "🎤" : "📝"}</span>
            {session.audioUrl ? "Transcription & Playback" : "Original Text & Analysis"}
          </h3>
          {session.audioUrl && (
            <div className="w-full mb-6 mt-4">
              <AudioPlayer
                src={session.audioUrl!}
                durationOverride={session.audioMetadata?.totalDurationSeconds || 0}
              />
            </div>
          )}

          <div className="flex bg-[rgba(255,255,255,0.06)] p-1 rounded-xl w-fit mb-4 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("transcript")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeTab === "transcript" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
            >
              🗣️ Your Original
            </button>
            {analysis.overall?.upgradedTranscript && analysis.overall.upgradedTranscript !== "(Connect Gemini API for upgraded transcript)" && (
              <button
                onClick={() => setActiveTab("c1")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeTab === "c1" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
              >
                ✨ C1 Upgrade
              </button>
            )}
            {analysis.overall?.nativeVersion && analysis.overall.nativeVersion !== "(Connect Gemini API for native speaker version)" && (
              <button
                onClick={() => setActiveTab("native")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 whitespace-nowrap ${activeTab === "native" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
              >
                🇺🇸 Native Speaker
              </button>
            )}
          </div>

          <div className="relative">
            {activeTab === "transcript" && (
              <div className="text-secondary text-sm italic border-l-2 border-primary-500/50 pl-4 py-2 animate-in fade-in duration-300">
                &quot;{session.transcript}&quot;
              </div>
            )}
            {activeTab === "c1" && analysis.overall?.upgradedTranscript && (
              <div className="text-base text-[#c8c8d5] bg-[rgba(139,92,246,0.04)] border border-[rgba(139,92,246,0.1)] p-5 rounded-xl leading-[1.8] animate-in fade-in duration-300">
                <button
                  onClick={() => speak(analysis.overall.upgradedTranscript)}
                  className={`absolute top-1 right-1 px-1 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors ${isPlaying && currentText === analysis.overall.upgradedTranscript ? "text-primary-400" : ""}`}
                >
                  🔊
                </button>
                <HighlightedText
                  text={analysis.overall.upgradedTranscript}
                  activeChunk={isPlaying && currentText === analysis.overall.upgradedTranscript ? activeChunk : ""}
                />
              </div>
            )}
            {activeTab === "native" && analysis.overall?.nativeVersion && (
              <div className="text-base text-[#c8c8d5] bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.1)] p-5 rounded-xl leading-[1.8] italic animate-in fade-in duration-300">
                <button
                  onClick={() => speak(analysis.overall.nativeVersion)}
                  className={`absolute top-1 right-1 px-1 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors ${isPlaying && currentText === analysis.overall.nativeVersion ? "text-primary-400" : ""}`}
                >
                  🔊
                </button>
                <HighlightedText
                  text={analysis.overall.nativeVersion}
                  activeChunk={isPlaying && currentText === analysis.overall.nativeVersion ? activeChunk : ""}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-background-secondary border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 md:p-8 mb-8 shadow-xl">
          <h3 className="heading-4 mb-4 flex items-center gap-3">
            <span className="p-2 bg-background-elevated rounded-lg">📜</span>
            Transcript
          </h3>
          <div className="text-secondary text-sm italic border-l-2 border-primary-500/50 pl-4 py-2">
            &quot;No transcript available.&quot;
          </div>
        </div>
      )}

      {/* Actionable Tip */}
      <div className="bg-gradient-primary-soft border border-[rgba(6,182,212,0.2)] rounded-2xl p-6 md:p-8 mb-10 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
        <div className="text-xs font-bold uppercase tracking-[0.1em] text-primary-400 mb-3 flex items-center gap-2">
          <span>💡</span> Your Next Action Step
        </div>
        <div className="text-xl md:text-2xl font-medium leading-snug text-[#f0f0f5]">
          {analysis.overall?.actionableTip}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/practice/record" className="btn btn-primary btn-lg min-w-[200px]">
          🎙️ Record Again
        </Link>
        <Link href="/vocabulary" className="btn btn-secondary btn-lg min-w-[200px]">
          📚 Learn Words
        </Link>
      </div>
    </div>
  );
}
