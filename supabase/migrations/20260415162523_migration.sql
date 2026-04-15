-- FluentMind AI Database Schema
-- Run this in Supabase SQL Editor

-- =========================================
-- 1. User Profiles (extends Supabase auth)
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '' CHECK (goal IN ('', 'ielts', 'professional', 'casual', 'academic')),
  current_level TEXT NOT NULL DEFAULT '' CHECK (current_level IN ('', 'beginner', 'intermediate', 'advanced')),
  native_language TEXT NOT NULL DEFAULT '',
  daily_goal_minutes INTEGER NOT NULL DEFAULT 5,
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 2. User Progress (XP, streaks, badges)
-- =========================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_level_title TEXT NOT NULL DEFAULT 'Novice Communicator',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_practice_date DATE,
  streak_freezes_available INTEGER NOT NULL DEFAULT 0,
  badges JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- 3. Sessions (recordings, conversations)
-- =========================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'recording' CHECK (type IN ('recording', 'conversation', 'exam')),
  topic TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  transcript TEXT NOT NULL DEFAULT '',
  analysis JSONB NOT NULL DEFAULT '{}'::JSONB,
  audio_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.sessions(created_at DESC);

-- =========================================
-- 4. Vocabulary Bank
-- =========================================
CREATE TABLE IF NOT EXISTS public.vocabulary_words (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT NOT NULL DEFAULT '',
  register TEXT NOT NULL DEFAULT '',
  context TEXT NOT NULL DEFAULT '',
  cefr_level TEXT NOT NULL DEFAULT '',
  mastery_level TEXT NOT NULL DEFAULT 'new' CHECK (mastery_level IN ('new', 'learning', 'familiar', 'mastered')),
  next_review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reps INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocab_user_id ON public.vocabulary_words(user_id);

-- =========================================
-- 5. FSRS Cards (spaced repetition state)
-- =========================================
CREATE TABLE IF NOT EXISTS public.fsrs_cards (
  word_id TEXT PRIMARY KEY REFERENCES public.vocabulary_words(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stability DOUBLE PRECISION NOT NULL DEFAULT 0,
  difficulty DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_review TIMESTAMPTZ,
  next_review TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_fsrs_user_id ON public.fsrs_cards(user_id);

-- =========================================
-- 6. Row Level Security (RLS)
-- =========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fsrs_cards ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Progress: users can only read/write their own
CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = id);

-- Sessions: users can only read/write their own
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vocabulary: users can only read/write/delete their own
CREATE POLICY "Users can view own vocab" ON public.vocabulary_words FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vocab" ON public.vocabulary_words FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vocab" ON public.vocabulary_words FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vocab" ON public.vocabulary_words FOR DELETE USING (auth.uid() = user_id);

-- FSRS Cards: users can only read/write/delete their own
CREATE POLICY "Users can view own fsrs" ON public.fsrs_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fsrs" ON public.fsrs_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fsrs" ON public.fsrs_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fsrs" ON public.fsrs_cards FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- 7. Auto-create profile & progress on signup
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_progress (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
