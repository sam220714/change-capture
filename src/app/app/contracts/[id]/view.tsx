"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { contractById } from "@/lib/data/contracts";
import { personById, supplierById } from "@/lib/data/company";
import { useStore } from "@/lib/store";
import { termViews, type TermLayer } from "@/lib/terms";
import { date, inr } from "@/lib/format";
import type { SourceRef } from "@/lib/types";
import { Card, Empty, Eyebrow, WorkSurface } from "@/components/ui";

function SourceChip({ s }: { s: SourceRef }) {
  const cls =
    s.kind === "Email change"
      ? "bg-sirion-light text-sirion-s3"
      : s.kind === "Amendment"
        ? "bg-sirion-s3 text-white"
        : "hairline border-sirion-line/60 text-sirion-muted2";
  const inner = (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${cls}`}>
      {s.doc} · {s.clause.length > 38 ? s.clause.slice(0, 36) + "…" : s.clause}
    </span>
  );
  return s.recordId ? <Link href={`/app/changes/${s.recordId}`}>{inner}</Link> : inner;
}

export function ContractView({ id }: { id: string }) {
  const { records } = useStore();
  const c = contractById(id);
  if (!c)
    return (
      <WorkSurface>
        <Empty title="Contract not found" />
      </WorkSurface>
    );
  const s = supplierById(c.supplierId)!;
  const views = termViews(c, records);
  const today = new Date().toISOString().slice(0, 10);
  const mine = records.filter((r) => r.contractId === c.id);
  const amendments = mine.filter((r) => r.stage === "executed").length;
  const emailApproved = mine.filter((r) => r.stage === "approved" || r.stage === "sent").length;
  const current = (layers: TermLayer[]) => {
    let cur = layers[0];
    for (const l of layers.slice(1)) if ((!l.effective || l.effective <= today) && (!l.until || l.until >= today)) cur = l;
    return cur ?? layers[layers.length - 1];
  };

  const stack = [
    { label: "MSA", doc: c.msa.id, sub: c.msa.title },
    { label: "SOW", doc: c.sow.id, sub: `${date(c.sow.start)} to ${date(c.sow.end)}` },
    { label: "Amendments", doc: String(amendments), sub: "Signed or confirmed" },
    { label: "Approved Email Changes", doc: String(emailApproved), sub: "Awaiting signature" },
  ];

  return (
    <WorkSurface>
      <Link href="/app/contracts" className="mb-4 inline-flex items-center gap-1 text-sm text-sirion-s3 hover:underline">
        <ArrowLeft size={14} strokeWidth={1.5} /> Contract Terms
      </Link>
      <Eyebrow>
        {s.name} · {s.category}
      </Eyebrow>
      <h1 className="mt-2 text-[32px] leading-9 text-sirion-ink">{c.title}</h1>
      <p className="mt-2 text-sm font-light text-sirion-muted2">
        Owner {personById(c.businessOwnerId)?.name} · {c.po.id} {inr(c.po.value)} (headroom {inr(c.po.value - c.po.committed)}) · Governing law {c.msa.governingLaw}
      </p>

      <ol className="mt-6 grid gap-2 sm:grid-cols-4">
        {stack.map((x, i) => (
          <li key={x.label} className="hairline rounded-lg border-sirion-light bg-sirion-card p-4">
            <p className="text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">
              {i + 1}. {x.label}
            </p>
            <p className="mt-1 text-lg font-light text-sirion-ink">{x.doc}</p>
            <p className="text-xs text-sirion-muted2">{x.sub}</p>
          </li>
        ))}
      </ol>

      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-sirion-light text-left text-xs text-sirion-muted2">
              <th className="px-5 py-3 font-normal">Term</th>
              <th className="px-3 py-3 font-normal">In Force Today</th>
              <th className="px-3 py-3 font-normal">Source</th>
              <th className="px-5 py-3 font-normal">History and Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sirion-light">
            {views.map((v) => {
              const cur = current(v.layers);
              const changed = cur !== v.layers[0];
              return (
                <tr key={v.term.key} className="h-12 align-top">
                  <td className="px-5 py-3 text-sirion-ink">{v.term.label}</td>
                  <td className="px-3 py-3">
                    <span className={changed ? "diff-add rounded px-1 text-sirion-ink" : "text-sirion-ink"}>{cur?.value ?? v.term.value}</span>
                  </td>
                  <td className="px-3 py-3">{cur && <SourceChip s={cur.source} />}</td>
                  <td className="space-y-1 px-5 py-3 text-xs text-sirion-muted2">
                    {v.layers.length > 1 &&
                      v.layers.map((l, i) =>
                        l === cur ? null : (
                          <p key={i}>
                            <span className="diff-del rounded px-1">{l.value}</span> {l.effective ? `from ${date(l.effective)}` : i === 0 ? "(original)" : ""}
                            {l.until ? ` to ${date(l.until)}` : ""}
                          </p>
                        ),
                      )}
                    {v.pending.map((p) => (
                      <p key={p.record.id + p.change.id}>
                        <Link href={`/app/changes/${p.record.id}`} className="inline-flex rounded-full bg-sirion-warning-soft px-2.5 py-0.5 text-sirion-warning-ink hover:underline">
                          Pending: {p.change.toValue} · {p.record.id}
                        </Link>
                      </p>
                    ))}
                    {v.layers.length === 1 && v.pending.length === 0 && "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6 p-5">
        <Eyebrow className="mb-3">{c.msa.id} · Key Clauses</Eyebrow>
        <ul className="space-y-3">
          {c.msa.clauses.map((cl) => (
            <li key={cl.id} className="text-sm">
              <p className="text-sirion-ink">
                {cl.id} {cl.title}
              </p>
              <p className="font-light text-sirion-muted2">{cl.text}</p>
            </li>
          ))}
        </ul>
      </Card>
    </WorkSurface>
  );
}
