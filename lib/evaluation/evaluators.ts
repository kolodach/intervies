import { openai } from "@ai-sdk/openai";
import {
  InterviewEvaluationSchema,
  FinalEvaluationSchema,
  type InterviewEvaluation,
  type FinalEvaluation,
} from "./schemas";
import { COMPREHENSIVE_EVALUATOR_PROMPT, SUMMARIZER_PROMPT } from "./prompts";
import { logger } from "@/lib/logger";
import type { EvaluationChecklist, Problem } from "@/lib/types";
import { generateObject } from "ai";
import type { Json } from "../database.types";

export async function runComprehensiveEvaluation(
  conversation: Json,
  boardState: Json,
  checklist: EvaluationChecklist,
  problem: Problem
): Promise<InterviewEvaluation> {
  logger.info("Running comprehensive evaluation");

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-2024-08-06"),
      messages: [
        {
          role: "system",
          content: COMPREHENSIVE_EVALUATOR_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify({
            conversation,
            boardState,
            checklist,
            problem: {
              title: problem.title,
              description: problem.description,
              requirements: problem.requirements,
            },
          }),
        },
      ],
      schema: InterviewEvaluationSchema,
    });

    const evaluation = object;

    logger.info("Comprehensive evaluation completed");
    return evaluation;
  } catch (error) {
    logger.error(error, "Comprehensive evaluation failed");
    throw new Error("Failed to generate comprehensive evaluation");
  }
}

export async function generateFinalEvaluation(
  evaluation1: InterviewEvaluation,
  evaluation2: InterviewEvaluation,
  checklist: EvaluationChecklist,
  problem: Problem
): Promise<FinalEvaluation> {
  logger.info("Starting final evaluation summary");

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-2024-08-06"),
      messages: [
        {
          role: "system",
          content: SUMMARIZER_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify({
            evaluation1,
            evaluation2,
            checklist,
            problem: {
              title: problem.title,
              description: problem.description,
            },
          }),
        },
      ],
      schema: FinalEvaluationSchema,
    });

    const evaluation = object;

    logger.info("Final evaluation completed");
    return evaluation;
  } catch (error) {
    logger.error(error, "Final evaluation failed");
    throw new Error("Failed to generate final evaluation");
  }
}

// Main orchestrator function - runs SAME evaluation twice for consistency
export async function evaluateInterview(
  solutionId: string,
  conversation: Json,
  boardState: Json,
  checklist: EvaluationChecklist,
  problem: Problem
): Promise<FinalEvaluation> {
  logger.info({ solutionId }, "Starting interview evaluation");

  try {
    // Run the SAME comprehensive evaluation TWICE in parallel for consistency
    logger.info({ solutionId }, "Running dual evaluations for consistency");

    const [evaluation1, evaluation2] = await Promise.all([
      runComprehensiveEvaluation(conversation, boardState, checklist, problem),
      runComprehensiveEvaluation(conversation, boardState, checklist, problem),
    ]);

    logger.info(
      { solutionId },
      "Both evaluations completed, generating summary"
    );

    // Summarizer averages/merges the two evaluations
    const finalEvaluation = await generateFinalEvaluation(
      evaluation1,
      evaluation2,
      checklist,
      problem
    );

    logger.info({ solutionId }, "Interview evaluation completed successfully");
    return finalEvaluation;
  } catch (error) {
    logger.error({ solutionId, error }, "Interview evaluation failed");
    throw error;
  }
}
