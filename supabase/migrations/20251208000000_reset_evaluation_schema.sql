-- Reset evaluation schema for simplified evaluation structure
-- This migration handles the breaking schema change to the evaluation JSONB column
-- Set all existing evaluation data to NULL
-- This is the safest approach since the schema has changed significantly
-- Old evaluations won't be compatible with the new simplified structure
UPDATE solutions
SET
    evaluation = NULL
WHERE
    evaluation IS NOT NULL;

-- Update comment to document the new schema structure
COMMENT ON COLUMN solutions.evaluation IS 'Simplified evaluation report with overall_score, summary, and categories (technical/communication with pros/cons)';