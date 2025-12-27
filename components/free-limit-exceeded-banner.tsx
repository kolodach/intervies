"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function FreeLimitExceededBanner() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertTitle className="text-red-800 dark:text-red-200">
        Free Plan Limit Exceeded
      </AlertTitle>
      <AlertDescription className="text-red-700 dark:text-red-300">
        <p className="mb-3">
          Your subscription has ended. Subscribe to continue this interview.
        </p>
        <Button
          onClick={handleSubscribe}
          disabled={isLoading}
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Subscribe Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
