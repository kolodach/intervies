-- Remove deep_dive items from evaluation_checklist
-- The deep dive phase has been removed from the interview flow
-- Scoring is now: Requirements (25pts), Design (50pts), Communication (25pts)

-- Update the default value to remove deep_dive items (now 17 items instead of 21)
ALTER TABLE solutions 
ALTER COLUMN evaluation_checklist DROP DEFAULT;

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
  "communication_clear_and_structured": false,
  "communication_collaborative": false,
  "communication_thought_out_loud": false,
  "communication_got_defensive": false
}'::jsonb;

-- Remove deep_dive keys from existing solutions that haven't been evaluated yet
UPDATE solutions 
SET evaluation_checklist = evaluation_checklist 
  - 'deep_dive_showed_depth'
  - 'deep_dive_considered_alternatives'
  - 'deep_dive_did_calculations'
  - 'deep_dive_handled_pushback'
WHERE status IN ('active', 'evaluating');

-- Update comment explaining the new checklist structure
COMMENT ON COLUMN solutions.evaluation_checklist IS 
'Streamlined 17-item evaluation checklist:
- 4 Requirements items (25 points)
- 9 Design items (50 points, includes 1 red flag: design_over_engineered)
- 4 Communication items (25 points, includes 1 red flag: communication_got_defensive)
Red flags (design_over_engineered, communication_got_defensive) use inverted scoring: true = bad';

