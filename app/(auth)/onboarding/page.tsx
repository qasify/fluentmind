"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAppStore } from "@/lib/store";

const slideVariants: Variants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { x: -50, opacity: 0, transition: { duration: 0.25, ease: "easeIn" } },
};

const goals = [
  { id: "ielts", icon: "🎓", label: "IELTS / Exam Prep", desc: "Prepare for speaking exams with simulated tests and band scoring" },
  { id: "professional", icon: "💼", label: "Professional Growth", desc: "Sound confident in meetings, presentations, and interviews" },
  { id: "casual", icon: "💬", label: "Casual Conversation", desc: "Improve everyday speaking fluency and reduce bad habits" },
  { id: "academic", icon: "📖", label: "Academic English", desc: "Develop formal vocabulary and structured argumentation" },
] as const;

const levels = [
  { id: "beginner", icon: "🌱", label: "Beginner (A1-A2)", desc: "I know basic phrases and can handle simple conversations" },
  { id: "intermediate", icon: "🌿", label: "Intermediate (B1-B2)", desc: "I can express myself but hesitate and make grammar errors" },
  { id: "advanced", icon: "🌳", label: "Advanced (C1-C2)", desc: "I speak fluently but want to polish vocabulary and structure" },
] as const;

const dailyGoals = [
  { minutes: 3, label: "3 min", desc: "Quick warmup", emoji: "☕" },
  { minutes: 5, label: "5 min", desc: "Recommended", emoji: "🎯" },
  { minutes: 10, label: "10 min", desc: "Serious growth", emoji: "🚀" },
  { minutes: 15, label: "15 min", desc: "Power mode", emoji: "⚡" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, setProfile, completeOnboarding } = useAppStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.displayName || "");
  const [goal, setGoal] = useState(profile.goal || "");
  const [level, setLevel] = useState(profile.currentLevel || "");
  const [language, setLanguage] = useState(profile.nativeLanguage || "");
  const [dailyGoal, setDailyGoal] = useState(profile.dailyGoalMinutes || 5);

  const totalSteps = 5;

  const canProceed = () => {
    switch (step) {
      case 0: return name.trim().length >= 2;
      case 1: return goal !== "";
      case 2: return level !== "";
      case 3: return language.trim().length >= 2;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Final step — save everything
      setProfile({
        displayName: name,
        goal: goal as typeof profile.goal,
        currentLevel: level as typeof profile.currentLevel,
        nativeLanguage: language,
        dailyGoalMinutes: dailyGoal,
      });
      completeOnboarding();
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8 text-xl font-bold">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center font-extrabold text-[#f0f0f5]">F</div>
          <span>Fluent<span className="gradient-text">Mind</span></span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-background-tertiary">
              <div
                className="h-full rounded-full bg-gradient-primary transition-all duration-500"
                style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Step Container */}
        <div className="bg-background-secondary border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 md:p-10 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex-1 flex flex-col"
            >
              {/* Step 0: Name */}
              {step === 0 && (
                <>
                  <div className="text-4xl mb-4">👋</div>
                  <h2 className="heading-3 mb-2">What should we call you?</h2>
                  <p className="text-[#a0a0b5] mb-8">Your AI coach will use this name to personalize your experience.</p>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="input text-xl py-4"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                      id="onboarding-name"
                    />
                  </div>
                </>
              )}

              {/* Step 1: Goal */}
              {step === 1 && (
                <>
                  <div className="text-4xl mb-4">🎯</div>
                  <h2 className="heading-3 mb-2">What&apos;s your main goal?</h2>
                  <p className="text-[#a0a0b5] mb-6">This helps us tailor topics, difficulty, and feedback style.</p>
                  <div className="grid gap-3 flex-1">
                    {goals.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                          goal === g.id
                            ? "bg-primary-500/10 border-primary-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                            : "bg-background-tertiary border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                        }`}
                      >
                        <span className="text-2xl">{g.icon}</span>
                        <div>
                          <div className="font-semibold">{g.label}</div>
                          <div className="text-sm text-[#a0a0b5]">{g.desc}</div>
                        </div>
                        {goal === g.id && <span className="ml-auto text-primary-400 text-xl">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 2: Level */}
              {step === 2 && (
                <>
                  <div className="text-4xl mb-4">📊</div>
                  <h2 className="heading-3 mb-2">How would you rate your English?</h2>
                  <p className="text-[#a0a0b5] mb-6">Don&apos;t worry — the AI will calibrate after your first session.</p>
                  <div className="grid gap-3 flex-1">
                    {levels.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLevel(l.id)}
                        className={`flex items-center gap-4 p-5 rounded-xl border text-left transition-all duration-200 ${
                          level === l.id
                            ? "bg-primary-500/10 border-primary-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                            : "bg-background-tertiary border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                        }`}
                      >
                        <span className="text-3xl">{l.icon}</span>
                        <div>
                          <div className="font-semibold text-lg">{l.label}</div>
                          <div className="text-sm text-[#a0a0b5]">{l.desc}</div>
                        </div>
                        {level === l.id && <span className="ml-auto text-primary-400 text-xl">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 3: Native Language */}
              {step === 3 && (
                <>
                  <div className="text-4xl mb-4">🌍</div>
                  <h2 className="heading-3 mb-2">What&apos;s your native language?</h2>
                  <p className="text-[#a0a0b5] mb-8">We&apos;ll tailor feedback to common mistakes speakers of your language make.</p>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      className="input text-xl py-4"
                      placeholder="e.g. Urdu, Spanish, Mandarin"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      autoFocus
                      id="onboarding-language"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {["Urdu", "Hindi", "Arabic", "Spanish", "Mandarin", "French", "Portuguese", "Korean"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                          language === lang
                            ? "bg-primary-500/10 border-primary-500/30 text-primary-400"
                            : "bg-background-tertiary border-[rgba(255,255,255,0.06)] text-[#a0a0b5] hover:text-[#f0f0f5]"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 4: Daily Goal */}
              {step === 4 && (
                <>
                  <div className="text-4xl mb-4">⏱️</div>
                  <h2 className="heading-3 mb-2">Set your daily goal</h2>
                  <p className="text-[#a0a0b5] mb-6">How many minutes per day do you want to practice? You can change this later.</p>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {dailyGoals.map((g) => (
                      <button
                        key={g.minutes}
                        onClick={() => setDailyGoal(g.minutes)}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all duration-200 ${
                          dailyGoal === g.minutes
                            ? "bg-primary-500/10 border-primary-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)] scale-[1.02]"
                            : "bg-background-tertiary border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
                        }`}
                      >
                        <span className="text-3xl mb-2">{g.emoji}</span>
                        <span className="text-2xl font-extrabold mb-1">{g.label}</span>
                        <span className="text-xs text-[#a0a0b5]">{g.desc}</span>
                        {dailyGoal === g.minutes && g.minutes === 5 && (
                          <span className="badge badge-primary mt-2 text-[10px]">Most Popular</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
            {step > 0 ? (
              <button onClick={handleBack} className="btn btn-ghost">
                ← Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              className={`btn ${canProceed() ? "btn-primary" : "btn-secondary opacity-50 pointer-events-none"}`}
              disabled={!canProceed()}
              id="onboarding-next"
            >
              {step === totalSteps - 1 ? "Start Practicing 🚀" : "Continue →"}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <div className="text-center mt-4 text-sm text-[#6b6b80]">
          Step {step + 1} of {totalSteps}
        </div>
      </div>
    </div>
  );
}
