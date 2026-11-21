/**
 * Verdict copy for the capture review screen. Derived from the buckets in rules.ts, never from the model.
 * "You" is the contract's business owner; when someone else is viewing, the owner's name stands in.
 */
import type { ActingRole, Contract, Person } from "./types";
import { supplierById } from "./data/company";
import { date, inr } from "./format";
import { capCounter, type Bucket, type ChangeVerdict, type RuleResult } from "./rules";

export interface Voice {
  isOwner: boolean;
  /** "you" or the owner's name, for use mid-sentence. */
  you: string;
  /** "your" or "Priya Menon's". */
  your: string;
  owner: Person;
}

export function voiceFor(owner: Person, viewerId: string): Voice {
  const isOwner = owner.id === viewerId;
  return { isOwner, you: isOwner ? "you" : owner.name, your: isOwner ? "your" : `${owner.name}'s`, owner };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function joinAnd(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const roleName: Record<ActingRole, string> = { business_owner: "Business Owner", finance: "Finance", legal: "Legal" };

export interface BucketCopy {
  title: string;
  sub: string;
  empty: string;
}

export function bucketCopy(b: Bucket, voice: Voice): BucketCopy {
  if (b === "approve") {
    return {
      title: voice.isOwner ? "You Can Approve" : `${voice.owner.name} Can Approve`,
      sub: `Inside the MSA and ${voice.your} approval limits`,
      empty: `Nothing is fully inside ${voice.your} authority.`,
    };
  }
  if (b === "signoff") return { title: "Needs Sign-Off", sub: "Someone beyond the business owner decides", empty: "No one else needs to sign off." };
  return { title: "Not Allowed As Agreed", sub: "Breaks a contract rule", empty: "Nothing breaks a contract rule." };
}

export type VerdictTone = Bucket | "clarify" | "closed";

export interface Verdict {
  tone: VerdictTone;
  head: string;
  sub: string;
}

/** Finance and Legal across the given changes, in that order. The owner is handled separately. */
function outsideRoles(vs: ChangeVerdict[]): ("finance" | "legal")[] {
  const roles = new Set(vs.flatMap((v) => v.signers.map((s) => s.role)));
  return (["finance", "legal"] as const).filter((r) => roles.has(r));
}

// "was agreed by ..." / "breaks ..." read in the singular; swap the verb when several changes share one reason.
const plural = (note: string) => note.replace(/^was /, "were ").replace(/^breaks /, "break ");

function blockSentence(blocked: ChangeVerdict[]) {
  const groups = new Map<string, string[]>();
  for (const v of blocked) {
    const note = v.blockNotes.join(" and ");
    groups.set(note, [...(groups.get(note) ?? []), v.name]);
  }
  return [...groups].map(([note, names]) => `${joinAnd(names)} ${names.length > 1 ? plural(note) : note}`).join("; ");
}

function bindingSentence(result: RuleResult) {
  const validity = result.binds.find((k) => k.id === "validity");
  const doc = result.instrument === "amendment" ? "amendment" : "change order";
  if (!validity) return "";
  if (validity.level === "ok") return "The MSA allows this by email change order.";
  if (validity.level === "block") return "It needs a signed amendment, because the added spend is above the email change-order limit.";
  return `It binds once a signed ${doc} is in place.`;
}

const typeWord: Record<string, string> = { rate: "rate", fee: "fee", headcount: "headcount", dates: "date", scope: "scope", payment_terms: "payment terms" };
const countWord = (n: number) => ["Zero", "One", "Two", "Three", "Four", "Five"][n] ?? String(n);

export function verdictFor(result: RuleResult, voice: Voice, hasReply: boolean): Verdict {
  const blocked = result.verdicts.filter((v) => v.bucket === "blocked");
  const signoff = result.verdicts.filter((v) => v.bucket === "signoff");
  const approve = result.verdicts.filter((v) => v.bucket === "approve");

  if (result.verdicts.length === 0) {
    return { tone: "closed", head: "Nothing left to approve", sub: "Every change in this thread was rejected or replaced by a later one, so there is nothing to record." };
  }

  if (blocked.length > 0) {
    const outside = outsideRoles([...blocked, ...signoff]).map((r) => roleName[r]);
    const ratify = blocked.some((v) => v.signers.some((s) => s.role === "business_owner"));
    const tail = outside.length
      ? `${joinAnd(outside)} must sign off${ratify ? `, and ${voice.you} must ratify or reject` : ""}.`
      : `${cap(voice.you)} must ratify or reject ${blocked.length > 1 ? "them" : "it"} before ${blocked.length > 1 ? "they bind" : "it binds"}.`;
    return { tone: "blocked", head: "This can't go ahead as agreed", sub: `${cap(blockSentence(blocked))}. ${tail}` };
  }

  if (result.needsClarification) {
    return {
      tone: "clarify",
      head: "Clarify with the supplier before anything binds",
      sub: `${countWord(signoff.length)} change${signoff.length === 1 ? " was" : "s were"} offered but not accepted by both sides. ${hasReply ? "A reply to the supplier is drafted for you." : "Settle the open points with the supplier first."}`,
    };
  }

  if (signoff.length > 0) {
    const outside = outsideRoles(signoff).map((r) => roleName[r]);
    const names = joinAnd(signoff.map((v) => v.name));
    const rest = approve.length ? ` ${countWord(approve.length)} other change${approve.length === 1 ? "" : "s"} ${voice.you} can approve.` : "";
    if (outside.length === 0) {
      return { tone: "signoff", head: "Some changes are not agreed yet", sub: `${names} ${signoff.length === 1 ? "is" : "are"} not agreed by both sides yet.${rest}` };
    }
    return { tone: "signoff", head: `Needs sign-off from ${joinAnd(outside)}`, sub: `${names} ${signoff.length === 1 ? "needs" : "need"} ${joinAnd(outside)}.${rest}` };
  }

  // Everything is agreed and inside the rules.
  const okIds = new Set(approve.flatMap((v) => v.checks.filter((k) => k.level === "ok").map((k) => k.id.split("-").slice(1).join("-"))));
  const inside = [okIds.has("cap") && "the MSA rate cap", okIds.has("limit") && `${voice.your} approval limit`, okIds.has("po") && "the PO"].filter(Boolean) as string[];
  const types = new Set(approve.map((v) => v.change.type));
  const what = `${countWord(approve.length)} ${types.size === 1 ? `${typeWord[[...types][0]]} change` : "change"}${approve.length === 1 ? "" : "s"}`;
  const first = inside.length ? `${what}, inside ${joinAnd(inside)}.` : `${what} with nothing that breaks the contract or goes past ${voice.your} limits.`;
  return {
    tone: "approve",
    head: voice.isOwner ? "You can approve this yourself" : `${voice.owner.name} can approve this`,
    sub: [first, bindingSentence(result)].filter(Boolean).join(" "),
  };
}

export function allApprovable(result: RuleResult) {
  return result.verdicts.length > 0 && !result.needsClarification && result.verdicts.every((v) => v.bucket === "approve");
}

export const ctaLabel = (result: RuleResult) => (allApprovable(result) ? "Approve and Create Record" : "Create Record and Route");

export function routeCaption(result: RuleResult, voice: Voice, existingId?: string) {
  const names = result.steps.map((s) => {
    if (s.role === "business_owner") return voice.you;
    const p = s.assigneeId === "p-rahul" ? "Rahul Iyer" : s.assigneeId === "p-anika" ? "Anika Shah" : "";
    return `${p} (${roleName[s.role]})`;
  });
  const route =
    existingId ? `Already created as ${existingId}.` : names.length === 0 ? "Nothing live to route." : names.length === 1 ? `Routes to ${names[0]} only.` : `Routes to ${names[0]}, then ${joinAnd(names.slice(1))}.`;
  return `${route} Nothing is sent to the supplier yet.`;
}

/** One sentence on why an approvable change is approvable, built from the checks that passed. */
export function approveWhy(v: ChangeVerdict, contract: Contract, voice: Voice) {
  const ok = new Map(v.checks.filter((k) => k.level === "ok").map((k) => [k.id.split("-").slice(1).join("-"), k]));
  const rules = contract.msa.rules;
  const limit = voice.owner.authority.ratePct;
  const inside = [ok.has("cap") && rules.rateCapPct != null && `the ${rules.rateCapPct}% MSA cap`, ok.has("limit") && `${voice.your} ${limit}% limit`].filter(Boolean) as string[];
  const parts: string[] = [];
  if (inside.length && v.pct != null) parts.push(`${Math.abs(v.pct).toFixed(1)}% is inside ${joinAnd(inside)}`);
  if (ok.has("po")) parts.push(`${inr(v.impact)} fits the ${inr(contract.po.value - contract.po.committed)} left on the PO`);
  if (parts.length) return `${parts.join(", and ")}.`;
  const first = v.checks.find((k) => k.level === "ok");
  return first ? `${first.title}.` : `Nothing in this change breaks the contract or goes past ${voice.your} limits.`;
}

/** "1 change rejected, 1 superseded", or null when nothing was closed. */
export function closedLine(result: RuleResult) {
  const n = (s: string) => result.closed.filter((c) => c.status === s).length;
  const counts = (["rejected", "superseded"] as const).map((s) => [s, n(s)] as const).filter(([, k]) => k > 0);
  if (counts.length === 0) return null;
  // "1 change superseded", or "1 change rejected, 1 superseded" when both kinds are present.
  const parts = counts.map(([s, k], i) => (i === 0 ? `${k} ${k === 1 ? "change" : "changes"} ${s}` : `${k} ${s}`));
  return `Closed in the thread: ${parts.join(", ")}`;
}

/** A counter at the MSA cap, written from the contract rule. Plain code, not AI, so the panel does not carry the AI mark. */
export function counterReply(v: ChangeVerdict, contract: Contract, voice: Voice): { label: string; text: string } | null {
  const counter = capCounter(v.change, contract);
  if (!counter) return null;
  const supplier = supplierById(contract.supplierId);
  const first = supplier?.contact.split(" ")[0] ?? "there";
  const c = v.change;
  const from = c.effectiveDate ? ` from ${date(c.effectiveDate)}` : "";
  const text =
    `Hi ${first},\n\n` +
    `Thanks for the proposal. Clause ${counter.clause} of our MSA caps a rate revision at ${counter.capPct}% per role in 12 months, so the most we can agree for ${v.name} is ${counter.display}${from}, not ${c.toValue}.\n\n` +
    `If that works for you, please confirm by reply. Until we have agreed a rate, please keep invoicing at ${c.fromValue ?? "the current rate"}.\n\n` +
    voice.owner.name;
  return { label: `Counter at ${counter.capPct}% (${counter.display})`, text };
}
