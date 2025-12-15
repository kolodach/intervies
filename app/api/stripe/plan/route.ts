import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/user-utils";
import { captureError } from "@/lib/observability";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's plan
    const { plan: userPlan, error: planError } = await getUserPlan(clerkUserId);

    if (planError) {
      throw planError;
    }

    return NextResponse.json({ plan: userPlan ?? null });
  } catch (error) {
    console.error("[STRIPE PLAN] Error:", error);
    captureError(error as Error);
    return NextResponse.json(
      { error: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}
