"use client";

import { cn } from "@/lib/utils";
import type { ToolUIPart } from "ai";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolCallStatusProps = {
  /**
   * The present continuous tense (e.g., "Requesting state transition")
   */
  presentTense: string;
  /**
   * The past tense (e.g., "Requested state transition")
   */
  pastTense: string;
  /**
   * The current state of the tool from AI SDK
   */
  state: ToolUIPart["state"];
  /**
   * Optional error message to display
   */
  errorText?: string;
  /**
   * Optional icon to display. Defaults to CheckCircle for complete, AlertCircle for error, Loader2 for loading
   */
  icon?: LucideIcon;
  /**
   * Additional class names
   */
  className?: string;
};

export const ToolCallStatus = ({
  presentTense,
  pastTense,
  state,
  errorText,
  icon,
  className,
}: ToolCallStatusProps) => {
  // Determine states
  const isStreaming = state === "input-streaming";
  const isExecuting = state === "input-available";
  const isLoading = isStreaming || isExecuting;
  const isError = state === "output-error";
  const isComplete = state === "output-available";

  // Determine which text to show
  let displayText = isLoading ? presentTense : pastTense;

  // For errors, show the error message along with the failed action
  if (isError) {
    displayText = `Failed: ${pastTense.toLowerCase()}`;
    if (errorText) {
      displayText += ` - ${errorText}`;
    }
  }

  // Choose icon based on state or use provided icon
  let Icon = icon;
  switch (state) {
    case "input-streaming":
    case "input-available":
      Icon = Loader2;
      break;
    case "output-available":
      Icon = icon ?? CheckCircle;
      break;
    case "output-error":
      Icon = AlertCircle;
      break;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-xs py-2 px-2 rounded-md my-1",
        isError && "text-destructive",
        isComplete && "text-muted-foreground",
        isLoading && "text-foreground",
        className
      )}
    >
      <Icon className={cn("size-3 shrink-0", isLoading && "animate-spin")} />
      <span className={cn("font-medium", isLoading && "shimmer")}>
        {displayText}
      </span>
    </div>
  );
};
