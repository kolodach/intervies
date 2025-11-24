-- Rename questions table to problems
ALTER TABLE questions RENAME TO problems;

-- Rename indexes
ALTER INDEX idx_questions_difficulty RENAME TO idx_problems_difficulty;
ALTER INDEX idx_questions_categories RENAME TO idx_problems_categories;
ALTER INDEX idx_questions_is_active RENAME TO idx_problems_is_active;

-- Rename trigger
DROP TRIGGER IF EXISTS update_questions_updated_at ON problems;
CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policies
DROP POLICY IF EXISTS "Public can read questions" ON public.problems;
CREATE POLICY "Public can read problems"
ON public.problems
FOR SELECT
TO anon
USING (is_active = true);

