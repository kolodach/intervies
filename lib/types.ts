import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type SolutionState =
  | "GREETING"
  | "REQUIREMENTS"
  | "DESIGNING"
  | "DEEP_DIVE"
  | "CONCLUSION";
export const SolutionStates: SolutionState[] = [
  "GREETING",
  "REQUIREMENTS",
  "DESIGNING",
  "DEEP_DIVE",
  "CONCLUSION",
];

export type TypedSupabaseClient = SupabaseClient<Database>;

export type Problem = Database["public"]["Tables"]["problems"]["Row"];
export type Solution = Database["public"]["Tables"]["solutions"]["Row"];

export type ProblemRequirements = {
  functional: string[];
  non_functional: string[];
  constraints?: string[];
  out_of_scope?: string[];
};

export type EvaluationChecklist = {
  // REQUIREMENTS GATHERING (4 items)
  requirements_asked_clarifying_questions: boolean;
  requirements_discussed_scale_and_performance: boolean;
  requirements_stated_assumptions: boolean;
  requirements_validated_understanding: boolean;

  // DESIGN (9 items)
  design_started_with_high_level: boolean;
  design_drew_diagram: boolean;
  design_explained_data_flow: boolean;
  design_justified_technology_choices: boolean;
  design_discussed_scalability: boolean;
  design_considered_failures: boolean;
  design_discussed_tradeoffs: boolean;
  design_did_capacity_planning: boolean;
  design_over_engineered: boolean; // RED FLAG: inverted scoring

  // DEEP DIVE (4 items)
  deep_dive_showed_depth: boolean;
  deep_dive_considered_alternatives: boolean;
  deep_dive_did_calculations: boolean;
  deep_dive_handled_pushback: boolean;

  // COMMUNICATION (4 items)
  communication_clear_and_structured: boolean;
  communication_collaborative: boolean;
  communication_thought_out_loud: boolean;
  communication_got_defensive: boolean; // RED FLAG: inverted scoring
};
