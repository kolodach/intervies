import type { TablesInsert, TablesUpdate } from "@/lib/database.types";
import type { TypedSupabaseClient } from "@/lib/types";

export function fetchAllInterviewsQuery(client: TypedSupabaseClient) {
  return client.from("interviews").select("*").throwOnError();
}

export function fetchInterviewById(client: TypedSupabaseClient, id: string) {
  return client
    .from("interviews")
    .select("*")
    .eq("id", id)
    .throwOnError()
    .single();
}

export function findInterviewByQuestionId(
  client: TypedSupabaseClient,
  questionId: string,
  userId: string
) {
  return client
    .from("interviews")
    .select("*")
    .match({ question_id: questionId, user_id: userId })
    .throwOnError()
    .maybeSingle();
}

export function createInterview(
  client: TypedSupabaseClient,
  interview: TablesInsert<"interviews">
) {
  return client
    .from("interviews")
    .insert(interview)
    .select()
    .throwOnError()
    .single();
}

export function updateInterview(
  client: TypedSupabaseClient,
  id: string,
  updates: TablesUpdate<"interviews">
) {
  return client
    .from("interviews")
    .update(updates)
    .eq("id", id)
    .select()
    .throwOnError()
    .single();
}

export function deleteInterview(client: TypedSupabaseClient, id: string) {
  return client.from("interviews").delete().eq("id", id).throwOnError();
}
