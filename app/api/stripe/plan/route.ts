import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getUserPlan } from "@/lib/user-utils";
import { captureError } from "@/lib/observability";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's plan
    const { plan: userPlan, error: planError } = await getUserPlan(
      session.user.id
    );

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
