import type { LucideIcon } from "lucide-react";
import { CheckCheck, Eye, Milestone, NotebookPen } from "lucide-react";

/**
 * Maps tool names to their present and past tense labels for display
 */
export const TOOL_CALL_LABELS: Record<
  string,
  { presentTense: string; pastTense: string; icon?: LucideIcon }
> = {
  request_state_transition: {
    presentTense: "Updating session progress",
    pastTense: "Updated session progress",
    icon: Milestone,
  },
  get_board_state: {
    presentTense: "Looking at the board",
    pastTense: "Looked at the board",
    icon: Eye,
  },
  conclude_interview: {
    presentTense: "Concluding interview",
    pastTense: "Concluded interview",
    icon: CheckCheck,
  },
  update_checklist: {
    presentTense: "Making notes",
    pastTense: "Made notes",
    icon: NotebookPen,
  },
};

/**
 * Gets the present and past tense labels for a tool call type
 * Handles both "tool-name" and "tool-call-name" formats
 */
export function getToolCallLabels(toolType: string): {
  presentTense: string;
  pastTense: string;
  icon?: LucideIcon;
} {
  // Extract tool name from type (e.g., "tool-call-request_state_transition" -> "request_state_transition")
  const toolName = toolType.replace(/^tool-call-/, "").replace(/^tool-/, "");

  // Return mapped labels or generate default ones
  return (
    TOOL_CALL_LABELS[toolName] ?? {
      presentTense: `${toolName.replace(/_/g, " ")}...`,
      pastTense: toolName.replace(/_/g, " "),
    }
  );
}
