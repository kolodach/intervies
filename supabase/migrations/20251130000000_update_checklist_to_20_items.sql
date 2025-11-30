-- Update evaluation_checklist to new 21-item structure
-- This migration replaces the old 48-item checklist with the streamlined 21-item version

-- First, drop the old default constraint
ALTER TABLE solutions 
ALTER COLUMN evaluation_checklist DROP DEFAULT;

-- Set the new default with 21 items
ALTER TABLE solutions 
ALTER COLUMN evaluation_checklist SET DEFAULT '{
  "requirements_asked_clarifying_questions": false,
  "requirements_discussed_scale_and_performance": false,
  "requirements_stated_assumptions": false,
  "requirements_validated_understanding": false,
  "design_started_with_high_level": false,
  "design_drew_diagram": false,
  "design_explained_data_flow": false,
  "design_justified_technology_choices": false,
  "design_discussed_scalability": false,
  "design_considered_failures": false,
  "design_discussed_tradeoffs": false,
  "design_did_capacity_planning": false,
  "design_over_engineered": false,
  "deep_dive_showed_depth": false,
  "deep_dive_considered_alternatives": false,
  "deep_dive_did_calculations": false,
  "deep_dive_handled_pushback": false,
  "communication_clear_and_structured": false,
  "communication_collaborative": false,
  "communication_thought_out_loud": false,
  "communication_got_defensive": false
}'::jsonb;

-- Update existing solutions to have the new checklist structure
-- (This will reset all existing checklists to the new format)
UPDATE solutions 
SET evaluation_checklist = '{
  "requirements_asked_clarifying_questions": false,
  "requirements_discussed_scale_and_performance": false,
  "requirements_stated_assumptions": false,
  "requirements_validated_understanding": false,
  "design_started_with_high_level": false,
  "design_drew_diagram": false,
  "design_explained_data_flow": false,
  "design_justified_technology_choices": false,
  "design_discussed_scalability": false,
  "design_considered_failures": false,
  "design_discussed_tradeoffs": false,
  "design_did_capacity_planning": false,
  "design_over_engineered": false,
  "deep_dive_showed_depth": false,
  "deep_dive_considered_alternatives": false,
  "deep_dive_did_calculations": false,
  "deep_dive_handled_pushback": false,
  "communication_clear_and_structured": false,
  "communication_collaborative": false,
  "communication_thought_out_loud": false,
  "communication_got_defensive": false
}'::jsonb;

-- Add comment explaining the checklist structure
COMMENT ON COLUMN solutions.evaluation_checklist IS 
'Streamlined 21-item evaluation checklist:
- 4 Requirements items
- 9 Design items (includes 1 red flag: design_over_engineered, and capacity planning)
- 4 Deep Dive items
- 4 Communication items (includes 1 red flag: communication_got_defensive)
Red flags (design_over_engineered, communication_got_defensive) use inverted scoring: true = bad';

