import { streamText, type UIMessage, convertToModelMessages } from "ai";
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
    boardDiff
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
          return JSON.stringify(solution.board_state, null, 2);
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
