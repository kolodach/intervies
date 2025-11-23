'use client'

import { fetchAllQuestionsQuery } from "@/lib/queries/questions";
import useSupabaseBrowser from "@/lib/supabase/client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";

export default function Page() {
  const client = useSupabaseBrowser()
  const { data: questions, error } = useQuery(fetchAllQuestionsQuery(client))
  return (
    <div>{JSON.stringify(questions, null, 2)}</div>
  );
}
