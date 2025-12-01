-- Add evaluation support to solutions table
-- This migration adds fields for interview evaluation and conclusion

-- Drop old CHECK constraint if it exists (from interviews table migration)
-- The old constraint only allowed 'completed' or 'in_progress'
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find and drop the old status constraint
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'solutions'::regclass
    AND contype = 'c'
    AND conname LIKE '%status%check%'
  LIMIT 1;
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE solutions DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
  END IF;
END $$;

-- Add status column if it doesn't exist, or alter it if it does
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'solutions' 
    AND column_name = 'status'
  ) THEN
    -- Column doesn't exist, add it with new constraint
    ALTER TABLE solutions
    ADD COLUMN status VARCHAR(50) DEFAULT 'active'
    CHECK (status IN ('active', 'evaluating', 'completed', 'evaluation_failed', 'abandoned', 'in_progress'));
  ELSE
    -- Column exists, add the new constraint if it doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'solutions'::regclass
        AND conname = 'solutions_status_check'
    ) THEN
      ALTER TABLE solutions
      ADD CONSTRAINT solutions_status_check 
      CHECK (status IN ('active', 'evaluating', 'completed', 'evaluation_failed', 'abandoned', 'in_progress'));
    END IF;
    
    -- Set default
    ALTER TABLE solutions
    ALTER COLUMN status SET DEFAULT 'active';
  END IF;
END $$;

-- Add concluded_at timestamp
ALTER TABLE solutions
ADD COLUMN IF NOT EXISTS concluded_at TIMESTAMPTZ;

-- Add evaluation JSON field
ALTER TABLE solutions
ADD COLUMN IF NOT EXISTS evaluation JSONB;

-- Add evaluated_at timestamp
ALTER TABLE solutions
ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ;

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_solutions_status ON solutions (status);

-- Add index for evaluation queries
CREATE INDEX IF NOT EXISTS idx_solutions_evaluated_at ON solutions (evaluated_at)
WHERE
    evaluated_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN solutions.status IS 'Status of the interview: active, evaluating, completed, evaluation_failed, abandoned';

COMMENT ON COLUMN solutions.evaluation IS 'Complete evaluation report with scores, feedback, and recommendations';

-- Update existing solutions:
-- - Set NULL status to 'active'
-- - Convert old 'in_progress' to 'active' (for consistency)
UPDATE solutions
SET
    status = 'active'
WHERE
    status IS NULL OR status = 'in_progress';
