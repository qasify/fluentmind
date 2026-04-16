-- Add avoidance sequence tracking to mistakes
ALTER TABLE public.user_mistakes 
ADD COLUMN IF NOT EXISTS avoidance_count INTEGER NOT NULL DEFAULT 0;
