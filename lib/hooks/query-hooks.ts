import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
import {
  useQuery,
  type UseQueryReturn,
} from "@supabase-cache-helpers/postgrest-react-query";
import type { PostgrestError, PostgrestResponse } from "@supabase/supabase-js";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { TypedSupabaseClient } from "../types";

/**
 * Custom hook for running a PostgREST query only when the user is authenticated.
 * Required to make next-auth and Supabase work together.
 * @param query - The query to run.
 * @param config - The configuration for the query.
 * @returns The query result.
 */
export function useAuthenticatedQuery<Result>(
  query: (client: TypedSupabaseClient) => Promise<PostgrestResponse<Result>>,
  config?: Omit<
    UseQueryOptions<PostgrestResponse<Result>, PostgrestError>,
    "queryKey" | "queryFn"
  >
): UseQueryReturn<Result> {
  const { data: session } = useSession();
  const client = useSupabaseBrowserClient();

  return useQuery<Result>(query(client), {
    enabled: !!session?.user,
    ...config,
  });
}
