import { CONCLUSION_STATE_PROMPT } from "@/lib/ai/prompts/conclusion-state-prompt ";
import { DEEP_DIVE_STATE_PROMPT } from "@/lib/ai/prompts/deep-dive-state-prompt";
import { DESIGN_STATE_PROMPT } from "@/lib/ai/prompts/design-state-prompt";
import { GREETING_STATE_PROMPT } from "@/lib/ai/prompts/greeting-state-prompt";
import { INTERVIEWER_PROMPT } from "@/lib/ai/prompts/interviewer-prompt";
import { REQUIREMENT_STATE_PROMPT } from "@/lib/ai/prompts/requirements-state-prompt";
import type { SolutionState, ProblemRequirements } from "@/lib/types";

export const buildInterviewerPrompt = (
  currentState: SolutionState,
  boardChanged: boolean,
  userInfo: string,
  problemInfo: string,
  boardDiff: string,
  evaluationChecklist: Record<string, boolean>,
  requirements: ProblemRequirements
) => {
  const stateSpecificInstructions = getStateSpecificInstructions(currentState);
  const checklistStatus = formatChecklistStatus(evaluationChecklist);
  const requirementsSection = formatRequirements(requirements);

  return INTERVIEWER_PROMPT.replace("{{user_info}}", userInfo)
    .replace("{{problem_info}}", problemInfo)
    .replace("{{current_state}}", currentState)
    .replace("{{board_changed}}", boardChanged.toString())
    .replace("{{state_specific_instructions}}", stateSpecificInstructions)
    .replace("{{board_diff}}", boardDiff)
    .replace("{{checklist_status}}", checklistStatus)
    .replace("{{requirements}}", requirementsSection);
};

const getStateSpecificInstructions = (currentState: SolutionState) => {
  switch (currentState) {
    case "GREETING":
      return GREETING_STATE_PROMPT;
    case "REQUIREMENTS":
      return REQUIREMENT_STATE_PROMPT;
    case "DESIGNING":
      return DESIGN_STATE_PROMPT;
    case "DEEP_DIVE":
      return DEEP_DIVE_STATE_PROMPT;
    case "CONCLUSION":
      return CONCLUSION_STATE_PROMPT;
    default:
      throw new Error(`Unknown solution state: ${currentState}`);
  }
};

const formatChecklistStatus = (checklist: Record<string, boolean>): string => {
  const groupByPrefix = (items: [string, boolean][]) => {
    const grouped: Record<string, [string, boolean][]> = {};
    items.forEach(([key, value]) => {
      const prefix = key.split("_")[0];
      if (!grouped[prefix]) grouped[prefix] = [];
      grouped[prefix].push([key, value]);
    });
    return grouped;
  };

  const entries = Object.entries(checklist);
  const grouped = groupByPrefix(entries);

  const sections = [];

  // Calculate stats
  const total = entries.length;
  const checked = entries.filter(([_, v]) => v).length;
  const percentComplete = Math.round((checked / total) * 100);

  sections.push(`OVERALL: ${checked}/${total} (${percentComplete}%) ✓\n`);

  // Show each category
  for (const [prefix, items] of Object.entries(grouped)) {
    const categoryChecked = items.filter(([_, v]) => v).length;
    const categoryTotal = items.length;
    const categoryName = prefix.charAt(0).toUpperCase() + prefix.slice(1);

    sections.push(`${categoryName} (${categoryChecked}/${categoryTotal}):`);

    items.forEach(([key, checked]) => {
      const displayName = key.replace(`${prefix}_`, "").replace(/_/g, " ");
      const symbol = checked ? "✓" : "○";
      sections.push(`  ${symbol} ${displayName}`);
    });
    sections.push("");
  }

  return sections.join("\n");
};

const formatRequirements = (requirements: ProblemRequirements): string => {
  const sections = [];

  sections.push("FUNCTIONAL REQUIREMENTS:");
  requirements.functional.forEach((req) => {
    sections.push(`- ${req}`);
  });
  sections.push("");

  sections.push("NON-FUNCTIONAL REQUIREMENTS:");
  requirements.non_functional.forEach((req) => {
    sections.push(`- ${req}`);
  });
  sections.push("");

  if (requirements.constraints && requirements.constraints.length > 0) {
    sections.push("CONSTRAINTS:");
    requirements.constraints.forEach((constraint) => {
      sections.push(`- ${constraint}`);
    });
    sections.push("");
  }

  if (requirements.out_of_scope && requirements.out_of_scope.length > 0) {
    sections.push("OUT OF SCOPE (mention only if candidate asks):");
    requirements.out_of_scope.forEach((item) => {
      sections.push(`- ${item}`);
    });
    sections.push("");
  }

  return sections.join("\n");
};

export const getActiveTools = (currentState: SolutionState) => {
  const commonTools = ["update_checklist"];
  switch (currentState) {
    case "GREETING":
      return [...commonTools, "request_state_transition"];
    case "REQUIREMENTS":
      return [...commonTools, "request_state_transition", "get_board_state"];
    case "DESIGNING":
      return [...commonTools, "request_state_transition", "get_board_state"];
    case "DEEP_DIVE":
      return [...commonTools, "request_state_transition", "get_board_state"];
    case "CONCLUSION":
      return [...commonTools, "request_state_transition"];
  }
};
