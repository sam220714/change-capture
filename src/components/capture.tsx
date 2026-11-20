"use client";

import { Fragment, type ReactNode } from "react";
import { ArrowRight, Quote } from "lucide-react";
import type { ApprovalStep, Check, ChangeRecord, Contract, EmailMessage, ExtractedChange, Extraction } from "@/lib/types";
import { personById, PEOPLE } from "@/lib/data/company";
import { threadById } from "@/lib/data/threads";
import { date, dateTime, inr, pct } from "@/lib/format";
import { changePct, valueImpact } from "@/lib/rules";
import { nameOf } from "@/lib/threadText";
import { AIPanel, LevelIcon, StatusChip } from "./ui";

export function recordThread(r: ChangeRecord) {
  const t = threadById(r.threadId);
  if (t) return { subject: t.subject, supplierId: t.supplierId, messages: t.messages };
  return r.pastedThread ?? { subject: "Pasted thread", supplierId: "", messages: [] };
}

function highlight(body: string, quotes: string[]): ReactNode[] {
  const ranges: [number, number][] = [];
  for (const q of quotes) {
    const i = body.indexOf(q);
    if (i >= 0) ranges.push([i, i + q.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const out: ReactNode[] = [];
  let pos = 0;
  ranges.forEach(([s, e], k) => {
    if (s < pos) return;
    out.push(body.slice(pos, s));
    out.push(
      <mark key={k} className="evidence">
        {body.slice(s, e)}
      </mark>,
    );
    pos = e;
  });
  out.push(body.slice(pos));
  return out;
}

export function ThreadView({ messages, changes, focus }: { messages: EmailMessage[]; changes: ExtractedChange[]; focus?: string | null }) {
  const used = focus ? changes.filter((c) => c.id === focus) : changes;
  return (
    <ol className="space-y-3">
      {messages.map((m, i) => {
        const quotes = used.flatMap((c) => c.evidence.filter((e) => e.messageIndex === i).map((e) => e.quote));
        const buyer = /@kavora\.in/i.test(m.from);
        return (
          <li key={i} id={`msg-${i}`} className={`hairline rounded-lg bg-sirion-card p-4 ${buyer ? "border-sirion-soft" : "border-sirion-light"}`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <p>
                <span className="text-sirion-ink">{nameOf(m.from)}</span>
                <span className="ml-2 text-xs text-sirion-muted2">{buyer ? "Kavora" : "Supplier"}</span>
              </p>
              <p className="text-xs text-sirion-muted2">
                [{i}] {m.date ? dateTime(m.date) : ""}
              </p>
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-sirion-muted2">{highlight(m.body, quotes)}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function ChangeCard({
  change,
  contract,
  onFocus,
  focused,
}: {
  change: ExtractedChange;
  contract: Contract;
  onFocus?: (id: string | null) => void;
  focused?: boolean;
}) {
  const p = changePct(change);
  const impact = valueImpact(change, contract);
  const agreer = PEOPLE.find((x) => x.email === change.agreedBy);
  const dim = change.status === "superseded" || change.status === "rejected";
  return (
    <div
      className={`hairline rounded-lg bg-sirion-card p-4 transition-shadow ${focused ? "border-sirion-s3 shadow-glow" : "border-sirion-light"} ${dim ? "opacity-70" : ""}`}
      onMouseEnter={() => onFocus?.(change.id)}
      onMouseLeave={() => onFocus?.(null)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-sirion-ink">
          <span className="mr-2 text-xs text-sirion-muted2">{change.id}</span>
          {change.description}
        </p>
        <StatusChip status={change.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {change.fromValue && <span className="diff-del rounded px-1.5 text-sirion-muted2">{change.fromValue}</span>}
        {change.fromValue && <ArrowRight size={14} strokeWidth={1.5} className="text-sirion-line" />}
        <span className="diff-add rounded px-1.5 text-sirion-ink">{change.toValue}</span>
        {p != null && <span className="text-xs text-sirion-muted2">{pct(p)}</span>}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-sirion-muted2 sm:grid-cols-4">
        <div>
          <dt>Effective</dt>
          <dd className="text-sirion-ink">{date(change.effectiveDate)}{change.endDate ? ` to ${date(change.endDate)}` : ""}</dd>
        </div>
        <div>
          <dt>Agreed by</dt>
          <dd className="text-sirion-ink">{agreer?.name ?? change.agreedBy ?? "—"}</dd>
        </div>
        <div>
          <dt>Value impact</dt>
          <dd className="text-sirion-ink">{impact ? inr(impact) : "—"}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd className="text-sirion-ink">{Math.round(change.confidence * 100)}%</dd>
        </div>
      </dl>
      {change.ambiguity && <p className="mt-3 rounded-sm bg-sirion-warning-soft px-3 py-2 text-xs text-sirion-warning-ink">{change.ambiguity}</p>}
      <ul className="mt-3 space-y-1.5">
        {change.evidence.map((e, i) => (
          <li key={i}>
            <a href={`#msg-${e.messageIndex}`} className="flex gap-2 text-xs text-sirion-muted2 hover:text-sirion-s3">
              <Quote size={12} strokeWidth={1.5} className="mt-0.5 shrink-0 text-sirion-line" />
              <span>
                <span className="text-sirion-line">[{e.messageIndex}]</span> {e.quote}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExtractionPanel({
  extraction,
  contract,
  source,
  focus,
  onFocus,
}: {
  extraction: Extraction;
  contract: Contract;
  source: "live" | "stored";
  focus?: string | null;
  onFocus?: (id: string | null) => void;
}) {
  return (
    <AIPanel
      title="What Was Agreed"
      meta={<span className="text-xs text-sirion-muted2">{source === "live" ? "Live: Claude Opus 5.5" : "Stored extraction (demo mode)"}</span>}
    >
      <p className="text-base font-light leading-6 text-sirion-ink">{extraction.summary}</p>
      <div className="mt-4 space-y-3">
        {extraction.changes.map((c) => (
          <ChangeCard key={c.id} change={c} contract={contract} focused={focus === c.id} onFocus={onFocus} />
        ))}
      </div>
      {(extraction.openQuestions.length > 0 || extraction.riskFlags.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {extraction.openQuestions.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">Open Questions</p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-sirion-muted2">
                {extraction.openQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {extraction.riskFlags.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[1.5px] text-sirion-line">Risk Flags</p>
              <ul className="list-disc space-y-1 pl-4 text-sm text-sirion-muted2">
                {extraction.riskFlags.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AIPanel>
  );
}

export function ChecksList({ checks }: { checks: Check[] }) {
  return (
    <ul className="divide-y divide-sirion-light">
      {checks.map((c) => (
        <li key={c.id} className="flex gap-3 py-3">
          <LevelIcon level={c.level} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-sirion-ink">
              {c.changeId && <span className="mr-2 text-xs text-sirion-muted2">{c.changeId}</span>}
              {c.title}
            </p>
            <p className="mt-0.5 text-sm font-light text-sirion-muted2">{c.detail}</p>
          </div>
          {c.source && <span className="hidden shrink-0 self-start rounded-full bg-sirion-light px-2.5 py-0.5 text-xs text-sirion-s3 sm:inline">{c.source}</span>}
        </li>
      ))}
    </ul>
  );
}

const roleLabel = { business_owner: "Business Owner", finance: "Finance", legal: "Legal" } as const;

export function StepsPreview({ steps }: { steps: ApprovalStep[] }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const p = personById(s.assigneeId);
        return (
          <Fragment key={s.id}>
            <li className="flex gap-3">
              <span className="hairline flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-sirion-line text-xs text-sirion-s3">{i + 1}</span>
              <div>
                <p className="text-sm text-sirion-ink">
                  {roleLabel[s.role]} <span className="text-sirion-muted2">· {p?.name}</span>
                </p>
                <p className="text-sm font-light text-sirion-muted2">{s.reason}</p>
              </div>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

export { roleLabel };
