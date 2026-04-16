-- Migration for Phase 5: Curriculum Engine
CREATE TABLE IF NOT EXISTS public.user_curriculums (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying curriculums efficiently by user_id and status
CREATE INDEX IF NOT EXISTS idx_curriculums_user_id ON public.user_curriculums(user_id);
CREATE INDEX IF NOT EXISTS idx_curriculums_status ON public.user_curriculums(status);

ALTER TABLE public.user_curriculums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own curriculums" ON public.user_curriculums FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own curriculums" ON public.user_curriculums FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own curriculums" ON public.user_curriculums FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own curriculums" ON public.user_curriculums FOR DELETE USING (auth.uid() = user_id);
