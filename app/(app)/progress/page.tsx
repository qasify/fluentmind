"use client";

import { useMemo, useState } from "react";
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

const DIM_LABELS = ["Clarity", "Vocabulary", "Grammar", "Structure", "Fluency", "Confidence"] as const;
const DIM_KEYS = ["clarity", "vocabulary", "grammar", "structure", "fluency", "confidence"] as const;

export default function ProgressPage() {
  const {
    totalXp, currentLevel, currentLevelTitle, currentStreak, longestStreak,
    sessions, vocabularyBank, badges, profile, mistakes
  } = useAppStore();

  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  const toggleRule = (id: string) => {
    setExpandedRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate averages from sessions
  const { avgScore, avgWpm, totalMinutes } = useMemo(() => {
    const avgScore = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.analysis.overall?.score ?? 0), 0) / sessions.length)
      : 0;

    const avgWpm = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.audioMetadata.wpm, 0) / sessions.length)
      : 0;

    const totalMinutes = Math.round(
      sessions.reduce((sum, s) => sum + s.audioMetadata.totalDurationSeconds, 0) / 60
    );

    return { avgScore, avgWpm, totalMinutes };
  }, [sessions]);

  const unlockedBadges = badges.filter((b) => b.unlockedAt);

  // Dimension averages for radar
  const dimAverages = useMemo(() => (
    DIM_KEYS.map((key) =>
      sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.analysis[key]?.score ?? 0), 0) / sessions.length)
        : 0
    )
  ), [sessions]);

  // Session score trend (last 10)
  const scoreTrend = useMemo(() => (
    sessions.slice(0, 10).reverse().map((s, i) => ({
      label: `S${i + 1}`,
      score: s.analysis.overall?.score ?? 0,
    }))
  ), [sessions]);

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

  const activeMistakes = mistakes.filter(m => m.status === 'active');
  const fixedMistakes = mistakes.filter(m => m.status === 'fixed');

  const { examSessions, latestExamBand, avgExamBand, bestExamBand, examBandTrend } = useMemo(() => {
    const examSessions = sessions.filter((s) => s.type === "exam" && (s.analysis?.fluency?.ieltsBandEstimate ?? 0) > 0);
    const latestExamBand = examSessions[0]?.analysis?.fluency?.ieltsBandEstimate ?? 0;
    const avgExamBand = examSessions.length > 0
      ? Math.round((examSessions.reduce((sum, s) => sum + (s.analysis?.fluency?.ieltsBandEstimate ?? 0), 0) / examSessions.length) * 2) / 2
      : 0;
    const bestExamBand = examSessions.length > 0
      ? Math.max(...examSessions.map((s) => s.analysis?.fluency?.ieltsBandEstimate ?? 0))
      : 0;

    const examBandTrend = examSessions.slice(0, 10).reverse().map((s, i) => ({
      label: `E${i + 1}`,
      band: s.analysis?.fluency?.ieltsBandEstimate ?? 0,
    }));

    return { examSessions, latestExamBand, avgExamBand, bestExamBand, examBandTrend };
  }, [sessions]);

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

      {/* Exam Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-5">🎓 Exam Performance</h3>
            <Link href="/exam" className="text-sm font-semibold text-primary-400 hover:text-primary-300">
              Practice →
            </Link>
          </div>
          {examSessions.length === 0 ? (
            <div className="text-center py-8 text-[#6b6b80]">
              No exam runs yet. Take an IELTS speaking simulation to track your band over time.
              <div className="mt-4">
                <Link href="/exam" className="btn btn-secondary btn-sm">Start Exam</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-background-tertiary rounded-xl p-4 text-center">
                  <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Latest</div>
                  <div className="text-3xl font-extrabold text-primary-400">{latestExamBand}</div>
                </div>
                <div className="bg-background-tertiary rounded-xl p-4 text-center">
                  <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Average</div>
                  <div className="text-3xl font-extrabold">{avgExamBand}</div>
                </div>
                <div className="bg-background-tertiary rounded-xl p-4 text-center">
                  <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Best</div>
                  <div className="text-3xl font-extrabold text-success-400">{bestExamBand}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-[#a0a0b5]">Band trend (last 10 exam steps)</div>
                <Link href="/history/exams" className="text-xs font-semibold text-primary-400 hover:text-primary-300">
                  Exam History →
                </Link>
              </div>
              <div className="flex items-end gap-2 h-40">
                {examBandTrend.map((item, i) => {
                  const heightPct = (item.band / 9) * 100;
                  const color = item.band >= 7 ? "bg-success-400" : item.band >= 6 ? "bg-warning-400" : "bg-danger-400";
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold">{item.band}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPct, 4)}%` }}
                        transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                        className={`w-full rounded-t-md ${color} min-h-[4px]`}
                      />
                      <span className="text-[9px] text-[#6b6b80]">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="card p-6">
          <h3 className="heading-5 mb-4">📌 Target Band Delta</h3>
          <p className="text-sm text-[#a0a0b5] mb-4">
            Choose a target and see your gap based on your average exam band.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[6, 6.5, 7, 7.5].map((target) => {
              const gap = avgExamBand > 0 ? Math.round((target - avgExamBand) * 2) / 2 : null;
              return (
                <div key={target} className="bg-background-tertiary rounded-xl p-4 text-center">
                  <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Target</div>
                  <div className="text-xl font-extrabold text-[#f0f0f5]">{target}</div>
                  <div className="text-xs text-[#6b6b80] mt-1">
                    Gap:{" "}
                    <span className={gap !== null && gap <= 0 ? "text-success-400 font-bold" : "text-warning-400 font-bold"}>
                      {gap === null ? "—" : gap <= 0 ? "Met" : `+${gap}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[#6b6b80] mt-4">
            This is a directional estimate. Your true IELTS band depends heavily on pronunciation and consistency across parts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Skill Radar */}
        <div className="card p-6">
          <h3 className="heading-5 mb-6">Skill Breakdown</h3>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-[#6b6b80]">Complete sessions to see your skill radar</div>
          ) : (
            <div className="grid gap-3">
              {DIM_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm font-semibold w-24 text-[#a0a0b5]">{label}</span>
                  <div className="flex-1 h-3 bg-background-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${dimAverages[i]}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${dimAverages[i] >= 80 ? "bg-success-400" : dimAverages[i] >= 60 ? "bg-warning-400" : "bg-danger-400"
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


      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Filler Word Trend */}
        <div className="card p-6">
          <h3 className="heading-5 mb-6">🗣️ Filler Word Trend</h3>
          {sessions.length < 2 ? (
            <div className="text-center py-8 text-[#6b6b80]">Complete 2+ sessions to see filler trends</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {sessions.slice(0, 10).reverse().map((s, i) => {
                const fillers = s.analysis?.clarity?.totalFillers ?? 0;
                const maxFillers = Math.max(...sessions.slice(0, 10).map(ss => ss.analysis?.clarity?.totalFillers ?? 0), 1);
                const heightPct = (fillers / maxFillers) * 100;
                const color = fillers <= 3 ? "bg-success-400" : fillers <= 8 ? "bg-warning-400" : "bg-danger-400";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${fillers} fillers`}>
                    <span className="text-[10px] font-bold">{fillers}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(heightPct, 4)}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                      className={`w-full rounded-t-md ${color} min-h-[4px]`}
                    />
                    <span className="text-[9px] text-[#6b6b80]">S{i + 1}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vocab Growth */}
        <div className="card p-6">
          <h3 className="heading-5 mb-6">📚 Vocabulary Growth</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-background-tertiary rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-primary-400">{vocabularyBank.length}</div>
              <div className="text-xs text-[#6b6b80] mt-1">Total Words</div>
            </div>
            <div className="bg-background-tertiary rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-success-400">
                {vocabularyBank.filter(w => w.masteryLevel === "mastered").length}
              </div>
              <div className="text-xs text-[#6b6b80] mt-1">Mastered</div>
            </div>
          </div>
          <div className="space-y-2">
            {(["mastered", "familiar", "learning", "new"] as const).map(level => {
              const count = vocabularyBank.filter(w => w.masteryLevel === level).length;
              const pct = vocabularyBank.length > 0 ? (count / vocabularyBank.length) * 100 : 0;
              const colors: Record<string, string> = { mastered: "bg-success-400", familiar: "bg-primary-400", learning: "bg-warning-400", new: "bg-[#6b6b80]" };
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-20 text-[#a0a0b5] capitalize">{level}</span>
                  <div className="flex-1 h-2.5 bg-background-tertiary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${colors[level]}`}
                    />
                  </div>
                  <span className="text-xs font-bold w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grammar Score Evolution */}
        <div className="card p-6">
          <h3 className="heading-5 mb-6">✅ Grammar Score Evolution</h3>
          {sessions.length < 2 ? (
            <div className="text-center py-8 text-[#6b6b80]">Complete 2+ sessions to see grammar trends</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {sessions.slice(0, 10).reverse().map((s, i) => {
                const score = s.analysis?.grammar?.score ?? 0;
                const color = score >= 80 ? "bg-success-400" : score >= 60 ? "bg-warning-400" : "bg-danger-400";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold">{score}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(score, 4)}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                      className={`w-full rounded-t-md ${color} min-h-[4px]`}
                    />
                    <span className="text-[9px] text-[#6b6b80]">S{i + 1}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fluency Score Evolution */}
        <div className="card p-6">
          <h3 className="heading-5 mb-6">🎯 Fluency Score Evolution</h3>
          {sessions.length < 2 ? (
            <div className="text-center py-8 text-[#6b6b80]">Complete 2+ sessions to see fluency trends</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {sessions.slice(0, 10).reverse().map((s, i) => {
                const score = s.analysis?.fluency?.score ?? 0;
                const color = score >= 80 ? "bg-success-400" : score >= 60 ? "bg-warning-400" : "bg-danger-400";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold">{score}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(score, 4)}%` }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                      className={`w-full rounded-t-md ${color} min-h-[4px]`}
                    />
                    <span className="text-[9px] text-[#6b6b80]">S{i + 1}</span>
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


    </div>
  );
}
