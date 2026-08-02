import { NextRequest } from "next/server";
import { DEFAULT_MODEL, MAX_OUTPUT_TOKENS, getAnthropicClient } from "@/lib/anthropic";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isValidHistory(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!isValidHistory(messages) || messages.length === 0) {
    return new Response("Body must include a non-empty `messages` array", {
      status: 400,
    });
  }

  let client;
  try {
    client = getAnthropicClient();
  } catch (err) {
    return new Response((err as Error).message, { status: 500 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const anthropicStream = client.messages.stream({
          model: DEFAULT_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          system: SYSTEM_PROMPT,
          messages,
        });

        anthropicStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        anthropicStream.on("error", (err) => {
          controller.enqueue(
            encoder.encode(`\n\n[Errore durante la simulazione: ${err.message}]`)
          );
          controller.close();
        });

        await anthropicStream.finalMessage();
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n\n[Errore durante la simulazione: ${(err as Error).message}]`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
