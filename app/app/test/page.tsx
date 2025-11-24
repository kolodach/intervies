"use client";

import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchAllProblemsQuery } from "@/lib/queries/problems";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Page() {
  const { data: problems, error } = useAuthenticatedQuery(
    fetchAllProblemsQuery
  );

  return <pre>{JSON.stringify(problems, null, 2)}</pre>;
}
