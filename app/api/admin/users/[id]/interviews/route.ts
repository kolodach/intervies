import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

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

    // Get user info
    const { data: user, error: targetUserError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (targetUserError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch interviews (solutions) for this user
    const { data: interviews, error: interviewsError } = await supabase
      .from("solutions")
      .select(`
        id,
        title,
        status,
        state,
        created_at,
        concluded_at,
        problem_id
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (interviewsError) {
      throw interviewsError;
    }

    // Get problem titles
    const problemIds = [...new Set(interviews?.map((i) => i.problem_id) || [])];
    const { data: problems } = await supabase
      .from("problems")
      .select("id, title")
      .in("id", problemIds);

    const problemsMap: Record<string, string> = {};
    problems?.forEach((p) => {
      problemsMap[p.id] = p.title;
    });

    const enrichedInterviews = interviews?.map((interview) => ({
      ...interview,
      problem_title: problemsMap[interview.problem_id] || "Unknown Problem",
    }));

    return NextResponse.json({
      user,
      interviews: enrichedInterviews,
    });
  } catch (error) {
    console.error("Admin user interviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

