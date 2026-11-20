import { extractWithGemini, GeminiError, geminiConfigured } from "@/lib/ai/gemini";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompt";
import { STORED_EXTRACTIONS } from "@/lib/data/extractions";
import { threadById } from "@/lib/data/threads";
import { contractById, contractBySupplier } from "@/lib/data/contracts";
import { supplierByDomain, supplierById } from "@/lib/data/company";
import { domainsIn, parsePastedThread, threadToText } from "@/lib/threadText";
import type { EmailMessage, Extraction } from "@/lib/types";

/**
 * Keep only quotes that appear word for word in the cited message. A change that
 * loses its evidence is flagged and its confidence capped, so a person checks it.
 */
function verifyEvidence(x: Extraction, messages: EmailMessage[]): Extraction {
  return {
    ...x,
    changes: x.changes.map((c) => {
      const evidence = c.evidence.filter((e) => messages[e.messageIndex]?.body.includes(e.quote));
      const dropped = c.evidence.length - evidence.length;
      if (!dropped) return c;
      const note = `${dropped} quote(s) could not be found in the thread and were removed. Check this change by hand.`;
      return { ...c, evidence, confidence: Math.min(c.confidence, 0.5), ambiguity: c.ambiguity ? `${c.ambiguity} ${note}` : note };
    }),
  };
}

export const maxDuration = 90;

export function GET() {
  return Response.json({ live: geminiConfigured(), provider: "Gemini" });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { threadId?: string; text?: string; contractId?: string };
  const live = geminiConfigured();

  let messages: EmailMessage[];
  let supplierId: string | undefined;
  const demoThread = body.threadId ? threadById(body.threadId) : undefined;

  if (body.threadId) {
    if (!demoThread) return Response.json({ error: "Thread not found." }, { status: 404 });
    messages = demoThread.messages;
    supplierId = demoThread.supplierId;
  } else if (body.text && body.text.trim().length > 20) {
    messages = parsePastedThread(body.text);
    if (messages.length === 0) messages = [{ from: "Unknown", to: "", date: "", body: body.text }];
    supplierId = domainsIn(body.text).map(supplierByDomain).find(Boolean)?.id;
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

  /** Demo threads always have a stored answer, so the demo never breaks on a busy free tier. */
  const stored = (note?: string) =>
    Response.json({ extraction: STORED_EXTRACTIONS[demoThread!.id], source: "stored", contractId: contract.id, note });

  if (!live) {
    if (demoThread) return stored();
    return Response.json(
      { error: "Live AI is off in this deployment (no GEMINI_API_KEY). Try one of the demo threads, which use stored extractions." },
      { status: 503 },
    );
  }

  try {
    const { extraction, model } = await extractWithGemini(
      SYSTEM_PROMPT,
      buildUserPrompt(threadToText(messages), contract, supplierById(contract.supplierId)),
      // Demo threads have a stored answer to fall back on, so don't keep the viewer waiting.
      { deadlineMs: demoThread ? 40_000 : 80_000 },
    );
    return Response.json({
      extraction: verifyEvidence(extraction, messages),
      source: "live",
      model,
      contractId: contract.id,
      messages: demoThread ? undefined : messages,
    });
  } catch (err) {
    const message = err instanceof GeminiError ? err.message : "AI request failed.";
    console.error("[extract]", message);
    if (demoThread) return stored("Live AI was unavailable, so this shows the stored extraction.");
    const busy = err instanceof GeminiError && err.retryable;
    return Response.json(
      { error: busy ? "The free AI tier is busy right now. Wait a minute and try again." : message },
      { status: busy ? 503 : 502 },
    );
  }
}
