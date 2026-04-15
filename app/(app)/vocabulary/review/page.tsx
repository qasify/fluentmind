"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAppStore, type VocabWord } from "@/lib/store";

type QuizFormat = "definition" | "fillBlank" | "context" | "reverse";

interface QuizQuestion {
  word: VocabWord;
  format: QuizFormat;
  correctAnswer: string;
  options: string[];
  prompt: string;
}

function generateQuestions(dueWords: VocabWord[], allWords: VocabWord[]): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  for (const word of dueWords) {
    // Pick a random format
    const formats: QuizFormat[] = ["definition", "fillBlank", "context", "reverse"];
    const format = formats[Math.floor(Math.random() * formats.length)];

    // Get 3 wrong options from other words
    const otherWords = allWords.filter((w) => w.id !== word.id);
    const shuffled = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);

    let prompt = "";
    let correctAnswer = "";
    let options: string[] = [];

    switch (format) {
      case "definition":
        prompt = `What does "${word.word}" mean?`;
        correctAnswer = word.definition;
        options = [
          word.definition,
          ...shuffled.map((w) => w.definition),
        ];
        break;
      case "reverse":
        prompt = `Which word matches this definition?\n"${word.definition}"`;
        correctAnswer = word.word;
        options = [
          word.word,
          ...shuffled.map((w) => w.word),
        ];
        break;
      case "fillBlank":
        prompt = `Fill in the blank:\n"${word.context.replace(new RegExp(word.word, "gi"), "______")}"`;
        correctAnswer = word.word;
        options = [
          word.word,
          ...shuffled.map((w) => w.word),
        ];
        break;
      case "context":
        prompt = `In which context would you use "${word.word}"?`;
        correctAnswer = word.context;
        options = [
          word.context,
          ...shuffled.map((w) => w.context || `A ${w.register} expression meaning ${w.definition}`),
        ];
        break;
    }

    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);

    questions.push({ word, format, correctAnswer, options, prompt });
  }

  return questions;
}

const slideVariants: Variants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { x: -40, opacity: 0, transition: { duration: 0.2 } },
};

export default function VocabReviewPage() {
  const router = useRouter();
  const { vocabularyBank, getWordsDueForReview, reviewWord, addXp } = useAppStore();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const due = getWordsDueForReview();
    if (due.length === 0 || vocabularyBank.length < 2) return;
    // Take up to 10 due words
    const batch = due.slice(0, 10);
    const q = generateQuestions(batch, vocabularyBank);
    setQuestions(q);
  }, [getWordsDueForReview, vocabularyBank]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selected === currentQuestion?.correctAnswer;

  const handleSelect = useCallback((option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);

    const correct = option === currentQuestion.correctAnswer;
    if (correct) setCorrectCount((prev) => prev + 1);

    // FSRS review: 1=Again, 2=Hard, 3=Good, 4=Easy
    const rating: 1 | 2 | 3 | 4 = correct ? 3 : 1;
    reviewWord(currentQuestion.word.id, rating);
  }, [showResult, currentQuestion, reviewWord]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
      addXp(correctCount * 10);
    }
  };

  // No words to review
  if (vocabularyBank.length < 2) {
    return (
      <div className="page-container flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6 opacity-60">📚</div>
          <h2 className="heading-3 mb-3">Not Enough Words Yet</h2>
          <p className="text-[#a0a0b5] mb-6">
            You need at least 2 words in your vocabulary bank to start a review quiz.
            Complete a recording session and save some word suggestions!
          </p>
          <button onClick={() => router.push("/practice/record")} className="btn btn-primary">
            🎙️ Record a Session
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page-container flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-6">✅</div>
          <h2 className="heading-3 mb-3">All Caught Up!</h2>
          <p className="text-[#a0a0b5] mb-6">
            No words are due for review right now. Keep practicing and adding new words.
            Come back later when your scheduled reviews are ready!
          </p>
          <button onClick={() => router.push("/vocabulary")} className="btn btn-secondary">
            📚 Vocabulary Bank
          </button>
        </div>
      </div>
    );
  }

  // Completion screen
  if (isComplete) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="page-container flex items-center justify-center min-h-[70vh]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className="text-6xl mb-6">
            {percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "💪"}
          </div>
          <h2 className="heading-2 mb-2">Quiz Complete!</h2>
          <p className="text-[#a0a0b5] mb-8">
            You got {correctCount} out of {questions.length} correct
          </p>

          {/* Score circle */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <svg width="140" height="140" className="-rotate-90">
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--color-background-tertiary)" strokeWidth="8" />
              <circle
                cx="70" cy="70" r="60" fill="none"
                stroke={percentage >= 80 ? "var(--color-success-400)" : percentage >= 50 ? "var(--color-warning-400)" : "var(--color-danger-400)"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - percentage / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute">
              <span className="text-4xl font-extrabold">{percentage}%</span>
            </div>
          </div>

          <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mb-8">
            <div className="text-sm text-primary-400 font-semibold">+{correctCount * 10} XP earned</div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => {
              setCurrentIndex(0);
              setSelected(null);
              setShowResult(false);
              setCorrectCount(0);
              setIsComplete(false);
              const due = getWordsDueForReview();
              const batch = due.slice(0, 10);
              setQuestions(generateQuestions(batch, vocabularyBank));
            }} className="btn btn-secondary">
              🔄 Review Again
            </button>
            <button onClick={() => router.push("/vocabulary")} className="btn btn-primary">
              📚 Vocabulary Bank
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col items-center min-h-[80vh]">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#a0a0b5] font-medium">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-success-400 font-medium">
            {correctCount} correct
          </span>
        </div>
        <div className="w-full h-2 bg-background-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full max-w-lg flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="bg-background-secondary border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 shadow-lg"
          >
            {/* Format badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="badge badge-accent">
                {currentQuestion.format === "definition" ? "📖 Definition"
                  : currentQuestion.format === "reverse" ? "🔄 Reverse"
                  : currentQuestion.format === "fillBlank" ? "✏️ Fill Blank"
                  : "💡 Context"}
              </span>
              <span className="badge badge-primary">{currentQuestion.word.cefrLevel}</span>
            </div>

            {/* Prompt */}
            <h3 className="text-xl font-semibold mb-8 leading-relaxed whitespace-pre-line">
              {currentQuestion.prompt}
            </h3>

            {/* Options Grid */}
            <div className="grid gap-3">
              {currentQuestion.options.map((option, i) => {
                let borderColor = "border-[rgba(255,255,255,0.06)]";
                let bg = "bg-background-tertiary";

                if (showResult) {
                  if (option === currentQuestion.correctAnswer) {
                    borderColor = "border-success-500/50";
                    bg = "bg-success-500/10";
                  } else if (option === selected && !isCorrect) {
                    borderColor = "border-danger-500/50";
                    bg = "bg-danger-500/10";
                  }
                } else if (option === selected) {
                  borderColor = "border-primary-500/50";
                  bg = "bg-primary-500/10";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(option)}
                    disabled={showResult}
                    className={`p-4 rounded-xl border text-left font-medium transition-all duration-200 ${bg} ${borderColor} ${
                      !showResult ? "hover:border-[rgba(255,255,255,0.15)] hover:bg-background-elevated cursor-pointer" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] text-xs font-bold text-[#a0a0b5]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="leading-relaxed text-base line-clamp-3">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Result feedback */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl border ${
                  isCorrect
                    ? "bg-success-500/10 border-success-500/20 text-success-400"
                    : "bg-danger-500/10 border-danger-500/20 text-danger-400"
                }`}
              >
                <div className="font-bold text-lg mb-1">
                  {isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                </div>
                <div className="text-sm opacity-80">
                  {isCorrect
                    ? `Nice! "${currentQuestion.word.word}" — ${currentQuestion.word.definition}`
                    : `The answer was: "${currentQuestion.correctAnswer}"`}
                </div>
              </motion.div>
            )}

            {/* Next Button (only show after answering) */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.3 } }}
                className="mt-6"
              >
                <button onClick={handleNext} className="btn btn-primary w-full">
                  {currentIndex < questions.length - 1 ? "Next Question →" : "See Results 🎉"}
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
