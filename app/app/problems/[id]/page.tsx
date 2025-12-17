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
import type { Database, Json } from "@/lib/database.types";
import { type UIMessage, useChat } from "@ai-sdk/react";
import type { Solution, SolutionState } from "@/lib/types";
import { logger } from "@/lib/logger";
import { captureError } from "@/lib/observability";
import { useEvaluationPolling } from "@/lib/hooks/use-evaluation-polling";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { refresh } from "next/cache";
import { Button } from "@/components/ui/button";
import { CopyIcon, Eye, HardHat, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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

function DevTools({
  messages,
  solution,
  refetchSolution,
}: {
  messages: UIMessage[];
  solution: Solution;
  refetchSolution: () => void;
}) {
  const client = useSupabaseBrowserClient();

  const updateInterviewState = async (state: SolutionState) => {
    if (!solution) {
      return;
    }
    await updateSolution(client, solution.id, {
      state: state,
    });
    refetchSolution();
  };

  const updateInterviewStatus = async (status: Solution["status"]) => {
    if (!solution) {
      return;
    }
    await updateSolution(client, solution.id, {
      status: status,
    });
    refetchSolution();
  };

  const revertToBeforeMessage = async (messageId: string) => {
    if (!solution) {
      return;
    }
    // Remove the provided message and all messages after it
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    await updateSolution(client, solution.id, {
      conversation: messages.slice(0, idx) as unknown as Json[],
    });
    refetchSolution();
    toast.success("Reverted to before message");
  };
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="absolute top-0 right-0 h-full z-10 flex items-center justify-center">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="text-amber-500"
        size="icon"
        variant="secondary"
      >
        <HardHat />
      </Button>
      <div
        className={cn(
          "w-[800px] h-full bg-background p-2 rounded-md transition-all duration-300 opacity-100",
          "rounded-tl-md rounded-bl-md border shadow",
          !isOpen && "w-0 opacity-0"
        )}
      >
        <div
          className="grid grid-rows-[auto_auto_1fr] items-start justify-between p-2 h-full"
          style={{ minHeight: 0 }}
        >
          <h2 className="text-lg font-bold">Dev tools</h2>
          <h3>Messages: {messages.length}</h3>
          <ScrollArea className="min-h-0 h-full w-full">
            <div className="flex flex-col gap-1 w-full">
              {messages.map((message) => (
                <details
                  key={message.id}
                  open={message.id === messages[messages.length - 1].id}
                >
                  <summary className="text-sm font-medium w-full">
                    {message.role}
                  </summary>
                  <pre className="text-xs border rounded-md p-1 overflow-x-scroll size-full whitespace-pre-wrap relative">
                    {JSON.stringify(message, null, 2)}
                    <div className="absolute top-0 right-0">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => revertToBeforeMessage(message.id)}
                      >
                        <RotateCcw />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            JSON.stringify(message, null, 2)
                          );
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <CopyIcon />
                      </Button>
                    </div>
                  </pre>
                </details>
              ))}
            </div>
          </ScrollArea>
          <div className="flex flex-row gap-4 mt-2 items-center">
            <div className="flex flex-col">
              <label
                htmlFor="solution-status"
                className="text-xs font-medium pb-1"
              >
                Status
              </label>
              <select
                id="solution-status"
                value={solution?.status || ""}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  updateInterviewStatus(newStatus as Solution["status"]);
                  toast.success(`Status updated to "${newStatus}"`);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Unset</option>
                <option value="active">Active</option>
                <option value="evaluating">Evaluating</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="solution-state"
                className="text-xs font-medium pb-1"
              >
                State
              </label>
              <select
                id="solution-state"
                value={solution?.state || ""}
                onChange={(e) => {
                  const newState = e.target.value;
                  updateInterviewState(newState as SolutionState);
                  toast.success(`State updated to "${newState}"`);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Unset</option>
                <option value="GREETING">Greeting</option>
                <option value="REQUIREMENTS">Gathering requirements</option>
                <option value="DESIGNING">Designing</option>
                <option value="DEEP_DIVE">Deep dive</option>
                <option value="CONCLUSION">Conclusion</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
