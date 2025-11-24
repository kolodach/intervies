-- Schema for interviews table
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('completed', 'in_progress')),
  title TEXT NOT NULL,
  question_id UUID NOT NULL,
  conversation JSONB NOT NULL DEFAULT '[]',
  board_state JSONB NOT NULL DEFAULT '{}',
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for better query performance
CREATE INDEX idx_interviews_user_id ON interviews(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can query their own interviews
CREATE POLICY "Users can query their interviews"
ON public.interviews
FOR SELECT
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Policy: Users can insert their own interviews
CREATE POLICY "Users can insert their interviews"
ON public.interviews
FOR INSERT
TO authenticated
WITH CHECK (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Policy: Users can update their own interviews
CREATE POLICY "Users can update their interviews"
ON public.interviews
FOR UPDATE
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
)
WITH CHECK (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Policy: Users can delete their own interviews
CREATE POLICY "Users can delete their interviews"
ON public.interviews
FOR DELETE
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Create updated_at trigger (reuse existing function if available)
CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

