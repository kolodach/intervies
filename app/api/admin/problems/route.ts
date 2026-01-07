import { auth } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import {
  fetchAllProblemsAdminQuery,
  createProblemAdmin,
} from "@/lib/queries/admin-problems";
import { NextResponse } from "next/server";
import { z } from "zod";

// Schema for problem validation
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

const problemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  categories: z.array(z.string()).min(1, "At least one category is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  sample_requirements: z
    .array(z.string())
    .min(1, "At least one sample requirement is required"),
  is_active: z.boolean().optional().default(true),
  requirements: requirementsSchema,
  evaluation_criteria: z
    .array(evaluationCriterionSchema)
    .min(1, "At least one evaluation criterion is required"),
});

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

