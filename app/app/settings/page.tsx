"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsageLimits } from "@/lib/hooks/use-usage-limits";
import {
  Activity,
  Calendar,
  Crown,
  Loader2,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SettingsPage() {
  const {
    isPro,
    interviewCount,
    interviewLimit,
    usagePercentage,
    usageLimitReached,
    currentPeriodEnd,
    isLoading,
    refetch,
  } = useUsageLimits();

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            title="Refresh usage data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Usage Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Usage</h2>
            </div>
            {isPro ? (
              <Badge
                variant="outline"
                className="text-amber-600 border-amber-600"
              >
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-gray-600 border-gray-600"
              >
                Free
              </Badge>
            )}
          </div>

          {isPro ? (
            // Pro user usage display
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Monthly AI Usage
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      usageLimitReached && "text-orange-600"
                    )}
                  >
                    {usagePercentage}% used
                  </span>
                </div>
                <Progress
                  value={usagePercentage}
                  className={cn(
                    "h-3",
                    usageLimitReached && "[&>div]:bg-orange-500"
                  )}
                />
              </div>

              {usageLimitReached && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  You&apos;ve reached your monthly usage limit. Chat is
                  temporarily disabled.
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                <Calendar className="w-4 h-4" />
                <span>Resets on {formatDate(currentPeriodEnd)}</span>
              </div>
            </div>
          ) : (
            // Free user usage display
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Interviews Used</span>
                  <span className="font-medium">
                    {interviewCount} / {interviewLimit}
                  </span>
                </div>
                <Progress
                  value={(interviewCount / interviewLimit) * 100}
                  className="h-3"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>
                  {interviewCount >= interviewLimit
                    ? "You've used all free interviews"
                    : `${interviewLimit - interviewCount} free interview${
                        interviewLimit - interviewCount === 1 ? "" : "s"
                      } remaining`}
                </span>
              </div>

              <div className="pt-2">
                <Link href="/app/subscription">
                  <Button variant="outline" className="w-full">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Links */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/app/subscription">
              <Button variant="ghost" className="w-full justify-start">
                <Crown className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
