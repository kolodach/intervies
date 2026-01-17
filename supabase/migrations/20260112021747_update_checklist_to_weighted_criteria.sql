-- Migration: Update evaluation_checklist to new weighted criteria system
-- 
-- This migration replaces the old 17-item checklist with a new 14-item weighted criteria system.
-- The new system has 10 positive criteria (sum to 100%) and 4 red flags (subtract from score).
--
-- Old schema: 17 items in categories (requirements, design, communication)
-- New schema: 14 items with individual weights

-- Update the default value for new solutions
ALTER TABLE solutions 
ALTER COLUMN evaluation_checklist DROP DEFAULT;

ALTER TABLE solutions 
ALTER COLUMN evaluation_checklist SET DEFAULT '{
  "clarifies_requirements_before_design": false,
  "avoids_unfounded_assumptions": false,
  "proposes_high_level_architecture_first": false,
  "communicates_decisions_and_tradeoffs": false,
  "makes_opinionated_choices": false,
  "addresses_data_model_and_consistency": false,
  "addresses_scalability_and_growth": false,
  "addresses_reliability_and_failure_modes": false,
  "ties_design_to_user_and_business_impact": false,
  "collaborates_with_interviewer": false,
  "limited_engagement_with_interviewer": false,
  "technical_terms_without_explanation": false,
  "tradeoffs_discussed_but_not_resolved": false,
  "operational_concerns_not_addressed": false
}'::jsonb;

-- Reset active solutions to the new checklist format
-- Only reset solutions that are still in progress (not completed/evaluated)
UPDATE solutions 
SET evaluation_checklist = '{
  "clarifies_requirements_before_design": false,
  "avoids_unfounded_assumptions": false,
  "proposes_high_level_architecture_first": false,
  "communicates_decisions_and_tradeoffs": false,
  "makes_opinionated_choices": false,
  "addresses_data_model_and_consistency": false,
  "addresses_scalability_and_growth": false,
  "addresses_reliability_and_failure_modes": false,
  "ties_design_to_user_and_business_impact": false,
  "collaborates_with_interviewer": false,
  "limited_engagement_with_interviewer": false,
  "technical_terms_without_explanation": false,
  "tradeoffs_discussed_but_not_resolved": false,
  "operational_concerns_not_addressed": false
}'::jsonb
WHERE status IN ('active', 'evaluating');

-- Update comment explaining the new checklist structure
COMMENT ON COLUMN solutions.evaluation_checklist IS 
'Weighted evaluation criteria (14 items):

POSITIVE CRITERIA (sum to 100%):
- clarifies_requirements_before_design (10%)
- avoids_unfounded_assumptions (5%)
- proposes_high_level_architecture_first (12%)
- communicates_decisions_and_tradeoffs (18%)
- makes_opinionated_choices (12%)
- addresses_data_model_and_consistency (12%)
- addresses_scalability_and_growth (10%)
- addresses_reliability_and_failure_modes (12%)
- ties_design_to_user_and_business_impact (5%)
- collaborates_with_interviewer (4%)

RED FLAGS (subtract from score):
- limited_engagement_with_interviewer (-5%)
- technical_terms_without_explanation (-4%)
- tradeoffs_discussed_but_not_resolved (-6%)
- operational_concerns_not_addressed (-8%)

Score calculation: Sum of triggered positive criteria minus triggered red flags, clamped to 0-100.';
