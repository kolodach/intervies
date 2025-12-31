"use client";

import { Canvas } from "@/components/canvas";
import Chat from "@/components/chat";
import {
  fetchSolutionById,
  fetchSolutionState,
  updateSolution,
} from "@/lib/queries/solutions";
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
import type { Solution, SolutionState } from "@/lib/types";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/observability";
import { useEvaluationPolling } from "@/lib/hooks/use-evaluation-polling";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { DevTools } from "@/components/dev-tools";
import { useMutation } from "@tanstack/react-query";
import { useUsageLimits } from "@/lib/hooks/use-usage-limits";

export default function Page() {
  const { id } = useParams();
  const { user } = useUser();
  const client = useSupabaseBrowserClient();
  const supabase = useSupabaseBrowserClient();
  const intervirewRequestedRef = useRef(false);
  const initialMessagesLoadedRef = useRef(false);
  const { usageLimitReached, freeLimitExceeded, currentPeriodEnd } =
    useUsageLimits();

  // Full solution query - used only for initial data and board state
  const {
    data: solution,
    error,
    isLoading,
    refetch: refetchSolution,
  } = useQuery(fetchSolutionById(supabase, id as string), {
    enabled: !!user,
  });

  // Lightweight state-only query - used to refresh state without affecting messages
  const { data: solutionState, refetch: refetchSolutionState } = useQuery(
    fetchSolutionState(supabase, id as string),
    {
      enabled: !!user && !!solution, // Only after initial solution loads
    }
  );

  // Derived state: prefer the lightweight solutionState for up-to-date values
  const currentStatus = solutionState?.status ?? solution?.status;
  const currentState = solutionState?.state ?? solution?.state;

  // Flag to force message sync on next solution refetch
  const forceMessageSyncRef = useRef(false);

  // Helper to refetch state only (used during streaming to avoid message re-renders)
  const refetchStateOnly = async () => {
    await refetchSolutionState();
  };

  // Helper to refetch everything INCLUDING messages (for conclude/evaluation/devtools)
  const refetchWithMessages = async () => {
    forceMessageSyncRef.current = true;
    await Promise.all([refetchSolution(), refetchSolutionState()]);
  };

  const { mutate: concludeInterview, isPending: isConcludingInterview } =
    useMutation({
      mutationFn: async () => {
        await fetch(`/api/v1/solutions/${id as string}/conclude`, {
          method: "POST",
        });
      },
      onSuccess: () => {
        refetchWithMessages();
      },
      onError: (error) => {
        toast.error("Error concluding interview");
        captureError(error);
        logger.error(error, "Error concluding interview");
      },
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

  const isSolutionActive = currentStatus === "active";
  const isCanvasReadOnly =
    isEvaluating ||
    isEvaluationCompleted ||
    isFailed ||
    isLoading ||
    !isSolutionActive;

  // Only initialize useChat after solution is loaded
  const { messages, sendMessage, status, setMessages, regenerate } = useChat({
    id: id as string,
    onError(error) {
      toast.error("Error fetching messages");
      captureError(error);
      logger.error(error, "Error fetching messages");
      throw error;
    },
    onFinish: async () => {
      // Only refresh state, not the full solution with messages
      await refetchSolutionState();
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  // Sync messages from solution on initial load OR when forced (conclude/evaluation/devtools)
  useEffect(() => {
    if (!solution?.conversation) return;

    const shouldSync =
      // Initial load: messages are empty and not yet loaded
      (!initialMessagesLoadedRef.current && messages.length === 0) ||
      // Forced sync: after conclude, evaluation, or devtools action
      forceMessageSyncRef.current;

    if (shouldSync) {
      const conversationMessages =
        solution.conversation as unknown as UIMessage[];
      if (conversationMessages.length > 0) {
        setMessages(conversationMessages);
        initialMessagesLoadedRef.current = true;
        forceMessageSyncRef.current = false;
      }
    }
  }, [solution?.conversation, messages.length, setMessages]);

  // Automatically start polling when the solution is in "evaluating" state
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (currentStatus === "evaluating") {
      startPolling();
    }
  }, [currentStatus]);

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
          currentState: currentState as SolutionState,
          boardChanged: boardChanged,
        },
      }
    );
  }, [id, user, solution, currentState]);

  const [boardChanged, setBoardChanged] = useState(false);

  // Show evaluation status toasts
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isEvaluationCompleted && evaluation) {
      toast.success("Evaluation complete! Check the results below.");
      logger.info({ evaluation }, "Evaluation completed");
      refetchWithMessages();
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
        currentState: currentState as SolutionState,
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
          isConcludingInterview={isConcludingInterview || isEvaluating}
          onConcludeInterview={concludeInterview}
          readonly={isCanvasReadOnly}
          solution={solution}
          interviewState={currentState as SolutionState}
          interviewStatus={currentStatus as Solution["status"]}
          onRegenerate={handleRegenerate}
          onReset={handleReset}
          onMessageSent={onMessageSent}
          boardChanged={boardChanged}
          messages={messages}
          sendMessage={sendMessage}
          status={status}
          userId={user?.id}
          usageLimitReached={usageLimitReached}
          freeLimitExceeded={freeLimitExceeded}
          currentPeriodEnd={currentPeriodEnd}
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
        refetchSolution={refetchWithMessages}
      />
    </div>
  );
}
