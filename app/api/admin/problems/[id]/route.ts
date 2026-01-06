import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import {
  fetchProblemByIdAdminQuery,
  updateProblemAdmin,
  deleteProblemAdmin,
} from "@/lib/queries/admin-problems";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for problem validation (partial for updates)
const evaluationCriterionSchema = z.object({
  dimension: z.string(),
  description: z.string(),
  weight: z.number(),
});

const requirementsSchema = z.object({
  functional: z.array(z.string()),
  non_functional: z.array(z.string()),
  constraints: z.array(z.string()),
  out_of_scope: z.array(z.string()),
});

const updateProblemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  categories: z.array(z.string()).min(1).optional(),
  tags: z.array(z.string()).min(1).optional(),
  sample_requirements: z.array(z.string()).min(1).optional(),
  is_active: z.boolean().optional(),
  requirements: requirementsSchema.optional(),
  evaluation_criteria: z.array(evaluationCriterionSchema).min(1).optional(),
});

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
          details: validationResult.error.errors,
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

