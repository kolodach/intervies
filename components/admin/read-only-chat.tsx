"use client";

import { Fragment } from "react";
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
import { EvaluationCard } from "@/components/evaluation-card";
import type { Json } from "@/lib/database.types";
import type { FinalEvaluation } from "@/lib/evaluation/schemas";
import { cn } from "@/lib/utils";

interface MessagePart {
  type: string;
  text?: string;
  state?: string;
  errorText?: string;
}

interface ChatMessage {
  id: string;
  role: string;
  parts: MessagePart[];
  metadata?: Record<string, unknown>;
}

interface ReadOnlyChatProps {
  messages: ChatMessage[];
  evaluation?: Json | null;
}

export function ReadOnlyChat({ messages, evaluation }: ReadOnlyChatProps) {
  // Find the last assistant message to attach evaluation to it
  const lastAssistantIndex = [...messages]
    .reverse()
    .findIndex((m) => m.role === "assistant");
  const evaluationMessageIndex =
    lastAssistantIndex >= 0 ? messages.length - 1 - lastAssistantIndex : -1;

  return (
    <div className="h-full flex flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="pb-4">
          {/* Top gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-[16px] pointer-events-none z-10 bg-gradient-to-b from-background to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[16px] pointer-events-none z-10 bg-gradient-to-t from-background to-transparent" />

          {/* Skip first message (system prompt) */}
          {messages.slice(1).map((message, index) => {
            const key = `${message.id}-${index}`;

            // Check if this message has evaluation in metadata
            const containsEvaluation =
              message.metadata &&
              typeof message.metadata === "object" &&
              "evaluation" in message.metadata;

            if (containsEvaluation) {
              const evalData = (message.metadata as { evaluation: Json })
                ?.evaluation as FinalEvaluation;

              return (
                <Message
                  from={message.role as "user" | "assistant"}
                  key={key}
                  className="max-w-full border rounded-md p-4"
                >
                  <MessageContent className="size-full">
                    <EvaluationCard evaluation={evalData} />
                  </MessageContent>
                </Message>
              );
            }

            return (
              <Message
                from={message.role as "user" | "assistant"}
                key={key}
                className="max-w-full"
              >
                <MessageContent className="size-full">
                  {message.parts.map((part, i) => {
                    const partKey = `${message.id}-${i}`;

                    // Handle tool calls (simplified display)
                    if (part.type.startsWith("tool-")) {
                      return (
                        <div
                          key={partKey}
                          className="text-xs text-muted-foreground italic py-1"
                        >
                          {part.state === "result" ? "✓" : "⋯"}{" "}
                          {part.type.replace("tool-", "")}
                        </div>
                      );
                    }

                    switch (part.type) {
                      case "text":
                        return (
                          <div key={partKey}>
                            <MessageResponse>{part.text || ""}</MessageResponse>
                          </div>
                        );
                      case "step-start":
                        return null;
                      default:
                        // Show unknown parts as JSON for debugging
                        if (part.text) {
                          return (
                            <MessageResponse key={partKey}>
                              {part.text}
                            </MessageResponse>
                          );
                        }
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            );
          })}

          {/* Show evaluation at the end if present and not in messages */}
          {evaluation && !messages.some((m) => m.metadata?.evaluation) && (
            <Message from="assistant" className="max-w-full border rounded-md p-4">
              <MessageContent className="size-full">
                <EvaluationCard evaluation={evaluation as FinalEvaluation} />
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}

