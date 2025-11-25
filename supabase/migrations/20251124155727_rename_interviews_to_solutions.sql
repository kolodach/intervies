-- Rename interviews table to solutions
ALTER TABLE interviews RENAME TO solutions;

-- Rename column question_id to problem_id
ALTER TABLE solutions RENAME COLUMN question_id TO problem_id;

-- Rename indexes
ALTER INDEX idx_interviews_user_id RENAME TO idx_solutions_user_id;

-- Rename trigger
DROP TRIGGER IF EXISTS update_interviews_updated_at ON solutions;
CREATE TRIGGER update_solutions_updated_at
  BEFORE UPDATE ON solutions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can query their interviews" ON public.solutions;
DROP POLICY IF EXISTS "Users can insert their interviews" ON public.solutions;
DROP POLICY IF EXISTS "Users can update their interviews" ON public.solutions;
DROP POLICY IF EXISTS "Users can delete their interviews" ON public.solutions;

CREATE POLICY "Users can query their solutions"
ON public.solutions
FOR SELECT
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

CREATE POLICY "Users can insert their solutions"
ON public.solutions
FOR INSERT
TO authenticated
WITH CHECK (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

CREATE POLICY "Users can update their solutions"
ON public.solutions
FOR UPDATE
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
)
WITH CHECK (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

CREATE POLICY "Users can delete their solutions"
ON public.solutions
FOR DELETE
TO authenticated
USING (
  ((select auth.jwt()->>'sub') = (user_id)::text)
);

-- Add default values for solutions table columns
ALTER TABLE solutions 
  ALTER COLUMN conversation SET DEFAULT '[]'::jsonb,
  ALTER COLUMN board_state SET DEFAULT '[]'::jsonb;
-- Ensure columns are NOT NULL with defaults
ALTER TABLE solutions 
  ALTER COLUMN conversation SET NOT NULL,
  ALTER COLUMN board_state SET NOT NULL;

