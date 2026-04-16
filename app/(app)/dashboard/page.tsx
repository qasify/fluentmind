"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";

export default function Dashboard() {
  const {
    currentStreak, longestStreak, sessions, vocabularyBank, profile,
    totalXp, currentLevel, currentLevelTitle, checkAndUnlockBadges, getWordsDueForReview,
  } = useAppStore();

  // Check for new badges on mount
  useEffect(() => {
    checkAndUnlockBadges();
  }, [checkAndUnlockBadges]);

  const { mistakes, vocabularyBank: vocabBank, eloRating } = useAppStore();
  const dueWords = getWordsDueForReview().length;
  const displayName = profile.displayName || "Speaker";

  // Weekly Insight State
  const [insight, setInsight] = useState<any>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const generateInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch("/api/ai/weekly-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions, mistakes, vocabularyBank: vocabBank, profile, eloRating }),
      });
      const json = await res.json();
      if (json.success) setInsight(json.data);
    } catch (e) {
      console.error("Insight generation failed:", e);
    } finally {
      setInsightLoading(false);
    }
  };

  const recentSessions = sessions.slice(0, 3);
  const examSessions = sessions.filter((s) => s.type === "exam");
  const latestExam = examSessions[0];
  const latestExamBand = latestExam?.analysis?.fluency?.ieltsBandEstimate ?? null;

  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.analysis?.overall?.score || 0), 0) / sessions.length)
    : 0;

  const topics = [
    { topic: "Describe your ideal weekend", category: "Daily Life", duration: "2-3 mins" },
    { topic: "Should social media have age restrictions?", category: "Abstract", duration: "2-3 mins" },
    { topic: "Tell me about a skill you recently learned", category: "Personal", duration: "2-3 mins" },
    { topic: "Describe the perfect work environment", category: "Professional", duration: "2-3 mins" },
    { topic: "What makes a good leader?", category: "Abstract", duration: "2-3 mins" },
  ];
  const todaysChallenge = topics[new Date().getDate() % topics.length];

  return (
    <div className="page-container fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="heading-3 mb-1">
            Welcome back, <span className="gradient-text">{displayName}</span>
          </h1>
          <p className="text-[#a0a0b5] text-base">
            Level {currentLevel} · {currentLevelTitle} · {totalXp} XP
          </p>
        </div>
        <Link href="/practice/record" className="btn btn-primary" id="start-session-btn">
          🎙️ Quick Record
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-label">Current Streak</div>
          <div className="stat-value text-warning-400">🔥 {currentStreak}</div>
          <div className="stat-change text-[#6b6b80]">Best: {longestStreak}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sessions</div>
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-change text-success-400">Keep going!</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Score</div>
          <div className={`stat-value ${avgScore >= 80 ? "text-success-400" : avgScore >= 60 ? "text-warning-400" : ""}`}>
            {avgScore || "—"}
          </div>
          <div className="stat-change text-[#6b6b80]">Out of 100</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vocab Bank</div>
          <div className="stat-value">{vocabularyBank.length}</div>
          <div className="stat-change text-primary-400">
            {dueWords > 0 ? `${dueWords} due` : "All reviewed"}
          </div>
        </div>
      </div>

      {/* Weekly AI Insight */}
      <div className="card p-6 mb-8 border border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="heading-5 flex items-center gap-2"><span>🧠</span> Weekly AI Insight</h2>
          <button
            onClick={generateInsight}
            disabled={insightLoading}
            className="btn btn-secondary btn-sm"
          >
            {insightLoading ? "Analyzing..." : insight ? "🔄 Refresh" : "✨ Generate"}
          </button>
        </div>
        {insight ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="heading-4">{insight.headline}</h3>
              <span className={`text-2xl font-extrabold ${insight.weeklyGrade?.startsWith('A') ? 'text-success-400' : insight.weeklyGrade?.startsWith('B') ? 'text-primary-400' : insight.weeklyGrade?.startsWith('C') ? 'text-warning-400' : 'text-danger-400'}`}>
                {insight.weeklyGrade}
              </span>
            </div>
            <p className="text-sm text-[#a0a0b5]">{insight.summary}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-success-400/5 border border-success-400/10 rounded-xl p-4">
                <h4 className="text-xs font-bold text-success-400 uppercase tracking-widest mb-2">🏆 Wins</h4>
                <ul className="space-y-1">
                  {insight.wins?.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-[#c8c8d5] flex items-start gap-2"><span className="text-success-400">✓</span> {w}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-warning-400/5 border border-warning-400/10 rounded-xl p-4">
                <h4 className="text-xs font-bold text-warning-400 uppercase tracking-widest mb-2">🎯 Focus Next Week</h4>
                <ul className="space-y-1">
                  {insight.focusAreas?.map((f: string, i: number) => (
                    <li key={i} className="text-sm text-[#c8c8d5] flex items-start gap-2"><span className="text-warning-400">→</span> {f}</li>
                  ))}
                </ul>
              </div>
            </div>
            {insight.motivationalQuote && (
              <div className="text-center text-sm italic text-[#8b8b9d] pt-2 border-t border-[rgba(255,255,255,0.04)]">
                &quot;{insight.motivationalQuote}&quot;
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-[#6b6b80] py-4">Click &quot;Generate&quot; to get your personalized weekly performance report powered by AI.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Exam Snapshot */}
          <section>
            <div className="card p-6 border border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="heading-5 mb-1">🎓 IELTS Exam Snapshot</h2>
                <p className="text-sm text-[#a0a0b5]">
                  Practice with timed, one-prompt-at-a-time exam flow and review runs in Exam History.
                </p>
                <div className="mt-3 text-sm text-[#6b6b80]">
                  Latest band:{" "}
                  <span className="font-extrabold text-primary-400">
                    {latestExamBand ?? "—"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/exam" className="btn btn-primary btn-sm">
                  Start Exam
                </Link>
                <Link href="/history/exams" className="btn btn-secondary btn-sm">
                  Exam History
                </Link>
              </div>
            </div>
          </section>
          {/* Review Alert */}
          {dueWords > 0 && (
            <Link
              href="/vocabulary/review"
              className="bg-gradient-primary-soft border border-primary-500/20 rounded-2xl p-5 flex items-center justify-between gap-4 group hover:border-primary-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <div className="font-semibold">
                    {dueWords} word{dueWords !== 1 ? "s" : ""} due for review
                  </div>
                  <div className="text-sm text-[#a0a0b5]">Quick quiz to strengthen memory</div>
                </div>
              </div>
              <span className="text-primary-400 font-semibold group-hover:translate-x-1 transition-transform">
                Start →
              </span>
            </Link>
          )}

          {/* Daily Challenge */}
          <section>
            <h2 className="heading-5 mb-4">Today&apos;s Challenge</h2>
            <div className="card-glow flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-accent">{todaysChallenge.category}</span>
                  <span className="text-xs text-[#a0a0b5] font-mono">⏱️ {todaysChallenge.duration}</span>
                </div>
                <h3 className="heading-4 mb-2">{todaysChallenge.topic}</h3>
                <p className="text-sm text-[#a0a0b5] max-w-md">
                  Focus on using transition words naturally while building your response.
                </p>
              </div>
              <Link
                href={`/practice/record?topic=${encodeURIComponent(todaysChallenge.topic)}&category=${encodeURIComponent(todaysChallenge.category)}`}
                className="btn btn-primary shrink-0 self-start md:self-auto"
              >
                Accept Challenge
              </Link>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="heading-5 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/practice/conversation" className="card flex items-center gap-4 hover:-translate-y-[2px]">
                <div className="w-11 h-11 rounded-xl bg-background-elevated flex items-center justify-center text-xl">🗣️</div>
                <div>
                  <div className="font-semibold text-sm mb-0.5">AI Conversation</div>
                  <div className="text-xs text-[#a0a0b5]">Interactive dialogue</div>
                </div>
              </Link>
              <Link href="/vocabulary/review" className="card flex items-center gap-4 hover:-translate-y-[2px]">
                <div className="w-11 h-11 rounded-xl bg-background-elevated flex items-center justify-center text-xl">🧠</div>
                <div>
                  <div className="font-semibold text-sm mb-0.5">Review Vocab</div>
                  <div className="text-xs text-[#a0a0b5]">Spaced repetition</div>
                </div>
              </Link>
              <Link href="/progress" className="card flex items-center gap-4 hover:-translate-y-[2px]">
                <div className="w-11 h-11 rounded-xl bg-background-elevated flex items-center justify-center text-xl">📈</div>
                <div>
                  <div className="font-semibold text-sm mb-0.5">Progress</div>
                  <div className="text-xs text-[#a0a0b5]">Charts & badges</div>
                </div>
              </Link>
            </div>
          </section>
        </div>

        {/* Sidebar Data */}
        <div className="flex flex-col gap-6">
          <section className="card flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-5">Recent Sessions</h2>
              <Link href="/history" className="text-xs font-semibold text-primary-400 hover:text-primary-300">View All</Link>
            </div>
            
            <div className="flex flex-col gap-3 flex-1">
              {recentSessions.length === 0 ? (
                <div className="text-center py-6 text-sm text-[#6b6b80]">
                  No sessions yet. Record your first practice to see it here!
                </div>
              ) : (
                recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/evaluation/${session.id}`}
                    className="flex justify-between items-center p-3 rounded-lg border border-transparent hover:border-[rgba(255,255,255,0.06)] hover:bg-background-elevated transition-colors"
                    onClick={() => useAppStore.getState().setCurrentSession(session)}
                  >
                    <div>
                      <div className="font-semibold text-sm line-clamp-1">{session.topic}</div>
                      <div className="text-xs text-[#6b6b80]">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-base text-primary-400">{session.analysis?.overall?.score || 0}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#6b6b80]">Score</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
