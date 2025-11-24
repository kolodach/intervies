import type { TypedSupabaseClient } from "@/lib/types";

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

