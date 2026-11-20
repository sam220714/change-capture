export type Role = "business_owner" | "coordinator" | "finance" | "legal" | "ap";
export type ActingRole = "business_owner" | "finance" | "legal";

export interface Person {
  id: string;
  name: string;
  email: string;
  title: string;
  role: Role;
  /** Max rate increase (%) and one-off value impact (INR) this person can approve. 0 = no authority. */
  authority: { ratePct: number; valueINR: number };
}

export type SupplierCategory = "Staffing Agency" | "Consultancy" | "Marketing Agency";

export interface Supplier {
  id: string;
  name: string;
  domain: string;
  category: SupplierCategory;
  contact: string;
}

export type TermKind = "rate" | "headcount" | "date" | "fee" | "payment_terms" | "scope";

export interface SourceRef {
  doc: string; // e.g. "SOW-TB-03"
  clause: string; // e.g. "Schedule A, row 2"
  kind: "MSA" | "SOW" | "Amendment" | "Email change";
  recordId?: string;
}

export interface Term {
  key: string;
  label: string;
  kind: TermKind;
  value: string;
  numeric?: number;
  unit?: string;
  /** For rates: billable volume per month, used to size value impact. */
  monthlyVolume?: number;
  source: SourceRef;
}

export interface Clause {
  id: string;
  title: string;
  text: string;
}

export interface MsaRules {
  /** true = amendments only valid when signed by both parties. */
  requiresSignedAmendment: boolean;
  /** Max rate increase per role per 12 months, % (null = no cap). */
  rateCapPct: number | null;
  /** Clause ids for traceability. */
  amendmentClause: string;
  rateCapClause?: string;
  paymentTermsClause: string;
  emailChangeOrderLimitINR?: number;
}

export interface Contract {
  id: string;
  supplierId: string;
  title: string;
  businessOwnerId: string;
  msa: { id: string; title: string; effective: string; governingLaw: string; clauses: Clause[]; rules: MsaRules };
  sow: { id: string; title: string; start: string; end: string; terms: Term[] };
  po: { id: string; value: number; committed: number };
  amendments: { id: string; date: string; summary: string; terms: Term[] }[];
  stampState: string;
}

export interface EmailMessage {
  from: string; // "Name <email>"
  to: string;
  date: string; // ISO
  body: string;
}

export interface Thread {
  id: string;
  supplierId: string;
  subject: string;
  label: string; // demo label, e.g. "Clean rate change"
  messages: EmailMessage[];
}

export type ChangeStatus = "proposed" | "agreed" | "rejected" | "superseded";
export type ChangeType = "rate" | "headcount" | "dates" | "scope" | "payment_terms" | "fee";

export interface ExtractedChange {
  id: string;
  type: ChangeType;
  termKey: string | null;
  description: string;
  fromValue: string | null;
  toValue: string;
  fromNumeric: number | null;
  toNumeric: number | null;
  effectiveDate: string | null;
  endDate: string | null;
  status: ChangeStatus;
  proposedBy: string | null;
  agreedBy: string | null; // email of buyer-side person who agreed
  supersededBy: string | null;
  evidence: { messageIndex: number; quote: string }[];
  confidence: number;
  ambiguity: string | null;
}

export interface Extraction {
  summary: string;
  changes: ExtractedChange[];
  openQuestions: string[];
  riskFlags: string[];
  suggestedReply: string | null;
}

export type CheckLevel = "ok" | "info" | "warn" | "block";

export interface Check {
  id: string;
  changeId?: string;
  level: CheckLevel;
  title: string;
  detail: string;
  source?: string;
  routesTo?: ActingRole;
}

export type StepStatus = "pending" | "approved" | "rejected";

export interface ApprovalStep {
  id: string;
  role: ActingRole;
  assigneeId: string;
  reason: string;
  status: StepStatus;
  decidedAt?: string;
  note?: string;
}

export type RecordStage = "in_review" | "approved" | "sent" | "executed" | "rejected" | "clarifying";

export interface ChangeRecord {
  id: string;
  threadId: string;
  contractId: string;
  createdAt: string;
  createdBy: string;
  extraction: Extraction;
  extractionSource: "live" | "stored";
  checks: Check[];
  steps: ApprovalStep[];
  stage: RecordStage;
  instrument: "amendment" | "change_order";
  log: { at: string; who: string; text: string }[];
  /** Set when the thread was pasted rather than one of the demo threads. */
  pastedThread?: { subject: string; supplierId: string; messages: EmailMessage[] };
}

export interface InvoiceLine {
  termKey: string;
  description: string;
  qty: number;
  unit: string;
  rate: number;
}

export interface Invoice {
  id: string;
  contractId: string;
  period: string;
  issued: string;
  paymentTerms: string;
  lines: InvoiceLine[];
}
