"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { capturePaywallShown } from "@/lib/observability";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  "Unlimited practice interviews",
  "AI-powered detailed feedback",
  "Progress tracking & analytics",
  "All problem categories",
];

export function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Track paywall shown metric when modal opens
  if (open) {
    capturePaywallShown();
  }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={true} className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl">
            Unlock Unlimited Interviews
          </DialogTitle>
          <DialogDescription className="text-base">
            You&apos;ve used your 2 free interviews. Subscribe to continue
            practicing and ace your system design interviews.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="sm:flex-col gap-2">
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Subscribe Now
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
