import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gatewayKey =
    process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_AI_GATEWAY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' field" },
      { status: 400 }
    );
  }

  // Prefer Vercel AI Gateway (recommended) when configured.
  if (gatewayKey) {
    try {
      // Note: When you specify a model id as a plain string, the AI SDK routes via
      // the Vercel AI Gateway provider and looks for AI_GATEWAY_API_KEY.
      const ai = (await import("ai")) as unknown as Record<string, unknown>;
      const transcribe =
        (ai as { experimental_transcribe?: unknown }).experimental_transcribe ??
        (ai as { transcribe?: unknown }).transcribe;

      if (typeof transcribe === "function") {
        const model =
          process.env.AI_TRANSCRIBE_MODEL ??
          process.env.VERCEL_AI_TRANSCRIBE_MODEL ??
          "openai/whisper-1";

        const result = await (
          transcribe as (args: {
            model: string;
            audio: File;
          }) => Promise<{ text?: string }>
        )({
          model,
          audio: file,
        });

        return NextResponse.json({ text: result.text ?? "" });
      }

      // If AI SDK doesn't expose transcription helper in this version, fall through.
      throw new Error(
        "AI SDK transcription helper not available (expected experimental_transcribe)"
      );
    } catch (error) {
      // Fall back to direct OpenAI if available; otherwise surface the gateway error.
      if (!openaiKey) {
        const message =
          error instanceof Error
            ? error.message
            : "Gateway transcription failed";
        return NextResponse.json(
          { error: "Gateway transcription failed", details: message },
          { status: 500 }
        );
      }
    }
  }

  if (!openaiKey) {
    return NextResponse.json(
      {
        error:
          "Missing transcription credentials. Set AI_GATEWAY_API_KEY (preferred) or OPENAI_API_KEY.",
      },
      { status: 500 }
    );
  }

  const openaiForm = new FormData();
  openaiForm.append("file", file, file.name || "audio.webm");
  // Default to the most widely-available model; override via env as needed.
  openaiForm.append(
    "model",
    process.env.OPENAI_TRANSCRIBE_MODEL ?? "whisper-1"
  );
  openaiForm.append("response_format", "json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
    },
    body: openaiForm,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "Transcription failed", details: text },
      { status: 500 }
    );
  }

  const json = (await res.json()) as { text?: string };
  return NextResponse.json({ text: json.text ?? "" });
}
