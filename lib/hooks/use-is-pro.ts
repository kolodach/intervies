import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSession } from "next-auth/react";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import type { Tables } from "@/lib/database.types";

type UserPlan = Tables<"user_plans">;

/**
 * Hook to check if the current user has an active pro subscription.
 * Returns the subscription status and plan data.
 */
export function useIsPro() {
  const { data: session } = useSession();
  const user = session?.user;
  const supabase = useSupabaseBrowserClient();

  const {
    data: plan,
    isLoading,
    error,
  } = useQuery(
    supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", user?.id ?? "")
      .maybeSingle(),
    {
      enabled: !!user?.id,
    }
  );

  const isPro = plan?.status === "active";

  return {
    isPro: isPro ?? false,
    plan: plan ?? null,
    isLoading,
    error,
  };
}
