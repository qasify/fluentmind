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

// FSRS Card state for spaced repetition
export interface FSRSCard {
  wordId: string;
  stability: number; // days until ~90% recall probability
  difficulty: number; // 0-1, higher = harder for user
  lastReview: string;
  nextReview: string;
  reps: number;
  lapses: number; // times the card was "forgotten"
}

// Onboarding profile data
export interface UserProfile {
  displayName: string;
  goal: "ielts" | "professional" | "casual" | "academic" | "";
  currentLevel: "beginner" | "intermediate" | "advanced" | "";
  nativeLanguage: string;
  dailyGoalMinutes: number;
  onboardingComplete: boolean;
}

// Badge system
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
  unlockedAt: string | null;
}

export const ALL_BADGES: Badge[] = [
  { id: "first_session", name: "First Words", icon: "🎤", description: "Complete your first recording session", condition: "sessions >= 1", unlockedAt: null },
  { id: "streak_3", name: "On a Roll", icon: "🔥", description: "Maintain a 3-day streak", condition: "streak >= 3", unlockedAt: null },
  { id: "streak_7", name: "Week Warrior", icon: "⚡", description: "Maintain a 7-day streak", condition: "streak >= 7", unlockedAt: null },
  { id: "streak_30", name: "Monthly Master", icon: "🌟", description: "Maintain a 30-day streak", condition: "streak >= 30", unlockedAt: null },
  { id: "vocab_10", name: "Word Collector", icon: "📖", description: "Save 10 words to your vocabulary bank", condition: "vocab >= 10", unlockedAt: null },
  { id: "vocab_50", name: "Lexicon Builder", icon: "📚", description: "Save 50 words to your vocabulary bank", condition: "vocab >= 50", unlockedAt: null },
  { id: "vocab_master_5", name: "Memory King", icon: "👑", description: "Master 5 vocabulary words", condition: "mastered >= 5", unlockedAt: null },
  { id: "score_80", name: "High Achiever", icon: "🏅", description: "Score 80 or above on a session", condition: "score >= 80", unlockedAt: null },
  { id: "score_90", name: "Near Perfect", icon: "💎", description: "Score 90 or above on a session", condition: "score >= 90", unlockedAt: null },
  { id: "sessions_5", name: "Regular Speaker", icon: "🗣️", description: "Complete 5 practice sessions", condition: "sessions >= 5", unlockedAt: null },
  { id: "sessions_25", name: "Dedicated Learner", icon: "📈", description: "Complete 25 practice sessions", condition: "sessions >= 25", unlockedAt: null },
  { id: "level_3", name: "Rising Star", icon: "⭐", description: "Reach Level 3", condition: "level >= 3", unlockedAt: null },
  { id: "level_5", name: "Skilled Orator", icon: "🎯", description: "Reach Level 5", condition: "level >= 5", unlockedAt: null },
  { id: "xp_1000", name: "XP Hunter", icon: "💰", description: "Earn 1,000 total XP", condition: "xp >= 1000", unlockedAt: null },
  { id: "xp_5000", name: "XP Champion", icon: "🏆", description: "Earn 5,000 total XP", condition: "xp >= 5000", unlockedAt: null },
];

interface AppState {
  // User profile (onboarding)
  profile: UserProfile;

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

  // FSRS cards
  fsrsCards: FSRSCard[];

  // Badges
  badges: Badge[];

  // Actions
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  addSession: (session: Session) => void;
  setCurrentSession: (session: Session | null) => void;
  addXp: (amount: number) => void;
  updateStreak: () => void;
  addVocabWord: (word: VocabWord) => void;
  removeVocabWord: (id: string) => void;
  updateVocabMastery: (id: string, level: VocabWord["masteryLevel"]) => void;
  // FSRS
  reviewWord: (wordId: string, rating: 1 | 2 | 3 | 4) => void;
  getWordsDueForReview: () => VocabWord[];
  // Badges
  checkAndUnlockBadges: () => Badge[];
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

// ---- FSRS Algorithm (Simplified) ----
// Based on the Free Spaced Repetition Scheduler
// Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
function computeFSRS(card: FSRSCard, rating: 1 | 2 | 3 | 4): FSRSCard {
  const now = new Date();
  const w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

  let { stability, difficulty, reps, lapses } = card;

  if (reps === 0) {
    // First review — initial stability based on rating
    stability = w[rating - 1];
    difficulty = w[4] - (rating - 3) * w[5];
    difficulty = Math.max(1, Math.min(10, difficulty));
    reps = 1;
    if (rating === 1) lapses++;
  } else {
    // Subsequent reviews
    const elapsed = (now.getTime() - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24);
    const retrievability = Math.pow(1 + elapsed / (9 * stability), -1);

    // Update difficulty
    difficulty = difficulty - w[6] * (rating - 3);
    difficulty = Math.max(1, Math.min(10, difficulty));

    if (rating === 1) {
      // Forgot — reduce stability
      stability = w[11] * Math.pow(difficulty, -w[12]) * (Math.pow(stability + 1, w[13]) - 1) * Math.exp(w[14] * (1 - retrievability));
      stability = Math.max(0.1, stability);
      lapses++;
      reps = 0;
    } else {
      // Remembered — increase stability
      const hardPenalty = rating === 2 ? w[15] : 1;
      const easyBonus = rating === 4 ? w[16] : 1;
      stability = stability * (1 + Math.exp(w[8]) * (11 - difficulty) * Math.pow(stability, -w[9]) * (Math.exp(w[10] * (1 - retrievability)) - 1) * hardPenalty * easyBonus);
      reps++;
    }
  }

  const interval = Math.max(1, Math.round(stability * 9));
  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return {
    ...card,
    stability,
    difficulty,
    reps,
    lapses,
    lastReview: now.toISOString(),
    nextReview: nextReviewDate.toISOString(),
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: {
        displayName: "",
        goal: "",
        currentLevel: "",
        nativeLanguage: "",
        dailyGoalMinutes: 5,
        onboardingComplete: false,
      },
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
      fsrsCards: [],
      badges: ALL_BADGES.map((b) => ({ ...b })),

      setProfile: (partial) =>
        set((state) => ({
          profile: { ...state.profile, ...partial },
        })),

      completeOnboarding: () =>
        set((state) => ({
          profile: { ...state.profile, onboardingComplete: true },
        })),

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
          // Create FSRS card for new word
          const newCard: FSRSCard = {
            wordId: word.id,
            stability: 0,
            difficulty: 0,
            lastReview: "",
            nextReview: new Date().toISOString(), // Due immediately
            reps: 0,
            lapses: 0,
          };
          return {
            vocabularyBank: [word, ...state.vocabularyBank],
            fsrsCards: [newCard, ...state.fsrsCards],
          };
        }),

      removeVocabWord: (id) =>
        set((state) => ({
          vocabularyBank: state.vocabularyBank.filter((w) => w.id !== id),
          fsrsCards: state.fsrsCards.filter((c) => c.wordId !== id),
        })),

      updateVocabMastery: (id, level) =>
        set((state) => ({
          vocabularyBank: state.vocabularyBank.map((w) =>
            w.id === id ? { ...w, masteryLevel: level } : w
          ),
        })),

      reviewWord: (wordId, rating) =>
        set((state) => {
          const cardIndex = state.fsrsCards.findIndex((c) => c.wordId === wordId);
          if (cardIndex === -1) return state;

          const oldCard = state.fsrsCards[cardIndex];
          const newCard = computeFSRS(oldCard, rating);

          const updatedCards = [...state.fsrsCards];
          updatedCards[cardIndex] = newCard;

          // Update mastery level based on reps
          let newMastery: VocabWord["masteryLevel"] = "new";
          if (newCard.reps >= 5 && newCard.lapses === 0) newMastery = "mastered";
          else if (newCard.reps >= 3) newMastery = "familiar";
          else if (newCard.reps >= 1) newMastery = "learning";

          const updatedVocab = state.vocabularyBank.map((w) =>
            w.id === wordId
              ? { ...w, masteryLevel: newMastery, nextReviewDate: newCard.nextReview, reps: newCard.reps }
              : w
          );

          return {
            fsrsCards: updatedCards,
            vocabularyBank: updatedVocab,
          };
        }),

      getWordsDueForReview: () => {
        const state = get();
        const now = new Date();
        return state.vocabularyBank.filter((word) => {
          const card = state.fsrsCards.find((c) => c.wordId === word.id);
          if (!card) return true; // new word with no card
          return new Date(card.nextReview) <= now;
        });
      },

      checkAndUnlockBadges: () => {
        const state = get();
        const newlyUnlocked: Badge[] = [];
        const now = new Date().toISOString();

        const masteredCount = state.vocabularyBank.filter((w) => w.masteryLevel === "mastered").length;
        const highestScore = state.sessions.length > 0
          ? Math.max(...state.sessions.map((s) => s.analysis.overall.score))
          : 0;

        const updatedBadges = state.badges.map((badge) => {
          if (badge.unlockedAt) return badge; // Already unlocked

          let shouldUnlock = false;
          switch (badge.id) {
            case "first_session": shouldUnlock = state.sessions.length >= 1; break;
            case "streak_3": shouldUnlock = state.currentStreak >= 3; break;
            case "streak_7": shouldUnlock = state.currentStreak >= 7; break;
            case "streak_30": shouldUnlock = state.currentStreak >= 30; break;
            case "vocab_10": shouldUnlock = state.vocabularyBank.length >= 10; break;
            case "vocab_50": shouldUnlock = state.vocabularyBank.length >= 50; break;
            case "vocab_master_5": shouldUnlock = masteredCount >= 5; break;
            case "score_80": shouldUnlock = highestScore >= 80; break;
            case "score_90": shouldUnlock = highestScore >= 90; break;
            case "sessions_5": shouldUnlock = state.sessions.length >= 5; break;
            case "sessions_25": shouldUnlock = state.sessions.length >= 25; break;
            case "level_3": shouldUnlock = state.currentLevel >= 3; break;
            case "level_5": shouldUnlock = state.currentLevel >= 5; break;
            case "xp_1000": shouldUnlock = state.totalXp >= 1000; break;
            case "xp_5000": shouldUnlock = state.totalXp >= 5000; break;
          }

          if (shouldUnlock) {
            const unlocked = { ...badge, unlockedAt: now };
            newlyUnlocked.push(unlocked);
            return unlocked;
          }
          return badge;
        });

        if (newlyUnlocked.length > 0) {
          set({ badges: updatedBadges });
        }

        return newlyUnlocked;
      },
    }),
    {
      name: "fluentmind-store",
    }
  )
);
