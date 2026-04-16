import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

// ---- Types ----
export interface UserMistake {
  id: string;
  errorType: "grammar" | "vocabulary" | "phrase" | "action_step";
  originalText: string;
  suggestion: string;
  context: string;
  status: "active" | "fixed";
  createdAt: string;
  fixedAt?: string;
  avoidanceCount: number;
};
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
        pronunciation: string;
      }>;
    }>;
    phraseUpgrades: Array<{
      original: string;
      suggestion: string;
      explanation: string;
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
    bestFrameworks: Array<{ name: string; fit: string }>;
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
    nativeVersion: string;
    upgradedTranscript: string;
    newMistakesToTrack: Array<{
      originalText: string;
      suggestion: string;
      errorType: "grammar" | "vocabulary" | "phrase" | "action_step";
      context: string;
    }>;
    mistakesAvoided: string[]; // List of IDs the user successfully avoided this session
    mistakesRepeated: string[]; // List of IDs the user repeated this session
  };
}

export interface Session {
  id: string;
  type: "recording" | "conversation" | "exam";
  topic: string;
  category: string;
  transcript: string;
  audioUrl?: string;
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
  // Initialization state
  isHydrated: boolean;
  initializeStore: () => Promise<void>;

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

  // Mistakes Ledger
  mistakes: UserMistake[];

  // Actions
  setProfile: (profile: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  setCurrentSession: (session: Session | null) => void;
  addXp: (amount: number) => Promise<void>;
  updateStreak: () => Promise<void>;
  addVocabWord: (word: VocabWord) => Promise<void>;
  removeVocabWord: (id: string) => Promise<void>;
  updateVocabMastery: (id: string, level: VocabWord["masteryLevel"]) => Promise<void>;
  // FSRS
  reviewWord: (wordId: string, rating: 1 | 2 | 3 | 4) => Promise<void>;
  // Badges
  checkAndUnlockBadges: () => Promise<Badge[]>;
  // Mistakes
  addMistakes: (mistakes: Omit<UserMistake, "id" | "createdAt" | "status" | "avoidanceCount">[]) => Promise<void>;
  markMistakesAvoided: (ids: string[]) => Promise<void>;
  markMistakesRepeated: (ids: string[]) => Promise<void>;
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
function computeFSRS(card: FSRSCard, rating: 1 | 2 | 3 | 4): FSRSCard {
  const now = new Date();
  const w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

  let { stability, difficulty, reps, lapses } = card;

  if (reps === 0) {
    stability = w[rating - 1];
    difficulty = w[4] - (rating - 3) * w[5];
    difficulty = Math.max(1, Math.min(10, difficulty));
    reps = 1;
    if (rating === 1) lapses++;
  } else {
    const elapsed = (now.getTime() - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24);
    const retrievability = Math.pow(1 + elapsed / (9 * stability), -1);

    difficulty = difficulty - w[6] * (rating - 3);
    difficulty = Math.max(1, Math.min(10, difficulty));

    if (rating === 1) {
      stability = w[11] * Math.pow(difficulty, -w[12]) * (Math.pow(stability + 1, w[13]) - 1) * Math.exp(w[14] * (1 - retrievability));
      stability = Math.max(0.1, stability);
      lapses++;
      reps = 0;
    } else {
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

export const useAppStore = create<AppState>()((set, get) => ({
  isHydrated: false,
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
  mistakes: [],

  initializeStore: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      set({ isHydrated: true });
      return;
    }

    try {
      const [{ data: pData, error: pErr }, { data: upData, error: upErr }, { data: sData, error: sErr }, { data: vData, error: vErr }, { data: fData, error: fErr }, { data: mData, error: mErr }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_progress').select('*').eq('id', user.id).single(),
        supabase.from('sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vocabulary_words').select('*').eq('user_id', user.id),
        supabase.from('fsrs_cards').select('*').eq('user_id', user.id),
        supabase.from('user_mistakes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (pErr) console.error("Error fetching profiles:", pErr);
      if (upErr) console.error("Error fetching user_progress:", upErr);
      if (sErr) console.error("Error fetching sessions:", sErr);
      if (vErr) console.error("Error fetching vocabulary:", vErr);
      if (fErr) console.error("Error fetching FSRS cards:", fErr);
      if (mErr) console.error("Error fetching mistakes:", mErr);

      if (pData) {
        set({
          profile: {
            displayName: pData.display_name,
            goal: pData.goal,
            currentLevel: pData.current_level,
            nativeLanguage: pData.native_language,
            dailyGoalMinutes: pData.daily_goal_minutes,
            onboardingComplete: pData.onboarding_complete,
          }
        });
      }

      if (upData) {
        // Merge fetched badges with ALL_BADGES so UI always shows complete list
        const fetchedBadges = Array.isArray(upData.badges) ? upData.badges : [];
        const badgesMap = new Map(fetchedBadges.map((b: any) => [b.id, b]));
        const mergedBadges = ALL_BADGES.map(b => (badgesMap.has(b.id) ? badgesMap.get(b.id) : { ...b })) as Badge[];
        
        set({
          totalXp: upData.total_xp,
          currentLevel: upData.current_level,
          currentLevelTitle: upData.current_level_title,
          currentStreak: upData.current_streak,
          longestStreak: upData.longest_streak,
          lastPracticeDate: upData.last_practice_date,
          streakFreezesAvailable: upData.streak_freezes_available,
          badges: mergedBadges,
        });
      }

      if (sData) {
        set({
          sessions: sData.map((s: any) => ({
            id: s.id,
            type: s.type,
            topic: s.topic,
            category: s.category,
            transcript: s.transcript,
            audioUrl: s.audio_url,
            analysis: s.analysis,
            audioMetadata: s.audio_metadata,
            xpEarned: s.xp_earned,
            createdAt: s.created_at
          }))
        });
      }

      if (vData) {
        set({
          vocabularyBank: vData.map((v: any) => ({
            id: v.id,
            word: v.word,
            definition: v.definition,
            register: v.register,
            context: v.context,
            cefrLevel: v.cefr_level,
            masteryLevel: v.mastery_level,
            nextReviewDate: v.next_review_date,
            reps: v.reps,
            addedAt: v.added_at
          }))
        });
      }

      if (fData) {
        set({
           fsrsCards: fData.map((f: any) => ({
             wordId: f.word_id,
             stability: f.stability,
             difficulty: f.difficulty,
             lastReview: f.last_review,
             nextReview: f.next_review,
             reps: f.reps,
             lapses: f.lapses
           }))
        })
      }

      if (mData) {
        set({
           mistakes: mData.map((m: any) => ({
             id: m.id,
             errorType: m.error_type,
             originalText: m.original_text,
             suggestion: m.suggestion,
             context: m.context,
             status: m.status,
             createdAt: m.created_at,
             fixedAt: m.fixed_at,
             avoidanceCount: m.avoidance_count
           }))
        })
      }

      set({ isHydrated: true });
    } catch (e) {
      console.error("Hydration failed", e);
      set({ isHydrated: true });
    }
  },

  setProfile: async (partial) => {
    const state = get();
    const newProfile = { ...state.profile, ...partial };
    set({ profile: newProfile });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        display_name: newProfile.displayName,
        goal: newProfile.goal,
        current_level: newProfile.currentLevel,
        native_language: newProfile.nativeLanguage,
        daily_goal_minutes: newProfile.dailyGoalMinutes,
        onboarding_complete: newProfile.onboardingComplete
      }).eq('id', user.id);
    }
  },

  completeOnboarding: async () => {
    const state = get();
    await state.setProfile({ onboardingComplete: true });
  },

  addSession: async (session) => {
    const state = get();
    set({
      sessions: [session, ...state.sessions],
      currentSession: session,
    });
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('sessions').insert({
        id: session.id,
        user_id: user.id,
        type: session.type,
        topic: session.topic,
        category: session.category,
        transcript: session.transcript,
        analysis: session.analysis,
        audio_metadata: session.audioMetadata,
        audio_url: session.audioUrl,
        xp_earned: session.xpEarned,
        created_at: session.createdAt
      });
    }
  },

  addMistakes: async (mistakesData) => {
    const state = get();
    const newMistakes: UserMistake[] = mistakesData.map((m, i) => ({
      ...m,
      id: `mistake-${Date.now()}-${i}`,
      status: "active",
      avoidanceCount: 0,
      createdAt: new Date().toISOString()
    }));

    set({ mistakes: [...newMistakes, ...state.mistakes] });
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_mistakes').insert(newMistakes.map(m => ({
        id: m.id,
        user_id: user.id,
        error_type: m.errorType,
        original_text: m.originalText,
        suggestion: m.suggestion,
        context: m.context,
        status: m.status,
        avoidance_count: 0,
        created_at: m.createdAt
      })));
    }
  },

  markMistakesAvoided: async (ids) => {
    if (!ids || ids.length === 0) return;
    const state = get();
    const now = new Date().toISOString();
    let updatedDbList: any[] = [];
    
    const newMistakes: UserMistake[] = state.mistakes.map(m => {
      if (ids.includes(m.id) && m.status === 'active') {
        const newCount = m.avoidanceCount + 1;
        const isNowFixed = newCount >= 3;
        updatedDbList.push({ id: m.id, avoidance_count: newCount, status: isNowFixed ? 'fixed' : 'active', fixed_at: isNowFixed ? now : null });
        return {
          ...m,
          avoidanceCount: newCount,
          status: isNowFixed ? "fixed" : "active",
          fixedAt: isNowFixed ? now : undefined
        };
      }
      return m;
    });

    set({ mistakes: newMistakes });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      for (const update of updatedDbList) {
        const payload: any = { avoidance_count: update.avoidance_count };
        if (update.status === 'fixed') {
          payload.status = 'fixed';
          payload.fixed_at = update.fixed_at;
        }
        await supabase.from('user_mistakes').update(payload).eq('id', update.id);
      }
    }
  },

  markMistakesRepeated: async (ids) => {
    if (!ids || ids.length === 0) return;
    const state = get();
    
    const newMistakes: UserMistake[] = state.mistakes.map(m => {
      if (ids.includes(m.id) && m.status === 'active') {
        return { ...m, avoidanceCount: 0 };
      }
      return m;
    });

    set({ mistakes: newMistakes });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      for (const id of ids) {
        await supabase.from('user_mistakes').update({ avoidance_count: 0 }).eq('id', id);
      }
    }
  },

  setCurrentSession: (session) => set({ currentSession: session }),

  addXp: async (amount) => {
    const state = get();
    const newXp = state.totalXp + amount;
    const { level, title } = getLevelFromXp(newXp);
    
    set({
      totalXp: newXp,
      currentLevel: level,
      currentLevelTitle: title,
    });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_progress').update({
        total_xp: newXp,
        current_level: level,
        current_level_title: title
      }).eq('id', user.id);
    }
  },

  updateStreak: async () => {
    const state = get();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (state.lastPracticeDate === today) return;

    let newStreak = 1;
    if (state.lastPracticeDate === yesterday) {
      newStreak = state.currentStreak + 1;
    }

    const newLongest = Math.max(state.longestStreak, newStreak);
    const newFreezes = newStreak % 7 === 0 ? Math.min(state.streakFreezesAvailable + 1, 2) : state.streakFreezesAvailable;

    set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastPracticeDate: today,
      streakFreezesAvailable: newFreezes,
    });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
       await supabase.from('user_progress').update({
         current_streak: newStreak,
         longest_streak: newLongest,
         last_practice_date: today,
         streak_freezes_available: newFreezes
       }).eq('id', user.id);
    }
  },

  addVocabWord: async (word) => {
    const state = get();
    if (state.vocabularyBank.some((w) => w.word === word.word)) return;
    
    const newCard: FSRSCard = {
      wordId: word.id,
      stability: 0,
      difficulty: 0,
      lastReview: "",
      nextReview: new Date().toISOString(),
      reps: 0,
      lapses: 0,
    };
    
    set({
      vocabularyBank: [word, ...state.vocabularyBank],
      fsrsCards: [newCard, ...state.fsrsCards],
    });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('vocabulary_words').insert({
        id: word.id,
        user_id: user.id,
        word: word.word,
        definition: word.definition,
        register: word.register,
        context: word.context,
        cefr_level: word.cefrLevel,
        mastery_level: word.masteryLevel,
        next_review_date: word.nextReviewDate,
        reps: word.reps,
        added_at: word.addedAt
      });
      await supabase.from('fsrs_cards').insert({
        word_id: word.id,
        user_id: user.id,
        stability: newCard.stability,
        difficulty: newCard.difficulty,
        last_review: null,
        next_review: newCard.nextReview,
        reps: newCard.reps,
        lapses: newCard.lapses
      });
    }
  },

  removeVocabWord: async (id) => {
    const state = get();
    set({
      vocabularyBank: state.vocabularyBank.filter((w) => w.id !== id),
      fsrsCards: state.fsrsCards.filter((c) => c.wordId !== id),
    });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('vocabulary_words').delete().eq('id', id).eq('user_id', user.id);
      // fsrs_cards deletes automatically via ON DELETE CASCADE in SQL
    }
  },

  updateVocabMastery: async (id, level) => {
    const state = get();
    set({
      vocabularyBank: state.vocabularyBank.map((w) =>
        w.id === id ? { ...w, masteryLevel: level } : w
      ),
    });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('vocabulary_words').update({ mastery_level: level }).eq('id', id).eq('user_id', user.id);
    }
  },

  reviewWord: async (wordId, rating) => {
    const state = get();
    const cardIndex = state.fsrsCards.findIndex((c) => c.wordId === wordId);
    if (cardIndex === -1) return;

    const oldCard = state.fsrsCards[cardIndex];
    const newCard = computeFSRS(oldCard, rating);

    const updatedCards = [...state.fsrsCards];
    updatedCards[cardIndex] = newCard;

    let newMastery: VocabWord["masteryLevel"] = "new";
    if (newCard.reps >= 5 && newCard.lapses === 0) newMastery = "mastered";
    else if (newCard.reps >= 3) newMastery = "familiar";
    else if (newCard.reps >= 1) newMastery = "learning";

    const updatedVocab = state.vocabularyBank.map((w) =>
      w.id === wordId
        ? { ...w, masteryLevel: newMastery, nextReviewDate: newCard.nextReview, reps: newCard.reps }
        : w
    );

    set({
      fsrsCards: updatedCards,
      vocabularyBank: updatedVocab,
    });

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('fsrs_cards').update({
        stability: newCard.stability,
        difficulty: newCard.difficulty,
        last_review: newCard.lastReview,
        next_review: newCard.nextReview,
        reps: newCard.reps,
        lapses: newCard.lapses
      }).eq('word_id', wordId).eq('user_id', user.id);

      await supabase.from('vocabulary_words').update({
        mastery_level: newMastery,
        next_review_date: newCard.nextReview,
        reps: newCard.reps
      }).eq('id', wordId).eq('user_id', user.id);
    }
  },

  getWordsDueForReview: () => {
    const state = get();
    const now = new Date();
    return state.vocabularyBank.filter((word) => {
      const card = state.fsrsCards.find((c) => c.wordId === word.id);
      if (!card) return true;
      return new Date(card.nextReview) <= now;
    });
  },

  checkAndUnlockBadges: async () => {
    const state = get();
    const newlyUnlocked: Badge[] = [];
    const now = new Date().toISOString();

    const masteredCount = state.vocabularyBank.filter((w) => w.masteryLevel === "mastered").length;
    const highestScore = state.sessions.length > 0
      ? Math.max(...state.sessions.map((s) => s.analysis?.overall?.score || 0))
      : 0;

    const updatedBadges = state.badges.map((badge) => {
      if (badge.unlockedAt) return badge;

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
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_progress').update({
          badges: updatedBadges
        }).eq('id', user.id);
      }
    }

    return newlyUnlocked;
  },
}));
