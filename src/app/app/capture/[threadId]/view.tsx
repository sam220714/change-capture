"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Info, Link2, Reply } from "lucide-react";
import type { EmailMessage, Extraction } from "@/lib/types";
import { threadById } from "@/lib/data/threads";
import { contractById } from "@/lib/data/contracts";
import { personById, supplierById } from "@/lib/data/company";
import { evaluate, type Bucket, type ChangeVerdict } from "@/lib/rules";
import { bucketCopy, closedLine, counterReply, ctaLabel, routeCaption, verdictFor, voiceFor } from "@/lib/verdict";
import { useStore } from "@/lib/store";
import { PASTED_KEY } from "@/lib/threadText";
import { AIPanel, Button, Card, Eyebrow, LinkButton, WorkSurface } from "@/components/ui";
import { ThreadView } from "@/components/capture";
import { BucketSection, CheckRows, Collapsible, ReplyPanel, ReviewCard, scrollToEl, TraceBar, VerdictCard } from "@/components/review";

interface Result {
  extraction: Extraction;
  source: "live" | "stored";
  contractId: string;
  model?: string;
  note?: string;
  messages?: EmailMessage[];
}

type ReplyState = { kind: "suggested" } | { kind: "counter"; label: string; text: string };

const BUCKETS: Bucket[] = ["approve", "signoff", "blocked"];

export function CaptureView({ threadId }: { threadId: string }) {
  const router = useRouter();
  const { records, createRecord, viewerId } = useStore();
  const thread = threadById(threadId);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Thread tracing: hover or keyboard focus previews one change's quotes; Show in Thread pins it.
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [reply, setReply] = useState<ReplyState | null>(null);
  const replyRef = useRef<HTMLDivElement>(null);
  const existing = records.find((r) => r.threadId === threadId);

  useEffect(() => {
    let cancelled = false;
    if (threadId === "pasted") {
      const raw = sessionStorage.getItem(PASTED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the pasted result once on mount
      if (raw) setResult(JSON.parse(raw) as Result);
      else setError("No pasted thread found. Paste one on the Paste a Thread page.");
      return;
    }
    fetch("/api/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ threadId }) })
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (!r.ok) setError(d.error ?? "Extraction failed.");
        else setResult(d as Result);
      })
      .catch(() => !cancelled && setError("Network error."));
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  useEffect(() => {
    if (reply) scrollToEl(replyRef.current, "nearest");
  }, [reply]);

  const contract = result ? contractById(result.contractId) : undefined;
  const supplier = contract ? supplierById(contract.supplierId) : undefined;
  const messages = thread?.messages ?? result?.messages ?? [];
  const subject = thread?.subject ?? "Pasted thread";
  const rules = useMemo(() => (result && contract ? evaluate(result.extraction, contract) : null), [result, contract]);
  const owner = contract ? personById(contract.businessOwnerId) : undefined;
  const voice = owner ? voiceFor(owner, viewerId) : null;

  const changes = result?.extraction.changes ?? [];
  const focusId = pinned ?? hover;
  const focusName = focusId ? (rules?.verdicts.find((v) => v.change.id === focusId)?.name ?? changes.find((c) => c.id === focusId)?.description ?? null) : null;

  function create() {
    if (!result || !contract) return;
    const id = createRecord({
      threadId: thread ? thread.id : `pasted-${Date.now()}`,
      contractId: contract.id,
      extraction: result.extraction,
      source: result.source,
      pastedThread: thread ? undefined : { subject, supplierId: contract.supplierId, messages },
    });
    router.push(`/app/changes/${id}`);
  }

  function pin(id: string) {
    const next = pinned === id ? null : id;
    setPinned(next);
    if (!next) return;
    // Stacked layout: the thread is far below the card, so bring the first matching message into view.
    const first = Math.min(...(changes.find((c) => c.id === id)?.evidence.map((e) => e.messageIndex) ?? [0]));
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    scrollToEl(document.getElementById(`msg-${first}`), wide ? "nearest" : "center");
  }

  function jump(b: Bucket) {
    const el = document.getElementById(`bucket-${b}`);
    scrollToEl(el);
    el?.focus({ preventScroll: true });
  }

  function counter(v: ChangeVerdict) {
    if (!contract || !voice) return;
    const c = counterReply(v, contract, voice);
    if (c) setReply({ kind: "counter", label: "Counter at Cap", text: c.text });
  }

  // Nothing to record: say so plainly. No thread column, checks or routing, since there is nothing to check or route.
  if (result && result.extraction.changes.length === 0) {
    return (
      <WorkSurface>
        <Link href="/app/capture" className="mb-4 inline-flex items-center gap-1 text-sm text-sirion-s3 hover:underline">
          <ArrowLeft size={14} strokeWidth={1.5} /> Paste a Thread
        </Link>
        <div className="max-w-2xl">
          <AIPanel title="No Commercial Changes Found" meta={<span className="text-xs text-sirion-muted2">{result.source === "live" ? `Live: ${result.model ?? "Gemini"}` : "Stored extraction"}</span>}>
            <p className="text-base font-light leading-6 text-sirion-ink">{result.extraction.summary}</p>
            <p className="mt-3 text-sm text-sirion-muted2">
              Change Capture looks for rates, headcount, dates, scope, fees and payment terms that were proposed or agreed. Nothing like that is in this thread, so there is no change to record.
            </p>
          </AIPanel>
          <div className="mt-5">
            <LinkButton href="/app/capture">
              Paste Another Thread <ArrowRight size={14} strokeWidth={1.5} />
            </LinkButton>
          </div>
        </div>
      </WorkSurface>
    );
  }

  const ready = result && contract && rules && voice;
  const suggested = result?.extraction.suggestedReply ?? null;
  const copy = voice ? { approve: bucketCopy("approve", voice), signoff: bucketCopy("signoff", voice), blocked: bucketCopy("blocked", voice) } : null;

  return (
    <WorkSurface>
      <Link href="/app/capture" className="mb-4 inline-flex items-center gap-1 text-sm text-sirion-s3 hover:underline">
        <ArrowLeft size={14} strokeWidth={1.5} /> Paste a Thread
      </Link>
      <div className="mb-6">
        <Eyebrow>Capture</Eyebrow>
        <h1 className="mt-2 text-[32px] leading-9 text-sirion-ink">{subject}</h1>
        {contract && supplier && (
          <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full bg-sirion-light px-3 py-1 text-sm text-sirion-s3">
            <Link2 size={14} strokeWidth={1.5} />
            Matched to {supplier.name} by sender domain {supplier.domain} · {contract.msa.id} → {contract.sow.id}
          </p>
        )}
      </div>

      {!ready && !error && (
        <div className="ai-surface mb-6 animate-pulse rounded-r-lg p-6 text-sm text-sirion-s3">Reading the thread and working out what was agreed. On the free Gemini tier this can take up to 40 seconds; if it is busy, the stored extraction is shown instead.</div>
      )}
      {error && <div className="mb-6 rounded-lg bg-sirion-warning-soft p-4 text-sm text-sirion-warning-ink">{error}</div>}

      {ready && copy && (
        <>
          {result.note && <p className="mb-4 rounded-sm bg-sirion-warning-soft px-3 py-2 text-xs text-sirion-warning-ink">{result.note}</p>}
          <VerdictCard
            verdict={verdictFor(rules, voice, Boolean(suggested))}
            counts={{ approve: rules.verdicts.filter((v) => v.bucket === "approve").length, signoff: rules.verdicts.filter((v) => v.bucket === "signoff").length, blocked: rules.verdicts.filter((v) => v.bucket === "blocked").length }}
            copy={copy}
            onJump={jump}
            actions={
              <>
                {existing ? (
                  <LinkButton href={`/app/changes/${existing.id}`}>
                    Open {existing.id} <ArrowRight size={14} strokeWidth={1.5} />
                  </LinkButton>
                ) : (
                  <Button onClick={create} disabled={rules.steps.length === 0}>
                    {ctaLabel(rules)} <ArrowRight size={14} strokeWidth={1.5} />
                  </Button>
                )}
                {suggested && (
                  <Button variant="secondary" aria-expanded={reply?.kind === "suggested"} onClick={() => setReply(reply?.kind === "suggested" ? null : { kind: "suggested" })}>
                    <Reply size={14} strokeWidth={1.5} /> Draft Reply to Supplier
                  </Button>
                )}
                <p className="min-w-[220px] flex-1 text-xs text-sirion-muted2">{routeCaption(rules, voice, existing?.id)}</p>
                <p className="basis-full text-xs text-sirion-muted2">{result.source === "live" ? `Read live by ${result.model ?? "Gemini"}.` : "Read from the stored extraction."}</p>
              </>
            }
          />

          {reply && (
            <div ref={replyRef} className="mt-4 scroll-mt-20">
              {reply.kind === "suggested" && suggested ? (
                <ReplyPanel ai title={`Suggested Reply to ${supplier?.contact ?? "Supplier"}`} text={suggested} onClose={() => setReply(null)} />
              ) : reply.kind === "counter" ? (
                <ReplyPanel ai={false} title={reply.label} text={reply.text} onClose={() => setReply(null)} />
              ) : null}
            </div>
          )}
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div className="space-y-6">
          {ready &&
            copy &&
            BUCKETS.map((b) => {
              const list = rules.verdicts.filter((v) => v.bucket === b);
              return (
                <BucketSection key={b} bucket={b} copy={copy[b]} count={list.length}>
                  {list.map((v) => (
                    <ReviewCard key={v.change.id} v={v} contract={contract} voice={voice} focused={focusId === v.change.id} pinned={pinned === v.change.id} onPreview={setHover} onPin={pin} onCounter={counter} />
                  ))}
                </BucketSection>
              );
            })}

          {ready && closedLine(rules) && (
            <p className="flex items-center gap-2 text-sm text-sirion-muted2">
              <Info size={14} strokeWidth={1.5} className="shrink-0 text-sirion-line" /> {closedLine(rules)}
            </p>
          )}

          {ready && rules.binds.length > 0 && (
            <Collapsible title="Before It Binds" count={rules.binds.length} defaultOpen>
              <CheckRows checks={rules.binds} />
            </Collapsible>
          )}

          {ready && (() => {
            const notes = [
              ...result.extraction.riskFlags.map((t, i) => ({ id: `risk-${i}`, level: "warn" as const, title: t, source: "From the thread" })),
              ...result.extraction.openQuestions.map((t, i) => ({ id: `q-${i}`, level: "info" as const, title: t, source: "Open question" })),
              ...rules.gst,
            ];
            return notes.length > 0 ? (
              <Collapsible title="Good To Know" count={notes.length}>
                <CheckRows checks={notes} />
              </Collapsible>
            ) : null;
          })()}
        </div>

        {/* The thread beside the findings as the source. Sticky on wide screens, with its own scroll so a long thread never runs past the viewport. */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card className="flex flex-col p-5 lg:max-h-[calc(100vh-6.5rem)]">
            <Eyebrow className="shrink-0">Email Thread</Eyebrow>
            {ready && <TraceBar name={focusName} pinned={pinned !== null} onShowAll={() => setPinned(null)} />}
            <div className="mt-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              <ThreadView messages={messages} changes={changes} focus={focusId} />
            </div>
          </Card>
        </aside>
      </div>
    </WorkSurface>
  );
}
