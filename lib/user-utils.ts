import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Get or create a user plan record by Clerk user ID.
 * Uses the authenticated server client (user's JWT token).
 */
export async function getOrCreateUserPlan(clerkUserId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    // Try to get existing plan
    const { data: existingPlan, error: findError } = await supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", clerkUserId)
      .maybeSingle();

    if (findError) {
      console.error("[USER UTILS] Error finding plan:", findError);
      return { plan: null, error: findError };
    }

    if (existingPlan) {
      return { plan: existingPlan, error: null };
    }

    // Create new plan
    const { data: newPlan, error: createError } = await supabase
      .from("user_plans")
      .insert({
        user_id: clerkUserId,
        status: "none",
      })
      .select()
      .single();

    if (createError) {
      // If duplicate key error, try to fetch again (race condition)
      if (createError.code === "23505") {
        const { data: retryPlan, error: retryError } = await supabase
          .from("user_plans")
          .select("*")
          .eq("user_id", clerkUserId)
          .single();
        return { plan: retryPlan, error: retryError };
      }
      console.error("[USER UTILS] Error creating plan:", createError);
      return { plan: null, error: createError };
    }

    return { plan: newPlan, error: null };
  } catch (error) {
    console.error("[USER UTILS] Unexpected error:", error);
    return { plan: null, error: error as Error };
  }
}

/**
 * Get user plan by Clerk user ID.
 */
export async function getUserPlan(clerkUserId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", clerkUserId)
      .maybeSingle();

    if (error) {
      console.error("[USER UTILS] Error getting plan:", error);
      return { plan: null, error };
    }

    return { plan: data, error: null };
  } catch (error) {
    console.error("[USER UTILS] Unexpected error getting plan:", error);
    return { plan: null, error: error as Error };
  }
}
