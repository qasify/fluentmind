-- Independent Ledger for Persistent User Mistakes
CREATE TABLE IF NOT EXISTS public.user_mistakes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL DEFAULT 'grammar' CHECK (error_type IN ('grammar', 'vocabulary', 'phrase', 'action_step')),
  original_text TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fixed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fixed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mistakes_user_id ON public.user_mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_status ON public.user_mistakes(status);

ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mistakes" ON public.user_mistakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mistakes" ON public.user_mistakes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mistakes" ON public.user_mistakes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mistakes" ON public.user_mistakes FOR DELETE USING (auth.uid() = user_id);
