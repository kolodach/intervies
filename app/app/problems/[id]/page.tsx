"use client";

import { Canvas } from "@/components/canvas";
import Chat from "@/components/chat";
import { useAuthenticatedQuery } from "@/lib/hooks/query-hooks";
import { fetchSolutionById, updateSolution } from "@/lib/queries/solutions";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncer } from "@tanstack/react-pacer";
import { toast } from "sonner";
import type { Json } from "@/lib/database.types";
import { type UIMessage, useChat } from "@ai-sdk/react";
import type { SolutionState } from "@/lib/types";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/observability";
import { useEvaluationPolling } from "@/lib/hooks/use-evaluation-polling";

export default function Page() {
  const { id } = useParams();
  const { user } = useUser();
  const client = useSupabaseBrowserClient();
  const supabase = useSupabaseBrowserClient();
  const {
    data: solution,
    error,
    isLoading,
  } = useQuery(fetchSolutionById(supabase, id as string), {
    enabled: !!user,
  });

  // Only initialize useChat after solution is loaded
  const { messages, sendMessage, status, setMessages, regenerate } = useChat({
    id: id as string,
    onError(error) {
      toast.error("Error fetching messages");
      captureError(error);
      logger.error(error, "Error fetching messages");
      throw error;
    },
    messages: solution ? (solution.conversation as unknown as UIMessage[]) : [],
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === "conclude_interview") {
        logger.info({ solutionId: id }, "Concluding interview");

        try {
          // Trigger backend evaluation
          const response = await fetch(`/api/v1/solutions/${id}/conclude`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (!response.ok) {
            throw new Error("Failed to conclude interview");
          }

          toast.info("Interview concluded. Generating evaluation...");

          // Start polling for evaluation results
          startPolling();
        } catch (error) {
          logger.error({ error }, "Failed to conclude interview");
          captureError(error as Error);
          toast.error("Failed to start evaluation");
        }
      }
    },
  });

  // Sync messages from solution when it loads
  // biome-ignore lint/correctness/useExhaustiveDependencies: Need to sync only when solution changes
  useEffect(() => {
    if (solution?.conversation) {
      const conversationMessages =
        solution.conversation as unknown as UIMessage[];
      // Only update if messages are different
      if (JSON.stringify(messages) !== JSON.stringify(conversationMessages)) {
        setMessages(conversationMessages);
      }
    }
  }, [solution]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (
      !user ||
      !id ||
      !solution ||
      (solution.conversation as Json[]).length > 0
    ) {
      return;
    }
    sendMessage(
      {
        text: "BEGIN_INTERVIEW",
      },
      {
        body: {
          userId: user.id,
          problemId: solution.problem_id,
          solutionId: solution.id,
          currentState: solution.state as SolutionState,
          boardChanged: boardChanged,
        },
      }
    );
  }, [id, user, solution]);

  const [boardChanged, setBoardChanged] = useState(false);

  // Evaluation polling
  const {
    evaluation,
    isEvaluating,
    isCompleted,
    isFailed,
    error: evaluationError,
    startPolling,
  } = useEvaluationPolling(id as string);

  // Show evaluation status toasts
  useEffect(() => {
    if (isCompleted && evaluation) {
      toast.success("Evaluation complete! Check the results below.");
      logger.info({ evaluation }, "Evaluation completed");
    }
    if (isFailed || evaluationError) {
      toast.error(evaluationError || "Evaluation failed");
    }
  }, [isCompleted, isFailed, evaluation, evaluationError]);

  const initialElements = useMemo(() => {
    return (solution?.board_state ?? []) as unknown as Readonly<
      OrderedExcalidrawElement[]
    >;
  }, [solution]);
  const elementsRef = useRef<Readonly<OrderedExcalidrawElement[]>>([]);

  const onChange = async (elements: Readonly<OrderedExcalidrawElement[]>) => {
    if (JSON.stringify(elementsRef.current) === JSON.stringify(elements)) {
      return;
    }
    elementsRef.current = elements;
    console.log("elements", elements);
    if (!solution) {
      return;
    }
    await updateSolution(client, solution?.id, {
      board_state: elements as unknown as Json[],
    });
    setBoardChanged(true);
  };

  const onMessageSent = async () => {
    if (!solution) {
      return;
    }
    setBoardChanged(false);
    const { error } = await updateSolution(client, solution.id, {
      prev_board_state: solution.board_state,
    });
    if (error) {
      toast.error("Error updating solution");
      return;
    }
  };

  const debouncedOnChange = useDebouncer(onChange, {
    wait: 1000,
  });
  const excalidrawRef = useRef<ExcalidrawImperativeAPI>(null);

  // HANDLERS

  const handleRegenerate = async (messageId: string) => {
    if (!solution) {
      return;
    }
    await regenerate({
      messageId,
      body: {
        userId: user?.id,
        problemId: solution.problem_id,
        solutionId: solution.id,
        currentState: solution.state as SolutionState,
        boardChanged: boardChanged,
      },
    });
  };

  const handleReset = async () => {
    if (!solution) {
      return;
    }
    excalidrawRef.current?.resetScene();
    elementsRef.current = [];
    const { error: updateError } = await updateSolution(client, solution.id, {
      state: "GREETING",
      board_state: [] as unknown as Json[],
      conversation: [] as unknown as Json[],
    });
    if (updateError) {
      toast.error("Error resetting solution");
      return;
    }
    window.location.reload();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  if (!solution) {
    return <div>Solution not found</div>;
  }

  return (
    <div className="grid grid-cols-[450px_1fr] h-full">
      <div className="h-full p-2 min-h-0">
        <Chat
          solution={solution}
          onRegenerate={handleRegenerate}
          onReset={handleReset}
          onMessageSent={onMessageSent}
          boardChanged={boardChanged}
          messages={messages}
          sendMessage={sendMessage}
          status={status}
          userId={user?.id}
        />

        {/* Evaluation Status */}
        {isEvaluating && (
          <div className="fixed bottom-4 left-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              <span>
                Generating evaluation... This may take up to 2 minutes.
              </span>
            </div>
          </div>
        )}

        {/* Evaluation Complete */}
        {isCompleted && evaluation && (
          <div className="fixed bottom-4 left-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
            <div className="space-y-2">
              <div className="text-xl font-bold">
                Overall Score: {evaluation.overall_score}/100
              </div>
              <div className="text-sm">
                Level: {evaluation.level_assessment.toUpperCase()}
              </div>
              <button
                type="button"
                onClick={() => {
                  // TODO: Navigate to evaluation page or show modal
                  logger.info("View evaluation clicked");
                }}
                className="mt-2 px-4 py-2 bg-white text-green-600 rounded hover:bg-gray-100"
              >
                View Full Evaluation
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="h-full relative pb-2 pr-2">
        <Canvas
          elements={initialElements}
          excalidrawRef={excalidrawRef}
          onChange={debouncedOnChange.maybeExecute}
        />
      </div>
    </div>
  );
}
