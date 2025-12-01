import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchSolutionById } from "@/lib/queries/solutions";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/observability";

export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/api/v1/solutions/[id]/conclude">
) {
  const solutionId = (await params).id;

  try {
    const supabase = await createServerSupabaseClient();

    // Fetch the solution
    const { data: solution, error: solutionError } = await fetchSolutionById(
      supabase,
      solutionId
    );

    if (solutionError || !solution) {
      logger.error({ solutionId, solutionError }, "Solution not found");
      return NextResponse.json(
        { error: "Solution not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: solution.status,
      evaluation: solution.evaluation,
      evaluated_at: solution.evaluated_at,
    });
  } catch (error) {
    logger.error({ solutionId, error }, "Failed to fetch evaluation");
    captureError(error as Error);
    return NextResponse.json(
      { error: "Failed to fetch evaluation" },
      { status: 500 }
    );
  }
}
