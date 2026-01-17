import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type SolutionState =
  | "GREETING"
  | "REQUIREMENTS"
  | "DESIGNING"
  | "CONCLUSION";
export const SolutionStates: SolutionState[] = [
  "GREETING",
  "REQUIREMENTS",
  "DESIGNING",
  "CONCLUSION",
];

export type TypedSupabaseClient = SupabaseClient<Database>;

export type Problem = Database["public"]["Tables"]["problems"]["Row"];
export type Solution = Database["public"]["Tables"]["solutions"]["Row"];

export type ProblemRequirements = {
  functional: string[];
  non_functional: string[];
  out_of_scope?: string[];
};

import type { CriterionKey } from "@/lib/evaluation/criteria";

/**
 * Evaluation checklist tracks which criteria have been observed during the interview.
 * Keys correspond to CriterionKey from criteria.ts.
 */
export type EvaluationChecklist = Record<CriterionKey, boolean>;
