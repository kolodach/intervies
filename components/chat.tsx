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
import { useChat } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { GlobeIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export default function Chat() {
  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useUser();
  const { messages, sendMessage, status } = useChat();
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
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
          webSearch: useWebSearch,
          userId: user?.id,
          questionId: "5bc10acc-f791-4677-86d1-c0f54f959704",
          currentState: "GREETING",
          boardChanged: false,
        },
      }
    );
    setText("");
  };

  return (
    <div className="mx-auto relative size-full h-full">
      <div className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
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
              <PromptInputButton
                onClick={() => setUseWebSearch(!useWebSearch)}
                variant={useWebSearch ? "default" : "ghost"}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
