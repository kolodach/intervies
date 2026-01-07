-- Migration: Simplify problems schema
-- Changes:
-- 1. Remove sample_requirements column
-- 2. Remove categories column
-- 3. Remove tags column
-- 4. Add industries column (text[] default '{}')
-- 5. Update requirements JSONB to merge constraints into functional/non_functional

-- Step 1: Add industries column with default empty array
ALTER TABLE problems ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}';

-- Step 2: Migrate constraints into functional/non_functional requirements
-- We'll merge constraints into non_functional requirements since they're often performance/scaling related
UPDATE problems
SET requirements = jsonb_set(
  jsonb_set(
    requirements - 'constraints',
    '{non_functional}',
    COALESCE(requirements->'non_functional', '[]'::jsonb) || COALESCE(requirements->'constraints', '[]'::jsonb)
  ),
  '{out_of_scope}',
  COALESCE(requirements->'out_of_scope', '[]'::jsonb)
)
WHERE requirements ? 'constraints';

-- Step 3: Remove deprecated columns
ALTER TABLE problems DROP COLUMN IF EXISTS sample_requirements;
ALTER TABLE problems DROP COLUMN IF EXISTS categories;
ALTER TABLE problems DROP COLUMN IF EXISTS tags;

-- Add comment explaining the schema
COMMENT ON COLUMN problems.industries IS 'Industries where this interview question is commonly asked (e.g., ["FAANG", "Fintech", "Startup"])';
COMMENT ON COLUMN problems.requirements IS 'Problem requirements with functional, non_functional, and out_of_scope arrays';
