-- ============================================================================
-- BIL-10: Chiko AI Conversations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chiko_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chiko_conversations_agency ON public.chiko_conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_chiko_conversations_user ON public.chiko_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chiko_conversations_updated ON public.chiko_conversations(updated_at DESC);

-- RLS
ALTER TABLE public.chiko_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON public.chiko_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON public.chiko_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.chiko_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.chiko_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Super admins can see all
CREATE POLICY "Super admins can view all conversations"
  ON public.chiko_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_chiko_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chiko_conversations_updated_at
  BEFORE UPDATE ON public.chiko_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chiko_conversations_updated_at();
