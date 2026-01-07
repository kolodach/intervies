import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import {
  fetchAllProblemsAdminQuery,
  createProblemAdmin,
} from "@/lib/queries/admin-problems";
import { NextResponse } from "next/server";
import { problemSchema } from "@/lib/schemas/problem";

// GET /api/admin/problems - List all problems
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await fetchAllProblemsAdminQuery(supabase);

    if (error) {
      console.error("Error fetching problems:", error);
      return NextResponse.json(
        { error: "Failed to fetch problems" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/admin/problems:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/problems - Create a new problem
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = problemSchema.safeParse(body);

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
    const { data, error } = await createProblemAdmin(
      supabase,
      validationResult.data
    );

    if (error) {
      console.error("Error creating problem:", error);
      return NextResponse.json(
        { error: "Failed to create problem" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/problems:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

