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
import type { Solution, SolutionState } from "@/lib/types";
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
import { Circle, GlobeIcon, Link, Pen, RotateCcw } from "lucide-react";
import { Fragment, useRef, useState } from "react";
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
import { Json } from "@/lib/database.types";
import {
  FinalEvaluation,
  FinalEvaluationSchema,
} from "@/lib/evaluation/schemas";
import { capitalize } from "@/lib/utils";
import { Badge } from "./ui/badge";

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
}: {
  solution: Solution;
  onRegenerate: (messageId: string) => void;
  onReset: () => void;
  onMessageSent: () => void;
  boardChanged: boolean;
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
                const scoreColor =
                  evaluation.overall_score >= 80
                    ? "text-green-500"
                    : evaluation.overall_score >= 50
                    ? "text-yellow-500"
                    : evaluation.overall_score >= 30
                    ? "text-orange-500"
                    : "text-red-500";

                const scoreIcon =
                  evaluation.overall_score >= 80
                    ? "🏆"
                    : evaluation.overall_score >= 50
                    ? "💪"
                    : evaluation.overall_score >= 30
                    ? "🤝"
                    : "👋";
                return (
                  <Message
                    from={message.role}
                    key={key}
                    className="max-w-full border rounded-md p-4"
                  >
                    <MessageContent className="size-full">
                      <div>
                        <h3 className="text-lg font-bold">
                          Overall Score:{" "}
                          <span className={scoreColor}>
                            {evaluation.overall_score} / 100
                          </span>{" "}
                          {scoreIcon}
                        </h3>
                        <p className="text-md font-bold mb-4">
                          Level Assessment:{" "}
                          {capitalize(evaluation.level_assessment)}
                        </p>
                        <MessageResponse>{evaluation.summary}</MessageResponse>

                        <h3 className="text-lg font-bold my-2">
                          Category Scores:
                        </h3>

                        <ul className="list-disc list-inside">
                          <li>
                            <span className="font-bold">
                              {
                                evaluation.category_scores.requirements
                                  .percentage
                              }
                            </span>
                            % for Requirements
                          </li>
                          for Requirements
                          <li>
                            <span className="font-bold">
                              {evaluation.category_scores.design.percentage}
                            </span>
                            % for Design Design
                          </li>
                          <li>
                            <span className="font-bold">
                              {evaluation.category_scores.deep_dive.percentage}%
                            </span>
                            for Deep Dive
                          </li>
                          <li>
                            <span className="font-bold">
                              {
                                evaluation.category_scores.communication
                                  .percentage
                              }
                            </span>
                            % for Communication
                          </li>
                        </ul>

                        <details className="border rounded-md py-2 px-4 mt-2">
                          <summary className="text-md font-bold">
                            Top Strengths:
                          </summary>
                          {evaluation.top_strengths.map((strength) => (
                            <div key={strength.strength} className="mt-2">
                              <h4 className="text-md font-bold">
                                {strength.strength}
                              </h4>
                              <p>{strength.evidence}</p>
                            </div>
                          ))}
                        </details>

                        <details className="border rounded-md py-2 px-4 mt-2">
                          <summary className="text-md font-bold">
                            Areas for Improvement:
                          </summary>
                          {evaluation.areas_for_improvement.map((area) => (
                            <div key={area.area} className="mt-2">
                              <h4 className="text-md font-bold">{area.area}</h4>
                              <p>{area.why_important}</p>
                            </div>
                          ))}
                        </details>

                        <details className="border rounded-md py-2 px-4 mt-2">
                          <summary className="text-md font-bold">
                            Recommendations:
                          </summary>
                          {evaluation.recommendations.topics_to_revisit.map(
                            (topic) => (
                              <div key={topic.topic} className="mt-2">
                                <h4 className="text-md font-bold">
                                  {topic.topic}
                                </h4>
                                <p>{topic.why}</p>
                                <ul className="list-disc list-inside">
                                  {topic.resources.map((resource) => (
                                    <li key={resource.title}>
                                      {resource.title}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )
                          )}
                          {evaluation.recommendations.practice_strategies.map(
                            (strategy) => (
                              <div key={strategy}>
                                <h4 className="text-md">{strategy}</h4>
                              </div>
                            )
                          )}
                        </details>
                        <h3 className="text-lg font-bold my-2">
                          Next Problems to Practice:
                        </h3>
                        {evaluation.recommendations.next_problems_to_practice.map(
                          (problem) => (
                            <div key={problem} className="inline-block">
                              <Badge variant="outline">
                                <Link />
                                {problem}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
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
                              <Tooltip>
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
                              </Tooltip>
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
          <PromptInput onSubmit={handleSubmit} globalDrop multiple>
            {/* <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader> */}
            <PromptInputBody>
              <PromptInputTextarea
                className="text-sm p-2"
                onChange={(e) => setText(e.target.value)}
                ref={textareaRef}
                value={text}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
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
                  disabled={!text && !status}
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
