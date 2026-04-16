"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { motion, type Variants } from "framer-motion";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function CurriculumPage() {
  const { activeCurriculum, profile, mistakes, sessions, generateCurriculum, markTaskCompleted } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const activeMistakes = mistakes.filter(m => m.status === 'active');
      const recentSessions = sessions.slice(0, 5);

      const res = await fetch("/api/ai/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, activeMistakes, recentSessions }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate");

      await generateCurriculum(json.data.tasks, json.data.focusAreas);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber - 1] || `Day ${dayNumber}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assessment": return "📊";
      case "speaking": return "🎙️";
      case "conversation": return "💬";
      case "vocabulary": return "🔤";
      case "grammar": return "✅";
      case "homework": return "📝";
      default: return "📝";
    }
  };

  const getTaskLink = (task: any) => {
    if (task.type === "speaking") return `/practice/record?topic=${encodeURIComponent(task.targetFocus || task.title)}`;
    if (task.type === "conversation") return `/practice/conversation?topic=${encodeURIComponent(task.targetFocus || task.title)}`;
    if (task.type === "vocabulary") return `/vocabulary/review`;
    if (task.type === "assessment") return `/curriculum/assessment`;
    return `/practice/record`;
  };

  if (!activeCurriculum) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center fade-in">
        <div className="text-6xl mb-6">🗓️</div>
        <h1 className="heading-2 mb-4">Your AI Lesson Plan</h1>
        <p className="text-lg text-[#a0a0b5] max-w-lg mx-auto mb-8">
          Ready for a structured week? Generate a personalized 7-day curriculum based on your historical mistakes, active goals, and past performance.
        </p>
        
        {error && <div className="text-danger-400 mb-6">{error}</div>}
        
        <button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="btn btn-primary px-8 py-3 text-lg"
        >
          {isGenerating ? "🧠 Analyzing Weaknesses..." : "✨ Generate Week 1 Plan"}
        </button>
      </div>
    );
  }

  const completedCount = activeCurriculum.tasks.filter(t => t.isCompleted).length;
  const progressPercent = activeCurriculum.tasks.length > 0
    ? Math.round((completedCount / activeCurriculum.tasks.length) * 100)
    : 0;
  const sortedTasks = [...activeCurriculum.tasks].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="page-container fade-in">
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Weekly Curriculum</h1>
          <p className="page-subtitle">Your personalized path to fluency</p>
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="btn btn-secondary btn-sm"
        >
          {isGenerating ? "Regenerating..." : "🔄 Regenerate Week"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 card p-6">
          <h3 className="heading-5 mb-4">Weekly Progress</h3>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1 h-3 bg-background-tertiary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-bold">{progressPercent}%</span>
          </div>
          <p className="text-sm text-[#6b6b80]">{completedCount} of {activeCurriculum.tasks.length} tasks completed</p>
        </div>
        <div className="card p-6">
          <h3 className="heading-5 mb-4 text-[#a0a0b5]">Focus Areas</h3>
          <ul className="space-y-3">
            {activeCurriculum.focusAreas.map((area, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm font-medium">
                <span className="text-primary-400">🎯</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="heading-4 mb-6">7-Day Plan</h3>
        <motion.div 
          className="space-y-4"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {sortedTasks.map((task) => (
            <motion.div 
              key={task.id} 
              variants={fadeInUp}
              className={`card p-5 border flex flex-col md:flex-row gap-4 md:items-center transition-all ${task.isCompleted ? "border-success-400/30 bg-[rgba(16,185,129,0.02)]" : "border-[rgba(255,255,255,0.05)] hover:border-primary-500/50"}`}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-background-tertiary font-bold text-xl shrink-0">
                {task.isCompleted ? '✓' : task.dayNumber}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">{getDayName(task.dayNumber)}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-background-tertiary text-[#a0a0b5]">
                    {getTypeIcon(task.type)} {task.type}
                  </span>
                </div>
                <h4 className={`heading-5 mb-1 ${task.isCompleted ? "text-[#6b6b80] line-through" : ""}`}>
                  {task.title}
                </h4>
                <p className="text-sm text-[#8b8b9d] mb-2">{task.description}</p>
                {task.targetFocus && (
                  <p className="text-xs font-mono text-tertiary">
                    Focus: <span className="text-primary-300">{task.targetFocus}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0 md:w-40">
                {task.isCompleted ? (
                   <div className="text-center text-sm font-semibold text-success-400 py-2 border border-success-400/20 rounded-lg bg-success-400/5">
                     Completed
                   </div>
                ) : (
                  <>
                    <Link href={getTaskLink(task)} className="btn btn-primary btn-sm flex-1 justify-center">
                      Start Task
                    </Link>
                    <button 
                      onClick={() => markTaskCompleted(activeCurriculum.id, task.id)}
                      className="text-xs font-medium text-[#6b6b80] hover:text-[#fff] transition-colors py-1"
                    >
                      Mark as done (Skip)
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
