"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Link2 } from "lucide-react";
import type { EmailMessage, Extraction } from "@/lib/types";
import { threadById } from "@/lib/data/threads";
import { contractById } from "@/lib/data/contracts";
import { personById, supplierById } from "@/lib/data/company";
import { evaluate } from "@/lib/rules";
import { useStore } from "@/lib/store";
import { PASTED_KEY } from "@/lib/threadText";
import { inr } from "@/lib/format";
import { AIPanel, Button, Card, Eyebrow, LinkButton, WorkSurface } from "@/components/ui";
import { ChecksList, ExtractionPanel, StepsPreview, ThreadView } from "@/components/capture";

interface Result {
  extraction: Extraction;
  source: "live" | "stored";
  contractId: string;
  model?: string;
  note?: string;
  messages?: EmailMessage[];
}

export function CaptureView({ threadId }: { threadId: string }) {
  const router = useRouter();
  const { records, createRecord, viewerId } = useStore();
  const thread = threadById(threadId);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
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

  const contract = result ? contractById(result.contractId) : thread ? undefined : undefined;
  const supplier = contract ? supplierById(contract.supplierId) : undefined;
  const messages = thread?.messages ?? result?.messages ?? [];
  const subject = thread?.subject ?? "Pasted thread";
  const rules = useMemo(() => (result && contract ? evaluate(result.extraction, contract) : null), [result, contract]);

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section className="space-y-6">
          {!result && !error && (
            <div className="ai-surface animate-pulse rounded-r-lg p-6 text-sm text-sirion-s3">Reading the thread and working out what was agreed. On the free Gemini tier this can take up to 40 seconds; if it is busy, the stored extraction is shown instead.</div>
          )}
          {error && <div className="rounded-lg bg-sirion-warning-soft p-4 text-sm text-sirion-warning-ink">{error}</div>}
          {result && contract && rules && (
            <>
              <ExtractionPanel extraction={result.extraction} contract={contract} source={result.source} model={result.model} note={result.note} focus={focus} onFocus={setFocus} />

              <Card className="p-5">
                <Eyebrow className="mb-1">Contract Checks</Eyebrow>
                <ChecksList checks={rules.checks} />
              </Card>

              <Card className="p-5">
                <Eyebrow className="mb-3">Routing</Eyebrow>
                {rules.steps.length ? <StepsPreview steps={rules.steps} /> : <p className="text-sm text-sirion-muted2">Nothing live to route.</p>}
                <p className="mt-4 text-sm font-light text-sirion-muted2">
                  Instrument: <span className="text-sirion-ink">{rules.instrument === "amendment" ? "Formal amendment" : "Change order"}</span>
                  {rules.totalImpact > 0 && (
                    <>
                      {" "}
                      · Added spend <span className="text-sirion-ink">{inr(rules.totalImpact)}</span>
                    </>
                  )}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {existing ? (
                    <LinkButton href={`/app/changes/${existing.id}`}>
                      Open {existing.id} <ArrowRight size={14} strokeWidth={1.5} />
                    </LinkButton>
                  ) : (
                    <Button onClick={create} disabled={rules.steps.length === 0}>
                      Create Change Record <ArrowRight size={14} strokeWidth={1.5} />
                    </Button>
                  )}
                  <span className="text-xs text-sirion-muted2">Created as {personById(viewerId)?.name}. Nothing is sent to the supplier yet.</span>
                </div>
              </Card>
            </>
          )}
        </section>

        {/* Inferences first, the pasted thread beside them as the source. Same panel pattern (p-5, title row first) so both columns start on the same line. */}
        <section>
          <Card className="p-5">
            <Eyebrow className="mb-3">Email Thread</Eyebrow>
            <ThreadView messages={messages} changes={result?.extraction.changes ?? []} focus={focus} />
          </Card>
        </section>
      </div>
    </WorkSurface>
  );
}
