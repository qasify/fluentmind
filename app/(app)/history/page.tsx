"use client";

import { useAppStore, type Session } from "@/lib/store";
import Link from "next/link";
import { useState } from "react";

export default function HistoryPage() {
  const { sessions, conversations, setCurrentSession } = useAppStore();
  const [activeTab, setActiveTab] = useState<"recordings" | "conversations">("recordings");
  const [viewMode, setViewMode] = useState<"topic" | "recent">("topic");

  // Group by topic (case insensitive for better grouping)
  const groupedSessions = sessions.reduce((acc, session) => {
    const topicKey = session.topic.trim().toLowerCase();
    if (!acc[topicKey]) {
      // Use the exact casing of the first encountered session for display
      acc[topicKey] = { displayTopic: session.topic.trim(), sessions: [] };
    }
    acc[topicKey].sessions.push(session);
    return acc;
  }, {} as Record<string, { displayTopic: string; sessions: Session[] }>);

  // Sort groups by the most recent session in that group
  const sortedTopics = Object.values(groupedSessions).sort((a, b) => {
    const latestA = new Date(a.sessions[0].createdAt).getTime();
    const latestB = new Date(b.sessions[0].createdAt).getTime();
    return latestB - latestA; // Sort newest first
  });

  // Group Conversations by Scenario Title
  const groupedConversations = conversations.reduce((acc, conv) => {
    const topicKey = conv.scenarioTitle.trim().toLowerCase();
    if (!acc[topicKey]) {
      acc[topicKey] = { displayTopic: conv.scenarioTitle.trim(), conversations: [] };
    }
    acc[topicKey].conversations.push(conv);
    return acc;
  }, {} as Record<string, { displayTopic: string; conversations: any[] }>);

  const sortedConversationTopics = Object.values(groupedConversations).sort((a, b) => {
    const latestA = new Date(a.conversations[0].createdAt).getTime();
    const latestB = new Date(b.conversations[0].createdAt).getTime();
    return latestB - latestA;
  });

  return (
    <div className="page-container fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">📂 Activity History</h1>
          <p className="page-subtitle">
            {activeTab === "recordings" ? `${sessions.length} sessions recorded` : `${conversations.length} conversations held`}
          </p>
        </div>
        
        <div className="flex bg-[rgba(255,255,255,0.06)] p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab("recordings")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activeTab === "recordings" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
          >
            🎙️ Recordings
          </button>
          <button 
            onClick={() => setActiveTab("conversations")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${activeTab === "conversations" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
          >
            🗣️ Roleplays
          </button>
        </div>
      </div>

      {sessions.length > 0 && activeTab === "recordings" && (
         <div className="flex bg-[rgba(255,255,255,0.06)] p-1 rounded-xl w-fit mb-6">
           <button 
             onClick={() => setViewMode("topic")}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${viewMode === "topic" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
           >
             By Topic
           </button>
           <button 
             onClick={() => setViewMode("recent")}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${viewMode === "recent" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
           >
             Recent
           </button>
         </div>
      )}

      {conversations.length > 0 && activeTab === "conversations" && (
         <div className="flex bg-[rgba(255,255,255,0.06)] p-1 rounded-xl w-fit mb-6">
           <button 
             onClick={() => setViewMode("topic")}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${viewMode === "topic" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
           >
             By Topic
           </button>
           <button 
             onClick={() => setViewMode("recent")}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${viewMode === "recent" ? "bg-background-elevated text-primary-400 shadow-sm" : "text-[#a0a0b5] hover:text-[#f0f0f5]"}`}
           >
             Recent
           </button>
         </div>
      )}

      {activeTab === "recordings" && sessions.length === 0 && (
        <div className="text-center py-16 bg-background-elevated rounded-2xl border border-[rgba(255,255,255,0.06)]">
          <div className="text-5xl mb-4 opacity-50">📂</div>
          <h3 className="heading-4 mb-2">No sessions yet</h3>
          <p className="text-[#a0a0b5] max-w-sm mx-auto mb-6">
            Your practice history will appear here after your first session.
          </p>
          <Link href="/practice/record" className="btn btn-primary">🎙️ Start Recording</Link>
        </div>
      )}
      
      {activeTab === "recordings" && sessions.length > 0 && viewMode === "recent" && (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => <SessionCard key={session.id} session={session} setCurrentSession={setCurrentSession} />)}
        </div>
      )}

      {activeTab === "recordings" && sessions.length > 0 && viewMode === "topic" && (
        <div className="flex flex-col gap-6">
          {sortedTopics.map(({ displayTopic, sessions: topicSessions }) => (
            <TopicGroupCard 
              key={displayTopic} 
              displayTopic={displayTopic} 
              topicSessions={topicSessions} 
              setCurrentSession={setCurrentSession} 
            />
          ))}
        </div>
      )}

      {activeTab === "conversations" && conversations.length === 0 && (
        <div className="text-center py-16 bg-background-elevated rounded-2xl border border-[rgba(255,255,255,0.06)]">
          <div className="text-5xl mb-4 opacity-50">👥</div>
          <h3 className="heading-4 mb-2">No conversations yet</h3>
          <p className="text-[#a0a0b5] max-w-sm mx-auto mb-6">
            Practice your conversational flow with an AI partner.
          </p>
          <Link href="/practice" className="btn btn-primary">Start Roleplay</Link>
        </div>
      )}

      {activeTab === "conversations" && conversations.length > 0 && viewMode === "recent" && (
        <div className="flex flex-col gap-3">
          {conversations.map((conv) => (
             <ConversationCard key={conv.id} conv={conv} />
          ))}
        </div>
      )}

      {activeTab === "conversations" && conversations.length > 0 && viewMode === "topic" && (
        <div className="flex flex-col gap-6">
          {sortedConversationTopics.map(({ displayTopic, conversations: topicConvs }) => (
            <ConversationGroupCard 
              key={displayTopic} 
              displayTopic={displayTopic} 
              topicConvs={topicConvs} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationCard({ conv, isNested = false }: { conv: any, isNested?: boolean }) {
  return (
    <Link
      href={`/practice/conversation/${conv.id}`}
      className={`card flex items-center gap-4 hover:-translate-y-[1px] transition-all duration-200 bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)] ${isNested ? 'shadow-none hover:bg-[rgba(255,255,255,0.04)]' : ''}`}
    >
      <div className="w-11 h-11 shrink-0 rounded-xl bg-background-elevated flex items-center justify-center text-xl">
        🗣️
      </div>
      <div className="flex-1 min-w-0">
        {!isNested && <div className="font-semibold truncate">{conv.scenarioTitle}</div>}
        <div className={`text-xs text-[#6b6b80] mt-0.5 ${isNested ? 'text-sm font-medium text-[#c8c8d5]' : ''}`}>
          <span>{new Date(conv.createdAt).toLocaleDateString()}</span>
          <span className="opacity-50 mx-2">·</span>
          <span>{conv.messages.length} messages</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-success-400">
          {conv.status === 'completed' ? '✔️ Done' : 'Active'}
        </div>
      </div>
    </Link>
  );
}

function ConversationGroupCard({ displayTopic, topicConvs }: { displayTopic: string, topicConvs: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedAttempts = [...topicConvs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="bg-background-secondary border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 md:p-5 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      >
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary-500/20 text-primary-400' : 'bg-[rgba(255,255,255,0.06)] text-[#a0a0b5]'}`}>
            ⬇️
          </div>
          <div>
            <h3 className="heading-4 !text-lg mb-1 group-hover:text-primary-400 transition-colors">{displayTopic}</h3>
            <div className="text-xs text-[#6b6b80]">
              {topicConvs.length} {topicConvs.length === 1 ? "Roleplay" : "Roleplays"}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded List */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"} grid`}>
        <div className="overflow-hidden">
          <div className="p-4 flex flex-col gap-3">
            {sortedAttempts.map((conv, index) => (
              <div key={conv.id} className="relative pl-8 md:pl-10">
                {sortedAttempts.length > 1 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 md:w-10 flex justify-center text-xs font-bold text-tertiary border-r border-[rgba(255,255,255,0.1)]">
                    #{sortedAttempts.length - index}
                  </div>
                )}
                <ConversationCard conv={conv} isNested={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicGroupCard({ displayTopic, topicSessions, setCurrentSession }: { displayTopic: string, topicSessions: Session[], setCurrentSession: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedAttempts = [...topicSessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const earliestScore = sortedAttempts[sortedAttempts.length - 1].analysis?.overall?.score || 0;
  const latestScore = sortedAttempts[0].analysis?.overall?.score || 0;
  const bestScore = Math.max(...sortedAttempts.map(a => a.analysis?.overall?.score || 0));
  const improvement = latestScore - earliestScore;

  const scoreColor = (s: number) => 
    s >= 80 ? "text-success-400" : s >= 60 ? "text-warning-400" : "text-danger-400";

  return (
    <div className="bg-background-secondary border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-4 md:p-5 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      >
        <div>
          <h3 className="font-bold text-lg text-[#f0f0f5] flex items-center gap-2">
            <span className="text-primary-400 text-sm">⬡</span>
            <span>{displayTopic}</span>
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
             <span className="bg-background-elevated px-2 py-0.5 rounded text-xs font-mono text-tertiary">
               {sortedAttempts.length} Attempt{sortedAttempts.length > 1 ? "s" : ""}
             </span>
             <span className="opacity-30 text-[#a0a0b5]">·</span>
             <span className="flex items-center gap-1.5 text-xs text-[#a0a0b5]">
               <span className="uppercase tracking-wider opacity-60 text-[10px]">Last</span>
               <strong className={scoreColor(latestScore)}>{latestScore}</strong>
             </span>
             {sortedAttempts.length > 1 && (
               <>
                 <span className="opacity-30 text-[#a0a0b5]">·</span>
                 <span className="flex items-center gap-1.5 text-xs text-[#a0a0b5]">
                   <span className="uppercase tracking-wider opacity-60 text-[10px]">Best</span>
                   <strong className={scoreColor(bestScore)}>{bestScore}</strong>
                 </span>
                 <span className="opacity-30 text-[#a0a0b5]">·</span>
                 <span className={`font-medium text-xs tracking-wide ${improvement > 0 ? "text-success-400" : improvement < 0 ? "text-danger-400" : "text-[#a0a0b5]"}`}>
                   {improvement > 0 ? "↗" : improvement < 0 ? "↘" : "→"} {improvement > 0 ? "+" : ""}{improvement} pts
                 </span>
               </>
             )}
          </div>
        </div>
        <div className={`text-[#a0a0b5] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </button>

      <div 
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="p-4 flex flex-col gap-3">
            {sortedAttempts.map((session, index) => (
              <div key={session.id} className="relative pl-8 md:pl-10">
                {sortedAttempts.length > 1 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 md:w-10 flex justify-center text-xs font-bold text-tertiary border-r border-[rgba(255,255,255,0.1)]">
                    #{sortedAttempts.length - index}
                  </div>
                )}
                <SessionCard session={session} setCurrentSession={setCurrentSession} isNested={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, setCurrentSession, isNested = false }: { session: Session; setCurrentSession: any; isNested?: boolean }) {
  const score = session.analysis?.overall?.score || 0;
  const scoreColor =
    score >= 80 ? "text-success-400"
    : score >= 60 ? "text-warning-400"
    : "text-danger-400";
  const displayScore = score === 0 ? "..." : score;

  return (
    <Link
      href={`/evaluation/${session.id}`}
      onClick={() => setCurrentSession(session)}
      className={`card flex items-center gap-4 hover:-translate-y-[1px] transition-all duration-200 ${isNested ? 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)] shadow-none hover:bg-[rgba(255,255,255,0.04)]' : ''}`}
    >
      <div className="w-11 h-11 shrink-0 rounded-xl bg-background-elevated flex items-center justify-center text-xl">
        {session.type === "recording" ? "🎙️" : session.type === "conversation" ? "🗣️" : "🎓"}
      </div>
      <div className="flex-1 min-w-0">
        {!isNested && <div className="font-semibold truncate">{session.topic}</div>}
        <div className={`text-xs text-[#6b6b80] flex items-center flex-wrap gap-x-2 gap-y-1 ${isNested ? 'text-sm font-medium text-[#c8c8d5]' : 'mt-0.5'}`}>
          <span>{session.category}</span>
          <span className="opacity-50">·</span>
          <span>{new Date(session.createdAt).toLocaleDateString()}</span>
          <span className="opacity-50">·</span>
          <span>{Math.round(session.audioMetadata.totalDurationSeconds / 60)}m {session.audioMetadata.totalDurationSeconds % 60}s</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-2xl font-extrabold ${scoreColor}`}>
          {displayScore}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-[#6b6b80]">Score</div>
      </div>
    </Link>
  );
}
