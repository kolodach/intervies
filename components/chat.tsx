"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { useStickToBottomContext } from "use-stick-to-bottom";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { PromptInputSpeechButton } from "@/components/ai-elements/prompt-input-speech-button";
import { fetchProblemBySolutionId } from "@/lib/queries/problems";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { SolutionStates, type Solution, type SolutionState } from "@/lib/types";
import type { UIMessage } from "@ai-sdk/react";
import type {
  ChatRequestOptions,
  ChatStatus,
  CreateUIMessage,
  FileUIPart,
} from "ai";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  CheckCircle,
  Circle,
  CircleCheck,
  GlobeIcon,
  Link,
  Loader2,
  Pen,
  RotateCcw,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ToolUIPart } from "ai";
import type { Json } from "@/lib/database.types";
import type { FinalEvaluation } from "@/lib/evaluation/schemas";
import { capitalize, cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { EvaluationCard } from "./evaluation-card";
import { ToolCallStatus } from "./ai-elements/tool-call-status";
import { getToolCallLabels } from "./ai-elements/tool-call-labels";
import { UsageLimitBanner } from "./usage-limit-banner";
import { FreeLimitExceededBanner } from "./free-limit-exceeded-banner";
import {
  ProgressPanel,
  ChecklistUpdateCard,
  isChecklistUpdateTool,
} from "./candidate-progress";
import { getDefaultChecklist } from "@/lib/evaluation/criteria";

/**
 * Analyzes text for thinking state:
 * - isThinking: has <thinking> but no </thinking> yet (streaming)
 * - hadThinking: has complete <thinking>...</thinking> block
 */
function getThinkingState(text: string): {
  isThinking: boolean;
  hadThinking: boolean;
} {
  const hasOpenTag = /<thinking>/i.test(text);
  const hasCloseTag = /<\/thinking>/i.test(text);

  return {
    isThinking: hasOpenTag && !hasCloseTag,
    hadThinking: hasOpenTag && hasCloseTag,
  };
}

/**
 * Strips <thinking>...</thinking> blocks from AI responses.
 */
function stripThinkingText(text: string): string {
  return text.replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, "").trim();
}

// Scroll to bottom when triggered (must be inside Conversation context)
function ScrollToBottomEffect({ trigger }: { trigger: boolean }) {
  const { scrollToBottom } = useStickToBottomContext();

  useEffect(() => {
    if (trigger) {
      // Small delay to ensure new content is rendered
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [trigger, scrollToBottom]);

  return null;
}

export function ResetDialog({ onReset }: { onReset: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <PromptInputButton>
          <RotateCcw />
          <span>Restart</span>
        </PromptInputButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start over?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will reset the session and start over. You will lose any
            progress you have made.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onReset}>Restart</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function Chat({
  solution,
  interviewState,
  interviewStatus,
  onConcludeInterview,
  isConcludingInterview,
  isEvaluationCompleted = false,
  onRegenerate,
  onReset,
  onMessageSent,
  boardChanged,
  messages,
  sendMessage,
  status,
  userId,
  readonly,
  usageLimitReached = false,
  freeLimitExceeded = false,
  currentPeriodEnd = null,
  evaluationChecklist = null,
}: {
  solution: Solution;
  interviewState: SolutionState;
  interviewStatus: Solution["status"];
  onRegenerate: (messageId: string) => void;
  onReset: () => void;
  onMessageSent: () => void;
  isConcludingInterview: boolean;
  onConcludeInterview: () => void;
  isEvaluationCompleted?: boolean;
  boardChanged: boolean;
  readonly: boolean;
  messages: UIMessage[];
  sendMessage: (
    message?:
      | (CreateUIMessage<UIMessage> & {
          text?: never;
          files?: never;
          messageId?: string;
        })
      | {
          text: string;
          files?: FileList | FileUIPart[];
          parts?: never;
          messageId?: string;
        }
      | {
          files: FileList | FileUIPart[];
          parts?: never;
          messageId?: string;
        },
    options?: ChatRequestOptions
  ) => Promise<void>;
  status: ChatStatus | undefined;
  userId?: string;
  usageLimitReached?: boolean;
  freeLimitExceeded?: boolean;
  currentPeriodEnd?: string | null;
  evaluationChecklist?: Record<string, boolean> | null;
}) {
  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);

  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const client = useSupabaseBrowserClient();

  // Use provided checklist or default
  const checklist = evaluationChecklist ?? getDefaultChecklist();

  // Use the passed state/status props (which come from the lightweight query for freshness)
  const isInterviewCompleted = interviewStatus === "completed";
  const canConcludeInterview =
    interviewState === "CONCLUSION" && interviewStatus === "active";
  const currentStepIndex = SolutionStates.findIndex(
    (state) => state === interviewState
  );

  const handleConcludeInterview = () => {
    onConcludeInterview();
  };

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          userId: userId,
          problemId: solution.problem_id,
          solutionId: solution.id,
          currentState: interviewState,
          boardChanged: boardChanged,
        },
      }
    );
    setText("");
    onMessageSent();
  };

  return (
    <div className="mx-auto relative size-full h-full">
      <div className="flex flex-col h-full">
        {freeLimitExceeded && <FreeLimitExceededBanner />}
        {usageLimitReached && !freeLimitExceeded && (
          <UsageLimitBanner currentPeriodEnd={currentPeriodEnd} />
        )}
        <Conversation>
          <ScrollToBottomEffect trigger={isEvaluationCompleted} />
          <ConversationContent>
            {/* Top and bottom gradient overlays */}
            <div className="absolute top-0 left-0 right-0 h-[16px] pointer-events-none z-10 bg-gradient-to-b from-background to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[16px] pointer-events-none z-10 bg-gradient-to-t from-background to-transparent" />
            {/* Messages */}
            {messages.slice(1).map((message, index) => {
              const key = `${message.id}-${index}`;

              const containsEvaluation =
                message.metadata &&
                typeof message.metadata === "object" &&
                "evaluation" in message.metadata;
              if (containsEvaluation) {
                const evaluation = (message.metadata as { evaluation: Json })
                  ?.evaluation as FinalEvaluation;

                return (
                  <Message
                    from={message.role}
                    key={key}
                    className="max-w-full border rounded-md p-4"
                  >
                    <MessageContent className="size-full">
                      <EvaluationCard evaluation={evaluation} />
                    </MessageContent>
                  </Message>
                );
              }

              return (
                <Message from={message.role} key={key} className="max-w-full">
                  <MessageContent className="size-full">
                    {message.parts.map((part, i) => {
                      const key = `${message.id}-${i}`;
                      const isTool = part.type.startsWith("tool-");
                      if (isTool) {
                        const toolPart = part as ToolUIPart;

                        // Use custom card for update_checklist tool
                        if (isChecklistUpdateTool(toolPart)) {
                          return (
                            <ChecklistUpdateCard
                              key={key}
                              toolPart={toolPart}
                              onViewClick={() => setIsProgressExpanded(true)}
                            />
                          );
                        }

                        // Default tool call status for other tools
                        const { presentTense, pastTense, icon } =
                          getToolCallLabels(toolPart.type);
                        return (
                          <ToolCallStatus
                            key={key}
                            presentTense={presentTense}
                            pastTense={pastTense}
                            state={toolPart.state}
                            errorText={toolPart.errorText}
                            icon={icon}
                          />
                        );
                      }
                      switch (part.type) {
                        case "text": {
                          const { isThinking, hadThinking } = getThinkingState(
                            part.text
                          );

                          // Still streaming thinking - show indicator only
                          if (isThinking) {
                            return (
                              <div
                                className="inline-flex items-center gap-2 text-xs py-2 px-2 rounded-md text-muted-foreground"
                                key={key}
                              >
                                <Brain className="size-3 shrink-0" />
                                <span className="font-medium animate-pulse">
                                  Thinking...
                                </span>
                              </div>
                            );
                          }

                          // Finished thinking - show "Thought" + response
                          return (
                            <div
                              className="flex flex-col items-start gap-2 group"
                              key={key}
                            >
                              {hadThinking && (
                                <div className="inline-flex items-center gap-2 text-xs py-2 px-2 rounded-md text-muted-foreground">
                                  <Brain className="size-3 shrink-0" />
                                  <span className="font-medium">Thought</span>
                                </div>
                              )}
                              <MessageResponse>
                                {stripThinkingText(part.text)}
                              </MessageResponse>
                            </div>
                          );
                        }
                        case "step-start":
                          return null;
                        default:
                          return (
                            <pre
                              key={key}
                              className="text-xs border rounded-md p-2 overflow-x-scroll size-full"
                            >
                              {JSON.stringify(part, null, 2)
                                .split("\\n")
                                .map((line, i) => (
                                  <Fragment
                                    key={`${line}-${
                                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                      i
                                    }`}
                                  >
                                    {line}
                                    <br />
                                  </Fragment>
                                ))}
                            </pre>
                          );
                      }
                    })}
                  </MessageContent>
                </Message>
              );
            })}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="relative">
          <div className="bg-card/80 border rounded-md border-b-0 rounded-b-none mx-2">
            {isConcludingInterview && (
              <div className="mb-4 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Interview evaluation is in progress...
                </p>
              </div>
            )}
            {isInterviewCompleted && (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Interview Completed</h3>
                  <CheckCircle className="size-4 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground">
                  The interview is complete and your evaluation is ready.
                  <b> Both chat and board are now read-only.</b>
                </p>
              </div>
            )}
            {!isInterviewCompleted && canConcludeInterview && (
              <div className="mb-4 mt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Interview is ready to be concluded
                  </h3>
                  <Button
                    variant="default"
                    size="sm"
                    className="ml-2"
                    onClick={handleConcludeInterview}
                  >
                    <CheckCircle className="size-4 text-green-800" />
                    Conclude Interview
                  </Button>
                </div>
              </div>
            )}
            {/* Progress Panel with interview state stepper */}
            <ProgressPanel
              checklist={checklist}
              interviewState={interviewState}
              isExpanded={isProgressExpanded}
              onExpandedChange={setIsProgressExpanded}
            />
          </div>
          <PromptInput onSubmit={handleSubmit} globalDrop multiple>
            {/* <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader> */}
            <PromptInputBody>
              <PromptInputTextarea
                disabled={
                  readonly ||
                  status === "streaming" ||
                  usageLimitReached ||
                  freeLimitExceeded
                }
                className="text-sm p-2"
                onChange={(e) => setText(e.target.value)}
                ref={textareaRef}
                value={text}
              />
            </PromptInputBody>
            <PromptInputFooter className="dark:bg-card">
              <PromptInputTools>
                {/* <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu> */}
                <PromptInputSpeechButton
                  disabled={
                    readonly ||
                    status === "streaming" ||
                    usageLimitReached ||
                    freeLimitExceeded
                  }
                  onTranscriptionChange={setText}
                  textareaRef={textareaRef}
                />
                <ResetDialog onReset={onReset} />
                {/* <PromptInputButton
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  variant={useWebSearch ? "default" : "ghost"}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton> */}
              </PromptInputTools>
              <div className="flex items-center gap-2">
                <PromptInputSubmit
                  disabled={
                    (!text && !status) ||
                    readonly ||
                    status === "streaming" ||
                    usageLimitReached ||
                    freeLimitExceeded
                  }
                  status={status}
                />
              </div>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
