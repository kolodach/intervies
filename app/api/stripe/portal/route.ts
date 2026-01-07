import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createBillingPortalSession } from "@/lib/stripe";
import { getUserPlan } from "@/lib/user-utils";
import { captureError } from "@/lib/observability";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's plan
    const { plan: userPlan, error: planError } = await getUserPlan(
      session.user.id
    );

    if (planError || !userPlan?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Create billing portal session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const portalSession = await createBillingPortalSession(
      userPlan.stripe_customer_id,
      `${baseUrl}/app/settings`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[STRIPE PORTAL] Error:", error);
    captureError(error as Error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
