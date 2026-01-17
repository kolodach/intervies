/**
 * Evaluation Criteria Definitions
 *
 * This file contains all criteria used to evaluate system design interview performance.
 * Positive criteria add to the score, red flags subtract from it.
 *
 * Positive criteria weights sum to 100%.
 * Red flags subtract from the score (total possible deduction: 23%).
 */

export type CriterionKey =
  // Positive criteria (10 items, sum to 100%)
  | "clarifies_requirements_before_design"
  | "avoids_unfounded_assumptions"
  | "proposes_high_level_architecture_first"
  | "communicates_decisions_and_tradeoffs"
  | "makes_opinionated_choices"
  | "addresses_data_model_and_consistency"
  | "addresses_scalability_and_growth"
  | "addresses_reliability_and_failure_modes"
  | "ties_design_to_user_and_business_impact"
  | "collaborates_with_interviewer"
  // Red flags (4 items, subtract from score)
  | "limited_engagement_with_interviewer"
  | "technical_terms_without_explanation"
  | "tradeoffs_discussed_but_not_resolved"
  | "operational_concerns_not_addressed";

export type Criterion = {
  key: CriterionKey;
  name: string;
  description: string;
  weight_percent: number;
  is_red_flag: boolean;
};

/**
 * All evaluation criteria with weights and descriptions.
 * Positive criteria add to score, red flags subtract.
 */
export const CRITERIA: Record<CriterionKey, Criterion> = {
  // ============================================
  // POSITIVE CRITERIA (sum to 100%)
  // ============================================

  clarifies_requirements_before_design: {
    key: "clarifies_requirements_before_design",
    name: "Clarifies Requirements Before Design",
    description:
      "Asks functional and non-functional questions that materially affect the design before proposing solutions.",
    weight_percent: 10,
    is_red_flag: false,
  },

  avoids_unfounded_assumptions: {
    key: "avoids_unfounded_assumptions",
    name: "Avoids Unfounded Assumptions",
    description:
      "Explicitly states assumptions or asks clarifying questions instead of silently assuming constraints.",
    weight_percent: 5,
    is_red_flag: false,
  },

  proposes_high_level_architecture_first: {
    key: "proposes_high_level_architecture_first",
    name: "Proposes High-Level Architecture First",
    description:
      "Outlines a clear end-to-end architecture before diving into component-level details.",
    weight_percent: 12,
    is_red_flag: false,
  },

  communicates_decisions_and_tradeoffs: {
    key: "communicates_decisions_and_tradeoffs",
    name: "Communicates Decisions and Tradeoffs",
    description:
      "Explains why specific choices were made and why alternatives were rejected.",
    weight_percent: 18,
    is_red_flag: false,
  },

  makes_opinionated_choices: {
    key: "makes_opinionated_choices",
    name: "Makes Opinionated Choices",
    description:
      "Selects a concrete approach and defends it rather than listing multiple options indefinitely.",
    weight_percent: 12,
    is_red_flag: false,
  },

  addresses_data_model_and_consistency: {
    key: "addresses_data_model_and_consistency",
    name: "Addresses Data Model and Consistency",
    description:
      "Defines schemas, ownership, consistency expectations, and correctness guarantees.",
    weight_percent: 12,
    is_red_flag: false,
  },

  addresses_scalability_and_growth: {
    key: "addresses_scalability_and_growth",
    name: "Addresses Scalability and Growth",
    description:
      "Explains how the system scales over time and when redesigns become necessary.",
    weight_percent: 10,
    is_red_flag: false,
  },

  addresses_reliability_and_failure_modes: {
    key: "addresses_reliability_and_failure_modes",
    name: "Addresses Reliability and Failure Modes",
    description:
      "Identifies failure cases, retries, idempotency, monitoring, and recovery strategies.",
    weight_percent: 12,
    is_red_flag: false,
  },

  ties_design_to_user_and_business_impact: {
    key: "ties_design_to_user_and_business_impact",
    name: "Ties Design to User and Business Impact",
    description:
      "Connects architectural decisions to user experience, SLAs, or business priorities.",
    weight_percent: 5,
    is_red_flag: false,
  },

  collaborates_with_interviewer: {
    key: "collaborates_with_interviewer",
    name: "Collaborates With Interviewer",
    description:
      "Treats the interview as a design discussion, incorporating feedback and signals.",
    weight_percent: 4,
    is_red_flag: false,
  },

  // ============================================
  // RED FLAGS (subtract from score)
  // ============================================

  limited_engagement_with_interviewer: {
    key: "limited_engagement_with_interviewer",
    name: "Limited Engagement With Interviewer",
    description:
      "Proceeded without incorporating interviewer signals or feedback.",
    weight_percent: 5,
    is_red_flag: true,
  },

  technical_terms_without_explanation: {
    key: "technical_terms_without_explanation",
    name: "Technical Terms Without Explanation",
    description:
      "Named technologies or patterns without explaining why they fit the problem.",
    weight_percent: 4,
    is_red_flag: true,
  },

  tradeoffs_discussed_but_not_resolved: {
    key: "tradeoffs_discussed_but_not_resolved",
    name: "Tradeoffs Discussed But Not Resolved",
    description:
      "Mentioned multiple options but did not commit to or defend a decision.",
    weight_percent: 6,
    is_red_flag: true,
  },

  operational_concerns_not_addressed: {
    key: "operational_concerns_not_addressed",
    name: "Operational Concerns Not Addressed",
    description:
      "Did not discuss monitoring, failure recovery, or operational readiness.",
    weight_percent: 8,
    is_red_flag: true,
  },
};

/**
 * Get all criteria keys
 */
export const CRITERIA_KEYS = Object.keys(CRITERIA) as CriterionKey[];

/**
 * Get positive criteria only (non-red-flags)
 */
export const POSITIVE_CRITERIA = CRITERIA_KEYS.filter(
  (key) => !CRITERIA[key].is_red_flag
);

/**
 * Get red flag criteria only
 */
export const RED_FLAG_CRITERIA = CRITERIA_KEYS.filter(
  (key) => CRITERIA[key].is_red_flag
);

/**
 * Default checklist state with all criteria set to false
 */
export function getDefaultChecklist(): Record<CriterionKey, boolean> {
  return CRITERIA_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as Record<CriterionKey, boolean>);
}

/**
 * Calculate the current score from a checklist.
 * Positive criteria add to score, red flags subtract.
 * Score is clamped to 0-100 range.
 */
export function calculateScore(checklist: Record<string, boolean>): number {
  let score = 0;

  for (const [key, triggered] of Object.entries(checklist)) {
    if (!triggered) continue;

    const criterion = CRITERIA[key as CriterionKey];
    if (!criterion) continue;

    if (criterion.is_red_flag) {
      score -= criterion.weight_percent;
    } else {
      score += criterion.weight_percent;
    }
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get criteria grouped by their observed status
 */
export function groupChecklist(checklist: Record<string, boolean>): {
  noted: CriterionKey[];
  remaining: CriterionKey[];
  avoid: CriterionKey[];
} {
  const noted: CriterionKey[] = [];
  const remaining: CriterionKey[] = [];
  const avoid: CriterionKey[] = [];

  for (const key of CRITERIA_KEYS) {
    const criterion = CRITERIA[key];
    const isTriggered = checklist[key] === true;

    if (isTriggered) {
      noted.push(key);
    } else if (criterion.is_red_flag) {
      avoid.push(key);
    } else {
      remaining.push(key);
    }
  }

  // Sort noted: positive first, then red flags
  noted.sort((a, b) => {
    const aIsRedFlag = CRITERIA[a].is_red_flag;
    const bIsRedFlag = CRITERIA[b].is_red_flag;
    if (aIsRedFlag === bIsRedFlag) return 0;
    return aIsRedFlag ? 1 : -1;
  });

  return { noted, remaining, avoid };
}
