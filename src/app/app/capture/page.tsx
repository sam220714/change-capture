"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { THREADS } from "@/lib/data/threads";
import { SUPPLIERS } from "@/lib/data/company";
import { MAX_PASTE_CHARS, PASTED_KEY } from "@/lib/threadText";
import { Button, Card, Eyebrow, PageHeader, WorkSurface } from "@/components/ui";

/** Sample threads are loaded into the box as plain text, the same shape a user would paste. */
function sampleText(threadId: string) {
  const thread = THREADS.find((t) => t.id === threadId)!;
  return thread.messages.map((m) => `From: ${m.from}\nTo: ${m.to}\nDate: ${m.date}\n\n${m.body}`).join("\n\n");
}

export default function PasteThreadPage() {
  const router = useRouter();
  const [live, setLive] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  /** Set while the box still holds an untouched sample, so it keeps its stored answer if live AI is busy. */
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/extract")
      .then((r) => r.json())
      .then((d: { live: boolean }) => setLive(d.live))
      .catch(() => setLive(false));
  }, []);

  function loadSample(id: string) {
    setText(sampleText(id));
    setSampleId(id);
    setError(null);
  }

  const tooLong = text.length > MAX_PASTE_CHARS;

  async function analyse() {
    if (sampleId) {
      router.push(`/app/capture/${sampleId}`);
      return;
    }
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

      <Card className="p-6">
        <Eyebrow>Supplier Thread</Eyebrow>
        <h2 className="mt-2 text-2xl text-sirion-ink">Analyse Any Supplier Thread</h2>
        <p className="mt-1 text-sm font-light text-sirion-muted2">
          Paste messages with From:, To: and Date: lines. The supplier is matched by email domain ({SUPPLIERS.map((s) => s.domain).join(", ")}).
        </p>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSampleId(null);
          }}
          rows={12}
          placeholder={"From: Rohan Desai <rohan.desai@talentbridge.in>\nTo: Priya Menon <priya.menon@kavora.in>\nDate: 2026-11-18\n\nHi Priya, we'd like to add one QA engineer from 1 December...\n\nFrom: Priya Menon <priya.menon@kavora.in>\n..."}
          className="hairline mt-4 w-full rounded-sm border-sirion-line/50 bg-sirion-app p-3 font-mono text-sm text-sirion-ink placeholder:text-sirion-muted"
        />
        <p className={`mt-1 text-right text-xs ${tooLong ? "text-sirion-danger-ink" : "text-sirion-muted2"}`}>
          {text.length.toLocaleString("en-IN")} / {MAX_PASTE_CHARS.toLocaleString("en-IN")} characters{tooLong && ". Trim the thread to the messages that discuss the change."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={analyse} disabled={busy || text.trim().length < 20 || tooLong || (live === false && !sampleId)}>
            {busy ? "Reading Thread…" : "Analyse Thread"} <ArrowRight size={14} strokeWidth={1.5} />
          </Button>
          {live === false && !sampleId && <span className="text-sm text-sirion-muted2">Live AI is off in this deployment. Load a sample thread, or set GEMINI_API_KEY to enable.</span>}
          {error && <span className="text-sm text-sirion-danger-ink">{error}</span>}
        </div>

        <div className="mt-6 border-t border-sirion-light pt-4">
          <p className="mb-2 text-sm text-sirion-muted2">No thread to hand? Load a sample:</p>
          <div className="flex flex-wrap gap-2">
            {THREADS.map((t) => (
              <Button key={t.id} variant="secondary" onClick={() => loadSample(t.id)}>
                {t.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </WorkSurface>
  );
}
