"use client";

import { Fragment, type ReactNode } from "react";
import type { ApprovalStep, Check, ChangeRecord, EmailMessage, ExtractedChange } from "@/lib/types";
import { personById } from "@/lib/data/company";
import { threadById } from "@/lib/data/threads";
import { dateTime } from "@/lib/format";
import { nameOf } from "@/lib/threadText";
import { LevelIcon } from "./ui";

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
          <li
            key={i}
            id={`msg-${i}`}
            data-dim={focus && quotes.length === 0 ? "true" : undefined}
            className={`hairline rounded-lg bg-sirion-card p-4 transition-opacity ${buyer ? "border-sirion-soft" : "border-sirion-light"} ${focus && quotes.length === 0 ? "opacity-40" : ""}`}
          >
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

export function ChecksList({ checks }: { checks: Check[] }) {
  return (
    // Container query: the source chip sits beside the text only when the panel is wide enough; in a narrow column it drops under the text instead of squeezing it.
    <ul className="@container divide-y divide-sirion-light">
      {checks.map((c) => (
        <li key={c.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 py-3 @lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <LevelIcon level={c.level} />
          <div className="min-w-0">
            <p className="text-sm text-sirion-ink">
              {c.changeId && <span className="mr-2 text-xs text-sirion-muted2">{c.changeId}</span>}
              {c.title}
            </p>
            <p className="mt-0.5 text-sm font-light text-sirion-muted2">{c.detail}</p>
          </div>
          {c.source && (
            <span className="col-start-2 mt-2 w-fit rounded-full bg-sirion-light px-2.5 py-0.5 text-xs text-sirion-s3 @lg:col-start-3 @lg:row-start-1 @lg:mt-0 @lg:self-start">{c.source}</span>
          )}
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
