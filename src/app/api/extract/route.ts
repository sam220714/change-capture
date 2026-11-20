import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ExtractionSchema } from "@/lib/ai/schema";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { STORED_EXTRACTIONS } from "@/lib/data/extractions";
import { threadById } from "@/lib/data/threads";
import { contractById, contractBySupplier } from "@/lib/data/contracts";
import { supplierByDomain, supplierById } from "@/lib/data/company";
import { domainsIn, parsePastedThread, threadToText } from "@/lib/threadText";
import type { EmailMessage } from "@/lib/types";

export const maxDuration = 120;

const MODEL = "claude-opus-5-5";

export function GET() {
  return Response.json({ live: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { threadId?: string; text?: string; contractId?: string };
  const live = Boolean(process.env.ANTHROPIC_API_KEY);

  let messages: EmailMessage[];
  let supplierId: string | undefined;

  if (body.threadId) {
    const thread = threadById(body.threadId);
    if (!thread) return Response.json({ error: "Thread not found." }, { status: 404 });
    messages = thread.messages;
    supplierId = thread.supplierId;
    if (!live) {
      return Response.json({
        extraction: STORED_EXTRACTIONS[thread.id],
        source: "stored",
        contractId: contractBySupplier(thread.supplierId)?.id,
      });
    }
  } else if (body.text && body.text.trim().length > 20) {
    messages = parsePastedThread(body.text);
    if (messages.length === 0) messages = [{ from: "Unknown", to: "", date: "", body: body.text }];
    const supplier = domainsIn(body.text).map(supplierByDomain).find(Boolean);
    supplierId = supplier?.id;
  } else {
    return Response.json({ error: "Paste an email thread first." }, { status: 400 });
  }

  const contract = body.contractId ? contractById(body.contractId) : supplierId ? contractBySupplier(supplierId) : undefined;
  if (!contract) {
    return Response.json(
      { error: "No supplier matched by email domain. Choose the contract this thread belongs to.", needsContract: true },
      { status: 422 },
    );
  }

  if (!live) {
    return Response.json(
      { error: "Live AI is off in this deployment (no ANTHROPIC_API_KEY). Try one of the demo threads, which use stored extractions." },
      { status: 503 },
    );
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: betaZodOutputFormat(ExtractionSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(threadToText(messages), contract, supplierById(contract.supplierId)),
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ error: "The model declined to process this thread." }, { status: 422 });
    }
    if (!response.parsed_output) {
      return Response.json({ error: "The model's answer could not be read. Try again." }, { status: 502 });
    }
    return Response.json({
      extraction: response.parsed_output,
      source: "live",
      contractId: contract.id,
      messages: body.threadId ? undefined : messages,
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Rate limited. Wait a moment and try again." }, { status: 429 });
    }
    if (err instanceof Anthropic.APIError) {
      return Response.json({ error: `AI request failed (${err.status ?? "network"}).` }, { status: 502 });
    }
    throw err;
  }
}
