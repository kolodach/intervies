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
