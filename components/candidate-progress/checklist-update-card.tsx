"use client";

import { cn } from "@/lib/utils";
import { CRITERIA, type CriterionKey } from "@/lib/evaluation/criteria";
import { NotebookPen, ChevronRight, Target, Flag } from "lucide-react";
import type { ToolUIPart } from "ai";

/**
 * Type for the noted item in tool call output
 */
export type NotedItem = {
  key: string;
  name: string;
  is_red_flag: boolean;
};

/**
 * Type for the update_checklist tool result
 */
export type ChecklistUpdateResult = {
  success: boolean;
  noted: NotedItem[];
  current_score: number;
  message?: string;
};

export type ChecklistUpdateCardProps = {
  /**
   * The tool call part from the AI SDK
   */
  toolPart: ToolUIPart;
  /**
   * Optional callback when "View" is clicked
   */
  onViewClick?: () => void;
  /**
   * Additional class names
   */
  className?: string;
};

/**
 * Renders the output of an update_checklist tool call in the chat.
 * Shows what criteria were noted with a compact, non-intrusive design.
 */
export function ChecklistUpdateCard({
  toolPart,
  onViewClick,
  className,
}: ChecklistUpdateCardProps) {
  const isLoading =
    toolPart.state === "input-streaming" ||
    toolPart.state === "input-available";
  const isError = toolPart.state === "output-error";
  const isComplete = toolPart.state === "output-available";

  // Parse the output
  const output = toolPart.output as ChecklistUpdateResult | undefined;
  const notedItems = output?.noted ?? [];

  // If loading, show a simple loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm py-2 px-2 rounded-md my-1 text-muted-foreground",
          className
        )}
      >
        <NotebookPen className="size-3.5 shrink-0 animate-pulse" />
        <span className="shimmer">Making notes...</span>
      </div>
    );
  }

  // If error, show error state
  if (isError) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm py-2 px-2 rounded-md my-1 text-destructive",
          className
        )}
      >
        <NotebookPen className="size-3.5 shrink-0" />
        <span>Failed to update notes</span>
      </div>
    );
  }

  // If no items noted, show minimal feedback
  if (!isComplete || notedItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("rounded-lg border bg-card/50 p-3 my-2", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <NotebookPen className="size-3.5 shrink-0" />
        <span className="font-medium">Noted:</span>
      </div>

      {/* Noted items */}
      <div className="space-y-1.5">
        {notedItems.map((item) => {
          const Icon = item.is_red_flag ? Flag : Target;
          const iconColor = item.is_red_flag
            ? "text-red-500"
            : "text-green-500";

          return (
            <div key={item.key} className="flex items-center gap-2 text-sm">
              <Icon className={cn("size-3.5 shrink-0", iconColor)} />
              <span className="text-foreground">{item.name}</span>
            </div>
          );
        })}
      </div>

      {/* View button */}
      {onViewClick && (
        <button
          type="button"
          onClick={onViewClick}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
        >
          <span>View progress</span>
          <ChevronRight className="size-3" />
        </button>
      )}
    </div>
  );
}

/**
 * Check if a tool part is an update_checklist call
 * Tool types are formatted like "tool-call-update_checklist"
 */
export function isChecklistUpdateTool(toolPart: ToolUIPart): boolean {
  return toolPart.type.includes("update_checklist");
}
