"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchAllQuestionsQuery } from "@/lib/queries/questions";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Page() {
  const client = useSupabaseBrowserClient();

  const { data: questions, error } = useAuthenticatedQuery(
    fetchAllQuestionsQuery(client)
  );

  return <pre>{JSON.stringify(questions, null, 2)}</pre>;
}
