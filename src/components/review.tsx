"use client";

import { useState, type ReactNode } from "react";
import { ArrowRight, Ban, Check, CheckCircle2, ChevronRight, Copy, Info, Mail, Reply, Users, X } from "lucide-react";
import type { Check as CheckItem, CheckLevel, Contract } from "@/lib/types";
import { personByEmail, personById } from "@/lib/data/company";
import { date, inr, pct } from "@/lib/format";
import { capCounter, type Bucket, type ChangeVerdict } from "@/lib/rules";
import { approveWhy, counterReply, type BucketCopy, type Verdict, type VerdictTone, type Voice } from "@/lib/verdict";
import { AIPanel, Button, Card, Eyebrow, LevelIcon, StatusChip } from "./ui";
import { roleLabel } from "./capture";

/* Bucket identities: one colour family per bucket, all from the tokens. */
const TONE: Record<VerdictTone, { Icon: typeof Info; box: string; text: string }> = {
  approve: { Icon: CheckCircle2, box: "border-sirion-s3 bg-sirion-s3/10", text: "text-sirion-s3" },
  signoff: { Icon: Users, box: "border-sirion-warning bg-sirion-warning-soft", text: "text-sirion-warning-ink" },
  blocked: { Icon: Ban, box: "border-sirion-danger bg-sirion-danger/[0.07]", text: "text-sirion-danger-ink" },
  clarify: { Icon: Mail, box: "border-sirion-warning bg-sirion-warning-soft", text: "text-sirion-warning-ink" },
  closed: { Icon: Info, box: "border-sirion-line bg-sirion-light", text: "text-sirion-s3" },
};

export function BucketIcon({ tone, large = false }: { tone: VerdictTone; large?: boolean }) {
  const { Icon, box, text } = TONE[tone];
  return (
    <span className={`hairline inline-flex shrink-0 items-center justify-center ${large ? "h-[52px] w-[52px] rounded-md" : "h-9 w-9 rounded-[10px]"} ${box} ${text}`}>
      <Icon size={large ? 26 : 18} strokeWidth={1.5} />
    </span>
  );
}

export function scrollToEl(el: HTMLElement | null, block: ScrollLogicalPosition = "start") {
  if (!el) return;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block });
}

export function Avatar({ name, you = false }: { name: string; you?: boolean }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <span aria-hidden className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] tracking-wide ${you ? "bg-sirion-s3 text-white" : "bg-sirion-light text-sirion-s3"}`}>
      {initials}
    </span>
  );
}

function SourceChip({ children }: { children: ReactNode }) {
  return <span className="w-fit rounded-full bg-sirion-light px-2.5 py-0.5 text-xs text-sirion-s3">{children}</span>;
}

export function CheckRows({ checks }: { checks: { id: string; level: CheckLevel; title: string; detail?: string; source?: string }[] }) {
  return (
    <ul className="divide-y divide-sirion-light">
      {checks.map((k) => (
        <li key={k.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 gap-y-1 py-2.5 first:pt-0 last:pb-0">
          <LevelIcon level={k.level} />
          <div className="min-w-0">
            <p className="text-sm text-sirion-ink">{k.title}</p>
            {k.detail && <p className="text-[13px] font-light text-sirion-muted2">{k.detail}</p>}
          </div>
          {k.source && (
            <span className="col-start-2">
              <SourceChip>{k.source}</SourceChip>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Verdict card ---------- */

export function VerdictCard({
  verdict,
  counts,
  copy,
  onJump,
  actions,
}: {
  verdict: Verdict;
  counts: Record<Bucket, number>;
  copy: Record<Bucket, BucketCopy>;
  onJump: (b: Bucket) => void;
  actions: ReactNode;
}) {
  const buckets: Bucket[] = ["approve", "signoff", "blocked"];
  return (
    <section aria-labelledby="verdict-head" className="hairline grid grid-cols-1 gap-5 rounded-lg border-sirion-light bg-sirion-card p-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="flex items-start gap-4">
        <BucketIcon tone={verdict.tone} large />
        <div className="min-w-0">
          <Eyebrow>Where This Stands</Eyebrow>
          <h2 id="verdict-head" className="mt-1 text-[28px] leading-8 text-sirion-ink">
            {verdict.head}
          </h2>
          <p className="mt-2 max-w-[62ch] text-base font-light text-sirion-muted2">{verdict.sub}</p>
        </div>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {buckets.map((b) => {
          const n = counts[b];
          return (
            <li key={b} className="min-w-0">
              <button
                type="button"
                onClick={() => onJump(b)}
                aria-label={`${copy[b].title}: ${n} ${n === 1 ? "change" : "changes"}. Go to section.`}
                className={`hairline flex h-full w-full flex-col gap-0.5 rounded-md border-sirion-light bg-sirion-card p-3 text-left transition-colors hover:bg-sirion-app ${n ? "hover:border-sirion-s3" : ""}`}
              >
                <span className={`text-[28px] font-light leading-8 ${n ? TONE[b].text : "text-sirion-muted"}`}>{n}</span>
                <span className={`text-xs ${n ? "text-sirion-ink" : "text-sirion-muted2"}`}>{copy[b].title}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-3 border-t border-sirion-light pt-4 xl:col-span-2">{actions}</div>
    </section>
  );
}

/* ---------- Bucket sections ---------- */

export function BucketSection({ bucket, copy, count, children }: { bucket: Bucket; copy: BucketCopy; count: number; children?: ReactNode }) {
  const { Icon, text } = TONE[bucket];
  if (count === 0) {
    return (
      <div id={`bucket-${bucket}`} tabIndex={-1} className="hairline flex scroll-mt-20 items-center gap-2.5 rounded-md border-dashed border-sirion-soft px-4 py-3 text-sm text-sirion-muted2 outline-none">
        <Icon size={16} strokeWidth={1.5} className={`shrink-0 ${text}`} />
        <span>
          <span className="text-sirion-ink">{copy.title}.</span> {copy.empty}
        </span>
      </div>
    );
  }
  return (
    <section id={`bucket-${bucket}`} tabIndex={-1} aria-labelledby={`bucket-${bucket}-h`} className="scroll-mt-20 outline-none">
      <div className="mb-3 flex items-center gap-3">
        <BucketIcon tone={bucket} />
        <div>
          <h2 id={`bucket-${bucket}-h`} className="text-xl leading-[26px] font-normal text-sirion-ink">
            {copy.title}
          </h2>
          <p className="text-xs text-sirion-muted2">{copy.sub}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/* ---------- One change ---------- */

function SignerList({ signers, voice }: { signers: ChangeVerdict["signers"]; voice: Voice }) {
  return (
    <ul className="mt-2 space-y-2.5">
      {signers.map((s) => {
        const p = personById(s.assigneeId);
        const you = s.role === "business_owner" && voice.isOwner;
        return (
          <li key={s.role} className="flex items-start gap-2.5">
            <Avatar name={p?.name ?? roleLabel[s.role]} you={you} />
            <div className="min-w-0">
              <p className="text-sm text-sirion-ink">
                {p?.name} <span className="text-xs text-sirion-muted2">{roleLabel[s.role]}{you ? " · You" : ""}</span>
              </p>
              <p className="text-[13px] font-light text-sirion-muted2">{s.reason}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ReviewCard({
  v,
  contract,
  voice,
  focused,
  pinned,
  onPreview,
  onPin,
  onCounter,
}: {
  v: ChangeVerdict;
  contract: Contract;
  voice: Voice;
  focused: boolean;
  pinned: boolean;
  onPreview: (id: string | null) => void;
  onPin: (id: string) => void;
  onCounter: (v: ChangeVerdict) => void;
}) {
  const c = v.change;
  const agreer = personByEmail(c.agreedBy);
  const blockers = v.checks.filter((k) => k.level === "block");
  const counter = v.bucket === "blocked" ? counterReply(v, contract, voice) : null;
  const cc = counter ? capCounter(c, contract) : null;
  const facts: [string, string][] = [
    ["Effective", c.effectiveDate ? `${date(c.effectiveDate)}${c.endDate ? ` to ${date(c.endDate)}` : ""}` : "—"],
    ["Agreed by", agreer?.name ?? c.agreedBy ?? (c.status === "proposed" ? "Not yet" : "—")],
    ["Added spend", v.impact ? inr(v.impact) : "—"],
    ["Confidence", `${Math.round(c.confidence * 100)}%`],
  ];
  return (
    <article
      id={`change-${c.id}`}
      className={`hairline rounded-lg bg-sirion-card p-5 transition-shadow ${focused ? "border-sirion-s3 shadow-glow" : "border-sirion-light"}`}
      onMouseEnter={() => onPreview(c.id)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(c.id)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onPreview(null);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-base text-sirion-ink">{v.name}</p>
        <StatusChip status={c.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {c.fromValue && <span className="diff-del rounded px-1.5 text-sirion-muted2">{c.fromValue}</span>}
        {c.fromValue && <ArrowRight size={14} strokeWidth={1.5} className="text-sirion-line" />}
        <span className="diff-add rounded px-1.5 text-sirion-ink">{c.toValue}</span>
        {v.pct != null && <span className="text-xs text-sirion-muted2">{pct(v.pct)}</span>}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-sirion-muted2 sm:grid-cols-4">
        {facts.map(([k, val]) => (
          <div key={k} className="min-w-0">
            <dt>{k}</dt>
            <dd className="text-[13px] text-sirion-ink">{val}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 border-t border-sirion-light pt-3">
        {v.bucket === "approve" && (
          <>
            <p className="mb-2 text-[13px] text-sirion-muted2">{approveWhy(v, contract, voice)}</p>
            {v.checks.some((k) => k.level === "ok") && <CheckRows checks={v.checks.filter((k) => k.level === "ok")} />}
          </>
        )}

        {v.bucket === "signoff" && (
          <>
            {c.ambiguity && <p className="rounded-sm bg-sirion-warning-soft px-3 py-2 text-[13px] text-sirion-warning-ink">{c.ambiguity}</p>}
            <Eyebrow className={c.ambiguity ? "mt-3" : ""}>Who Signs Off</Eyebrow>
            <SignerList signers={v.signers} voice={voice} />
          </>
        )}

        {v.bucket === "blocked" && (
          <>
            <div className="space-y-2">
              {blockers.map((k: CheckItem) => (
                <div key={k.id} className="hairline rounded-md border-sirion-danger bg-sirion-danger/[0.07] p-3.5">
                  <div className="flex items-start gap-2">
                    <LevelIcon level="block" />
                    <p className="text-sm text-sirion-danger-ink">{k.title}</p>
                  </div>
                  <p className="mt-1 text-[13px] text-sirion-muted2">{k.detail}</p>
                  {k.source && (
                    <div className="mt-2">
                      <SourceChip>{k.source}</SourceChip>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Eyebrow className="mt-3">Who Signs Off</Eyebrow>
            <SignerList signers={v.signers} voice={voice} />
            {counter && cc && (
              <>
                <Eyebrow className="mt-3">Ways Forward</Eyebrow>
                <div className="mt-2">
                  <Button variant="secondary" className="px-3 py-1.5 text-[13px]" onClick={() => onCounter(v)}>
                    <Reply size={14} strokeWidth={1.5} /> {counter.label}
                  </Button>
                  <p className="mt-1.5 text-xs text-sirion-muted2">Drafts a reply that stays inside clause {cc.clause}. Nothing is sent.</p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button variant="ghost" aria-pressed={pinned} onClick={() => onPin(c.id)}>
          <Mail size={14} strokeWidth={1.5} /> {pinned ? "Showing in Thread" : "Show in Thread"}
        </Button>
        <span className="text-xs text-sirion-muted2">
          {c.evidence.length} {c.evidence.length === 1 ? "quote" : "quotes"}
        </span>
      </div>
    </article>
  );
}

/* ---------- Record-level notes ---------- */

export function Collapsible({ title, count, defaultOpen = false, children }: { title: string; count: number; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group hairline rounded-lg border-sirion-light bg-sirion-card px-5 py-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Eyebrow>{title}</Eyebrow>
          <span className="text-xs text-sirion-muted2">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </span>
        <ChevronRight size={14} strokeWidth={1.5} className="text-sirion-s3 transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

/* ---------- Thread tracing ---------- */

export function TraceBar({ name, pinned, onShowAll }: { name: string | null; pinned: boolean; onShowAll: () => void }) {
  return (
    <div role="status" aria-live="polite" className="mt-3 flex min-h-[38px] shrink-0 items-start gap-2 rounded-sm bg-sirion-light px-3 py-2 text-sm text-sirion-s3">
      {name ? (
        <>
          <Mail size={14} strokeWidth={1.5} className="mt-[3px] shrink-0" />
          <span className="min-w-0 flex-1">
            Showing quotes for <span className="text-sirion-ink">{name}</span>
            {pinned ? " (pinned)" : ""}
          </span>
          {pinned && (
            <Button variant="ghost" className="shrink-0 py-0" onClick={onShowAll}>
              Show All
            </Button>
          )}
        </>
      ) : (
        <>
          <Info size={14} strokeWidth={1.5} className="mt-[3px] shrink-0" />
          <span className="min-w-0 flex-1">Every quote the AI used is highlighted. Hover a change, or click Show in Thread, to see only its quotes.</span>
        </>
      )}
    </div>
  );
}

/* ---------- Reply panel ---------- */

export function ReplyPanel({ ai, title, text, onClose }: { ai: boolean; title: string; text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the text is on screen to select */
    }
  }
  const body = (
    <>
      <p className="whitespace-pre-line text-sm leading-6 text-sirion-ink">{text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />} {copied ? "Copied" : "Copy Reply"}
        </Button>
        <span className="text-xs text-sirion-muted2">Edit before sending. Nothing is sent from here.</span>
      </div>
    </>
  );
  const close = (
    <button type="button" onClick={onClose} aria-label="Close reply" className="hairline inline-flex h-8 w-8 items-center justify-center rounded-sm border-sirion-light text-sirion-s3 hover:bg-sirion-light">
      <X size={14} strokeWidth={1.5} />
    </button>
  );
  // AI-written drafts carry the teal mark. A counter built from the MSA cap is plain code, so it does not.
  if (ai) return <AIPanel title={title} meta={close}>{body}</AIPanel>;
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Eyebrow className="flex items-center gap-2">
          <Reply size={14} strokeWidth={1.5} /> {title}
        </Eyebrow>
        {close}
      </div>
      {body}
    </Card>
  );
}
