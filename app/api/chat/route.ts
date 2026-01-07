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
        description: `Update evaluation checklist when candidate demonstrates competencies or red flags.
Call immediately when you observe behaviors - don't batch at end of phase.
Can update multiple items at once if candidate demonstrates multiple competencies.
Only include the fields you want to mark as true.

NOTE: design_over_engineered and communication_got_defensive are RED FLAGS (being true is BAD).`,
        inputSchema: z
          .object({
            // REQUIREMENTS GATHERING (4 items)
            requirements_asked_clarifying_questions: z
              .boolean()
              .describe(
                "Asked questions to understand features, constraints, or scope. Example: 'What features should we support? What scale?'"
              )
              .optional(),
            requirements_discussed_scale_and_performance: z
              .boolean()
              .describe(
                "Asked about or discussed QPS, users, latency, availability. Example: 'What's the expected QPS? Any latency requirements?'"
              )
              .optional(),
            requirements_stated_assumptions: z
              .boolean()
              .describe(
                "Explicitly called out assumptions when requirements were unclear. Example: 'I'm assuming we need strong consistency for payments'"
              )
              .optional(),
            requirements_validated_understanding: z
              .boolean()
              .describe(
                "Confirmed understanding before moving to design. Example: 'So to summarize: 10M DAU, 99.9% uptime. Ready to design?'"
              )
              .optional(),

            // DESIGN (8 items)
            design_started_with_high_level: z
              .boolean()
              .describe(
                "Provided high-level architecture before diving into details. Example: 'Let me start with the big picture: clients, API, services, databases'"
              )
              .optional(),
            design_drew_diagram: z
              .boolean()
              .describe(
                "Used the whiteboard to draw components and connections. Example: Board shows boxes/arrows with labeled components"
              )
              .optional(),
            design_explained_data_flow: z
              .boolean()
              .describe(
                "Walked through how requests flow through the system. Example: 'When user clicks, request goes from client → LB → service → DB'"
              )
              .optional(),
            design_justified_technology_choices: z
              .boolean()
              .describe(
                "Explained WHY they chose specific technologies. Example: 'I chose Cassandra because we need high write throughput'"
              )
              .optional(),
            design_discussed_scalability: z
              .boolean()
              .describe(
                "Addressed how the system handles scale requirements. Example: 'We'll shard by user_id, use caching, add read replicas'"
              )
              .optional(),
            design_considered_failures: z
              .boolean()
              .describe(
                "Discussed what happens when components fail. Example: 'If primary DB fails, we failover to replica'"
              )
              .optional(),
            design_discussed_tradeoffs: z
              .boolean()
              .describe(
                "Acknowledged pros/cons of design decisions. Example: 'SQL gives us ACID, but NoSQL scales better for our use case'"
              )
              .optional(),
            design_did_capacity_planning: z
              .boolean()
              .describe(
                "Did back-of-envelope calculations for capacity/storage/bandwidth before choosing technologies. Example: '500k QPS × 1KB = 500MB/s throughput, 100M URLs × 500 bytes = 50GB storage'"
              )
              .optional(),
            design_over_engineered: z
              .boolean()
              .describe(
                "RED FLAG: Added unnecessary complexity or premature optimization. Example: 'Designed microservices with service mesh for a simple CRUD app'. This is INVERTED: true is BAD."
              )
              .optional(),

            // COMMUNICATION (4 items)
            communication_clear_and_structured: z
              .boolean()
              .describe(
                "Explained thoughts in organized, easy-to-follow manner. Example: 'First I'll cover requirements, then design, then dive into X'"
              )
              .optional(),
            communication_collaborative: z
              .boolean()
              .describe(
                "Engaged in dialogue, asked for feedback, not monologuing. Example: 'Does this make sense? What do you think about this approach?'"
              )
              .optional(),
            communication_thought_out_loud: z
              .boolean()
              .describe(
                "Shared their thinking process, not just conclusions. Example: 'I'm thinking we need caching because of the read:write ratio'"
              )
              .optional(),
            communication_got_defensive: z
              .boolean()
              .describe(
                "RED FLAG: Became defensive, dismissive, or argumentative. Example: 'That wouldn't be a problem because... (without considering the concern)'. This is INVERTED: true is BAD."
              )
              .optional(),
          })
          .describe(
            "Checklist items to mark as demonstrated. Only include fields you want to update (mark as true)."
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
              updated_items: [],
              total_checked:
                Object.values(currentChecklist).filter(Boolean).length,
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

          // Merge updates (simple spread, no nesting)
          const updatedChecklist = {
            ...currentChecklist,
            ...providedUpdates,
          };

          const { error } = await updateSolution(supabase, solutionId, {
            evaluation_checklist: updatedChecklist as unknown as Json,
          });

          if (error) {
            captureError(error);
            logger.error(error, "Error updating checklist");
            throw error;
          }

          return {
            success: true,
            updated_items: Object.keys(providedUpdates),
            total_checked:
              Object.values(updatedChecklist).filter(Boolean).length,
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
