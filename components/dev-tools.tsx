"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HardHat, RotateCcw, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateSolution } from "@/lib/queries/solutions";
import type { UIMessage } from "@ai-sdk/react";
import type { Solution, SolutionState } from "@/lib/types";
import type { Json } from "@/lib/database.types";

interface DevToolsProps {
  messages: UIMessage[];
  solution: Solution;
  refetchSolution: () => void;
}

export function DevTools({
  messages,
  solution,
  refetchSolution,
}: DevToolsProps) {
  // Only render in development mode
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const client = useSupabaseBrowserClient();
  const [isOpen, setIsOpen] = useState(false);

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
