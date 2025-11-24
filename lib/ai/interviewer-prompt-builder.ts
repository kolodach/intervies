import { CONCLUSION_STATE_PROMPT } from "@/lib/ai/prompts/conclusion-state-prompt ";
import { DEEP_DIVE_STATE_PROMPT } from "@/lib/ai/prompts/deep-dive-state-prompt";
import { DESIGN_STATE_PROMPT } from "@/lib/ai/prompts/design-state-prompt";
import { GREETING_STATE_PROMPT } from "@/lib/ai/prompts/greeting-state-prompt";
import { INTERVIEWER_PROMPT } from "@/lib/ai/prompts/interviewer-prompt";
import { REQUIREMENT_STATE_PROMPT } from "@/lib/ai/prompts/requirements-state-prompt";
import type { InterviewState } from "@/lib/types";

export const buildInterviewerPrompt = (
  currentState: InterviewState,
  boardChanged: boolean
) => {
  const stateSpecificInstructions = getStateSpecificInstructions(currentState);
  return INTERVIEWER_PROMPT.replace("{{current_state}}", currentState)
    .replace("{{board_changed}}", boardChanged.toString())
    .replace("{{state_specific_instructions}}", stateSpecificInstructions);
};

const getStateSpecificInstructions = (currentState: InterviewState) => {
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
      throw new Error(`Unknown interview state: ${currentState}`);
  }
};

export const getActiveTools = (currentState: InterviewState) => {
  switch (currentState) {
    case "GREETING":
      return ["fetchUserInfo", "fetchQuestionDetails"];
    case "REQUIREMENTS":
      return ["fetchQuestionDetails"];
    case "DESIGNING":
      return ["fetchQuestionDetails"];
  }
};
