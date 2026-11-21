"use client";

import Link from "next/link";
import { useState } from "react";
import { INVOICES } from "@/lib/data/threads";
import { supplierById } from "@/lib/data/company";
import { useStore } from "@/lib/store";
import { checkInvoice, type LineVerdict } from "@/lib/terms";
import { date, inr } from "@/lib/format";
import { Card, Eyebrow, PageHeader, WorkSurface } from "@/components/ui";

const verdictStyle: Record<LineVerdict, string> = {
  match: "bg-sirion-s3 text-white",
  hold: "bg-sirion-warning-soft text-sirion-warning-ink",
  mismatch: "hairline border-sirion-danger text-sirion-danger-ink",
  no_basis: "hairline border-sirion-danger text-sirion-danger-ink",
};
const verdictLabel: Record<LineVerdict, string> = { match: "Matches", hold: "Hold", mismatch: "Mismatch", no_basis: "No basis" };

export default function InvoicesPage() {
  const { records } = useStore();
  const [mode, setMode] = useState<"sow" | "current">("current");
  const checks = INVOICES.map((inv) => checkInvoice(inv, records, mode));
  const other = INVOICES.map((inv) => checkInvoice(inv, records, mode === "sow" ? "current" : "sow"));
  const count = (cs: typeof checks) => cs.reduce((n, c) => n + c.lines.filter((l) => l.verdict !== "match").length + (c.terms.verdict === "match" ? 0 : 1), 0);
  const risk = (cs: typeof checks) => cs.reduce((n, c) => n + c.atRisk, 0);
  const sow = mode === "sow" ? checks : other;
  const cur = mode === "current" ? checks : other;

  return (
    <WorkSurface>
      <PageHeader
        eyebrow="Accounts Payable"
        title="Invoice Check"
        lead="October invoices checked against the contract. Compare what AP sees with the SOW alone against what it sees once email changes are captured."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className={`p-5 ${mode === "sow" ? "border-sirion-s3 shadow-glow" : ""}`}>
          <Eyebrow>Against the SOW Alone</Eyebrow>
          <p className="mt-2 text-lg font-bold text-sirion-ink">
            {count(sow)} exceptions · {inr(risk(sow))} flagged
          </p>
          <p className="mt-1 text-sm font-light text-sirion-muted2">
            AP cannot tell an agreed rise from an overcharge, and a rate-card line for rejected work passes.
          </p>
        </Card>
        <Card className={`p-5 ${mode === "current" ? "border-sirion-s3 shadow-glow" : ""}`}>
          <Eyebrow>Against Current Agreed Terms</Eyebrow>
          <p className="mt-2 text-lg font-bold text-sirion-ink">
            {count(cur)} exceptions · {inr(risk(cur))} at risk
          </p>
          <p className="mt-1 text-sm font-light text-sirion-muted2">
            {records.length === 0 ? (
              <>
                No changes captured yet.{" "}
                <Link href="/app/capture" className="text-sirion-s3 underline">
                  Capture the threads
                </Link>{" "}
                to see the difference.
              </>
            ) : (
              "Each flag points to the change record or clause behind it."
            )}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex w-fit rounded-sm border-sirion-light bg-sirion-card p-1 text-sm hairline">
        {(["current", "sow"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-sm px-3 py-1.5 ${mode === m ? "bg-sirion-light text-sirion-ink" : "text-sirion-muted2"}`}>
            {m === "current" ? "Current Agreed Terms" : "SOW Only"}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {checks.map((c) => (
          <Card key={c.invoice.id} className="overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
              <div>
                <p className="text-xs text-sirion-muted2">{supplierById(c.contract.supplierId)?.name}</p>
                <h2 className="text-xl text-sirion-ink">
                  {c.invoice.id} · {c.invoice.period}
                </h2>
              </div>
              <p className="text-sm text-sirion-muted2">
                Issued {date(c.invoice.issued)} · {c.contract.sow.id}
                {c.atRisk > 0 && <span className="ml-3 text-sirion-danger-ink">{inr(c.atRisk)} at risk</span>}
              </p>
            </div>
            {/* Only the table scrolls on narrow screens; shared fixed column widths keep the three invoice tables lined up. */}
            <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[980px] table-fixed text-sm">
              <colgroup>
                <col className="w-[240px]" />
                <col className="w-[150px]" />
                <col className="w-[150px]" />
                <col className="w-[110px]" />
                <col />
              </colgroup>
              <thead>
                <tr className="border-b border-sirion-light text-left text-xs text-sirion-muted2">
                  <th className="px-5 py-2 font-normal">Line</th>
                  <th className="px-3 py-2 font-normal">Billed</th>
                  <th className="px-3 py-2 font-normal">Contract Says</th>
                  <th className="px-3 py-2 font-normal">Result</th>
                  <th className="px-5 py-2 font-normal">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sirion-light">
                {[...c.lines, { description: "Payment terms", billed: c.terms.billed, expected: c.terms.expected, verdict: c.terms.verdict, note: c.terms.note, source: c.terms.source, amount: 0, overcharge: 0 }].map((l, i) => (
                  <tr key={i} className="h-12 align-top">
                    <td className="px-5 py-3 text-sirion-ink">
                      {l.description}
                      {l.amount > 0 && <span className="block text-xs text-sirion-muted2">{inr(l.amount)}</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sirion-ink">{l.billed}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sirion-muted2">{l.expected}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs ${verdictStyle[l.verdict]}`}>{verdictLabel[l.verdict]}</span>
                    </td>
                    <td className="px-5 py-3 text-sm font-light text-sirion-muted2">
                      {l.note}
                      {l.source && (
                        <span className="mt-1 block text-xs text-sirion-s3">
                          {l.source.recordId ? <Link href={`/app/changes/${l.source.recordId}`} className="hover:underline">{l.source.doc} · {l.source.clause}</Link> : `${l.source.doc} · ${l.source.clause}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        ))}
      </div>
    </WorkSurface>
  );
}
