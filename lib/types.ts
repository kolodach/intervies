import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type InterviewState =
  | "GREETING"
  | "REQUIREMENTS"
  | "DESIGNING"
  | "DEEP_DIVE"
  | "CONCLUSION";
export const InterviewStates: InterviewState[] = [
  "GREETING",
  "REQUIREMENTS",
  "DESIGNING",
  "DEEP_DIVE",
  "CONCLUSION",
];

export type TypedSupabaseClient = SupabaseClient<Database>;

export type Question = Database["public"]["Tables"]["questions"]["Row"];
