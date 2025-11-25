"use client";

import Chat from "@/components/chat";
import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchSolutionById } from "@/lib/queries/solutions";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useParams } from "next/navigation";

export default function Page() {
  const { id } = useParams();
  const user = useUser();
  const supabase = useSupabaseBrowserClient();
  const {
    data: solution,
    error,
    isLoading,
  } = useQuery(fetchSolutionById(supabase, id as string), {
    enabled: !!user,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (!solution) {
    return <div>Solution not found</div>;
  }

  return (
    <div className="grid grid-cols-[400px_1fr] h-full">
      <div className="border-r h-full p-2 min-h-0">
        <Chat solution={solution} />
      </div>
      <div className="h-full">
        <div className="w-full h-full flex items-center justify-center">
          Board goes here
        </div>
      </div>
    </div>
  );
}
