"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usageResponseSchema, type UsageResponse } from "@/lib/schemas/usage";

async function fetchUsageLimits(): Promise<UsageResponse> {
  const response = await fetch("/api/usage");

  if (!response.ok) {
    throw new Error("Failed to fetch usage limits");
  }

  const data = await response.json();
  return usageResponseSchema.parse(data);
}

export interface UseUsageLimitsReturn extends UsageResponse {
  isLoading: boolean;
  error: Error | null;
  showPaywall: boolean;
  showUsageBanner: boolean;
  showFreeLimitBanner: boolean;
  refetch: () => void;
}

/**
 * Hook to check user's usage limits and subscription status.
 * - Free users: limited to 2 interviews
 * - Pro users: limited to $15/month AI usage
 */
export function useUsageLimits(): UseUsageLimitsReturn {
  const { data: session } = useSession();
  const user = session?.user;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["usage-limits", user?.id],
    queryFn: fetchUsageLimits,
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30 seconds
  });

  const defaultData: UsageResponse = {
    isPro: false,
    interviewCount: 0,
    interviewLimit: 2,
    canStartInterview: true,
    usagePercentage: 0,
    usageLimitReached: false,
    freeLimitExceeded: false,
    currentPeriodStart: null,
    currentPeriodEnd: null,
  };

  const usageData = data ?? defaultData;

  // Derived states
  // showPaywall: for starting new interviews when at limit
  const showPaywall = !usageData.isPro && !usageData.canStartInterview;
  // showUsageBanner: for pro users who hit their monthly AI usage limit
  const showUsageBanner = usageData.isPro && usageData.usageLimitReached;
  // showFreeLimitBanner: for free users who have more interviews than allowed
  // (e.g., started as pro, canceled subscription)
  const showFreeLimitBanner = usageData.freeLimitExceeded;

  return {
    ...usageData,
    isLoading,
    error: error as Error | null,
    showPaywall,
    showUsageBanner,
    showFreeLimitBanner,
    refetch,
  };
}
