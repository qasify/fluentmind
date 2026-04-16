-- Phase 5: Advanced Intelligence Engines Migration
-- 1. Add AI Personality to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_personality TEXT NOT NULL DEFAULT 'encouraging_coach' CHECK (ai_personality IN ('encouraging_coach', 'strict_examiner', 'casual_friend', 'socratic_tutor'));

-- 2. Add ELO Rating to user_progress for adaptive difficulty
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS elo_rating INTEGER NOT NULL DEFAULT 1200;