import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---- Types ----
export interface SessionAnalysis {
  clarity: {
    score: number;
    fillerWords: Array<{ word: string; count: number }>;
    totalFillers: number;
    feedback: string;
  };
  vocabulary: {
    score: number;
    lexicalDiversity: number;
    cefrLevel: string;
    basicWordsFlagged: Array<{
      original: string;
      context: string;
      suggestions: Array<{
        word: string;
        register: string;
        definition: string;
      }>;
    }>;
    advancedWordsUsed: string[];
    feedback: string;
  };
  grammar: {
    score: number;
    errors: Array<{
      originalText: string;
      correctedText: string;
      errorType: string;
      explanation: string;
    }>;
    feedback: string;
  };
  structure: {
    score: number;
    frameworkDetected: string;
    frameworkAdherence: {
      segments: Array<{ label: string; present: boolean }>;
      missingElements: string[];
    };
    coherenceScore: number;
    transitionWordsUsed: string[];
    feedback: string;
    suggestedFramework: string;
  };
  fluency: {
    score: number;
    wordsPerMinute: number;
    selfCorrectionCount: number;
    ieltsBandEstimate: number;
    feedback: string;
  };
  confidence: {
    score: number;
    hedgingPhrases: string[];
    assertivePhrases: string[];
    feedback: string;
  };
  overall: {
    score: number;
    summary: string;
    topStrength: string;
    topWeakness: string;
    actionableTip: string;
  };
}

export interface Session {
  id: string;
  type: "recording" | "conversation" | "exam";
  topic: string;
  category: string;
  transcript: string;
  analysis: SessionAnalysis;
  audioMetadata: {
    totalDurationSeconds: number;
    speakingTimeSeconds: number;
    silenceTimeSeconds: number;
    pauseCount: number;
    wpm: number;
  };
  xpEarned: number;
  createdAt: string;
}

export interface VocabWord {
  id: string;
  word: string;
  definition: string;
  register: string;
  context: string;
  cefrLevel: string;
  masteryLevel: "new" | "learning" | "familiar" | "mastered";
  nextReviewDate: string;
  reps: number;
  addedAt: string;
}

interface AppState {
  // User progress
  totalXp: number;
  currentLevel: number;
  currentLevelTitle: string;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  streakFreezesAvailable: number;

  // Sessions
  sessions: Session[];
  currentSession: Session | null;

  // Vocabulary
  vocabularyBank: VocabWord[];

  // Actions
  addSession: (session: Session) => void;
  setCurrentSession: (session: Session | null) => void;
  addXp: (amount: number) => void;
  updateStreak: () => void;
  addVocabWord: (word: VocabWord) => void;
  removeVocabWord: (id: string) => void;
}

// ---- Level Thresholds ----
const LEVELS = [
  { xp: 0, title: "Novice Communicator" },
  { xp: 500, title: "Emerging Speaker" },
  { xp: 1500, title: "Developing Communicator" },
  { xp: 4000, title: "Confident Speaker" },
  { xp: 8000, title: "Articulate Communicator" },
  { xp: 15000, title: "Persuasive Orator" },
  { xp: 25000, title: "Eloquent Presenter" },
  { xp: 40000, title: "Distinguished Speaker" },
  { xp: 60000, title: "Master Communicator" },
  { xp: 100000, title: "Legendary Linguist" },
];

function getLevelFromXp(xp: number): { level: number; title: string } {
  let level = 1;
  let title = LEVELS[0].title;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      level = i + 1;
      title = LEVELS[i].title;
      break;
    }
  }
  return { level, title };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      totalXp: 0,
      currentLevel: 1,
      currentLevelTitle: "Novice Communicator",
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
      streakFreezesAvailable: 0,
      sessions: [],
      currentSession: null,
      vocabularyBank: [],

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions],
          currentSession: session,
        })),

      setCurrentSession: (session) => set({ currentSession: session }),

      addXp: (amount) =>
        set((state) => {
          const newXp = state.totalXp + amount;
          const { level, title } = getLevelFromXp(newXp);
          return {
            totalXp: newXp,
            currentLevel: level,
            currentLevelTitle: title,
          };
        }),

      updateStreak: () =>
        set((state) => {
          const today = new Date().toISOString().split("T")[0];
          const yesterday = new Date(Date.now() - 86400000)
            .toISOString()
            .split("T")[0];

          if (state.lastPracticeDate === today) {
            return state; // Already practiced today
          }

          let newStreak = 1;
          if (state.lastPracticeDate === yesterday) {
            newStreak = state.currentStreak + 1;
          }

          const newLongest = Math.max(state.longestStreak, newStreak);

          // Earn streak freeze every 7 days
          const newFreezes =
            newStreak % 7 === 0
              ? Math.min(state.streakFreezesAvailable + 1, 2)
              : state.streakFreezesAvailable;

          return {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastPracticeDate: today,
            streakFreezesAvailable: newFreezes,
          };
        }),

      addVocabWord: (word) =>
        set((state) => {
          // Don't add duplicates
          if (state.vocabularyBank.some((w) => w.word === word.word)) {
            return state;
          }
          return {
            vocabularyBank: [word, ...state.vocabularyBank],
          };
        }),

      removeVocabWord: (id) =>
        set((state) => ({
          vocabularyBank: state.vocabularyBank.filter((w) => w.id !== id),
        })),
    }),
    {
      name: "fluentmind-store",
    }
  )
);
