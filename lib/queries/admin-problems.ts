import type { TypedSupabaseClient } from "@/lib/types";
import { TablesInsert, TablesUpdate } from "@/lib/database.types";

export function fetchAllProblemsAdminQuery(client: TypedSupabaseClient) {
  return client
    .from("problems")
    .select("*")
    .order("created_at", { ascending: false })
    .throwOnError();
}

export function fetchProblemByIdAdminQuery(
  client: TypedSupabaseClient,
  id: string
) {
  return client
    .from("problems")
    .select("*")
    .eq("id", id)
    .throwOnError()
    .single();
}

export async function createProblemAdmin(
  client: TypedSupabaseClient,
  problem: TablesInsert<"problems">
) {
  return client.from("problems").insert(problem).select().single();
}

export async function updateProblemAdmin(
  client: TypedSupabaseClient,
  id: string,
  problem: TablesUpdate<"problems">
) {
  return client.from("problems").update(problem).eq("id", id).select().single();
}

export async function deleteProblemAdmin(
  client: TypedSupabaseClient,
  id: string
) {
  // Soft delete: set is_active to false instead of actually deleting
  return client
    .from("problems")
    .update({ is_active: false })
    .eq("id", id)
    .select()
    .single();
}

export async function toggleProblemActiveAdmin(
  client: TypedSupabaseClient,
  id: string,
  isActive: boolean
) {
  return client
    .from("problems")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();
}

