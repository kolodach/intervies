import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service";
import { fetchSolutionById, updateSolution } from "@/lib/queries/solutions";
import { fetchProblemById } from "@/lib/queries/problems";
import { evaluateInterview } from "@/lib/evaluation/evaluators";
import { logger } from "@/lib/logger";
import {
  captureError,
  captureEvaluationSuccess,
  captureEvaluationFailure,
} from "@/lib/observability";
import type { EvaluationChecklist } from "@/lib/types";
import type { NextApiRequest } from "next";
import type { Json } from "@/lib/database.types";
import { generateId, type UIMessage } from "ai";

export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/v1/solutions/[id]/conclude">
) {
  logger.info({ params }, "Params");
  const solutionId = (await params).id;

  if (!solutionId || typeof solutionId !== "string") {
    logger.error({ solutionId }, "Solution ID is required");
    captureError(new Error("Invalid solution ID"));
    return NextResponse.json({ error: "Invalid solution ID" }, { status: 400 });
  }

  try {
    logger.info({ solutionId }, "Concluding interview");

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

    // Check if already concluded
    if (solution.status === "completed" || solution.status === "evaluating") {
      logger.warn({ solutionId, status: solution.status }, "Already concluded");
      return NextResponse.json(
        { error: "Interview already concluded" },
        { status: 400 }
      );
    }

    // Update status to evaluating
    const { error: updateError } = await updateSolution(supabase, solutionId, {
      status: "evaluating",
      concluded_at: new Date().toISOString(),
    });
    logger.info({ updateError }, "Update error");

    if (updateError) {
      // Check if it's a column doesn't exist error
      if (
        updateError.code === "22P02" ||
        updateError.message?.includes("column")
      ) {
        logger.error(
          { solutionId, updateError },
          "Database migration not applied. Please run: supabase migration up"
        );
        return NextResponse.json(
          {
            error:
              "Database migration required. Please run: supabase migration up",
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      logger.error(
        { solutionId, updateError },
        "Failed to update solution status"
      );
      return NextResponse.json(
        {
          error: "Failed to update solution status",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    logger.info({ solutionId }, "Status updated to evaluating");

    // Trigger evaluation asynchronously (don't await)
    runEvaluation(solutionId).catch((error) => {
      logger.error({ solutionId, error }, "Evaluation job failed");
      captureError(error);
    });

    return NextResponse.json({
      success: true,
      message: "Interview concluded. Evaluation in progress.",
    });
  } catch (error) {
    logger.error({ solutionId, error }, "Failed to conclude interview");
    captureError(error as Error);
    return NextResponse.json(
      { error: "Failed to conclude interview" },
      { status: 500 }
    );
  }
}

// Async evaluation function
async function runEvaluation(solutionId: string) {
  // Use service role client for background jobs - doesn't expire like JWT tokens
  const supabase = await createServerSupabaseClient();
  const evaluationStartTime = Date.now();

  try {
    // Fetch solution with all data
    const { data: solution, error: solutionError } = await fetchSolutionById(
      supabase,
      solutionId
    );

    if (solutionError || !solution) {
      throw new Error("Solution not found");
    }

    // Fetch problem
    const { data: problem, error: problemError } = await fetchProblemById(
      supabase,
      solution.problem_id
    );

    if (problemError || !problem) {
      throw new Error("Problem not found");
    }

    // Extract data
    const conversation = solution.conversation;
    const boardState = solution.board_state;
    const checklist = solution.evaluation_checklist as EvaluationChecklist;

    // Run evaluation
    const evaluation = await evaluateInterview(
      solutionId,
      conversation,
      boardState,
      checklist,
      problem
    );

    const evaluationMessage = {
      id: generateId(),
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "EVALUATION_RESULT",
        },
      ],
      metadata: {
        evaluation: evaluation as Json,
      },
    } as UIMessage;

    // Save evaluation
    await updateSolution(supabase, solutionId, {
      status: "completed",
      evaluation: evaluation,
      conversation: [
        ...(conversation as Json[]),
        evaluationMessage as unknown as Json,
      ],
      evaluated_at: new Date().toISOString(),
    });

    const evaluationDuration = Date.now() - evaluationStartTime;
    captureEvaluationSuccess(evaluationDuration);

    logger.info(
      { solutionId, duration: evaluationDuration },
      "Evaluation completed and saved"
    );
  } catch (error) {
    const evaluationDuration = Date.now() - evaluationStartTime;
    captureEvaluationFailure();

    logger.error(
      { solutionId, error, duration: evaluationDuration },
      "Evaluation failed"
    );

    // Update status to failed
    await updateSolution(supabase, solutionId, {
      status: "evaluation_failed",
    });

    throw error;
  }
}
