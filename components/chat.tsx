"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
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
  CheckCircle,
  Circle,
  CircleCheck,
  GlobeIcon,
  Link,
  Loader2,
  Pen,
  RotateCcw,
} from "lucide-react";
import { Fragment, useMemo, useRef, useState } from "react";
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
  onConcludeInterview,
  isConcludingInterview,
  onRegenerate,
  onReset,
  onMessageSent,
  boardChanged,
  messages,
  sendMessage,
  status,
  userId,
  readonly,
}: {
  solution: Solution;
  onRegenerate: (messageId: string) => void;
  onReset: () => void;
  onMessageSent: () => void;
  isConcludingInterview: boolean;
  onConcludeInterview: () => void;
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
}) {
  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const client = useSupabaseBrowserClient();
  const isInterviewCompleted = useMemo(() => {
    return solution.status === "completed";
  }, [solution.status]);
  const canConcludeInterview = useMemo(() => {
    return solution.state === "CONCLUSION" && solution.status === "active";
  }, [solution]);

  const currentStepIndex = useMemo(() => {
    return SolutionStates.findIndex((state) => state === solution.state);
  }, [solution.state]);

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
          currentState: solution.state as SolutionState,
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
        <Conversation>
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
                        case "text":
                          return (
                            <div
                              className="flex flex-col items-center gap-2 group"
                              key={key}
                            >
                              <MessageResponse>{part.text}</MessageResponse>
                              {/* <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => onRegenerate(message.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <RotateCcw />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Regenerate response
                                </TooltipContent>
                              </Tooltip> */}
                            </div>
                          );
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
          <div className="px-2 pb-2 bg-card/80 border rounded-md border-b-0 rounded-b-none mx-2 pt-2">
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
                  <h3 className="text-lg font-medium">Interview Completed</h3>
                  <CheckCircle className="size-4 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  The interview is complete and your evaluation is ready.
                  <b> Both chat and board are now read-only.</b>
                </p>
              </div>
            )}
            {canConcludeInterview && !isConcludingInterview && (
              <div className="mb-4">
                <h3 className="text-lg font-medium">Interview Completed</h3>
                <p className="text-sm text-muted-foreground">
                  You've complted all steps of the interview. Ask any additional
                  questions or click the button to receive your detailed
                  evaluation.
                </p>
                <Button
                  variant="default"
                  className="w-full mt-2"
                  onClick={handleConcludeInterview}
                >
                  <CheckCircle />
                  <span>Conclude Interview</span>
                </Button>
              </div>
            )}
            <div className="flex items-center gap-[4px]">
              {SolutionStates.map((state, index) => (
                <div
                  key={state}
                  className={cn(
                    "flex-1 h-[3px] rounded-full",
                    index <= currentStepIndex ? "bg-green-500/80" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <PromptInput onSubmit={handleSubmit} globalDrop multiple>
            {/* <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader> */}
            <PromptInputBody>
              <PromptInputTextarea
                disabled={readonly || status === "streaming"}
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
                  disabled={readonly || status === "streaming"}
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
                    (!text && !status) || readonly || status === "streaming"
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
