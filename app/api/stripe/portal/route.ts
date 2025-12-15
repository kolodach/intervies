import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createBillingPortalSession } from "@/lib/stripe";
import { getUserPlan } from "@/lib/user-utils";
import { captureError } from "@/lib/observability";

export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's plan
    const { plan: userPlan, error: planError } = await getUserPlan(clerkUserId);

    if (planError || !userPlan?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createBillingPortalSession(
      userPlan.stripe_customer_id,
      `${baseUrl}/app/subscription`
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[STRIPE PORTAL] Error:", error);
    captureError(error as Error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
