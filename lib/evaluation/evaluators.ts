import { openai } from "@ai-sdk/openai";
import {
  EvaluationSchema,
  type Evaluation,
  type FinalEvaluation,
} from "./schemas";
import { COMPREHENSIVE_EVALUATOR_PROMPT, SUMMARIZER_PROMPT } from "./prompts";
import { logger } from "@/lib/logger";
import type { EvaluationChecklist, Problem } from "@/lib/types";
import { generateObject } from "ai";
import type { Json } from "../database.types";
import { trackAIUsage } from "@/lib/ai/usage-tracker";

export async function runComprehensiveEvaluation(
  conversation: Json,
  boardState: Json,
  checklist: EvaluationChecklist,
  problem: Problem,
  solutionId: string,
  userId: string
): Promise<Evaluation> {
  const startTime = Date.now();
  const conversationLength = Array.isArray(conversation)
    ? conversation.length
    : 0;
  const boardStateSize = JSON.stringify(boardState).length;
  const checklistItems = Object.keys(checklist).filter(
    (k) => checklist[k as keyof EvaluationChecklist] === true
  ).length;

  logger.info(
    {
      problemTitle: problem.title,
      conversationLength,
      boardStateSize,
      checklistItems,
    },
    "Starting evaluation"
  );

  try {
    const inputSize = JSON.stringify({
      conversation,
      boardState,
      checklist,
      problem: {
        title: problem.title,
        description: problem.description,
        requirements: problem.requirements,
      },
    }).length;

    logger.info(
      {
        model: "gpt-4.1-mini-2025-04-14",
        inputSize,
        promptSize: COMPREHENSIVE_EVALUATOR_PROMPT.length,
      },
      "Calling LLM for evaluation"
    );

    const evaluationStartTime = Date.now();
    const { object, usage } = await generateObject({
      model: "openai/gpt-4.1-mini",
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
      schema: EvaluationSchema,
    });

    // Track AI usage for evaluation
    if (usage) {
      trackAIUsage({
        model: "openai/gpt-4.1-mini",
        userId,
        usage,
        entityType: "solution",
        entityId: solutionId,
      }).catch((error) => {
        logger.error({ error, solutionId }, "Failed to track evaluation usage");
      });
    }

    const evaluationDuration = Date.now() - evaluationStartTime;
    const totalDuration = Date.now() - startTime;

    logger.info(
      {
        duration: `${evaluationDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        usage: usage
          ? {
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              totalTokens: usage.totalTokens,
              tokensPerSecond: Math.round(
                (usage.totalTokens || 0) / (evaluationDuration / 1000)
              ),
            }
          : undefined,
        overallScore: object.overall_score,
        technicalPercentage: object.categories.technical.percentage,
        communicationPercentage: object.categories.communication.percentage,
      },
      "Evaluation completed"
    );

    return object;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ error, duration: `${duration}ms` }, "Evaluation failed");
    throw new Error("Failed to generate evaluation");
  }
}

export async function generateFinalEvaluation(
  evaluations: Evaluation[],
  checklist: EvaluationChecklist,
  problem: Problem,
  solutionId: string,
  userId: string
): Promise<Evaluation> {
  const startTime = Date.now();

  logger.info(
    {
      problemTitle: problem.title,
      evaluationCount: evaluations.length,
      evaluationScores: evaluations.map((e) => e.overall_score),
    },
    "Starting final evaluation synthesis"
  );

  try {
    const inputSize = JSON.stringify({
      evaluations,
      checklist,
      problem: {
        title: problem.title,
        description: problem.description,
      },
    }).length;

    logger.info(
      {
        model: "gpt-4.1-mini-2025-04-14",
        inputSize,
        promptSize: SUMMARIZER_PROMPT.length,
      },
      "Calling LLM for final evaluation synthesis"
    );

    const summaryStartTime = Date.now();
    const { object, usage } = await generateObject({
      model: "openai/gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: SUMMARIZER_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify({
            evaluations,
            checklist,
            problem: {
              title: problem.title,
              description: problem.description,
            },
          }),
        },
      ],
      schema: EvaluationSchema,
    });

    // Track AI usage for final evaluation synthesis
    if (usage) {
      trackAIUsage({
        model: "openai/gpt-4.1-mini",
        userId,
        usage,
        entityType: "solution",
        entityId: solutionId,
      }).catch((error) => {
        logger.error({ error, solutionId }, "Failed to track synthesis usage");
      });
    }

    const summaryDuration = Date.now() - summaryStartTime;
    const totalDuration = Date.now() - startTime;

    logger.info(
      {
        duration: `${summaryDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        usage: usage
          ? {
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
              totalTokens: usage.totalTokens,
              tokensPerSecond: Math.round(
                (usage.totalTokens || 0) / (summaryDuration / 1000)
              ),
            }
          : undefined,
        overallScore: object.overall_score,
        summaryLength: object.summary.length,
        technicalPercentage: object.categories.technical.percentage,
        communicationPercentage: object.categories.communication.percentage,
        technicalProsCount: object.categories.technical.pros.length,
        technicalConsCount: object.categories.technical.cons.length,
        communicationProsCount: object.categories.communication.pros.length,
        communicationConsCount: object.categories.communication.cons.length,
      },
      "Final evaluation completed"
    );

    return object;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      { error, duration: `${duration}ms` },
      "Final evaluation failed"
    );
    throw new Error("Failed to generate final evaluation");
  }
}

// Main orchestrator function - runs evaluations in parallel for consistency
export async function evaluateInterview(
  solutionId: string,
  conversation: Json,
  boardState: Json,
  checklist: EvaluationChecklist,
  problem: Problem,
  userId: string
): Promise<Evaluation> {
  const overallStartTime = Date.now();
  const conversationLength = Array.isArray(conversation)
    ? conversation.length
    : 0;

  logger.info(
    {
      solutionId,
      problemTitle: problem.title,
      conversationLength,
    },
    "Starting interview evaluation"
  );

  try {
    // Run the SAME evaluation THREE times in parallel for consistency
    logger.info(
      {
        solutionId,
        conversationLength,
        boardStateSize: JSON.stringify(boardState).length,
        checklistItems: Object.keys(checklist).filter(
          (k) => checklist[k as keyof EvaluationChecklist] === true
        ).length,
      },
      "Running three evaluations in parallel"
    );

    const parallelStartTime = Date.now();
    const evaluations = await Promise.all([
      runComprehensiveEvaluation(
        conversation,
        boardState,
        checklist,
        problem,
        solutionId,
        userId
      ),
      runComprehensiveEvaluation(
        conversation,
        boardState,
        checklist,
        problem,
        solutionId,
        userId
      ),
      runComprehensiveEvaluation(
        conversation,
        boardState,
        checklist,
        problem,
        solutionId,
        userId
      ),
    ]);
    const parallelDuration = Date.now() - parallelStartTime;

    logger.info(
      {
        solutionId,
        parallelDuration: `${parallelDuration}ms`,
        evaluationScores: evaluations.map((e) => e.overall_score),
      },
      "All parallel evaluations completed, starting synthesis"
    );

    // Summarizer synthesizes the three evaluations
    const finalEvaluation = await generateFinalEvaluation(
      evaluations,
      checklist,
      problem,
      solutionId,
      userId
    );

    const totalDuration = Date.now() - overallStartTime;

    logger.info(
      {
        solutionId,
        totalDuration: `${totalDuration}ms`,
        overallScore: finalEvaluation.overall_score,
        technicalPercentage: finalEvaluation.categories.technical.percentage,
        communicationPercentage:
          finalEvaluation.categories.communication.percentage,
      },
      "Interview evaluation completed successfully"
    );

    return finalEvaluation;
  } catch (error) {
    const totalDuration = Date.now() - overallStartTime;
    logger.error(
      {
        solutionId,
        error,
        totalDuration: `${totalDuration}ms`,
      },
      "Interview evaluation failed"
    );
    throw error;
  }
}
