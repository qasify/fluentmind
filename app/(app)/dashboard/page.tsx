"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";

export default function Dashboard() {
  const { currentStreak, sessions } = useAppStore();

  const recentSessions = sessions.slice(0, 3);
  const todaysChallenge = {
    title: "Describe your ideal weekend",
    category: "Daily Life",
    duration: "2-3 mins",
  };

  return (
    <div className="page-container fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="heading-3 mb-1">
            Welcome back, <span className="gradient-text">Speaker</span>
          </h1>
          <p className="text-secondary text-base">Let&apos;s build that fluency muscle today.</p>
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
          <div className="stat-change">Personal best: {useAppStore().longestStreak}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sessions</div>
          <div className="stat-value">{sessions.length}</div>
          <div className="stat-change text-success-400">+1 this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Fluency</div>
          <div className="stat-value">6.5</div>
          <div className="stat-change text-success-400">↑ 0.2 vs last week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vocab Bank</div>
          <div className="stat-value">{useAppStore().vocabularyBank.length}</div>
          <div className="stat-change text-primary-400">0 due for review</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Daily Challenge */}
          <section>
            <h2 className="heading-5 mb-4">Today&apos;s Challenge</h2>
            <div className="card-glow flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-accent">{todaysChallenge.category}</span>
                  <span className="text-xs text-[#a0a0b5] font-mono">⏱️ {todaysChallenge.duration}</span>
                </div>
                <h3 className="heading-4 mb-2">{todaysChallenge.title}</h3>
                <p className="text-sm text-[#a0a0b5] max-w-md line-clamp-2 md:line-clamp-none">
                  Focus on using transition words naturally (moreover, furthermore, alternatively) while explaining your perfect weekend itinerary.
                </p>
              </div>
              <button className="btn btn-secondary shrink-0 self-start md:self-auto uppercase tracking-wider text-sm px-6">
                Accept
              </button>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="heading-5 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/practice/conversation" className="card flex items-center gap-4 hover:-translate-y-[2px]">
                <div className="w-12 h-12 rounded-xl bg-background-elevated flex items-center justify-center text-2xl group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors">🗣️</div>
                <div>
                  <div className="font-semibold text-base mb-1">AI Conversation</div>
                  <div className="text-xs text-[#a0a0b5]">Interactive dialogue</div>
                </div>
              </Link>
              <Link href="/vocabulary" className="card flex items-center gap-4 hover:-translate-y-[2px]">
                <div className="w-12 h-12 rounded-xl bg-background-elevated flex items-center justify-center text-2xl group-hover:bg-accent-500/20 group-hover:text-accent-400 transition-colors">📚</div>
                <div>
                  <div className="font-semibold text-base mb-1">Review Vocab</div>
                  <div className="text-xs text-[#a0a0b5]">Spaced repetition</div>
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
            
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
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
                  >
                    <div>
                      <div className="font-semibold text-sm line-clamp-1">{session.topic}</div>
                      <div className="text-xs text-[#6b6b80]">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-base text-primary-400">{session.analysis.overall.score}</div>
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
