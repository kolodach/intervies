import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { captureError } from "@/lib/observability";
import {
  FREE_INTERVIEW_LIMIT,
  PRO_MONTHLY_USAGE_LIMIT_USD,
  usageResponseSchema,
  type UsageResponse,
} from "@/lib/schemas/usage";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Fetch user plan
    const { data: userPlan, error: planError } = await supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", clerkUserId)
      .maybeSingle();

    if (planError) {
      throw planError;
    }

    const isPro = userPlan?.status === "active";
    const currentPeriodStart = userPlan?.current_period_start ?? null;
    const currentPeriodEnd = userPlan?.current_period_end ?? null;

    // Fetch interview count (solutions created by user)
    const { count: interviewCount, error: countError } = await supabase
      .from("solutions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", clerkUserId);

    if (countError) {
      throw countError;
    }

    // Calculate usage for pro users
    let usagePercentage = 0;
    let usageLimitReached = false;

    if (isPro && currentPeriodStart) {
      // Sum total_cost_usd from ai_usage_events for current billing period
      const { data: usageData, error: usageError } = await supabase
        .from("ai_usage_events")
        .select("total_cost_usd")
        .eq("user_id", clerkUserId)
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

    const count = interviewCount ?? 0;

    // Determine if free user has exceeded interview limit
    // This happens when user had a subscription, started interviews, then canceled
    const freeLimitExceeded = !isPro && count > FREE_INTERVIEW_LIMIT;

    // Determine if user can start a new interview
    const canStartInterview = isPro
      ? !usageLimitReached
      : count < FREE_INTERVIEW_LIMIT;

    const response: UsageResponse = {
      isPro,
      interviewCount: count,
      interviewLimit: FREE_INTERVIEW_LIMIT,
      canStartInterview,
      usagePercentage,
      usageLimitReached,
      freeLimitExceeded,
      currentPeriodStart,
      currentPeriodEnd,
    };

    // Validate response with Zod
    const validated = usageResponseSchema.parse(response);

    return NextResponse.json(validated);
  } catch (error) {
    console.error("[USAGE API] Error:", error);
    captureError(error as Error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
