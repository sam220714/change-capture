import type { ChangeRecord, Contract, ExtractedChange, Invoice, SourceRef, Term } from "./types";
import { contractById } from "./data/contracts";
import { threadById } from "./data/threads";
import { inr } from "./format";

export const APPLIED_STAGES = ["approved", "sent", "executed"] as const;
export const PENDING_STAGES = ["in_review", "clarifying"] as const;

const isApplied = (r: ChangeRecord) => (APPLIED_STAGES as readonly string[]).includes(r.stage);
const isPending = (r: ChangeRecord) => (PENDING_STAGES as readonly string[]).includes(r.stage);

export interface TermLayer {
  value: string;
  numeric?: number;
  source: SourceRef;
  effective?: string | null;
  until?: string | null;
  change?: ExtractedChange;
  record?: ChangeRecord;
}

export interface TermView {
  term: Term;
  layers: TermLayer[]; // oldest first; last = current
  pending: { change: ExtractedChange; record: ChangeRecord }[];
  rejected: { change: ExtractedChange; record: ChangeRecord }[];
}

export function instrumentId(r: ChangeRecord) {
  const n = r.id.replace(/\D/g, "").slice(-3).padStart(3, "0");
  return r.instrument === "amendment" ? `AMD-${n}` : `CO-${n}`;
}

function sourceFor(r: ChangeRecord): SourceRef {
  const thread = threadById(r.threadId);
  if (r.stage === "executed") {
    return {
      doc: instrumentId(r),
      clause: r.instrument === "amendment" ? "Signed amendment" : "Confirmed change order",
      kind: "Amendment",
      recordId: r.id,
    };
  }
  return {
    doc: r.id,
    clause: `Approved from email: "${thread?.subject ?? "pasted thread"}"`,
    kind: "Email change",
    recordId: r.id,
  };
}

export function termViews(contract: Contract, records: ChangeRecord[]): TermView[] {
  const mine = records.filter((r) => r.contractId === contract.id);
  const views: TermView[] = contract.sow.terms.map((term) => ({
    term,
    layers: [{ value: term.value, numeric: term.numeric, source: term.source }],
    pending: [],
    rejected: [],
  }));

  const extra = new Map<string, TermView>();
  const ordered = [...mine].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const r of ordered) {
    for (const c of r.extraction.changes) {
      let view = views.find((v) => v.term.key === c.termKey);
      if (!view && (isApplied(r) || isPending(r)) && (c.status === "agreed" || c.status === "proposed")) {
        const key = c.termKey ?? `${r.id}.${c.id}`;
        view = extra.get(key);
        if (!view) {
          view = {
            term: { key, label: c.description, kind: "scope", value: "—", source: { doc: "—", clause: "Not in SOW", kind: "SOW" } },
            layers: [],
            pending: [],
            rejected: [],
          };
          extra.set(key, view);
        }
      }
      if (!view) continue;
      if (c.status === "rejected") {
        view.rejected.push({ change: c, record: r });
        continue;
      }
      if (c.status === "superseded") continue;
      if (isApplied(r)) {
        view.layers.push({
          value: c.toValue,
          numeric: c.toNumeric ?? undefined,
          source: sourceFor(r),
          effective: c.effectiveDate,
          until: c.endDate,
          change: c,
          record: r,
        });
      } else if (isPending(r)) {
        view.pending.push({ change: c, record: r });
      }
    }
  }
  return [...views, ...extra.values()];
}

/** Value in force on a date: last applied layer whose window covers the date. */
export function valueOn(view: TermView, isoDate: string): TermLayer {
  let current = view.layers[0];
  for (const l of view.layers.slice(1)) {
    const starts = !l.effective || l.effective <= isoDate;
    const ends = !l.until || l.until >= isoDate;
    if (starts && ends) current = l;
  }
  return current;
}

export type LineVerdict = "match" | "hold" | "mismatch" | "no_basis";

export interface LineCheck {
  description: string;
  billed: string;
  expected: string;
  amount: number;
  overcharge: number;
  verdict: LineVerdict;
  note: string;
  source?: SourceRef;
}

export interface InvoiceCheck {
  invoice: Invoice;
  contract: Contract;
  lines: LineCheck[];
  terms: { billed: string; expected: string; verdict: LineVerdict; note: string; source?: SourceRef };
  atRisk: number;
}

export function checkInvoice(invoice: Invoice, records: ChangeRecord[], mode: "sow" | "current"): InvoiceCheck {
  const contract = contractById(invoice.contractId)!;
  const views = termViews(contract, mode === "current" ? records : []);
  const on = invoice.period.match(/\d{4}/) ? periodStart(invoice) : invoice.issued;

  const lines: LineCheck[] = invoice.lines.map((line) => {
    const amount = line.qty * line.rate;
    const view = views.find((v) => v.term.key === line.termKey);
    const billed = `${inr(line.rate)} / ${line.unit}`;
    if (!view) {
      return { description: line.description, billed, expected: "—", amount, overcharge: amount, verdict: "no_basis", note: "No contract term covers this line." };
    }
    // Rate-card items (e.g. "additional analyst if ordered") need an order to be billable.
    if (view.term.monthlyVolume === 0) {
      const ordered = view.layers.length > 1 ? view.layers[view.layers.length - 1] : undefined;
      if (mode === "sow") {
        const ok = line.rate === view.term.numeric;
        return {
          description: line.description,
          billed,
          expected: view.term.value,
          amount,
          overcharge: ok ? 0 : amount,
          verdict: ok ? "match" : "mismatch",
          note: ok ? "Rate matches the SOW rate card." : "Rate differs from the SOW rate card.",
          source: view.term.source,
        };
      }
      if (ordered) {
        return { description: line.description, billed, expected: ordered.value, amount, overcharge: 0, verdict: "match", note: "Ordered through an approved change.", source: ordered.source };
      }
      const rej = view.rejected[0];
      return {
        description: line.description,
        billed,
        expected: "Not ordered",
        amount,
        overcharge: amount,
        verdict: "no_basis",
        note: rej
          ? `Rate is on the card, but this work was rejected in email ("${rej.change.evidence.at(-1)?.quote ?? rej.change.description}"). Nothing is payable without an executed Change Order.`
          : "Rate-card item with no order or approved change behind it.",
        source: rej ? { doc: rej.record.id, clause: "Rejected change", kind: "Email change", recordId: rej.record.id } : view.term.source,
      };
    }

    const cur = valueOn(view, on);
    if (cur.numeric === line.rate) {
      return { description: line.description, billed, expected: cur.value, amount, overcharge: 0, verdict: "match", note: cur.change ? "Matches the captured, approved change." : "Matches the contract.", source: cur.source };
    }
    const overcharge = cur.numeric != null ? (line.rate - cur.numeric) * line.qty : amount;
    const pend = view.pending.find((p) => p.change.toNumeric === line.rate);
    if (pend) {
      return {
        description: line.description,
        billed,
        expected: cur.value,
        amount,
        overcharge,
        verdict: "hold",
        note: `Billed at a rate captured from email but not yet approved (${pend.record.id}). Hold ${inr(overcharge)} until approval.`,
        source: { doc: pend.record.id, clause: "Pending change", kind: "Email change", recordId: pend.record.id },
      };
    }
    return {
      description: line.description,
      billed,
      expected: cur.value,
      amount,
      overcharge,
      verdict: "mismatch",
      note: mode === "sow" ? "Differs from the SOW. AP cannot tell whether a change was agreed." : "Differs from current agreed terms.",
      source: cur.source,
    };
  });

  const ptView = views.find((v) => v.term.key === "payment_terms");
  const ptCur = ptView ? valueOn(ptView, on) : undefined;
  const ptPending = ptView?.pending.find((p) => p.change.toValue.toLowerCase() === invoice.paymentTerms.toLowerCase());
  const ptMatch = ptCur?.value.toLowerCase() === invoice.paymentTerms.toLowerCase();
  const terms = {
    billed: invoice.paymentTerms,
    expected: ptCur?.value ?? "—",
    verdict: (ptMatch ? "match" : ptPending ? "hold" : "mismatch") as LineVerdict,
    note: ptMatch
      ? "Payment terms match."
      : ptPending
        ? `Supplier is using terms still under review (${ptPending.record.id}). Pay on ${ptCur?.value}.`
        : `Invoice states ${invoice.paymentTerms}; contract says ${ptCur?.value}. Pay on contract terms.`,
    source: ptCur?.source,
  };

  const atRisk = lines.reduce((s, l) => s + (l.verdict === "match" ? 0 : l.overcharge), 0);
  return { invoice, contract, lines, terms, atRisk };
}

function periodStart(inv: Invoice) {
  const d = new Date(`1 ${inv.period}`);
  if (Number.isNaN(d.getTime())) return inv.issued;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
