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
import { Button, Card, Eyebrow, LinkButton, WorkSurface } from "@/components/ui";
import { ChecksList, ExtractionPanel, StepsPreview, ThreadView } from "@/components/capture";

interface Result {
  extraction: Extraction;
  source: "live" | "stored";
  contractId: string;
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
      else setError("No pasted thread found. Paste one in the inbox.");
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

  return (
    <WorkSurface>
      <Link href="/app/inbox" className="mb-4 inline-flex items-center gap-1 text-sm text-sirion-s3 hover:underline">
        <ArrowLeft size={14} strokeWidth={1.5} /> Supplier Inbox
      </Link>
      <div className="mb-6">
        <Eyebrow>Step 2 · Capture</Eyebrow>
        <h1 className="mt-2 text-[32px] leading-9 text-sirion-ink">{subject}</h1>
        {contract && supplier && (
          <p className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full bg-sirion-light px-3 py-1 text-sm text-sirion-s3">
            <Link2 size={14} strokeWidth={1.5} />
            Matched to {supplier.name} by sender domain {supplier.domain} · {contract.msa.id} → {contract.sow.id}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <section>
          <Eyebrow className="mb-3">Email Thread</Eyebrow>
          <ThreadView messages={messages} changes={result?.extraction.changes ?? []} focus={focus} />
        </section>

        <section className="space-y-6">
          {!result && !error && (
            <div className="ai-surface animate-pulse rounded-r-lg p-6 text-sm text-sirion-s3">Reading the thread and working out what was agreed…</div>
          )}
          {error && <div className="rounded-lg bg-sirion-warning-soft p-4 text-sm text-sirion-warning-ink">{error}</div>}
          {result && contract && rules && (
            <>
              <ExtractionPanel extraction={result.extraction} contract={contract} source={result.source} focus={focus} onFocus={setFocus} />

              <Card className="p-5">
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <Eyebrow>Contract Checks</Eyebrow>
                  <span className="text-xs text-sirion-muted2">Rules, not AI: MSA clauses, approval limits, PO</span>
                </div>
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
      </div>
    </WorkSurface>
  );
}
