import type { TablesInsert, TablesUpdate } from "@/lib/database.types";
import type { TypedSupabaseClient } from "@/lib/types";
import { logger } from "@sentry/nextjs";

export function fetchAllSolutionsQuery(client: TypedSupabaseClient) {
  return client.from("solutions").select("*").throwOnError();
}

export function fetchSolutionsByUserId(
  client: TypedSupabaseClient,
  userId: string
) {
  return client
    .from("solutions")
    .select("*")
    .eq("user_id", userId)
    .throwOnError();
}

export function fetchSolutionById(client: TypedSupabaseClient, id: string) {
  logger.info("Fetching solution by id", { id });
  return client
    .from("solutions")
    .select("*")
    .eq("id", id)
    .throwOnError()
    .single();
}

export function findSolutionByProblemId(
  client: TypedSupabaseClient,
  problemId: string,
  userId: string
) {
  return client
    .from("solutions")
    .select("*")
    .match({ problem_id: problemId, user_id: userId })
    .throwOnError()
    .maybeSingle();
}

export function createSolution(
  client: TypedSupabaseClient,
  solution: TablesInsert<"solutions">
) {
  return client
    .from("solutions")
    .insert(solution)
    .select()
    .throwOnError()
    .single();
}

export function updateSolution(
  client: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<"solutions">
) {
  return client
    .from("solutions")
    .update(updates)
    .eq("id", id)
    .select()
    .throwOnError()
    .single();
}

export function deleteSolution(client: TypedSupabaseClient, id: string) {
  return client.from("solutions").delete().eq("id", id).throwOnError();
}
