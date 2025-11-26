"use client";

import { fetchAllProblemsQuery } from "@/lib/queries/problems";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";

export default function Page() {
  const supabase = useSupabaseBrowserClient();
  const { user } = useUser();
  const { data: problems, error } = useQuery(fetchAllProblemsQuery(supabase), {
    enabled: !!user,
  });

  return <pre>{JSON.stringify(problems, null, 2)}</pre>;
}
