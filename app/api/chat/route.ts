import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  generateId,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { SolutionStates, type SolutionState } from "@/lib/types";
import { logger } from "@/lib/logger";
import { clerkClient } from "@clerk/nextjs/server";
import { captureError } from "@/lib/observability";
import { z } from "zod";
import { stepCountIs } from "ai";
import {
  buildInterviewerPrompt,
  getActiveTools,
} from "@/lib/ai/interviewer-prompt-builder";
import { fetchProblemById } from "@/lib/queries/problems";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { fetchSolutionById, updateSolution } from "@/lib/queries/solutions";
import type { Json } from "@/lib/database.types";
import { createTwoFilesPatch } from "diff";

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
  const supabase = await createServerSupabaseClient();
  const clerk = await clerkClient();

  const user = await clerk.users.getUser(userId);
  if (!user) {
    const error = new Error(`Failed to fetch user info: ${userId}`);
    captureError(error);
    logger.error(error, `Failed to fetch user info: ${userId}`);
    throw error;
  }

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

  const prompt = buildInterviewerPrompt(
    currentState,
    boardChanged,
    user.fullName ?? "",
    JSON.stringify(problem, null, 2),
    boardDiff,
    evaluationChecklist
  );

  logger.info({ prompt }, "Interviewer prompt");

  const result = streamText({
    model: openai("gpt-5.1"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    system: prompt,
    onError({ error }) {
      captureError(error as Error);
      logger.error(error, "Error streaming chat response");
      throw error;
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
      update_checklist: {
        description: `Update evaluation checklist when candidate demonstrates competencies.
Call immediately when you observe behaviors - don't batch at end of phase.
Can update multiple items at once if candidate demonstrates multiple competencies.
Only include the fields you want to mark as true.`,
        inputSchema: z
          .object({
            // GREETING PHASE
            greeting_engagement: z
              .boolean()
              .describe("Candidate responded warmly and engaged")
              .optional(),
            greeting_sets_context: z
              .boolean()
              .describe("Acknowledged the problem/context")
              .optional(),
            greeting_establishes_collaboration: z
              .boolean()
              .describe(
                'Signals collaboration ("let me ask...", "can you clarify...")'
              )
              .optional(),

            // REQUIREMENTS PHASE
            requirements_clarified_requirements: z
              .boolean()
              .describe("Asked specific questions about features/scope")
              .optional(),
            requirements_avoided_overanalysis: z
              .boolean()
              .describe("Moved forward without overthinking edge cases")
              .optional(),
            requirements_defined_scope: z
              .boolean()
              .describe("Stated clear boundaries (in/out of scope)")
              .optional(),
            requirements_stated_assumptions: z
              .boolean()
              .describe("Explicitly called out assumptions")
              .optional(),
            requirements_stated_scale_and_sla: z
              .boolean()
              .describe("Discussed QPS, users, latency, availability")
              .optional(),
            requirements_walked_through_user_scenarios: z
              .boolean()
              .describe("Described user flows/journeys")
              .optional(),
            requirements_validated_requirements: z
              .boolean()
              .describe("Confirmed understanding with you")
              .optional(),

            // DESIGN PHASE
            design_provided_high_level_overview: z
              .boolean()
              .describe("Started with big picture before details")
              .optional(),
            design_modular_components_identified: z
              .boolean()
              .describe("Broke system into clear components")
              .optional(),
            design_covered_scalability: z
              .boolean()
              .describe("Addressed how system scales")
              .optional(),
            design_considered_future_growth: z
              .boolean()
              .describe("Thought about extensibility")
              .optional(),
            design_discussed_performance_and_latency: z
              .boolean()
              .describe("Addressed speed/latency concerns")
              .optional(),
            design_identified_spof_and_fault_tolerance: z
              .boolean()
              .describe("Called out failure points + mitigation")
              .optional(),
            design_covered_security_and_privacy: z
              .boolean()
              .describe("Addressed auth, data protection")
              .optional(),
            design_included_observability: z
              .boolean()
              .describe("Mentioned monitoring, logging, alerting")
              .optional(),
            design_chose_appropriate_databases: z
              .boolean()
              .describe("Selected suitable storage with reasoning")
              .optional(),
            design_covered_data_modeling: z
              .boolean()
              .describe("Discussed schema/data structure")
              .optional(),
            design_managed_data_growth_strategy: z
              .boolean()
              .describe("Addressed data volume growth (archival, partitioning)")
              .optional(),
            design_used_caching_properly: z
              .boolean()
              .describe("Applied caching where appropriate with reasoning")
              .optional(),
            design_avoided_over_under_engineering: z
              .boolean()
              .describe("Balanced complexity for requirements")
              .optional(),
            design_diagram_provided: z
              .boolean()
              .describe("Used board to create visual representations")
              .optional(),
            design_discussed_cost_implications: z
              .boolean()
              .describe("Mentioned infrastructure costs/tradeoffs")
              .optional(),

            // DEEP DIVE PHASE
            deep_dive_explained_tradeoffs: z
              .boolean()
              .describe("Articulated pros/cons of choices")
              .optional(),
            deep_dive_considered_alternative_solutions: z
              .boolean()
              .describe("Compared multiple approaches")
              .optional(),
            deep_dive_used_specifics_not_buzzwords: z
              .boolean()
              .describe('Used concrete numbers/tech, not "at scale"')
              .optional(),
            deep_dive_demonstrated_conceptual_depth: z
              .boolean()
              .describe("Showed deep understanding of technologies")
              .optional(),
            deep_dive_did_back_of_envelope_calculations: z
              .boolean()
              .describe("Calculated capacity/bandwidth/storage")
              .optional(),
            deep_dive_addressed_edge_cases: z
              .boolean()
              .describe("Handled corner cases and failure scenarios")
              .optional(),
            deep_dive_covered_consistency_vs_availability: z
              .boolean()
              .describe("Discussed CAP theorem tradeoffs")
              .optional(),
            deep_dive_focused_on_relevant_failures: z
              .boolean()
              .describe("Prioritized likely/important failure modes")
              .optional(),

            // INTERACTION QUALITY (throughout all phases)
            interaction_explained_thought_process: z
              .boolean()
              .describe(
                'Verbalized thinking ("I\'m considering...", "My reasoning...")'
              )
              .optional(),
            interaction_engaged_dialog_not_monologue: z
              .boolean()
              .describe("Asked questions, didn't just lecture")
              .optional(),
            interaction_reacted_to_hints: z
              .boolean()
              .describe("Picked up on guidance and adjusted")
              .optional(),
            interaction_communicated_clearly: z
              .boolean()
              .describe("Organized, easy to follow")
              .optional(),
            interaction_time_management_good: z
              .boolean()
              .describe("Appropriate pacing")
              .optional(),
            interaction_did_not_get_lost_in_details: z
              .boolean()
              .describe("Stayed appropriately high-level")
              .optional(),
            interaction_did_not_use_one_size_template: z
              .boolean()
              .describe("Tailored to problem, not generic")
              .optional(),
            interaction_honest_about_unknowns: z
              .boolean()
              .describe("Admitted knowledge gaps gracefully")
              .optional(),

            // CONCLUSION PHASE
            conclusion_validated_design_against_requirements: z
              .boolean()
              .describe("Verified design meets requirements")
              .optional(),
            conclusion_summarized_solution: z
              .boolean()
              .describe("Provided clear summary")
              .optional(),
            conclusion_closed_loop_with_interviewer: z
              .boolean()
              .describe("Asked for feedback/concerns/questions")
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
