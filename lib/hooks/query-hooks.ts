import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import {
  useQuery,
  type UseQueryReturn,
} from "@supabase-cache-helpers/postgrest-react-query";
import type { PostgrestError, PostgrestResponse } from "@supabase/supabase-js";
import type { UseQueryOptions } from "@tanstack/react-query";

/**
 * Custom hook for running a PostgREST query only when the user is authenticated.
 * Required to make Clerk and Supabase work together.
 * @param query - The query to run.
 * @param config - The configuration for the query.
 * @returns The query result.
 */
export function useAuthenticatedQuery<Result>(
  query: PromiseLike<PostgrestResponse<Result>>,
  config?: Omit<
    UseQueryOptions<PostgrestResponse<Result>, PostgrestError>,
    "queryKey" | "queryFn"
  >
): UseQueryReturn<Result> {
  const { user } = useUser();
  const client = useSupabaseBrowserClient();

  return useQuery<Result>(query, {
    enabled: !!user,
    ...config,
  });
}
