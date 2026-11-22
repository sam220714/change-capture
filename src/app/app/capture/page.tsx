"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { THREADS } from "@/lib/data/threads";
import { SUPPLIERS, personById, supplierById } from "@/lib/data/company";
import { contractBySupplier } from "@/lib/data/contracts";
import { MAX_PASTE_CHARS, PASTED_KEY } from "@/lib/threadText";
import { Button, Card, Eyebrow, PageHeader, WorkSurface } from "@/components/ui";

function ownerName(supplierId: string) {
  const ownerId = contractBySupplier(supplierId)?.businessOwnerId;
  return ownerId ? personById(ownerId)?.name : undefined;
}

export default function CaptureChangePage() {
  const router = useRouter();
  const [live, setLive] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/extract")
      .then((r) => r.json())
      .then((d: { live: boolean }) => setLive(d.live))
      .catch(() => setLive(false));
  }, []);

  const tooLong = text.length > MAX_PASTE_CHARS;

  async function analyse() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
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
        eyebrow="Business Owner"
        title="Capture a Change"
        lead="Copy a supplier email thread and paste it here. Change Capture reads only what you paste, finds the commercial changes, and turns them into a routed change record."
      />

      {live !== null && (
        <div className="mb-6 flex flex-wrap items-stretch gap-3 text-sm text-sirion-muted2">
          <span className="hairline inline-flex items-center rounded-lg border-sirion-line px-3 py-1.5">
            {live ? "Live AI on: Gemini (free tier). Sample threads fall back to stored answers if it is busy." : "Demo mode: sample threads use stored extractions"}
          </span>
        </div>
      )}

      <section aria-labelledby="samples-heading">
        <Eyebrow>Sample Threads</Eyebrow>
        <h2 id="samples-heading" className="mt-2 text-2xl text-sirion-ink">
          Start With a Sample
        </h2>
        <p className="mt-1 text-sm font-light text-sirion-muted2">Four supplier threads, each testing a different rule. One click runs it.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {THREADS.map((t) => {
            const owner = ownerName(t.supplierId);
            return (
              <Link
                key={t.id}
                href={`/app/capture/${t.id}`}
                className="group hairline flex flex-col rounded-lg border-sirion-light bg-sirion-card p-5 transition-colors hover:border-sirion-line"
              >
                <Eyebrow>{t.label}</Eyebrow>
                <h3 className="mt-2 text-lg font-normal text-sirion-ink">{t.subject}</h3>
                <p className="mt-0.5 text-sm text-sirion-muted2">
                  {supplierById(t.supplierId)?.name}
                  {owner && ` · Owner: ${owner}`}
                </p>
                <p className="mt-3 flex-1 text-sm font-light leading-6 text-sirion-ink">{t.lookFor}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-sirion-s3 group-hover:underline">
                  Run This Thread <ArrowRight size={14} strokeWidth={1.5} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <Card className="mt-10 p-6">
        <Eyebrow>Your Own Thread</Eyebrow>
        <h2 className="mt-2 text-2xl text-sirion-ink">Paste a Supplier Thread</h2>
        <p className="mt-1 text-sm font-light text-sirion-muted2">
          Works with threads from the prototype&apos;s suppliers ({SUPPLIERS.map((s) => s.name).join(", ")}), matched by email domain. Paste messages with From:, To: and Date: lines.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder={"From: Rohan Desai <rohan.desai@talentbridge.in>\nTo: Priya Menon <priya.menon@kavora.in>\nDate: 2026-11-18\n\nHi Priya, we'd like to add one QA engineer from 1 December...\n\nFrom: Priya Menon <priya.menon@kavora.in>\n..."}
          className="hairline mt-4 w-full rounded-sm border-sirion-line/50 bg-sirion-app p-3 font-mono text-sm text-sirion-ink placeholder:text-sirion-muted"
        />
        <p className={`mt-1 text-right text-xs ${tooLong ? "text-sirion-danger-ink" : "text-sirion-muted2"}`}>
          {text.length.toLocaleString("en-IN")} / {MAX_PASTE_CHARS.toLocaleString("en-IN")} characters{tooLong && ". Trim the thread to the messages that discuss the change."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={analyse} disabled={busy || text.trim().length < 20 || tooLong || live === false}>
            {busy ? "Reading Thread…" : "Analyse Thread"} <ArrowRight size={14} strokeWidth={1.5} />
          </Button>
          {live === false && <span className="text-sm text-sirion-muted2">Live AI is off in this deployment, so only the sample threads above run.</span>}
          {error && <span className="text-sm text-sirion-danger-ink">{error}</span>}
        </div>
      </Card>
    </WorkSurface>
  );
}
