import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { prefetchQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchProblemById } from "@/lib/queries/problems";
import { ProblemDetails } from "@/components/problem-details";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const queryClient = new QueryClient();
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  await prefetchQuery(queryClient, fetchProblemById(supabase, id));

  return (
    // Neat! Serialization is now as easy as passing props.
    // HydrationBoundary is a Client Component, so hydration will happen there.
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProblemDetails id={id} />
    </HydrationBoundary>
  );
}
