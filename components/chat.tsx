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
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
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
  Circle,
  CircleCheck,
  GlobeIcon,
  Link,
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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "./ai-elements/tool";
import type { ToolUIPart } from "ai";
import type { Json } from "@/lib/database.types";
import type { FinalEvaluation } from "@/lib/evaluation/schemas";
import { capitalize, cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { EvaluationCard } from "./evaluation-card";

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

  const currentStepIndex = useMemo(() => {
    return SolutionStates.findIndex((state) => state === solution.state);
  }, [solution.state]);

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
                        return (
                          <Tool defaultOpen={false} key={key}>
                            <ToolHeader
                              type={part.type as ToolUIPart["type"]}
                              state={(part as ToolUIPart).state}
                            />
                            <ToolContent>
                              <ToolInput input={(part as ToolUIPart).input} />
                              <ToolOutput
                                output={(part as ToolUIPart).output}
                                errorText={(part as ToolUIPart).errorText}
                              />
                            </ToolContent>
                          </Tool>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-3 pb-2 bg-card border rounded-md border-b-0 rounded-b-none mx-2 pt-2">
                {SolutionStates.map((state, index) => (
                  <div
                    key={state}
                    className={cn(
                      "flex-1 h-1 rounded-full",
                      index <= currentStepIndex ? "bg-green-500/80" : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent>Interview progress</TooltipContent>
          </Tooltip>
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
                {boardChanged && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Board changed
                    </span>
                    <div className="size-2 ml-auto bg-green-500 rounded-full " />
                  </div>
                )}
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
