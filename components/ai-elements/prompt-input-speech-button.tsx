"use client";

import {
  VoiceRecorderOverlay,
  type VoiceRecorderOverlayHandle,
} from "@/components/ai-elements/voice-recorder-overlay";
import {
  PromptInputButton,
  type PromptInputButtonProps,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";
import { MicIcon } from "lucide-react";
import { toast } from "sonner";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * PromptInputSpeechButton (extracted)
 * ----------------------------------
 * This file intentionally contains only the "orchestration" logic:
 * - open/close the recorder overlay
 * - optionally run native `SpeechRecognition` (Safari/Chrome)
 * - fall back to server transcription (`/api/transcribe`) for cross-browser support
 *
 * The recorder UI + MediaRecorder + waveform rendering lives in `VoiceRecorderOverlay`.
 */

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type SpeechRecognitionResultList = {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export type PromptInputSpeechButtonProps = PromptInputButtonProps & {
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  onTranscriptionChange?: (text: string) => void;
};

export const PromptInputSpeechButton = ({
  className,
  textareaRef,
  onTranscriptionChange,
  ...props
}: PromptInputSpeechButtonProps) => {
  const overlayRef = useRef<VoiceRecorderOverlayHandle | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const baseValueRef = useRef<string>("");
  const finalTranscriptRef = useRef<string>("");

  const applyText = useCallback(
    (value: string) => {
      if (textareaRef?.current) {
        const textarea = textareaRef.current;
        textarea.value = value;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
      onTranscriptionChange?.(value);
    },
    [onTranscriptionChange, textareaRef]
  );

  const appendToBase = useCallback(
    (addition: string) => {
      const base = baseValueRef.current;
      const trimmed = addition.trim();
      const next = trimmed
        ? base
          ? `${base.replace(/\s+$/, "")} ${trimmed}`
          : trimmed
        : base;
      applyText(next);
    },
    [applyText]
  );

  const transcribeBlob = useCallback(async (blob: Blob) => {
    if (!blob.size) return "";
    const file = new File([blob], "voice-input.webm", {
      type: blob.type || "audio/webm",
    });
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/transcribe", { method: "POST", body: form });
    if (!res.ok) {
      const details = await res.text().catch(() => "");
      throw new Error(details || "Transcription failed");
    }
    const json = (await res.json()) as { text?: string };
    return json.text ?? "";
  }, []);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechRecognition = new SpeechRecognition();
      speechRecognition.continuous = true;
      speechRecognition.interimResults = true;
      speechRecognition.lang = "en-US";

      speechRecognition.onresult = (event) => {
        let nextFinal = finalTranscriptRef.current;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            nextFinal += result[0]?.transcript ?? "";
          }
        }
        finalTranscriptRef.current = nextFinal;
      };

      // We rely on server transcription fallback when SpeechRecognition fails or yields nothing.
      speechRecognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current = speechRecognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  const start = useCallback(() => {
    if (open || busy) return;
    baseValueRef.current = textareaRef?.current?.value ?? "";
    finalTranscriptRef.current = "";
    setOpen(true);
    overlayRef.current?.start();

    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.error("SpeechRecognition start failed:", e);
    }
  }, [busy, open, textareaRef]);

  return (
    <>
      {!open && !busy && (
        <PromptInputButton
          className={cn("relative transition-all duration-200", className)}
          aria-label="Start voice recording"
          onClick={start}
          title="Start voice recording"
          {...props}
        >
          <MicIcon className="size-4" />
        </PromptInputButton>
      )}

      <VoiceRecorderOverlay
        ref={overlayRef}
        open={open}
        busy={busy}
        onCancel={() => {
          try {
            recognitionRef.current?.stop();
          } catch {}
          finalTranscriptRef.current = "";
          setOpen(false);
        }}
        onConfirm={async (audio) => {
          try {
            recognitionRef.current?.stop();
          } catch {}

          setBusy(true);
          try {
            const native = finalTranscriptRef.current.trim();
            if (native) {
              appendToBase(native);
            } else {
              const text = (await transcribeBlob(audio)).trim();
              if (text) {
                appendToBase(text);
              } else {
                toast.error("Couldn’t transcribe audio. Try again.");
              }
            }
          } catch (e) {
            console.error(e);
            toast.error(
              "Transcription failed. Check `/api/transcribe` logs/config."
            );
          } finally {
            setBusy(false);
            setOpen(false);
            finalTranscriptRef.current = "";
          }
        }}
      />
    </>
  );
};



