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

export async function POST(req: Request) {
  const {
    messages,
    currentState,
    boardChanged,
    userId,
    problemId,
  }: {
    messages: UIMessage[];
    currentState: SolutionState;
    boardChanged: boolean;
    userId: string;
    problemId: string;
  } = await req.json();

  logger.info(
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
    activeTools: getActiveTools(currentState) as ( // | "concludeInterview" // | "requestStateTransition" // | "getBoardDiff" // | "getBoardState"
      | "fetchUserInfo"
      | "fetchProblemDetails"
    )[],
    tools: {
      fetchProblemDetails: {
        description: "Fetch the problem details",
        inputSchema: z.object({}),
        execute: async () => {
          logger.info(
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
          logger.info(
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
          logger.info(
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
          logger.info(
            {
              user,
            },
            "Fetched user info"
          );
          return user;
        },
      },
    },
  });

  return result.toUIMessageStreamResponse({
    onError(error) {
      captureError(error as Error);
      logger.error(error, "Error streaming chat response");
      throw error;
    },
  });
}
