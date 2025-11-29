-- Add structured requirements to problems table
-- This replaces the generic sample_requirements with more structured data

ALTER TABLE problems
ADD COLUMN requirements JSONB NOT NULL DEFAULT '{
  "functional": [],
  "non_functional": [],
  "constraints": [],
  "out_of_scope": []
}'::jsonb;

-- Create index for better query performance on requirements
CREATE INDEX idx_problems_requirements ON problems USING GIN(requirements);

-- Add check constraint to ensure requirements structure is valid
ALTER TABLE problems
ADD CONSTRAINT valid_requirements_structure
CHECK (
  requirements ? 'functional' AND
  requirements ? 'non_functional' AND
  jsonb_typeof(requirements->'functional') = 'array' AND
  jsonb_typeof(requirements->'non_functional') = 'array'
);

-- Optional: Drop old sample_requirements column if no longer needed
-- Uncomment the next line after confirming data migration
-- ALTER TABLE problems DROP COLUMN sample_requirements;

-- Comment explaining the structure
COMMENT ON COLUMN problems.requirements IS 
'Structured requirements for the interview problem. Contains:
- functional: Array of functional requirements
- non_functional: Array of non-functional requirements (scale, latency, availability)
- constraints: Array of constraints (optional)
- out_of_scope: Array of features explicitly out of scope (optional)';

