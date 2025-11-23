"use client";

import { Database } from "@/lib/database.types";
import { fetchAllQuestionsQuery } from "@/lib/queries/questions";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSession, useUser } from "@clerk/nextjs";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { createClient } from "@supabase/supabase-js";

export default function Page() {
  const { user } = useUser();
  const client = useSupabaseBrowserClient();

  const { data: questions, error } = useQuery(fetchAllQuestionsQuery(client), {
    enabled: !!user,
  });

  return <div>{JSON.stringify(questions, null, 2)}</div>;
}
