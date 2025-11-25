import type { TypedSupabaseClient } from "@/lib/types";
import { captureError } from "../observability";

export function fetchAllProblemsQuery(client: TypedSupabaseClient) {
  return client.from("problems").select("*").throwOnError();
}

export function fetchProblemById(client: TypedSupabaseClient, id: string) {
  return client
    .from("problems")
    .select("*")
    .eq("id", id)
    .throwOnError()
    .single();
}

export async function fetchProblemBySolutionId(
  client: TypedSupabaseClient,
  solutionId: string
) {
  const { data: solution, error: solutionError } = await client
    .from("solutions")
    .select("problem_id")
    .eq("id", solutionId)
    .throwOnError()
    .maybeSingle();

  if (solutionError || !solution?.problem_id) {
    const error = new Error(
      `Failed to fetch problem by solution id: ${solutionId}`
    );
    captureError(error);
    throw error;
  }

  return await client
    .from("problems")
    .select("*")
    .eq("id", solution.problem_id)
    .throwOnError()
    .single();
}
