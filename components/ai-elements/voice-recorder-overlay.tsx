"use client";

import { InputGroupButton } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

/**
 * VoiceRecorderOverlay
 * --------------------
 * This component owns everything related to the **recording UI**:
 * - microphone capture (`getUserMedia`)
 * - encoding (`MediaRecorder`)
 * - visualizer ("spikes over time") using Web Audio (`AnalyserNode`)
 * - timer + recorder overlay layout
 *
 * It deliberately does NOT do transcription. Instead, it returns an audio Blob to
 * the parent via `onConfirm(blob, durationMs)` so the caller can decide whether
 * to use `SpeechRecognition` (native) or server transcription (/api/transcribe).
 *
 * Why so many constants?
 * - Audio UIs tend to require tuning. The constants below are documented and
 *   grouped so they can be adjusted without hunting through the draw loop.
 */

export type VoiceRecorderOverlayHandle = {
  /**
   * Start a recording session.
   *
   * IMPORTANT: call this from a user gesture handler (e.g. onClick) so Chrome
   * will allow AudioContext to resume and mic capture to start.
   */
  start: () => void;

  /**
   * Cancel current session (stop recording, discard audio, close overlay).
   */
  cancel: () => void;
};

export type VoiceRecorderOverlayProps = {
  /** Whether the overlay is visible (positioned absolutely over footer row). */
  open: boolean;
  /** Disable UI + show spinner while parent is processing (e.g., transcription). */
  busy?: boolean;
  /** Called when user cancels (X). */
  onCancel: () => void;
  /**
   * Called when user confirms (✓). The overlay will stop recording, assemble the blob,
   * and call this handler. The parent should return a promise if it needs time (e.g. API call).
   */
  onConfirm: (audio: Blob, durationMs: number) => void | Promise<void>;
};

// ---- Tunables (documented) -------------------------------------------------

/** Timer update interval. 250ms feels responsive without causing excessive re-renders. */
const TIMER_TICK_MS = 100;

/**
 * How much recording history is visible across the bar.
 * Larger = slower scrolling / more "imprinted" waveform.
 */
const WAVE_VISIBLE_SECONDS = 5;

/**
 * Analyser configuration:
 * - fftSize: larger -> more samples -> more stable RMS estimate (but more CPU)
 * - smoothing: closer to 1 -> smoother visuals, less jitter
 */
const ANALYSER_FFT_SIZE = 1024;
const ANALYSER_SMOOTHING = 0.9;

/**
 * RMS smoothing:
 * - high inertia prevents twitchy visuals
 * - keep this responsive enough to show syllables
 */
const LEVEL_SMOOTH_ALPHA = 0.85;

/**
 * Auto-gain:
 * Track a slowly-decaying peak and normalize by it.
 *
 * This is important because browsers can report vastly different absolute amplitudes.
 * (Chrome can look nearly flat without normalization.)
 */
const PEAK_DECAY = 0.995;
const PEAK_FLOOR = 0.01;

/**
 * Wave drawing:
 * - Use small rounded bars with gaps for a subtle ChatGPT-like recorder feel.
 */
const BAR_WIDTH_PX = 2;
const BAR_GAP_PX = 2;
const BAR_MAX_HEIGHT_RATIO = 0.85;
const BAR_MIN_HEIGHT_PX = 2;

/**
 * Shape curve:
 * Input (0..1) -> shaped (0..1). Lower exponent emphasizes small signals.
 */
const SHAPE_GAIN = 1.35;
const SHAPE_EXP = 0.7;

// ---------------------------------------------------------------------------

function pickSupportedMimeType(): string {
  // Try common types across browsers.
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  for (const type of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }
  return "";
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const VoiceRecorderOverlay = forwardRef<
  VoiceRecorderOverlayHandle,
  VoiceRecorderOverlayProps
>(({ open, busy = false, onCancel, onConfirm }, ref) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  // Timer
  const timerIntervalRef = useRef<number | null>(null);
  const startedAtMsRef = useRef(0);

  // Meter canvas + WebAudio
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const samplesRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Wave history
  const historyRef = useRef<number[]>([]);
  const smoothedLevelRef = useRef(0);
  const peakRef = useRef(0.02);
  const lastSampleAtRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startedAtMsRef.current = Date.now();
    setElapsedMs(0);
    timerIntervalRef.current = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAtMsRef.current);
    }, TIMER_TICK_MS);
  }, [stopTimer]);

  const stopMeter = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      sourceRef.current?.disconnect();
    } catch {}
    sourceRef.current = null;
    analyserRef.current = null;
    samplesRef.current = null;
    historyRef.current = [];
    smoothedLevelRef.current = 0;
    peakRef.current = 0.02;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startMeter = useCallback(
    (stream: MediaStream) => {
      stopMeter();
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        return;
      }

      // Create + resume under user gesture (caller should call `start()` from onClick).
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;
      audioContext.resume().catch(() => {});

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;
      analyser.smoothingTimeConstant = ANALYSER_SMOOTHING;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      // getByteTimeDomainData expects a buffer sized to analyser.fftSize.
      samplesRef.current = new Uint8Array(
        analyser.fftSize
      ) as Uint8Array<ArrayBuffer>;
      historyRef.current = [];
      smoothedLevelRef.current = 0;
      peakRef.current = 0.02;
      lastSampleAtRef.current = performance.now();

      const drawRoundRect = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) => {
        const radius = Math.min(r, w / 2, h / 2);
        const rr = (
          ctx as CanvasRenderingContext2D & {
            roundRect?: (
              x: number,
              y: number,
              w: number,
              h: number,
              radii: number
            ) => void;
          }
        ).roundRect;
        if (typeof rr === "function") {
          rr.call(ctx, x, y, w, h, radius);
          return;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.arcTo(x + w, y, x + w, y + radius, radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
        ctx.lineTo(x + radius, y + h);
        ctx.arcTo(x, y + h, x, y + h - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
      };

      const draw = () => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        const samples = samplesRef.current;
        if (!canvas || !analyser || !samples) {
          return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return;
        }

        // Sync backing resolution with CSS size.
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(rect.width * dpr));
        const height = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        // RMS from time-domain samples.
        analyser.getByteTimeDomainData(samples);
        let sumSq = 0;
        for (let i = 0; i < samples.length; i++) {
          const v = (samples[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / samples.length);

        // Smooth RMS (EMA).
        const prev = smoothedLevelRef.current;
        const smoothed =
          prev * LEVEL_SMOOTH_ALPHA + rms * (1 - LEVEL_SMOOTH_ALPHA);
        smoothedLevelRef.current = smoothed;

        // Auto-gain normalize (peak with slow decay).
        const peakPrev = peakRef.current;
        const peak = Math.max(smoothed, peakPrev * PEAK_DECAY);
        peakRef.current = peak;
        const normalized = Math.min(1, smoothed / Math.max(peak, PEAK_FLOOR));

        // Compute how many bars fit horizontally.
        const barWidth = BAR_WIDTH_PX * dpr;
        const gap = BAR_GAP_PX * dpr;
        const bars = Math.max(24, Math.floor(width / (barWidth + gap)));

        // Sample rate derived from desired visible history window.
        const sampleEveryMs = (WAVE_VISIBLE_SECONDS * 1000) / bars;

        const now = performance.now();
        const last = lastSampleAtRef.current;
        const elapsed = now - last;
        if (elapsed >= sampleEveryMs) {
          // Cap steps to avoid big jumps after tab inactivity.
          const steps = Math.min(10, Math.floor(elapsed / sampleEveryMs));
          const history = historyRef.current;
          for (let s = 0; s < steps; s++) {
            history.push(normalized);
          }
          if (history.length > bars) {
            history.splice(0, history.length - bars);
          }
          lastSampleAtRef.current = last + steps * sampleEveryMs;
        }

        // Draw.
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgba(255,255,255,0.65)";

        const history = historyRef.current;
        const startIndex = Math.max(0, bars - history.length);
        const midY = height / 2;

        for (let i = 0; i < bars; i++) {
          const hIdx = i - startIndex;
          const level = hIdx >= 0 ? history[hIdx] : 0;
          const shaped = Math.min(1, (level * SHAPE_GAIN) ** SHAPE_EXP);
          const barH = Math.max(
            BAR_MIN_HEIGHT_PX * dpr,
            shaped * (height * BAR_MAX_HEIGHT_RATIO)
          );

          const x = i * (barWidth + gap);
          const y = midY - barH / 2;
          const radius = barWidth / 2;
          ctx.beginPath();
          drawRoundRect(ctx, x, y, barWidth, barH, radius);
          ctx.fill();
        }

        rafRef.current = window.requestAnimationFrame(draw);
      };

      rafRef.current = window.requestAnimationFrame(draw);
    },
    [stopMeter]
  );

  const stopRecordingInternal = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.requestData?.();
      } catch {}
      recorder.stop();
    }

    const stream = mediaStreamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    mediaStreamRef.current = null;
    stopMeter();
    stopTimer();
    setIsRecording(false);
  }, [stopMeter, stopTimer]);

  const startRecordingInternal = useCallback(async () => {
    recordedChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    startMeter(stream);

    const mimeType = pickSupportedMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    );
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };
    recorder.start();
    setIsRecording(true);
    startTimer();
  }, [startMeter, startTimer]);

  const cancel = useCallback(() => {
    stopRecordingInternal();
    recordedChunksRef.current = [];
    onCancel();
  }, [onCancel, stopRecordingInternal]);

  const confirm = useCallback(async () => {
    if (busy) {
      return;
    }
    stopRecordingInternal();

    // Brief delay to allow MediaRecorder to flush final chunks.
    await new Promise((r) => setTimeout(r, 250));
    const chunks = recordedChunksRef.current;
    const blob = new Blob(chunks, {
      type: chunks[0] instanceof Blob ? (chunks[0] as Blob).type : undefined,
    });
    await onConfirm(blob, elapsedMs);
  }, [busy, elapsedMs, onConfirm, stopRecordingInternal]);

  useImperativeHandle(
    ref,
    () => ({
      start: () => {
        if (busy || isRecording) return;
        // Start mic capture & meter in the same tick as the click (user gesture).
        startRecordingInternal().catch((e) => {
          console.error("Microphone capture failed:", e);
          cancel();
        });
      },
      cancel,
    }),
    [busy, cancel, isRecording, startRecordingInternal]
  );

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopRecordingInternal();
    };
  }, [stopRecordingInternal]);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center">
      <div className="flex w-full items-center gap-2 bg-card px-2 py-1">
        <InputGroupButton
          aria-label="Cancel recording"
          disabled={busy}
          onClick={cancel}
          size="icon-sm"
          title="Cancel"
          variant="ghost"
        >
          <XIcon className="size-4" />
        </InputGroupButton>

        <div className="flex flex-1 items-center gap-3 px-1">
          <div className="flex flex-1 items-center rounded-full bg-card px-2 py-1">
            <canvas
              ref={canvasRef}
              className={cn(
                "h-5 w-full",
                isRecording ? "opacity-100" : "opacity-60"
              )}
            />
          </div>

          <span className="tabular-nums text-xs text-muted-foreground">
            {formatTime(elapsedMs)}
          </span>

          {busy && (
            <Loader2Icon
              aria-label="Transcribing"
              className="size-4 animate-spin text-muted-foreground"
            />
          )}
        </div>

        <InputGroupButton
          aria-label="Stop and transcribe"
          disabled={busy}
          onClick={confirm}
          size="icon-sm"
          title={busy ? "Transcribing…" : "Stop and transcribe"}
          variant="ghost"
        >
          <CheckIcon className="size-4" />
        </InputGroupButton>
      </div>
    </div>
  );
});

VoiceRecorderOverlay.displayName = "VoiceRecorderOverlay";
