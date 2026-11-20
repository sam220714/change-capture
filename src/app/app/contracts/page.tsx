"use client";

import Link from "next/link";
import { ArrowRight, FileStack } from "lucide-react";
import { CONTRACTS } from "@/lib/data/contracts";
import { personById, supplierById } from "@/lib/data/company";
import { useStore } from "@/lib/store";
import { termViews } from "@/lib/terms";
import { inr } from "@/lib/format";
import { Card, PageHeader, WorkSurface } from "@/components/ui";

export default function ContractsPage() {
  const { records } = useStore();
  return (
    <WorkSurface>
      <PageHeader
        eyebrow="Step 4 · Repository"
        title="Contract Terms"
        lead="The terms in force today for each supplier: MSA, then SOW, then amendments, then approved email changes. Every value links to its source."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {CONTRACTS.map((c) => {
          const s = supplierById(c.supplierId)!;
          const views = termViews(c, records);
          const changed = views.filter((v) => v.layers.length > 1).length;
          const pending = views.reduce((n, v) => n + v.pending.length, 0);
          return (
            <Link key={c.id} href={`/app/contracts/${c.id}`} className="group">
              <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-glow">
                <span className="hairline mb-4 flex h-10 w-10 items-center justify-center rounded-[9px] border-sirion-line">
                  <FileStack size={18} strokeWidth={1.5} className="text-sirion-line" />
                </span>
                <p className="text-xs text-sirion-muted2">{s.category}</p>
                <h2 className="mt-1 text-xl text-sirion-ink">{s.name}</h2>
                <p className="mt-1 text-sm font-light text-sirion-muted2">{c.title}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-sirion-muted2">
                  <div>
                    <dt>Documents</dt>
                    <dd className="text-sirion-ink">
                      {c.msa.id}, {c.sow.id}
                    </dd>
                  </div>
                  <div>
                    <dt>Owner</dt>
                    <dd className="text-sirion-ink">{personById(c.businessOwnerId)?.name}</dd>
                  </div>
                  <div>
                    <dt>{c.po.id}</dt>
                    <dd className="text-sirion-ink">{inr(c.po.value)}</dd>
                  </div>
                  <div>
                    <dt>Changes</dt>
                    <dd className="text-sirion-ink">
                      {changed} applied · {pending} pending
                    </dd>
                  </div>
                </dl>
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm text-sirion-s3">
                  Current Terms <ArrowRight size={14} strokeWidth={1.5} />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </WorkSurface>
  );
}
