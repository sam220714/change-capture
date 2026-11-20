"use client";

import Link from "next/link";
import { useState } from "react";
import { contractById } from "@/lib/data/contracts";
import { personById, supplierById } from "@/lib/data/company";
import { useStore } from "@/lib/store";
import { dateTime } from "@/lib/format";
import { isLive } from "@/lib/rules";
import { Card, Empty, LinkButton, PageHeader, StageChip, WorkSurface } from "@/components/ui";
import { recordThread, roleLabel } from "@/components/capture";
import type { ChangeRecord } from "@/lib/types";

function waitingOn(r: ChangeRecord) {
  if (r.stage === "clarifying") return r.steps[0];
  if (r.stage !== "in_review") return undefined;
  const owner = r.steps.find((s) => s.role === "business_owner");
  if (owner?.status === "pending") return owner;
  return r.steps.find((s) => s.status === "pending");
}

export default function ChangesPage() {
  const { records, viewerId, ready } = useStore();
  const [filter, setFilter] = useState<"mine" | "all">("all");
  const viewer = personById(viewerId)!;
  const mine = (r: ChangeRecord) =>
    r.steps.some(
      (s) =>
        s.assigneeId === viewerId &&
        s.status === "pending" &&
        (s.role === "business_owner" || r.steps.find((x) => x.role === "business_owner")?.status === "approved") &&
        (r.stage === "in_review" || r.stage === "clarifying"),
    );
  const list = (filter === "mine" ? records.filter(mine) : records).slice().reverse();

  return (
    <WorkSurface>
      <PageHeader
        eyebrow="Step 3 · Business, Finance and Legal"
        title="Change Records"
        lead="Every captured change, who it is waiting on, and why. Switch who you are viewing as (top right) to see each team's queue."
      />
      <div className="mb-4 flex rounded-sm bg-sirion-card p-1 text-sm hairline border-sirion-light w-fit">
        {(["all", "mine"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-sm px-3 py-1.5 ${filter === f ? "bg-sirion-light text-sirion-ink" : "text-sirion-muted2"}`}>
            {f === "all" ? "All Records" : `Waiting on ${viewer.name.split(" ")[0]} (${records.filter(mine).length})`}
          </button>
        ))}
      </div>
      {!ready ? null : list.length === 0 ? (
        <Empty title={filter === "mine" ? "Nothing waiting on you" : "No change records yet"}>
          <p className="mb-4">Capture a thread from the supplier inbox to create one.</p>
          <LinkButton href="/app/inbox">Open Supplier Inbox</LinkButton>
        </Empty>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-sirion-light text-left text-xs text-sirion-muted2">
                <th className="px-5 py-3 font-normal">Record</th>
                <th className="px-3 py-3 font-normal">Supplier and Thread</th>
                <th className="px-3 py-3 font-normal">Changes</th>
                <th className="px-3 py-3 font-normal">Stage</th>
                <th className="px-3 py-3 font-normal">Waiting On</th>
                <th className="px-5 py-3 font-normal">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sirion-light">
              {list.map((r) => {
                const c = contractById(r.contractId)!;
                const w = waitingOn(r);
                const blocks = r.checks.filter((x) => x.level === "block").length;
                return (
                  <tr key={r.id} className="h-12 hover:bg-sirion-app">
                    <td className="px-5 py-3">
                      <Link href={`/app/changes/${r.id}`} className="text-sirion-s3 hover:underline">
                        {r.id}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sirion-ink">{recordThread(r).subject}</p>
                      <p className="text-xs text-sirion-muted2">{supplierById(c.supplierId)?.name}</p>
                    </td>
                    <td className="px-3 py-3 text-sirion-muted2">
                      {r.extraction.changes.filter(isLive).length} live
                      {blocks > 0 && <span className="ml-2 text-xs text-sirion-danger-ink">{blocks} blocking</span>}
                    </td>
                    <td className="px-3 py-3">
                      <StageChip stage={r.stage} />
                    </td>
                    <td className="px-3 py-3 text-sirion-muted2">{w ? `${personById(w.assigneeId)?.name} (${roleLabel[w.role]})` : "—"}</td>
                    <td className="px-5 py-3 text-xs text-sirion-muted2">{dateTime(r.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </WorkSurface>
  );
}
