"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface UsageLimitBannerProps {
  currentPeriodEnd: string | null;
}

function formatResetDate(dateString: string | null): string {
  if (!dateString) return "soon";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export function UsageLimitBanner({ currentPeriodEnd }: UsageLimitBannerProps) {
  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-800 dark:text-orange-200">
        Usage Limit Reached
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300">
        You&apos;ve reached your monthly usage limit. Your limit will reset on{" "}
        <span className="font-medium">{formatResetDate(currentPeriodEnd)}</span>
        .
      </AlertDescription>
    </Alert>
  );
}
