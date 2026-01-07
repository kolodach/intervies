-- Production script: Update problems to simplified schema
-- Run this AFTER the migration has been applied
-- This script updates existing problems that still have constraints in their requirements

-- Step 1: Merge constraints into non_functional requirements for any problems that still have constraints
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

-- Step 2: Update any problems that don't have industries set (should default to empty array from schema)
-- This is a no-op if migration already added the column with default
UPDATE problems
SET industries = '{}'
WHERE industries IS NULL;

-- Step 3: Verify the update
SELECT
  id,
  title,
  industries,
  requirements->'functional' IS NOT NULL as has_functional,
  requirements->'non_functional' IS NOT NULL as has_non_functional,
  requirements ? 'constraints' as still_has_constraints,
  requirements->'out_of_scope' IS NOT NULL as has_out_of_scope
FROM problems
ORDER BY title;
