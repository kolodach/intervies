import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;

    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleSupabaseClient();

    // Check if current user is admin
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (userError || !currentUser?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent admin from removing their own admin status
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot modify your own admin status" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { is_admin } = body;

    if (typeof is_admin !== "boolean") {
      return NextResponse.json(
        { error: "is_admin must be a boolean" },
        { status: 400 }
      );
    }

    // Update user admin status
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ is_admin })
      .eq("id", targetUserId)
      .select("id, name, email, is_admin")
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

