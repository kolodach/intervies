"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUsageLimits } from "@/lib/hooks/use-usage-limits";
import {
  Activity,
  Calendar,
  Crown,
  Loader2,
  MessageSquare,
  RefreshCw,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  PartyPopper,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Header } from "@/components/header";

interface UserPlan {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  status: string;
  price_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusBadge(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd && status === "active") {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-600">
        <AlertCircle className="w-3 h-3 mr-1" />
        Canceling
      </Badge>
    );
  }

  switch (status) {
    case "active":
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    case "past_due":
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Past Due
        </Badge>
      );
    case "canceled":
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600">
          <XCircle className="w-3 h-3 mr-1" />
          Canceled
        </Badge>
      );
    case "trialing":
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Crown className="w-3 h-3 mr-1" />
          Trial
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-gray-500 border-gray-500">
          No Subscription
        </Badge>
      );
  }
}

function SettingsPageContent() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== "loading";
  const searchParams = useSearchParams();

  // Usage state
  const {
    isPro,
    interviewCount,
    interviewLimit,
    usagePercentage,
    usageLimitReached,
    currentPeriodEnd,
    isLoading: isLoadingUsage,
    refetch: refetchUsage,
  } = useUsageLimits();

  // Subscription state
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Get status from URL params (from Stripe redirect)
  const isSuccess = searchParams.get("success") === "true";
  const isCanceled = searchParams.get("canceled") === "true";
  const errorParam = searchParams.get("error");

  // Show toast for canceled checkout
  useEffect(() => {
    if (isCanceled) {
      toast.info("Checkout canceled");
    }
  }, [isCanceled]);

  // Fetch subscription data
  const fetchPlan = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/stripe/plan");
      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
      }
    } catch (error) {
      console.error("Failed to fetch plan:", error);
    } finally {
      setLoadingPlan(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isLoaded) {
      fetchPlan();
    }
  }, [user, isLoaded]);

  const handleRefreshAll = async () => {
    setActionLoading(true);
    await Promise.all([fetchPlan(), refetchUsage()]);
    setActionLoading(false);
    toast.success("Data refreshed");
  };

  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      toast.error("Failed to start checkout");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to open billing portal");
      }
    } catch (error) {
      toast.error("Failed to open billing portal");
    } finally {
      setActionLoading(false);
    }
  };

  const hasActiveSubscription =
    plan?.status === "active" || plan?.status === "trialing";
  const isCanceling = plan?.cancel_at_period_end && plan?.status === "active";
  const isPastDue = plan?.status === "past_due";

  if (!isLoaded || loadingPlan || isLoadingUsage) {
    return (
      <>
        <Header>
          <Header.Left>
            <Header.DefaultLeft />
          </Header.Left>
          <Header.Right>
            <Header.NewInterviewButton />
            <Header.DefaultRight />
          </Header.Right>
        </Header>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header>
        <Header.Left>
          <Header.DefaultLeft />
        </Header.Left>
        <Header.Right>
          <Header.NewInterviewButton />
          <Header.DefaultRight />
        </Header.Right>
      </Header>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="w-full h-full flex flex-col items-center p-4">
          <div className="w-full max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Settings</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefreshAll}
                title="Refresh all data"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Success Message */}
            {isSuccess && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  Thank you for subscribing!
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Your subscription is now active. You have full access to all
                  features. We&apos;re excited to have you on board!
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {errorParam && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <AlertTitle className="text-red-800 dark:text-red-200">
                  Something went wrong
                </AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-300">
                  <p className="mb-2">
                    A problem occurred while processing your subscription. Please
                    try again or reach out to our support team for assistance.
                  </p>
                  <a
                    href="mailto:support@example.com"
                    className="inline-flex items-center gap-1 text-red-800 dark:text-red-200 underline hover:no-underline"
                  >
                    <Mail className="w-4 h-4" />
                    Contact Support
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Subscription Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Subscription</h2>
                {getStatusBadge(
                  plan?.status ?? "none",
                  plan?.cancel_at_period_end ?? false
                )}
              </div>

              {hasActiveSubscription ? (
                <div className="space-y-4">
                  {/* Subscription Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {isCanceling ? "Ends" : "Renews"}:{" "}
                        {formatDate(plan?.current_period_end ?? null)}
                      </span>
                    </div>

                    {plan?.payment_method_brand && plan?.payment_method_last4 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CreditCard className="w-4 h-4" />
                        <span className="capitalize">
                          {plan.payment_method_brand} ****
                          {plan.payment_method_last4}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Canceling Warning */}
                  {isCanceling && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-3">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Your subscription is set to cancel at the end of the
                        billing period. You can resubscribe anytime through the
                        billing portal.
                      </p>
                    </div>
                  )}

                  {/* Past Due Warning */}
                  {isPastDue && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Your payment failed. Please update your payment method to
                        continue your subscription.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleManage}
                      disabled={actionLoading}
                    >
                      Manage Subscription
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    You don&apos;t have an active subscription. Subscribe to
                    unlock all features.
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Unlimited practice sessions
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      AI-powered feedback
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Progress tracking
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      All problem categories
                    </li>
                  </ul>

                  {/* Subscribe Button */}
                  <Button
                    onClick={handleSubscribe}
                    disabled={actionLoading}
                    className="w-full md:w-auto"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crown className="w-4 h-4" />
                    )}
                    Subscribe Now
                  </Button>
                </div>
              )}
            </Card>

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
                      <span className="text-muted-foreground">
                        Interviews Used
                      </span>
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

                  {!hasActiveSubscription && (
                    <div className="pt-2">
                      <Button
                        onClick={handleSubscribe}
                        disabled={actionLoading}
                        variant="outline"
                        className="w-full"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Help Section */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Need Help?</h2>
              <p className="text-sm text-muted-foreground">
                If you have any questions about your subscription, usage, or
                billing, please contact our support team. You can manage your
                payment method, view invoices, and cancel your subscription
                through the billing portal.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header>
            <Header.Left>
              <Header.DefaultLeft />
            </Header.Left>
            <Header.Right>
              <Header.NewInterviewButton />
              <Header.DefaultRight />
            </Header.Right>
          </Header>
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
