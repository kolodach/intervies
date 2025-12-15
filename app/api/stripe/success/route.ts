import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncStripeDataToDatabase } from "@/lib/stripe";
import { getUserPlan } from "@/lib/user-utils";
import { captureError } from "@/lib/observability";

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Get user's plan
  const { plan: userPlan, error: planError } = await getUserPlan(clerkUserId);

  if (planError || !userPlan?.stripe_customer_id) {
    console.error("[STRIPE SUCCESS] No Stripe customer found:", planError);
    redirect("/app/subscription?error=no_customer");
  }

  // Sync subscription data from Stripe to database
  // This ensures the user sees their subscription immediately
  // (webhooks might not have arrived yet due to race condition)
  try {
    await syncStripeDataToDatabase(userPlan.stripe_customer_id);
  } catch (error) {
    console.error("[STRIPE SUCCESS] Error syncing:", error);
    captureError(error as Error);
    // Continue to redirect even if sync fails - webhooks will update later
  }

  // Redirect to subscription page
  redirect("/app/subscription?success=true");
}
