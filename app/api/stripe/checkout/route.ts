import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getOrCreateStripeCustomer, createCheckoutSession } from "@/lib/stripe";
import { getOrCreateUserPlan } from "@/lib/user-utils";
import { captureError } from "@/lib/observability";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;

    // Ensure user has a plan record (creates if needed)
    const { error: planError } = await getOrCreateUserPlan(userId);
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
    const stripeCustomerId = await getOrCreateStripeCustomer(userId, email);

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
    const checkoutSession = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${baseUrl}/api/stripe/success`,
      `${baseUrl}/app/subscription?canceled=true`
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE CHECKOUT] Error:", error);
    captureError(error as Error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
