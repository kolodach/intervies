import { z } from "zod";

// Constants for usage limits
export const FREE_INTERVIEW_LIMIT = 2;
export const PRO_MONTHLY_USAGE_LIMIT_USD = 15;

// API Response schema
export const usageResponseSchema = z.object({
  isPro: z.boolean(),
  interviewCount: z.number(),
  interviewLimit: z.number(),
  canStartInterview: z.boolean(),
  usagePercentage: z.number().min(0).max(100),
  usageLimitReached: z.boolean(),
  freeLimitExceeded: z.boolean(),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
});

export type UsageResponse = z.infer<typeof usageResponseSchema>;

// Error codes for chat API
export const USAGE_ERROR_CODES = {
  FREE_LIMIT_EXCEEDED: "FREE_LIMIT_EXCEEDED",
  USAGE_LIMIT_REACHED: "USAGE_LIMIT_REACHED",
} as const;

export type UsageErrorCode =
  (typeof USAGE_ERROR_CODES)[keyof typeof USAGE_ERROR_CODES];
