"use client";

import { fetchProblemById } from "@/lib/queries/problems";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";

export function ProblemDetails({ id }: { id: string }) {
  const supabase = useSupabaseBrowserClient();
  const { data: problem, error } = useQuery(fetchProblemById(supabase, id));

  return <div>{JSON.stringify(problem, null, 2)}</div>;
}
