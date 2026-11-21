/**
 * Deterministic checks and routing. The AI reads the thread; this file decides.
 * Every check cites the clause or limit it relies on.
 */
import type { ActingRole, ApprovalStep, Check, Contract, ExtractedChange, Extraction, Term } from "./types";
import { personByEmail, personById } from "./data/company";
import { inr, monthsBetween, pct } from "./format";

const GST_RATE = 0.18;

export const isLive = (c: ExtractedChange) => c.status === "agreed" || c.status === "proposed";

export function termFor(contract: Contract, key: string | null): Term | undefined {
  if (!key) return undefined;
  return contract.sow.terms.find((t) => t.key === key);
}

/** Rate change as a %, when both values are numeric and the base is > 0. */
export function changePct(c: ExtractedChange): number | null {
  if (c.fromNumeric == null || c.toNumeric == null || c.fromNumeric <= 0) return null;
  if (c.type !== "rate" && c.type !== "fee") return null;
  return ((c.toNumeric - c.fromNumeric) / c.fromNumeric) * 100;
}

/** Added spend this change causes over its life, in INR. */
export function valueImpact(c: ExtractedChange, contract: Contract): number {
  if (c.fromNumeric == null || c.toNumeric == null) return 0;
  const delta = c.toNumeric - c.fromNumeric;
  const term = termFor(contract, c.termKey);
  const start = c.effectiveDate ?? contract.sow.start;
  const end = c.endDate ?? contract.sow.end;
  if (c.type === "rate" && term?.monthlyVolume) {
    return delta * term.monthlyVolume * monthsBetween(start, end);
  }
  if (c.type === "fee" && term?.unit === "month") {
    return delta * monthsBetween(start, end);
  }
  if (c.type === "fee" || c.type === "rate") return delta; // one-off amount
  return 0;
}

/** Where a live change lands for the business owner. Decided here in code, never by the model. */
export type Bucket = "approve" | "signoff" | "blocked";

export interface Signer {
  role: ActingRole;
  assigneeId: string;
  reason: string;
}

export interface ChangeVerdict {
  change: ExtractedChange;
  bucket: Bucket;
  /** Contract term label when the change maps to one, else the model's description. */
  name: string;
  /** This change's own checks. GST is record-level, so it is not in here. */
  checks: Check[];
  /** Who has to say yes, with the routing reason for each. */
  signers: Signer[];
  /** One short clause per blocking check, e.g. "breaks the 5% MSA rate cap (+11.9% vs 5%)". */
  blockNotes: string[];
  pct: number | null;
  impact: number;
}

export interface RuleResult {
  checks: Check[];
  steps: ApprovalStep[];
  instrument: "amendment" | "change_order";
  totalImpact: number;
  hasAgreed: boolean;
  needsClarification: boolean;
  /** Every live (agreed or proposed) change with its bucket, in thread order. */
  verdicts: ChangeVerdict[];
  /** Superseded or rejected in the thread. In no bucket. */
  closed: ExtractedChange[];
  /** Record-level: validity of the instrument and stamp duty. */
  binds: Check[];
  /** Record-level: GST notes. The extraction's riskFlags and openQuestions sit beside these in the UI. */
  gst: Check[];
}

export function changeName(c: ExtractedChange, contract: Contract): string {
  return termFor(contract, c.termKey)?.label ?? c.description;
}

/** The rate that would sit exactly at the MSA cap, for a rate increase that breaks it. */
export function capCounter(c: ExtractedChange, contract: Contract): { capPct: number; rate: number; display: string; clause: string } | null {
  const cap = contract.msa.rules.rateCapPct;
  const p = changePct(c);
  if (cap == null || c.type !== "rate" || p == null || p <= cap || c.fromNumeric == null) return null;
  const rate = Math.round(c.fromNumeric * (1 + cap / 100) * 100) / 100;
  const suffix = c.toValue.replace(/^[^/]*?[\d,.]+/, "").trim(); // "₹2,070 / hr" -> "/ hr"
  const digits = Number.isInteger(rate) ? 0 : 2;
  const num = rate.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return { capPct: cap, rate, display: `₹${num}${suffix ? ` ${suffix}` : ""}`, clause: contract.msa.rules.rateCapClause ?? "" };
}

const isGstCheck = (k: Check) => k.id.endsWith("-gst");

export function evaluate(extraction: Extraction, contract: Contract): RuleResult {
  const checks: Check[] = [];
  const owner = personById(contract.businessOwnerId)!;
  const headroom = contract.po.value - contract.po.committed;
  const rules = contract.msa.rules;
  const live = extraction.changes.filter(isLive);
  const agreed = live.filter((c) => c.status === "agreed");
  const routes = new Map<ActingRole, string[]>();
  const routesByChange = new Map<string, Map<ActingRole, string[]>>();
  const add = (m: Map<ActingRole, string[]>, role: ActingRole, reason: string) => {
    const list = m.get(role) ?? [];
    if (!list.includes(reason)) list.push(reason);
    m.set(role, list);
  };
  // Finance and Legal reasons also feed the record-level steps; the owner's own reason is per change only.
  const route = (changeId: string, role: ActingRole, reason: string) => {
    const own = routesByChange.get(changeId) ?? new Map<ActingRole, string[]>();
    routesByChange.set(changeId, own);
    add(own, role, reason);
    if (role !== "business_owner") add(routes, role, reason);
  };
  const blockNotes = new Map<string, string[]>();
  const note = (changeId: string, text: string) => blockNotes.set(changeId, [...(blockNotes.get(changeId) ?? []), text]);
  let ratify: string | null = null;

  for (const c of extraction.changes) {
    if (c.status === "superseded" || c.status === "rejected") {
      checks.push({
        id: `${c.id}-closed`,
        changeId: c.id,
        level: "info",
        title: c.status === "rejected" ? "Rejected in thread, not recorded" : `Superseded by ${c.supersededBy ?? "a later change"}`,
        detail: c.description,
      });
    }
  }

  let totalImpact = 0;
  for (const c of live) {
    const term = termFor(contract, c.termKey);
    if (c.status === "proposed") {
      checks.push({
        id: `${c.id}-open`,
        changeId: c.id,
        level: "warn",
        title: "Not agreed yet",
        detail: c.ambiguity ?? "Offered but not accepted by both sides.",
      });
    }

    // Authority
    if (c.status === "agreed") {
      const agreer = personByEmail(c.agreedBy);
      if (!agreer || agreer.authority.ratePct === 0) {
        const who = agreer ? `${agreer.name} (${agreer.title})` : c.agreedBy ?? "an unknown person";
        ratify = who;
        checks.push({
          id: `${c.id}-authority`,
          changeId: c.id,
          level: "block",
          title: "Agreed by someone without authority",
          detail: `${who} has no approval authority in the approval-limits table. ${owner.name} must ratify or reject before this binds the company.`,
          source: "Approval limits",
          routesTo: "business_owner",
        });
        route(c.id, "business_owner", `Ratify or reject: agreed by ${who}, who has no authority.`);
        note(c.id, `was agreed by ${who}, who has no approval authority`);
      }
    }

    // Size of change vs limits and caps
    const p = changePct(c);
    const impact = valueImpact(c, contract);
    totalImpact += impact;
    if (p != null) {
      if (rules.rateCapPct != null && c.type === "rate" && p > rules.rateCapPct) {
        checks.push({
          id: `${c.id}-cap`,
          changeId: c.id,
          level: "block",
          title: `Breaks MSA rate cap (${pct(p)} vs ${rules.rateCapPct}%)`,
          detail: `Clause ${rules.rateCapClause} caps any rate revision at ${rules.rateCapPct}% per role in 12 months. Agreeing this needs a deliberate MSA deviation.`,
          source: `${contract.msa.id} cl. ${rules.rateCapClause}`,
          routesTo: "legal",
        });
        route(c.id, "legal", `Rate increase of ${pct(p)} breaks the ${rules.rateCapPct}% MSA cap (cl. ${rules.rateCapClause}).`);
        note(c.id, `breaks the ${rules.rateCapPct}% MSA rate cap (${pct(p)} vs ${rules.rateCapPct}%)`);
      } else if (rules.rateCapPct != null && c.type === "rate") {
        checks.push({
          id: `${c.id}-cap`,
          changeId: c.id,
          level: "ok",
          title: `Within MSA rate cap (${pct(p)} vs ${rules.rateCapPct}%)`,
          detail: `Clause ${rules.rateCapClause} allows up to ${rules.rateCapPct}%.`,
          source: `${contract.msa.id} cl. ${rules.rateCapClause}`,
        });
      }
      if (p > owner.authority.ratePct) {
        checks.push({
          id: `${c.id}-limit`,
          changeId: c.id,
          level: "warn",
          title: `Above business owner's limit (${pct(p)} vs ${owner.authority.ratePct}%)`,
          detail: `${owner.name} can approve increases up to ${owner.authority.ratePct}%. Finance approval needed.`,
          source: "Approval limits",
          routesTo: "finance",
        });
        route(c.id, "finance", `Increase of ${pct(p)} is above the business owner's ${owner.authority.ratePct}% limit.`);
      } else {
        checks.push({
          id: `${c.id}-limit`,
          changeId: c.id,
          level: "ok",
          title: `Within business owner's limit (${pct(p)} vs ${owner.authority.ratePct}%)`,
          detail: `${owner.name} can approve this alone.`,
          source: "Approval limits",
        });
      }
    }
    if (impact > 0) {
      const level = impact > headroom ? "warn" : "ok";
      checks.push({
        id: `${c.id}-po`,
        changeId: c.id,
        level,
        title: impact > headroom ? `Exceeds PO headroom (${inr(impact)} vs ${inr(headroom)})` : `Fits PO headroom (${inr(impact)} of ${inr(headroom)})`,
        detail:
          impact > headroom
            ? `${contract.po.id} has ${inr(headroom)} left against projected spend. Finance must extend the PO or budget.`
            : `Added spend over the life of the change: ${inr(impact)}.`,
        source: contract.po.id,
        routesTo: impact > headroom ? "finance" : undefined,
      });
      if (impact > headroom) route(c.id, "finance", `Adds ${inr(impact)}, above the ${inr(headroom)} left on ${contract.po.id}.`);
      if (impact > owner.authority.valueINR && impact <= headroom) {
        route(c.id, "finance", `Adds ${inr(impact)}, above the business owner's ${inr(owner.authority.valueINR)} value limit.`);
        checks.push({
          id: `${c.id}-value`,
          changeId: c.id,
          level: "warn",
          title: `Above business owner's value limit (${inr(impact)} vs ${inr(owner.authority.valueINR)})`,
          detail: `${owner.name} can approve up to ${inr(owner.authority.valueINR)} of added spend. Finance approval needed.`,
          source: "Approval limits",
          routesTo: "finance",
        });
      }
      checks.push({
        id: `${c.id}-gst`,
        changeId: c.id,
        level: "info",
        title: "GST moves with the revised value",
        detail: `At ${GST_RATE * 100}% GST, input tax on this change is about ${inr(impact * GST_RATE)}. AP should expect GST lines to change from the effective date.`,
        source: "India: GST",
      });
    }

    if (c.type === "payment_terms") {
      checks.push({
        id: `${c.id}-pt`,
        changeId: c.id,
        level: "warn",
        title: `Payment terms change (${c.fromValue ?? "?"} → ${c.toValue})`,
        detail: `Payment terms are set in the MSA (cl. ${rules.paymentTermsClause}). A change needs Legal, and Finance for the cash-flow effect.`,
        source: `${contract.msa.id} cl. ${rules.paymentTermsClause}`,
        routesTo: "legal",
      });
      route(c.id, "legal", `Payment terms are an MSA term (cl. ${rules.paymentTermsClause}).`);
      route(c.id, "finance", `Shorter payment terms change cash flow (${c.fromValue ?? "?"} → ${c.toValue}).`);
    }

    if (c.type === "dates" && term?.key === "date.end") {
      checks.push({
        id: `${c.id}-date`,
        changeId: c.id,
        level: "ok",
        title: "Extends the SOW term",
        detail: `End date moves from ${c.fromValue ?? term.value} to ${c.toValue}. Inside the MSA term.`,
        source: contract.sow.id,
      });
    }
  }

  // Validity of the instrument
  const signed = rules.requiresSignedAmendment || (rules.emailChangeOrderLimitINR != null && totalImpact > rules.emailChangeOrderLimitINR);
  const instrument: "amendment" | "change_order" = rules.requiresSignedAmendment
    ? contract.msa.clauses.find((cl) => cl.id === rules.amendmentClause)?.title.includes("Change")
      ? "change_order"
      : "amendment"
    : signed
      ? "amendment"
      : "change_order";
  const clause = contract.msa.clauses.find((cl) => cl.id === rules.amendmentClause);
  if (live.length > 0) {
    if (rules.requiresSignedAmendment) {
      checks.unshift({
        id: "validity",
        level: "warn",
        title: "Email agreement does not change this contract",
        detail: `${clause?.title} (cl. ${rules.amendmentClause}): "${clause?.text}" A signed ${instrument === "amendment" ? "amendment" : "Change Order"} is required; one is drafted once the record is created.`,
        source: `${contract.msa.id} cl. ${rules.amendmentClause}`,
      });
    } else if (signed) {
      checks.unshift({
        id: "validity",
        level: "block",
        title: `Above the email change-order limit (${inr(totalImpact)} vs ${inr(rules.emailChangeOrderLimitINR!)})`,
        detail: `Clause ${rules.amendmentClause} allows email change orders up to ${inr(rules.emailChangeOrderLimitINR!)}. This needs a signed amendment.`,
        source: `${contract.msa.id} cl. ${rules.amendmentClause}`,
      });
    } else {
      checks.unshift({
        id: "validity",
        level: ratify ? "warn" : "ok",
        title: "Email change order allowed under the MSA",
        detail: `Clause ${rules.amendmentClause} allows changes up to ${inr(rules.emailChangeOrderLimitINR ?? 0)} by email from an authorised representative.${ratify ? ` ${ratify} is not one (cl. 3.5), so the agreement is not valid until ratified.` : ""}`,
        source: `${contract.msa.id} cl. ${rules.amendmentClause}`,
      });
    }
    if (instrument === "amendment") {
      checks.push({
        id: "stamp",
        level: "info",
        title: `Stamp duty may apply (${contract.stampState})`,
        detail: `An amendment that changes consideration can attract stamp duty under the ${contract.stampState} Stamp Act. Unstamped instruments are inadmissible as evidence until duty and penalty are paid.`,
        source: "India: stamp duty",
      });
    }
  }

  // Steps
  const needsClarification = agreed.length === 0 && live.length > 0;
  const steps: ApprovalStep[] = [];
  if (live.length > 0) {
    steps.push({
      id: "s-owner",
      role: "business_owner",
      assigneeId: owner.id,
      reason: needsClarification
        ? "Nothing is fully agreed. Resolve the open points with the supplier."
        : ratify
          ? `Ratify or reject: agreed by ${ratify}, who has no authority.`
          : "Confirm the captured terms match what you agreed.",
      status: "pending",
    });
    const fin = routes.get("finance");
    if (fin) steps.push({ id: "s-finance", role: "finance", assigneeId: "p-rahul", reason: fin.join(" "), status: "pending" });
    const leg = routes.get("legal");
    if (leg) steps.push({ id: "s-legal", role: "legal", assigneeId: "p-anika", reason: leg.join(" "), status: "pending" });
  }

  // Buckets. Block beats sign-off beats approve. A change needs sign-off when anyone besides the owner must say yes, or when it is not fully agreed.
  const verdicts: ChangeVerdict[] = live.map((c) => {
    const own = checks.filter((k) => k.changeId === c.id && !isGstCheck(k));
    const mine = routesByChange.get(c.id) ?? new Map<ActingRole, string[]>();
    const outside = mine.has("finance") || mine.has("legal");
    const bucket: Bucket = own.some((k) => k.level === "block") ? "blocked" : c.status === "proposed" || outside ? "signoff" : "approve";
    const signers: Signer[] = [];
    if (bucket !== "approve") {
      const people: Record<ActingRole, string> = { business_owner: owner.id, finance: "p-rahul", legal: "p-anika" };
      for (const role of ["business_owner", "finance", "legal"] as const) {
        const reasons = mine.get(role);
        if (reasons) signers.push({ role, assigneeId: people[role], reason: reasons.join(" ") });
      }
      if (signers.length === 0) {
        signers.push({ role: "business_owner", assigneeId: owner.id, reason: "Not agreed by both sides yet. Resolve the open points with the supplier before this binds." });
      }
    }
    return { change: c, bucket, name: changeName(c, contract), checks: own, signers, blockNotes: blockNotes.get(c.id) ?? [], pct: changePct(c), impact: valueImpact(c, contract) };
  });

  return {
    checks,
    steps,
    instrument,
    totalImpact,
    hasAgreed: agreed.length > 0,
    needsClarification,
    verdicts,
    closed: extraction.changes.filter((c) => !isLive(c)),
    binds: checks.filter((k) => k.id === "validity" || k.id === "stamp"),
    gst: checks.filter(isGstCheck),
  };
}
