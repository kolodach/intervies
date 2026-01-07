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
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (userError || !currentUser?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all users with their subscription status
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        image,
        is_admin,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (usersError) {
      throw usersError;
    }

    // Get subscription status for each user
    const { data: plans } = await supabase
      .from("user_plans")
      .select("user_id, status");

    const plansByUser: Record<string, string> = {};
    plans?.forEach((p) => {
      plansByUser[p.user_id] = p.status;
    });

    // Get solution counts per user
    const { data: solutions } = await supabase
      .from("solutions")
      .select("user_id");

    const solutionCounts: Record<string, number> = {};
    solutions?.forEach((s) => {
      solutionCounts[s.user_id] = (solutionCounts[s.user_id] || 0) + 1;
    });

    // Get AI usage cost per user
    const { data: usageEvents } = await supabase
      .from("ai_usage_events")
      .select("user_id, total_cost_usd");

    const costByUser: Record<string, number> = {};
    usageEvents?.forEach((e) => {
      costByUser[e.user_id] = (costByUser[e.user_id] || 0) + (e.total_cost_usd || 0);
    });

    const enrichedUsers = users?.map((user) => ({
      ...user,
      subscription_status: plansByUser[user.id] || "none",
      interview_count: solutionCounts[user.id] || 0,
      total_cost: costByUser[user.id] || 0,
    }));

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

