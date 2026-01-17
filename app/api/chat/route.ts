"use server";

import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  generateId,
  type ModelMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import {
  SolutionStates,
  type SolutionState,
  type EvaluationChecklist,
} from "@/lib/types";
import {
  CRITERIA,
  type CriterionKey,
  calculateScore,
} from "@/lib/evaluation/criteria";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";
import {
  captureError,
  captureEvaluationSuccess,
  captureEvaluationFailure,
} from "@/lib/observability";
import { z } from "zod";
import { stepCountIs } from "ai";
import {
  buildStaticBasePrompt,
  buildDynamicContext,
  getActiveTools,
  getStateSpecificInstructions,
} from "@/lib/ai/interviewer-prompt-builder";
import { fetchProblemById } from "@/lib/queries/problems";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchSolutionById, updateSolution } from "@/lib/queries/solutions";
import type { Json, Database } from "@/lib/database.types";
import { createTwoFilesPatch } from "diff";
import { evaluateInterview } from "@/lib/evaluation/evaluators";
import type { SupabaseClient } from "@supabase/supabase-js";
import { trackAIUsage } from "@/lib/ai/usage-tracker";
import { checkCanSendMessage } from "@/lib/usage-check";
import { captureBlockedChatAttempt } from "@/lib/observability";

function getBoardDiff(boardState: Json[], prevBoardState: Json[]) {
  const oldStr = JSON.stringify(prevBoardState, null, 2);
  const newStr = JSON.stringify(boardState, null, 2);

  const patch = createTwoFilesPatch(
    "prev_board_state",
    "board_state",
    oldStr,
    newStr,
    "OLD",
    "NEW",
    { context: 3 }
  );

  logger.debug({ patch, oldStr, newStr }, "Board diff");

  return patch;
}

export async function POST(req: Request) {
  const {
    messages,
    currentState,
    userId,
    problemId,
    solutionId,
  }: {
    messages: UIMessage[];
    currentState: SolutionState;
    userId: string;
    problemId: string;
    solutionId: string;
  } = await req.json();

  logger.debug(
    {
      messages,
      currentState,
      userId,
      problemId,
    },
    "Received chat request"
  );

  // Get session for user info
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Server-side usage validation - prevents bypassing frontend checks
  try {
    const usageCheck = await checkCanSendMessage(userId);
    if (!usageCheck.allowed) {
      logger.warn(
        { userId, reason: usageCheck.reason },
        "Chat request blocked due to usage limits"
      );
      captureBlockedChatAttempt(usageCheck.reason ?? "UNKNOWN");
      return new Response(JSON.stringify({ error: usageCheck.reason }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (usageError) {
    logger.error({ userId, usageError }, "Error checking usage limits");
    captureError(usageError as Error);
    // Don't block on usage check errors - fail open but log
  }

  const supabase = await createServerSupabaseClient();

  // Use session user info instead of Clerk
  const userName = session.user.name ?? "";

  const { data: problem, error: problemError } = await fetchProblemById(
    supabase,
    problemId
  );
  if (problemError) {
    captureError(problemError);
    logger.error(problemError, `Failed to fetch problem info: ${problemId}`);
    throw problemError;
  }

  const { data: solution, error: solutionError } = await fetchSolutionById(
    supabase,
    solutionId
  );
  if (solutionError) {
    captureError(solutionError);
    logger.error(solutionError, `Failed to fetch solution info: ${solutionId}`);
    throw solutionError;
  }

  const evaluationChecklist =
    (solution.evaluation_checklist as Record<string, boolean>) || {};

  const boardChanged =
    JSON.stringify(solution.board_state) !==
    JSON.stringify(solution.prev_board_state);

  let boardDiff = "";
  if (boardChanged) {
    try {
      boardDiff = getBoardDiff(
        solution.board_state as Json[],
        solution.prev_board_state as Json[]
      );
    } catch (error) {
      captureError(error as Error);
      logger.error(error, "Error getting board diff");
      throw error;
    }
  }

  // Extract requirements from problem (with fallback to empty structure)
  // Type assertion until database types are regenerated
  const problemWithRequirements = problem as typeof problem & {
    requirements?: Json;
  };

  const requirements = (problemWithRequirements.requirements as {
    functional: string[];
    non_functional: string[];
    constraints?: string[];
    out_of_scope?: string[];
  }) || {
    functional: [],
    non_functional: [],
    constraints: [],
    out_of_scope: [],
  };

  // Build prompts optimized for Anthropic's ephemeral token caching
  // Message 1: Static base prompt (cached) - persona, rules, tools, problem, user, requirements
  const staticBasePrompt = buildStaticBasePrompt(
    userName,
    JSON.stringify(problem, null, 2),
    requirements
  );

  // Message 2: State-specific instructions (cached) - changes per state but static within a state
  const stateInstructions = getStateSpecificInstructions(currentState);

  // Message 3: Dynamic context (not cached) - board diff, checklist status, current state
  const dynamicContext = buildDynamicContext(
    currentState,
    boardDiff,
    evaluationChecklist
  );

  logger.info(
    { staticBasePrompt, stateInstructions, dynamicContext },
    "Interviewer prompts (split for caching)"
  );

  const model = process.env.PREP_SESSION_MODEL;
  if (!model) {
    throw new Error("PREP_SESSION_MODEL is not set");
  }

  logger.info({ boardDiff }, "Board diff");

  // 3 system messages optimized for Anthropic's ephemeral token caching:
  // 1. Static base (cached) - same for all states within an interview
  // 2. State instructions (cached) - same within a state
  // 3. Dynamic context (not cached) - changes every request
  const modelMessages = [
    {
      role: "system",
      content: staticBasePrompt,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    },
    {
      role: "system",
      content: stateInstructions,
      providerOptions: {
        anthropic: { cacheControl: { type: "ephemeral" } },
      },
    },
    {
      role: "system",
      content: dynamicContext,
    },
    ...convertToModelMessages(messages),
  ] as ModelMessage[];

  const result = streamText({
    model,
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    // system: prompt,
    onError({ error }) {
      captureError(error as Error);
      logger.error(error, "Error streaming chat response");
      throw error;
    },
    onFinish({ totalUsage }) {
      // Track AI usage (fire-and-forget)
      trackAIUsage({
        model,
        userId,
        usage: totalUsage,
        entityType: "solution",
        entityId: solutionId,
      }).catch((error) => {
        logger.error({ error, solutionId }, "Failed to track AI usage");
      });
    },
    activeTools: getActiveTools(currentState) as [],
    tools: {
      request_state_transition: {
        description: "Set the state",
        inputSchema: z.object({
          state: z.enum(SolutionStates),
        }),
        execute: async ({ state }) => {
          const { error } = await updateSolution(supabase, solutionId, {
            state: state,
          });
          if (error) {
            captureError(error);
            logger.error(error, "Error updating solution");
            throw error;
          }
          return state;
        },
      },
      get_board_state: {
        description: "Get the board state",
        inputSchema: z.object({}),
        execute: async () => {
          const { data: solution, error: solutionError } =
            await fetchSolutionById(supabase, solutionId);
          if (solutionError) {
            captureError(solutionError);
            logger.error(solutionError, "Error fetching solution");
            throw solutionError;
          }
          return solution.board_state;
        },
      },
      conclude_interview: {
        description: `Conclude the interview and trigger evaluation.
Call this ONLY in CONCLUSION state after providing closing remarks to the candidate.
The interview will become read-only and evaluation will begin immediately.`,
        inputSchema: z.object({}),
        execute: async () => {
          return concludeInterview(solutionId);
        },
      },
      update_checklist: {
        description: `Update evaluation criteria when candidate demonstrates competencies or red flags.
Call immediately when you observe behaviors - don't batch at end of phase.
Can update multiple items at once if candidate demonstrates multiple competencies.
Only include the fields you want to mark as true.

POSITIVE CRITERIA (add to score):
- clarifies_requirements_before_design: Asks functional/non-functional questions before designing
- avoids_unfounded_assumptions: States assumptions explicitly instead of assuming silently
- proposes_high_level_architecture_first: Outlines end-to-end architecture before details
- communicates_decisions_and_tradeoffs: Explains why choices were made and alternatives rejected
- makes_opinionated_choices: Selects and defends a concrete approach
- addresses_data_model_and_consistency: Defines schemas, consistency, correctness guarantees
- addresses_scalability_and_growth: Explains how system scales and when redesigns needed
- addresses_reliability_and_failure_modes: Covers failures, retries, monitoring, recovery
- ties_design_to_user_and_business_impact: Connects architecture to UX, SLAs, business
- collaborates_with_interviewer: Treats interview as discussion, incorporates feedback

RED FLAGS (subtract from score - only mark if clearly observed):
- limited_engagement_with_interviewer: Proceeds without incorporating feedback
- technical_terms_without_explanation: Names tech without explaining fit
- tradeoffs_discussed_but_not_resolved: Mentions options but doesn't commit
- operational_concerns_not_addressed: Skips monitoring, failure modes, ops readiness`,
        inputSchema: z
          .object({
            // POSITIVE CRITERIA (10 items, sum to 100%)
            clarifies_requirements_before_design: z
              .boolean()
              .describe(
                "Asks functional and non-functional questions that affect design before proposing solutions. Example: 'What scale? What latency requirements? What consistency guarantees?'"
              )
              .optional(),
            avoids_unfounded_assumptions: z
              .boolean()
              .describe(
                "Explicitly states assumptions or asks clarifying questions instead of silently assuming. Example: 'I'm assuming we need strong consistency for payments'"
              )
              .optional(),
            proposes_high_level_architecture_first: z
              .boolean()
              .describe(
                "Outlines clear end-to-end architecture before component details. Example: 'Let me start with the big picture: clients → API gateway → services → databases'"
              )
              .optional(),
            communicates_decisions_and_tradeoffs: z
              .boolean()
              .describe(
                "Explains why specific choices were made and why alternatives rejected. Example: 'I chose Cassandra over DynamoDB because we need tunable consistency'"
              )
              .optional(),
            makes_opinionated_choices: z
              .boolean()
              .describe(
                "Selects a concrete approach and defends it rather than listing options. Example: 'I'll use Redis for caching because...' not 'We could use Redis or Memcached or...'"
              )
              .optional(),
            addresses_data_model_and_consistency: z
              .boolean()
              .describe(
                "Defines schemas, ownership, consistency expectations, correctness guarantees. Example: 'The URL table has id, original_url, short_code with unique constraint on short_code'"
              )
              .optional(),
            addresses_scalability_and_growth: z
              .boolean()
              .describe(
                "Explains how system scales and when redesigns become necessary. Example: 'At 10x current scale, we'd need to shard the database by user_id'"
              )
              .optional(),
            addresses_reliability_and_failure_modes: z
              .boolean()
              .describe(
                "Identifies failure cases, retries, idempotency, monitoring, recovery. Example: 'If the cache fails, we fall back to DB with circuit breaker'"
              )
              .optional(),
            ties_design_to_user_and_business_impact: z
              .boolean()
              .describe(
                "Connects architecture to UX, SLAs, or business priorities. Example: 'We prioritize read latency because users expect instant redirects'"
              )
              .optional(),
            collaborates_with_interviewer: z
              .boolean()
              .describe(
                "Treats interview as design discussion, incorporates feedback. Example: 'That's a good point about consistency - let me reconsider...'"
              )
              .optional(),

            // RED FLAGS (4 items, subtract from score)
            limited_engagement_with_interviewer: z
              .boolean()
              .describe(
                "RED FLAG: Proceeds without incorporating interviewer signals or feedback. Monologues without checking in or ignores hints."
              )
              .optional(),
            technical_terms_without_explanation: z
              .boolean()
              .describe(
                "RED FLAG: Names technologies or patterns without explaining why they fit. Example: 'We'll use Kafka' without explaining why message queue is needed."
              )
              .optional(),
            tradeoffs_discussed_but_not_resolved: z
              .boolean()
              .describe(
                "RED FLAG: Mentions multiple options but does not commit to or defend a decision. Stays wishy-washy instead of making a choice."
              )
              .optional(),
            operational_concerns_not_addressed: z
              .boolean()
              .describe(
                "RED FLAG: Does not discuss monitoring, failure recovery, or operational readiness when design is otherwise complete."
              )
              .optional(),
          })
          .describe(
            "Criteria to mark as observed. Only include fields you want to update (mark as true)."
          ),
        execute: async (updates = {}) => {
          // Filter out undefined values to get only the fields that were provided
          const providedUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, value]) => value !== undefined)
          ) as Record<string, boolean>;

          // If no updates provided, just return current state without error
          if (Object.keys(providedUpdates).length === 0) {
            const { data: solution, error: fetchError } =
              await fetchSolutionById(supabase, solutionId);
            if (fetchError) {
              captureError(fetchError);
              logger.error(
                fetchError,
                "Error fetching solution for checklist update"
              );
              throw fetchError;
            }
            const currentChecklist =
              (solution.evaluation_checklist as Record<string, boolean>) || {};
            return {
              success: true,
              noted: [],
              current_score: calculateScore(currentChecklist),
              message: "No updates provided - returning current state",
            };
          }

          const { data: solution, error: fetchError } = await fetchSolutionById(
            supabase,
            solutionId
          );
          if (fetchError) {
            captureError(fetchError);
            logger.error(
              fetchError,
              "Error fetching solution for checklist update"
            );
            throw fetchError;
          }

          const currentChecklist =
            (solution.evaluation_checklist as Record<string, boolean>) || {};

          // Only apply changes that differ from current values
          const effectiveUpdates = Object.fromEntries(
            Object.entries(providedUpdates).filter(([key, value]) => {
              return currentChecklist[key] !== value;
            })
          ) as Record<string, boolean>;

          if (Object.keys(effectiveUpdates).length === 0) {
            return {
              success: true,
              noted: [],
              current_score: calculateScore(currentChecklist),
              message: "No new criteria to update",
            };
          }

          // Merge updates (simple spread, no nesting)
          const updatedChecklist = {
            ...currentChecklist,
            ...effectiveUpdates,
          };

          const { error } = await updateSolution(supabase, solutionId, {
            evaluation_checklist: updatedChecklist as unknown as Json,
          });

          if (error) {
            captureError(error);
            logger.error(error, "Error updating checklist");
            throw error;
          }

          // Build noted items with metadata for frontend display
          const notedItems = Object.keys(effectiveUpdates).map((key) => {
            const criterion = CRITERIA[key as CriterionKey];
            return {
              key,
              name: criterion?.name ?? key,
              is_red_flag: criterion?.is_red_flag ?? false,
            };
          });

          return {
            success: true,
            noted: notedItems,
            current_score: calculateScore(updatedChecklist),
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onError(error) {
      captureError(error as Error);
      logger.error(error, "Error streaming chat response");
      throw error;
    },
    async onFinish({ messages, responseMessage }) {
      logger.info({ responseMessage }, "Chat response finished");
      const supabase = await createServerSupabaseClient();
      const { data: solution, error: solutionError } = await fetchSolutionById(
        supabase,
        solutionId
      );
      if (solutionError) {
        captureError(solutionError);
        logger.error(solutionError, "Error fetching solution");
        throw solutionError;
      }
      // INSERT_YOUR_CODE
      // If the last message's id is null or empty string, assign a new id using generateId()
      if (
        Array.isArray(messages) &&
        messages.length > 0 &&
        (messages[messages.length - 1].id == null ||
          messages[messages.length - 1].id === "")
      ) {
        messages[messages.length - 1].id = generateId();
      }
      const { error } = await updateSolution(supabase, solutionId, {
        conversation: messages as unknown as Json[],
        prev_board_state: solution.board_state as Json[],
      });
      if (error) {
        captureError(error);
        logger.error(error, "Error updating solution");
        throw error;
      }
      logger.debug({ solution }, "Solution updated");
    },
  });
}

export async function concludeInterview(solutionId: string) {
  const supabase = await createServerSupabaseClient();

  logger.info({ solutionId }, "Concluding interview");

  // Fetch the solution
  const { data: solution, error: solutionError } = await fetchSolutionById(
    supabase,
    solutionId
  );

  if (solutionError || !solution) {
    logger.error({ solutionId, solutionError }, "Solution not found");
    throw new Error("Solution not found");
  }

  // Check if already concluded
  if (solution.status === "completed" || solution.status === "evaluating") {
    logger.warn({ solutionId, status: solution.status }, "Already concluded");
    throw new Error("Interview already concluded");
  }

  // Update status to evaluating
  const { error: updateError } = await updateSolution(supabase, solutionId, {
    status: "evaluating",
    concluded_at: new Date().toISOString(),
  });

  if (updateError) {
    logger.error(
      { solutionId, updateError },
      "Failed to update solution status"
    );
    throw updateError;
  }

  logger.info({ solutionId }, "Status updated to evaluating");

  // Trigger evaluation asynchronously (don't await)
  runEvaluation(solutionId, supabase).catch((error) => {
    logger.error({ solutionId, error }, "Evaluation job failed");
    captureError(error);
  });

  return {
    success: true,
    message: "Interview concluded. Evaluation in progress.",
  };
}

// Async evaluation function
export async function runEvaluation(
  solutionId: string,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
) {
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
      problem,
      solution.user_id
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
