"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, Send, UserRound } from "lucide-react";
import type { ApprovalStep, ChangeRecord } from "@/lib/types";
import { contractById } from "@/lib/data/contracts";
import { personById, supplierById } from "@/lib/data/company";
import { needsSignature, useStore } from "@/lib/store";
import { amendmentDraft, confirmationDraft, declineDraft } from "@/lib/drafts";
import { instrumentId } from "@/lib/terms";
import { date, dateTime } from "@/lib/format";
import { isLive } from "@/lib/rules";
import { AIPanel, Button, Card, Empty, Eyebrow, LinkButton, StageChip, StatusChip, WorkSurface } from "@/components/ui";
import { ChecksList, recordThread, roleLabel, ThreadView } from "@/components/capture";

const unlocked = (r: ChangeRecord, s: ApprovalStep) => s.role === "business_owner" || r.steps.find((x) => x.role === "business_owner")?.status === "approved";

function FlowStrip({ r }: { r: ChangeRecord }) {
  const items: { label: string; state: "done" | "now" | "todo" | "bad" }[] = [{ label: "Captured", state: "done" }];
  for (const s of r.steps) {
    items.push({
      label: roleLabel[s.role],
      state: s.status === "approved" ? "done" : s.status === "rejected" ? "bad" : unlocked(r, s) && (r.stage === "in_review" || r.stage === "clarifying") ? "now" : "todo",
    });
  }
  const sign = needsSignature(r);
  items.push({ label: "Sent to Supplier", state: r.stage === "sent" || r.stage === "executed" ? "done" : r.stage === "approved" ? "now" : "todo" });
  if (sign) items.push({ label: "Signed", state: r.stage === "executed" ? "done" : r.stage === "sent" ? "now" : "todo" });
  items.push({ label: "In Contract", state: r.stage === "executed" ? "done" : "todo" });
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
              it.state === "done"
                ? "bg-sirion-s3 text-white"
                : it.state === "now"
                  ? "hairline border-sirion-s3 bg-sirion-card text-sirion-s3 shadow-glow"
                  : it.state === "bad"
                    ? "hairline border-sirion-danger text-sirion-danger-ink"
                    : "hairline border-sirion-line/40 text-sirion-muted2"
            }`}
          >
            {it.state === "done" && <Check size={12} strokeWidth={2} />}
            {it.label}
          </span>
          {i < items.length - 1 && <span className="h-px w-4 bg-sirion-line/50" />}
        </li>
      ))}
    </ol>
  );
}

export function RecordView({ id }: { id: string }) {
  const store = useStore();
  const { records, viewerId, setViewer, decide, sendReply, recordAcceptance, sendConfirmation, markSigned, replies, ready } = store;
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"doc" | "email">("doc");
  const r = records.find((x) => x.id === id);

  if (!ready) return <WorkSurface>{null}</WorkSurface>;
  if (!r)
    return (
      <WorkSurface>
        <Empty title="Change record not found">
          <Link href="/app/inbox" className="text-sirion-s3 underline">
            Back to the inbox
          </Link>
        </Empty>
      </WorkSurface>
    );

  const contract = contractById(r.contractId)!;
  const supplier = supplierById(contract.supplierId)!;
  const owner = personById(contract.businessOwnerId)!;
  const viewer = personById(viewerId)!;
  const thread = recordThread(r);
  const live = r.extraction.changes.filter(isLive);
  const docTitle = r.instrument === "amendment" ? "Amendment" : "Change Order";
  const nextStep = r.steps.find((s) => s.status === "pending" && unlocked(r, s));
  const replySent = replies[r.id];

  return (
    <WorkSurface>
      <Link href="/app/changes" className="mb-4 inline-flex items-center gap-1 text-sm text-sirion-s3 hover:underline">
        <ArrowLeft size={14} strokeWidth={1.5} /> Change Records
      </Link>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Eyebrow>
            {r.id} · {supplier.name}
          </Eyebrow>
          <h1 className="mt-2 text-[32px] leading-9 text-sirion-ink">{thread.subject}</h1>
          <p className="mt-2 text-sm font-light text-sirion-muted2">
            {contract.msa.id} → {contract.sow.id} · Owner {owner.name} · Created {dateTime(r.createdAt)} ·{" "}
            {r.extractionSource === "live" ? "Live extraction" : "Stored extraction"}
          </p>
        </div>
        <StageChip stage={r.stage} />
      </div>

      <Card className="mb-6 p-4">
        <FlowStrip r={r} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-6">
          {/* Changes */}
          <Card className="overflow-hidden">
            <div className="px-5 pt-5">
              <Eyebrow>Captured Changes</Eyebrow>
            </div>
            <div className="overflow-x-auto">
              {/* Fixed value columns; the effective date sits under the description so long values and descriptions never crush each other. */}
              <table className="mt-3 w-full min-w-[560px] table-fixed text-sm">
                <colgroup>
                  <col />
                  <col className="w-[120px]" />
                  <col className="w-[170px]" />
                  <col className="w-[130px]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-sirion-light text-left text-xs text-sirion-muted2">
                    <th className="px-5 py-2 font-normal">Change</th>
                    <th className="px-3 py-2 font-normal">Current</th>
                    <th className="px-3 py-2 font-normal">New</th>
                    <th className="px-5 py-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sirion-light">
                  {r.extraction.changes.map((c) => (
                    <tr key={c.id} className={`h-12 align-top ${isLive(c) ? "" : "opacity-60"}`}>
                      <td className="px-5 py-3 text-sirion-ink">
                        <span className="mr-2 text-xs text-sirion-muted2">{c.id}</span>
                        {c.description}
                        {c.effectiveDate && <span className="mt-0.5 block text-xs text-sirion-muted2">From {date(c.effectiveDate)}</span>}
                      </td>
                      <td className="px-3 py-3">{c.fromValue ? <span className="diff-del rounded px-1 text-sirion-muted2">{c.fromValue}</span> : "—"}</td>
                      <td className="px-3 py-3">
                        <span className="diff-add rounded px-1 text-sirion-ink">{c.toValue}</span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusChip status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Clarifying */}
          {r.stage === "clarifying" && r.extraction.suggestedReply && (
            <AIPanel title="Suggested Clarifying Reply">
              <p className="mb-3 text-sm font-light text-sirion-muted2">Nothing in this thread is fully agreed. This reply closes the open points. It goes out only when {owner.name} approves it.</p>
              <pre className="hairline whitespace-pre-wrap rounded-sm border-sirion-light bg-sirion-card p-4 font-sans text-sm leading-6 text-sirion-ink">{r.extraction.suggestedReply}</pre>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {viewerId === owner.id ? (
                  <Button
                    onClick={() => {
                      sendReply(r.id);
                      recordAcceptance(r.id);
                    }}
                  >
                    <Send size={14} strokeWidth={1.5} /> Approve and Send Reply
                  </Button>
                ) : (
                  <SwitchTo id={owner.id} onSwitch={setViewer} why="to approve this reply" />
                )}
              </div>
            </AIPanel>
          )}

          {/* Holding reply for in-review records */}
          {r.stage === "in_review" && r.extraction.suggestedReply && (
            <AIPanel title="Suggested Holding Reply" meta={replySent ? <span className="text-xs text-sirion-s3">Sent</span> : null}>
              <p className="mb-3 text-sm font-light text-sirion-muted2">The supplier is acting on terms that are not approved. Tell them where things stand while approvals run.</p>
              <pre className="hairline whitespace-pre-wrap rounded-sm border-sirion-light bg-sirion-card p-4 font-sans text-sm leading-6 text-sirion-ink">{r.extraction.suggestedReply}</pre>
              {!replySent && (
                <div className="mt-4">
                  {viewerId === owner.id ? (
                    <Button variant="secondary" onClick={() => sendReply(r.id)}>
                      <Send size={14} strokeWidth={1.5} /> Approve and Send Reply
                    </Button>
                  ) : (
                    <SwitchTo id={owner.id} onSwitch={setViewer} why="to send this reply" />
                  )}
                </div>
              )}
            </AIPanel>
          )}

          {/* Drafts */}
          <Card className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <Eyebrow>Drafts</Eyebrow>
              <div className="flex rounded-sm bg-sirion-app p-1 text-sm">
                {(["doc", "email"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-sm px-3 py-1 ${tab === t ? "bg-sirion-card text-sirion-ink shadow-sm" : "text-sirion-muted2"}`}
                  >
                    {t === "doc" ? `${docTitle} ${instrumentId(r)}` : "Supplier Confirmation"}
                  </button>
                ))}
              </div>
            </div>
            {r.stage === "rejected" ? (
              <div className="ai-surface rounded-r-sm p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-sirion-ink">{declineDraft(r, contract)}</pre>
              </div>
            ) : (
              <>
                <div className={`ai-surface relative rounded-r-sm p-4 ${r.stage === "in_review" || r.stage === "clarifying" ? "opacity-60" : ""}`}>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-sirion-ink">{tab === "doc" ? amendmentDraft(r, contract) : confirmationDraft(r, contract)}</pre>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {(r.stage === "in_review" || r.stage === "clarifying") && (
                    <p className="inline-flex items-center gap-2 text-sm text-sirion-muted2">
                      <Lock size={14} strokeWidth={1.5} /> Sending unlocks when every approval is in.
                    </p>
                  )}
                  {r.stage === "approved" && (
                    <>
                      <Button onClick={() => sendConfirmation(r.id)}>
                        <Send size={14} strokeWidth={1.5} /> Approve and Send to {supplier.contact}
                      </Button>
                      <span className="text-xs text-sirion-muted2">Sends the {needsSignature(r) ? `${docTitle.toLowerCase()} for signature` : "confirmation"} with the email.</span>
                    </>
                  )}
                  {r.stage === "sent" && (
                    <Button onClick={() => markSigned(r.id)}>
                      <Check size={14} strokeWidth={1.5} /> Mark Signed by Both Parties
                    </Button>
                  )}
                  {r.stage === "executed" && (
                    <LinkButton href={`/app/contracts/${contract.id}`} variant="secondary">
                      View Updated Contract Terms <ArrowRight size={14} strokeWidth={1.5} />
                    </LinkButton>
                  )}
                </div>
              </>
            )}
          </Card>

          <Card className="p-5">
            <Eyebrow className="mb-3">Source Thread</Eyebrow>
            <ThreadView messages={thread.messages} changes={r.extraction.changes} />
          </Card>
        </div>

        <div className="space-y-6">
          {/* Approvals */}
          <Card className="p-5">
            <Eyebrow className="mb-4">Approvals</Eyebrow>
            <ol className="space-y-4">
              {r.steps.map((s) => {
                const p = personById(s.assigneeId)!;
                const open = s.status === "pending" && unlocked(r, s) && r.stage === "in_review";
                const mine = open && viewerId === s.assigneeId;
                return (
                  <li key={s.id} className={`hairline rounded-lg p-4 ${mine ? "border-sirion-s3 shadow-glow" : "border-sirion-light"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-sirion-ink">{roleLabel[s.role]}</p>
                        <p className="text-xs text-sirion-muted2">
                          {p.name}, {p.title}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs capitalize ${
                          s.status === "approved"
                            ? "bg-sirion-s3 text-white"
                            : s.status === "rejected"
                              ? "hairline border-sirion-danger text-sirion-danger-ink"
                              : "hairline border-sirion-line/50 text-sirion-muted2"
                        }`}
                      >
                        {s.status === "pending" && !unlocked(r, s) ? "Waiting" : s.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-light text-sirion-muted2">{s.reason}</p>
                    {s.decidedAt && (
                      <p className="mt-2 text-xs text-sirion-muted2">
                        {dateTime(s.decidedAt)}
                        {s.note ? ` · "${s.note}"` : ""}
                      </p>
                    )}
                    {mine && (
                      <div className="mt-3 space-y-2">
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Note (optional)"
                          className="hairline w-full rounded-sm border-sirion-line/50 bg-sirion-app px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              decide(r.id, s.id, true, note || undefined);
                              setNote("");
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              decide(r.id, s.id, false, note || undefined);
                              setNote("");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                    {open && !mine && <SwitchTo id={s.assigneeId} onSwitch={setViewer} why="to act on this step" />}
                  </li>
                );
              })}
            </ol>
            {r.stage === "clarifying" && <p className="mt-4 text-sm text-sirion-muted2">Approvals start once the open points are resolved with the supplier.</p>}
            {nextStep && r.stage === "in_review" && viewerId !== nextStep.assigneeId && (
              <p className="mt-4 text-xs text-sirion-muted2">You are viewing as {viewer.name}.</p>
            )}
          </Card>

          <Card className="p-5">
            <Eyebrow className="mb-1">Contract Checks</Eyebrow>
            <ChecksList checks={r.checks} />
          </Card>

          <Card className="p-5">
            <Eyebrow className="mb-3">Activity</Eyebrow>
            <ol className="space-y-2 text-sm">
              {[...r.log].reverse().map((l, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-24 shrink-0 text-xs text-sirion-muted2">{dateTime(l.at)}</span>
                  <span className="text-sirion-muted2">
                    <span className="text-sirion-ink">{l.who}</span> {l.text}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-sirion-muted2">{live.length} live change(s) in this record.</p>
          </Card>
        </div>
      </div>
    </WorkSurface>
  );
}

function SwitchTo({ id, onSwitch, why }: { id: string; onSwitch: (id: string) => void; why: string }) {
  const p = personById(id)!;
  return (
    <button onClick={() => onSwitch(id)} className="mt-3 inline-flex items-center gap-2 text-sm text-sirion-s3 hover:underline">
      <UserRound size={14} strokeWidth={1.5} /> View as {p.name} {why}
    </button>
  );
}
