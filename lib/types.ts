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

export type EvaluationChecklist = {
  // Greeting
  greeting_engagement: boolean;
  greeting_sets_context: boolean;
  greeting_establishes_collaboration: boolean;

  // Requirements
  requirements_clarified_requirements: boolean;
  requirements_avoided_overanalysis: boolean;
  requirements_defined_scope: boolean;
  requirements_stated_assumptions: boolean;
  requirements_stated_scale_and_sla: boolean;
  requirements_walked_through_user_scenarios: boolean;
  requirements_validated_requirements: boolean;

  // Design
  design_provided_high_level_overview: boolean;
  design_modular_components_identified: boolean;
  design_covered_scalability: boolean;
  design_considered_future_growth: boolean;
  design_discussed_performance_and_latency: boolean;
  design_identified_spof_and_fault_tolerance: boolean;
  design_covered_security_and_privacy: boolean;
  design_included_observability: boolean;
  design_chose_appropriate_databases: boolean;
  design_covered_data_modeling: boolean;
  design_managed_data_growth_strategy: boolean;
  design_used_caching_properly: boolean;
  design_avoided_over_under_engineering: boolean;
  design_diagram_provided: boolean;
  design_discussed_cost_implications: boolean;

  // Deep Dive
  deep_dive_explained_tradeoffs: boolean;
  deep_dive_considered_alternative_solutions: boolean;
  deep_dive_used_specifics_not_buzzwords: boolean;
  deep_dive_demonstrated_conceptual_depth: boolean;
  deep_dive_did_back_of_envelope_calculations: boolean;
  deep_dive_addressed_edge_cases: boolean;
  deep_dive_covered_consistency_vs_availability: boolean;
  deep_dive_focused_on_relevant_failures: boolean;

  // Interaction Quality
  interaction_explained_thought_process: boolean;
  interaction_engaged_dialog_not_monologue: boolean;
  interaction_reacted_to_hints: boolean;
  interaction_communicated_clearly: boolean;
  interaction_time_management_good: boolean;
  interaction_did_not_get_lost_in_details: boolean;
  interaction_did_not_use_one_size_template: boolean;
  interaction_honest_about_unknowns: boolean;

  // Conclusion
  conclusion_validated_design_against_requirements: boolean;
  conclusion_summarized_solution: boolean;
  conclusion_closed_loop_with_interviewer: boolean;
};
