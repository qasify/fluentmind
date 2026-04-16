-- Create Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  scenario_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Conversation Messages Table
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'system')),
  text TEXT NOT NULL,
  audio_url TEXT,
  corrections JSONB DEFAULT '[]'::jsonb, -- Store inline corrections from AI
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.conversation_messages(conversation_id);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Conversations
CREATE POLICY "Users can manage their own conversations" 
ON public.conversations 
FOR ALL USING (auth.uid() = user_id);

-- Policies for Messages (Need to join with conversations to check ownership)
CREATE POLICY "Users can manage their own messages" 
ON public.conversation_messages 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.conversations c 
    WHERE c.id = conversation_messages.conversation_id 
    AND c.user_id = auth.uid()
  )
);
