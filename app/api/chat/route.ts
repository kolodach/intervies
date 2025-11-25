import { streamText, type UIMessage, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import type { SolutionState } from "@/lib/types";
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
import { updateSolution } from "@/lib/queries/solutions";

export async function POST(req: Request) {
  const {
    messages,
    currentState,
    boardChanged,
    userId,
    problemId,
    solutionId,
  }: {
    messages: UIMessage[];
    currentState: SolutionState;
    boardChanged: boolean;
    userId: string;
    problemId: string;
    solutionId: string;
  } = await req.json();

  logger.debug(
    {
      messages,
      currentState,
      boardChanged,
      userId,
      problemId,
    },
    "Received chat request"
  );

  const prompt = buildInterviewerPrompt(currentState, boardChanged);

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
    activeTools: getActiveTools(
      currentState
    ) as // | "concludeInterview" // | "requestStateTransition" // | "getBoardDiff" // | "getBoardState"
    ("fetchUserInfo" | "fetchProblemDetails")[],
    tools: {
      fetchProblemDetails: {
        description: "Fetch the problem details",
        inputSchema: z.object({}),
        execute: async () => {
          logger.debug(
            {
              problemId,
            },
            "Fetching problem details"
          );
          const supabase = await createServerSupabaseClient();
          const { data: problem, error } = await fetchProblemById(
            supabase,
            problemId
          );
          if (error) {
            captureError(error);
            logger.error(
              error,
              `Failed to fetch problem details: ${problemId}`
            );
            throw new Error(
              `Failed to fetch problem details: ${error.message}`
            );
          }
          logger.debug(
            {
              problem,
            },
            "Fetched problem details"
          );
          return problem;
        },
      },
      fetchUserInfo: {
        description: "Fetch the user info",
        inputSchema: z.object({}),
        execute: async () => {
          logger.debug(
            {
              userId,
            },
            "Fetching user info"
          );
          const clerk = await clerkClient();
          const user = await clerk.users.getUser(userId);
          if (!user) {
            const error = new Error(`Failed to fetch user info: ${userId}`);
            captureError(error);
            logger.error(error, `Failed to fetch user info: ${userId}`);
            throw error;
          }
          logger.debug(
            {
              user,
            },
            "Fetched user info"
          );
          return {
            name: user.fullName,
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
    async onFinish({ messages }) {
      logger.info({ messages }, "Chat response finished");
      const supabase = await createServerSupabaseClient();
      const { data: solution, error } = await updateSolution(
        supabase,
        solutionId,
        {
          conversation: JSON.stringify(messages),
        }
      );
      if (error) {
        captureError(error);
        logger.error(error, "Error updating solution");
        throw error;
      }
      logger.debug({ solution }, "Solution updated");
    },
  });
}
