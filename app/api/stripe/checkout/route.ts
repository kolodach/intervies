import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getOrCreateStripeCustomer, createCheckoutSession } from "@/lib/stripe";
import { getOrCreateUserPlan } from "@/lib/user-utils";
import { captureError } from "@/lib/observability";

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    const user = await currentUser();

    if (!clerkUserId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Ensure user has a plan record (creates if needed)
    const { error: planError } = await getOrCreateUserPlan(clerkUserId);
    if (planError) {
      console.error(
        "[STRIPE CHECKOUT] Failed to get/create user plan:",
        planError
      );
      return NextResponse.json(
        { error: "Failed to initialize user plan" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer (always before checkout)
    const stripeCustomerId = await getOrCreateStripeCustomer(
      clerkUserId,
      email
    );

    // Get the price ID from environment
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price not configured" },
        { status: 500 }
      );
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${baseUrl}/api/stripe/success`,
      `${baseUrl}/app/subscription?canceled=true`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[STRIPE CHECKOUT] Error:", error);
    captureError(error as Error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
