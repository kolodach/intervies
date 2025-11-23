'use client'

import { fetchQuestionById } from "@/lib/queries/questions";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";

export function QuestionDetails({
  id
}: { id: string }) {
  const supabase = useSupabaseBrowserClient()
  const { data: question, error } = useQuery(fetchQuestionById(supabase, id))

  return (<div>
    {JSON.stringify(question, null, 2)}
  </div>)
}
