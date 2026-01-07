import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import {
  fetchProblemByIdAdminQuery,
  updateProblemAdmin,
  deleteProblemAdmin,
} from "@/lib/queries/admin-problems";
import { NextResponse } from "next/server";
import { updateProblemSchema } from "@/lib/schemas/problem";

// GET /api/admin/problems/[id] - Get a single problem
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await fetchProblemByIdAdminQuery(supabase, id);

    if (error) {
      console.error("Error fetching problem:", error);
      return NextResponse.json(
        { error: "Failed to fetch problem" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/admin/problems/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/problems/[id] - Update a problem
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateProblemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await updateProblemAdmin(
      supabase,
      id,
      validationResult.data
    );

    if (error) {
      console.error("Error updating problem:", error);
      return NextResponse.json(
        { error: "Failed to update problem" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/admin/problems/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/problems/[id] - Delete a problem
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const supabase = createServiceRoleSupabaseClient();
    const { error } = await deleteProblemAdmin(supabase, id);

    if (error) {
      console.error("Error deleting problem:", error);
      return NextResponse.json(
        { error: "Failed to delete problem" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/problems/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

