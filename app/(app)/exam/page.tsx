"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

const IELTS_PARTS = [
  {
    part: 1 as const,
    title: "Introduction & Interview",
    duration: "4–5 min",
    description: "Short questions on familiar topics. Aim for natural, direct answers with 1–2 expansions.",
    icon: "💬",
    color: "text-primary-400",
  },
  {
    part: 2 as const,
    title: "Long Turn (Cue Card)",
    duration: "3–4 min",
    description: "1 minute prep, then 1–2 minutes speaking. Use a clear structure and examples.",
    icon: "🎤",
    color: "text-warning-400",
  },
  {
    part: 3 as const,
    title: "Two-way Discussion",
    duration: "4–5 min",
    description: "Abstract follow-ups. Show nuance, comparisons, and reasons (not just opinions).",
    icon: "🧠",
    color: "text-success-400",
  },
];

export default function ExamPage() {
  const router = useRouter();
  const { startExamRun, sessions } = useAppStore();

  const examSessions = sessions.filter((s) => s.type === "exam");
  const latestExam = examSessions[0];
  const latestBand = latestExam?.analysis?.fluency?.ieltsBandEstimate ?? null;
  const attempts = examSessions.length;

  return (
    <div className="page-container fade-in">
      <div className="page-header text-center mb-10">
        <h1 className="page-title">🎓 IELTS Speaking Simulation</h1>
        <p className="page-subtitle max-w-2xl mx-auto">
          Run a realistic IELTS Speaking flow: one prompt at a time, timed steps, and IELTS band scoring after each response.
        </p>
      </div>

      <div className="mx-auto space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-5 text-center">
            <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Attempts</div>
            <div className="text-3xl font-extrabold">{attempts}</div>
          </div>
          <div className="card p-5 text-center">
            <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Latest Band</div>
            <div className="text-3xl font-extrabold text-primary-400">{latestBand ?? "—"}</div>
          </div>
          <Link href="/history/exams" className="card p-5 text-center hover:-translate-y-[1px] transition-all">
            <div className="text-xs text-[#6b6b80] uppercase tracking-wider mb-1">Review</div>
            <div className="text-3xl font-extrabold">📂</div>
            <div className="text-xs text-primary-400 font-semibold mt-2">Exam History →</div>
          </Link>
        </div>

        <div className="card-glow p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <div className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-1">Recommended</div>
            <div className="heading-4 mb-1">Full IELTS Speaking (Parts 1–3)</div>
            <p className="text-sm text-[#a0a0b5] max-w-xl">
              Best for realism and a stable overall estimate. You’ll be scored after each step and can review everything in Exam History.
            </p>
          </div>
          <button
            onClick={() => {
              startExamRun("full");
              router.push("/exam/run");
            }}
            className="btn btn-primary px-8 py-3"
          >
            Start Full Exam
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {IELTS_PARTS.map((part) => (
            <motion.div
              key={part.part}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: part.part * 0.15 }}
              className="card p-6 border border-[rgba(255,255,255,0.05)] hover:border-primary-500/30 transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-background-tertiary flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                  {part.icon}
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold uppercase tracking-widest ${part.color} mb-0.5`}>Part {part.part}</div>
                  <div className="text-xs text-[#6b6b80]">{part.duration}</div>
                </div>
              </div>
              <div className="flex-1 mb-6">
                <h3 className="heading-4 mb-2">{part.title}</h3>
                <p className="text-sm text-[#8b8b9d] leading-relaxed">{part.description}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.04)] flex justify-end">
                <button
                  onClick={() => {
                    startExamRun("part", part.part);
                    router.push("/exam/run");
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Practice Part {part.part}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="card p-6 border border-dashed border-[rgba(255,255,255,0.08)] text-center">
          <p className="text-sm text-[#6b6b80]">
            <strong>Tip:</strong> Use Part 2 to practice structure (hook → story → reflection). Use Part 3 to practice nuance (pros/cons, comparisons, examples).
          </p>
        </div>
      </div>
    </div>
  );
}
