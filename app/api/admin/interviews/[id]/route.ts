import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: interviewId } = await params;

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

    // Fetch the interview (solution)
    const { data: interview, error: interviewError } = await supabase
      .from("solutions")
      .select("*")
      .eq("id", interviewId)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Get problem info
    const { data: problem } = await supabase
      .from("problems")
      .select("id, title, description, difficulty")
      .eq("id", interview.problem_id)
      .single();

    // Get user info
    const { data: user } = await supabase
      .from("users")
      .select("id, name, email, image")
      .eq("id", interview.user_id)
      .single();

    return NextResponse.json({
      interview,
      problem,
      user,
    });
  } catch (error) {
    console.error("Admin interview details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

