"use client";

import { Canvas } from "@/components/canvas";
import Chat from "@/components/chat";
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
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { DevTools } from "@/components/dev-tools";

export default function Page() {
  const { id } = useParams();
  const { user } = useUser();
  const client = useSupabaseBrowserClient();
  const supabase = useSupabaseBrowserClient();
  const intervirewRequestedRef = useRef(false);
  const {
    data: solution,
    error,
    isLoading,
    refetch: refetchSolution,
  } = useQuery(fetchSolutionById(supabase, id as string), {
    enabled: !!user,
  });

  // Evaluation polling
  const {
    evaluation,
    isEvaluating,
    isCompleted: isEvaluationCompleted,
    isFailed,
    error: evaluationError,
    startPolling,
  } = useEvaluationPolling(id as string);

  const isSolutionActive = solution?.status === "active";
  const isCanvasReadOnly =
    isEvaluating ||
    isEvaluationCompleted ||
    isFailed ||
    isLoading ||
    !isSolutionActive;

  // Only initialize useChat after solution is loaded
  const {
    messages,
    sendMessage,
    status,
    setMessages,
    regenerate,
    addToolOutput,
  } = useChat({
    id: id as string,
    onError(error) {
      toast.error("Error fetching messages");
      captureError(error);
      logger.error(error, "Error fetching messages");
      throw error;
    },
    messages: solution ? (solution.conversation as unknown as UIMessage[]) : [],
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onFinish: async () => {
      await refetchSolution();
    },
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
          await refetchSolution();

          addToolOutput({
            tool: "tool-conclude_interview",
            toolCallId: toolCall.toolCallId,
            output: "Interview concluded. Evaluation started.",
          });
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

  // Automatically start polling when the solution is in "evaluating" state
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (solution?.status === "evaluating") {
      startPolling();
    }
  }, [solution]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (
      !user ||
      !id ||
      !solution ||
      (solution.conversation as Json[]).length > 0 ||
      intervirewRequestedRef.current
    ) {
      return;
    }
    intervirewRequestedRef.current = true;
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

  // Show evaluation status toasts
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isEvaluationCompleted && evaluation) {
      toast.success("Evaluation complete! Check the results below.");
      logger.info({ evaluation }, "Evaluation completed");
      refetchSolution();
    }
    if (isFailed || evaluationError) {
      toast.error(evaluationError || "Evaluation failed");
    }
  }, [isEvaluationCompleted, isFailed, evaluation, evaluationError]);

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
    await updateSolution(client, solution.id, {
      status: "active",
    });
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
      status: "active",
      board_state: [] as unknown as Json[],
      prev_board_state: [] as unknown as Json[],
      conversation: [] as unknown as Json[],
      evaluated_at: null,
      evaluation: null,
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
      <div className="h-full px-2 pb-2 min-h-0">
        {/* Evaluation Status */}
        <Chat
          readonly={isCanvasReadOnly}
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
      </div>
      <div className="h-full relative pb-2 pr-2">
        <Canvas
          readonly={isCanvasReadOnly}
          elements={initialElements}
          excalidrawRef={excalidrawRef}
          onChange={debouncedOnChange.maybeExecute}
        />
      </div>
      <DevTools
        messages={messages}
        solution={solution}
        refetchSolution={refetchSolution}
      />
    </div>
  );
}
