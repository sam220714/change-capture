"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { THREADS } from "@/lib/data/threads";
import { CONTRACTS } from "@/lib/data/contracts";
import { supplierById } from "@/lib/data/company";
import { useStore } from "@/lib/store";
import { date } from "@/lib/format";
import { PASTED_KEY } from "@/lib/threadText";
import { Button, Card, Eyebrow, PageHeader, StageChip, WorkSurface } from "@/components/ui";

export default function InboxPage() {
  const { records } = useStore();
  const router = useRouter();
  const [live, setLive] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  const [contractId, setContractId] = useState("");
  const [needsContract, setNeedsContract] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/extract")
      .then((r) => r.json())
      .then((d: { live: boolean }) => setLive(d.live))
      .catch(() => setLive(false));
  }, []);

  async function analyse() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, contractId: contractId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (data.needsContract) setNeedsContract(true);
        return;
      }
      sessionStorage.setItem(PASTED_KEY, JSON.stringify(data));
      router.push("/app/capture/pasted");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkSurface>
      <PageHeader
        eyebrow="Step 1 · Business Owner"
        title="Supplier Inbox"
        lead="Threads from supplier inboxes that have opted in. Change Capture reads these threads only, finds commercial changes, and turns them into routed change records."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-sirion-muted2">
        <span className="inline-flex items-start gap-2 rounded-lg bg-sirion-light px-3 py-1 text-sirion-s3">
          <ShieldCheck size={14} strokeWidth={1.5} className="mt-1 shrink-0" /> Opt-in per supplier inbox. Personal mail is never scanned.
        </span>
        {live !== null && (
          <span className="hairline inline-flex items-center rounded-full border-sirion-line px-3 py-1">
            {live ? "Live AI on: Gemini (free tier). Demo threads fall back to stored answers if it is busy." : "Demo mode: demo threads use stored extractions"}
          </span>
        )}
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-y divide-sirion-light">
          {THREADS.map((t) => {
            const s = supplierById(t.supplierId)!;
            const rec = records.find((r) => r.threadId === t.id);
            const last = t.messages[t.messages.length - 1];
            return (
              <li key={t.id}>
                <Link href={rec ? `/app/changes/${rec.id}` : `/app/capture/${t.id}`} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-sirion-app md:flex-row md:items-center">
                  <span className="hairline hidden h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border-sirion-line md:flex">
                    <Mail size={18} strokeWidth={1.5} className="text-sirion-line" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-sirion-muted2">
                      {s.name} · {s.category}
                    </p>
                    <p className="truncate text-base text-sirion-ink">{t.subject}</p>
                    <p className="mt-0.5 truncate text-sm font-light text-sirion-muted2">{last.body.split("\n").find((l) => l.length > 20)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:shrink-0 md:flex-nowrap">
                    <span className="rounded-full bg-sirion-light px-2.5 py-0.5 text-xs text-sirion-s3">{t.label}</span>
                    <span className="text-xs text-sirion-muted2">
                      {t.messages.length} msgs · {date(last.date)}
                    </span>
                    {rec ? (
                      <span className="flex items-center gap-2">
                        <StageChip stage={rec.stage} /> <span className="text-xs text-sirion-muted2">{rec.id}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sirion-s3">
                        Capture <ArrowRight size={14} strokeWidth={1.5} />
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-8 p-6">
        <Eyebrow>Or Paste a Thread</Eyebrow>
        <h2 className="mt-2 text-2xl text-sirion-ink">Analyse Any Supplier Thread</h2>
        <p className="mt-1 text-sm font-light text-sirion-muted2">
          Paste messages with From:, To: and Date: lines. The supplier is matched by email domain (talentbridge.in, kestreladvisory.com, lumenlark.co). Needs live AI.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"From: Rohan Desai <rohan.desai@talentbridge.in>\nTo: Priya Menon <priya.menon@kavora.in>\nDate: 2026-11-18\n\nHi Priya, we'd like to add one QA engineer from 1 December...\n\nFrom: Priya Menon <priya.menon@kavora.in>\n..."}
          className="hairline mt-4 w-full rounded-sm border-sirion-line/50 bg-sirion-app p-3 font-mono text-sm text-sirion-ink placeholder:text-sirion-muted"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {needsContract && (
            <select value={contractId} onChange={(e) => setContractId(e.target.value)} className="hairline rounded-sm border-sirion-line bg-white px-3 py-2 text-sm">
              <option value="">Choose contract…</option>
              {CONTRACTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {supplierById(c.supplierId)?.name}: {c.sow.id}
                </option>
              ))}
            </select>
          )}
          <Button onClick={analyse} disabled={busy || text.trim().length < 20 || live === false}>
            {busy ? "Reading Thread…" : "Analyse Thread"} <ArrowRight size={14} strokeWidth={1.5} />
          </Button>
          {live === false && <span className="text-sm text-sirion-muted2">Live AI is off in this deployment. Set GEMINI_API_KEY to enable.</span>}
          {error && <span className="text-sm text-sirion-danger-ink">{error}</span>}
        </div>
      </Card>
    </WorkSurface>
  );
}
