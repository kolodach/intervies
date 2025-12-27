import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  FREE_INTERVIEW_LIMIT,
  PRO_MONTHLY_USAGE_LIMIT_USD,
  USAGE_ERROR_CODES,
  type UsageErrorCode,
} from "@/lib/schemas/usage";

export interface UsageCheckResult {
  allowed: boolean;
  reason?: UsageErrorCode;
  isPro: boolean;
  interviewCount: number;
  usagePercentage: number;
}

/**
 * Check if a user can send messages in the chat.
 * This is used by both the chat API for server-side validation
 * and can inform the frontend.
 *
 * @param userId - Clerk user ID
 * @returns UsageCheckResult with allowed status and reason if blocked
 */
export async function checkCanSendMessage(
  userId: string
): Promise<UsageCheckResult> {
  const supabase = await createServerSupabaseClient();

  // Fetch user plan
  const { data: userPlan, error: planError } = await supabase
    .from("user_plans")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (planError) {
    throw planError;
  }

  const isPro = userPlan?.status === "active";
  const currentPeriodStart = userPlan?.current_period_start ?? null;

  // Fetch interview count
  const { count: interviewCount, error: countError } = await supabase
    .from("solutions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) {
    throw countError;
  }

  const count = interviewCount ?? 0;

  // For free users: check if they've exceeded the interview limit
  if (!isPro) {
    const freeLimitExceeded = count > FREE_INTERVIEW_LIMIT;
    return {
      allowed: !freeLimitExceeded,
      reason: freeLimitExceeded
        ? USAGE_ERROR_CODES.FREE_LIMIT_EXCEEDED
        : undefined,
      isPro,
      interviewCount: count,
      usagePercentage: 0,
    };
  }

  // For pro users: check usage limit
  let usagePercentage = 0;
  let usageLimitReached = false;

  if (currentPeriodStart) {
    const { data: usageData, error: usageError } = await supabase
      .from("ai_usage_events")
      .select("total_cost_usd")
      .eq("user_id", userId)
      .gte("timestamp", currentPeriodStart);

    if (usageError) {
      throw usageError;
    }

    const totalCostUsd =
      usageData?.reduce(
        (sum, event) => sum + Number(event.total_cost_usd),
        0
      ) ?? 0;

    usagePercentage = Math.min(
      Math.round((totalCostUsd / PRO_MONTHLY_USAGE_LIMIT_USD) * 100),
      100
    );
    usageLimitReached = totalCostUsd >= PRO_MONTHLY_USAGE_LIMIT_USD;
  }

  return {
    allowed: !usageLimitReached,
    reason: usageLimitReached
      ? USAGE_ERROR_CODES.USAGE_LIMIT_REACHED
      : undefined,
    isPro,
    interviewCount: count,
    usagePercentage,
  };
}
