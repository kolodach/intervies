import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleSupabaseClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch credits from AI Gateway
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI Gateway API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch AI Gateway credits" },
        { status: response.status }
      );
    }

    const credits = await response.json();

    return NextResponse.json({
      balance: credits.balance,
      totalUsed: credits.total_used,
    });
  } catch (error) {
    console.error("AI Gateway credits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

