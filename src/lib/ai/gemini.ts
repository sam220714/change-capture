import { z } from "zod/v4";
import { ExtractionSchema, type ExtractionOutput } from "./schema";

/**
 * Gemini over REST (free tier). On the free tier a busy model answers 429/503 or
 * hangs, so a failed model is not retried in place: the call moves to the next
 * model in the chain and backs off only after a whole round has failed.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Tried in order. Free-tier availability swings a lot day to day. Pro models need
 * billing. Flash-lite is left out on purpose: on 2026-11-20 it marked a conditional
 * acceptance as "agreed", the costly mistake. Override with GEMINI_MODEL /
 * GEMINI_FALLBACK_MODELS.
 */
export const DEFAULT_MODELS = ["gemini-3.6-flash", "gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.8-flash"];

export class GeminiError extends Error {
  constructor(
    message: string,
    /** true when the failure is capacity or network, not a bad request or key. */
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function models() {
  const primary = process.env.GEMINI_MODEL?.trim();
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? DEFAULT_MODELS.join(","))
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return [...new Set([...(primary ? [primary] : []), ...fallbacks])];
}

/** Gemini accepts a subset of JSON Schema: rewrite `const`, drop bookkeeping keys. */
function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema === null || typeof schema !== "object") return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema as Record<string, unknown>)) {
    if (key === "$schema" || key === "$id" || key === "default" || key === "additionalProperties") continue;
    if (key === "const") {
      out.enum = [value];
      continue;
    }
    out[key] = toGeminiSchema(value);
  }
  return out;
}

const RESPONSE_SCHEMA = toGeminiSchema(z.toJSONSchema(ExtractionSchema));

interface GeminiReply {
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  promptFeedback?: { blockReason?: string };
}

export async function extractWithGemini(
  system: string,
  user: string,
  opts: { deadlineMs?: number } = {},
): Promise<{ extraction: ExtractionOutput; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const redact = (t: string) => (apiKey ? t.split(apiKey).join("<key>") : t);
  const thinkingLevel = process.env.GEMINI_THINKING?.trim() || "low";
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: RESPONSE_SCHEMA,
      temperature: 0,
      maxOutputTokens: 16000,
      thinkingConfig: { thinkingLevel },
    },
  });

  const chain = models();
  const unavailable = new Set<string>();
  const tried: string[] = [];
  let lastRejection = "";
  const started = Date.now();
  const deadlineMs = opts.deadlineMs ?? 75_000; // stays inside the route's maxDuration

  for (let round = 1; round <= 2; round++) {
    for (const model of chain) {
      if (unavailable.has(model)) continue;
      const left = deadlineMs - (Date.now() - started);
      if (left < 5_000) throw new GeminiError(`Gemini timed out (${tried.join(", ")})`, true);

      let res: Response;
      try {
        res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
          body,
          signal: AbortSignal.timeout(Math.min(25_000, left)),
        });
      } catch {
        tried.push(`${model} timeout`);
        continue;
      }
      tried.push(`${model} ${res.status}`);

      if (res.ok) {
        const json = (await res.json()) as GeminiReply;
        if (json.promptFeedback?.blockReason) throw new GeminiError(`Gemini blocked the prompt (${json.promptFeedback.blockReason})`, false);
        const cand = json.candidates?.[0];
        if (cand?.finishReason && cand.finishReason !== "STOP") {
          tried.push(`${model} finish=${cand.finishReason}`);
          continue; // cut off or filtered: another model may do better
        }
        const text = (cand?.content?.parts ?? [])
          .filter((p) => !p.thought && typeof p.text === "string")
          .map((p) => p.text)
          .join("");
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          tried.push(`${model} bad-json`);
          continue;
        }
        const result = ExtractionSchema.safeParse(parsed);
        if (!result.success) {
          tried.push(`${model} schema-mismatch`);
          continue;
        }
        return { extraction: result.data, model };
      }

      if (RETRYABLE.has(res.status)) continue;
      const detail = redact(await res.text().catch(() => "")).slice(0, 200);
      // 401/403: the key is wrong. No other model will help.
      if (res.status === 401 || res.status === 403) throw new GeminiError(`Gemini rejected the key (${res.status}): ${detail}`, false);
      // 404: model not available to this key. 400: this model rejects part of the request
      // (e.g. an unsupported thinking level). Either way, skip it for this call.
      unavailable.add(model);
      lastRejection = `${res.status}: ${detail}`;
    }
    if (unavailable.size === chain.length) throw new GeminiError(`No Gemini model accepted the request (${lastRejection})`, false);
    if (round === 1) await new Promise((r) => setTimeout(r, 2_000 + Math.random() * 500));
  }
  throw new GeminiError(`Every Gemini model failed (${tried.join(", ")})`, true);
}
