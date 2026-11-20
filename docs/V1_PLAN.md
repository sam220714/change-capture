# Change Capture: V1 Build Plan

Source decisions: `../Sirion_Planning.md` (outside this repo). Design rules: `docs/DESIGN_GUIDELINES.md`.

## 1. What v1 must prove

One end-to-end loop, with every step visible:

> Supplier email thread → AI works out what was actually agreed → rules check validity, authority and conflicts → routed to the right approvers → drafts (amendment + supplier confirmation) approved by a human → contract's current terms updated with a source for every number → one invoice checked against those terms.

The assignment also needs the case written inside the prototype (no slides): Why this stage, Stakeholder map, The problem, Success metrics. Those are pages in the app.

## 2. Scope

**In v1**
- 3 suppliers (staffing, consultancy, marketing agency), each with an MSA + SOW (synthetic, modelled on standard Law Insider clauses).
- 4 email threads covering the planned cases:
  1. Clean agreed rate change (TalentBridge, QA rate +3%), inside every limit.
  2. Ambiguous thread (Kestrel): a proposal, a counter, a conditional acceptance. Nothing fully agreed; one item superseded.
  3. Agreed by someone without authority (Lumen & Lark, a marketing coordinator approves a retainer increase).
  4. Breaks the MSA (TalentBridge, Senior Dev rate +11.9% over a 5% cap, plus Net 45 → Net 15).
- Paste-your-own thread (live AI only).
- Change records with per-change status: proposed / agreed / rejected / superseded.
- Rules: MSA amendment-validity check, approval-limits table, MSA cap check, PO headroom check, payment-terms → Legal.
- Role switcher (Business owner, Finance, Legal) to show how the three experiences connect.
- Drafts: formal amendment, supplier confirmation email, updated rate table. "Send" is simulated and gated on approvals.
- Current-terms view: MSA → SOW → amendments → approved email changes, each value with its source.
- Invoice check: 3 invoices compared against SOW-only terms vs current agreed terms.
- India notes: stamp duty on amendments, GST on revised values.

**Not in v1** (named on the Assumptions page): real mail integration, auth, database, real e-signature, ERP connection, logistics/SaaS suppliers, non-commercial changes.

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 (App Router) + TypeScript | One deployable unit, API route for the AI call, Vercel hosting |
| Styling | Tailwind CSS v4 with Sirion tokens in `globals.css` `@theme` | Tokens from the design guidelines, one place to change |
| Font | Hanken Grotesk (Google Fonts), weights 300/400/700 | Free fallback for PP Radio Grotesk |
| Icons | lucide-react, 1.5px stroke | Guideline: line icons in teal |
| AI | Anthropic TypeScript SDK, `claude-opus-5-5`, structured output via Zod | Extraction must return a typed record the rules can trust |
| State | React context + `localStorage` | No DB needed for a prototype; "Reset demo" restores seed data |
| Hosting | Vercel | Public link for submission |

**AI vs rules split (a deliberate design choice):** Claude does the reading (who proposed what, what was agreed, what got superseded, with quotes as evidence). Plain code does the deciding (limits, caps, PO headroom, routing). Routing never depends on model judgement, so it is auditable and predictable.

**Demo mode:** without `ANTHROPIC_API_KEY`, the 4 demo threads use stored extractions in the same schema the model returns, labelled "Stored extraction". With a key, every thread (including pasted ones) runs live.

## 4. Data model

```
Person        id, name, email, team, role (business_owner | coordinator | finance | legal), authority {ratePct, valueINR}
Supplier      id, name, domain, category
Contract      id, supplierId, msa {clauses[]}, sow {terms[], po}, amendments[]
Term          key, label, value, unit, kind (rate | headcount | date | fee | payment_terms | scope), source {doc, clause}
Thread        id, supplierId, subject, messages[{from, to, date, body}]
Extraction    summary, changes[], openQuestions[], riskFlags[]
Change        id, type, termKey, from/to (+ numeric), effectiveDate, status, proposedBy, agreedBy, evidence[{messageIndex, quote}], confidence, ambiguity
ChangeRecord  id, threadId, contractId, changes[], checks[], steps[{role, assignee, reason, status}], stage, drafts
Invoice       id, contractId, period, lines[{termKey, qty, rate, amount}], paymentTerms
```

## 5. Screens

| Area | Route | Content |
|---|---|---|
| Case | `/` | Overview: the idea in one line, the loop, links into each section |
| Case | `/case/why` | Why Intake (on live contracts), why it's worth solving |
| Case | `/case/problem` | Who it affects, why it matters, evidence with source quality |
| Case | `/case/stakeholders` | Map: wants, conflicts, how the product resolves each |
| Case | `/case/metrics` | North-star, supporting metrics, rethink triggers |
| Case | `/case/assumptions` | Company, systems, data, scope cuts |
| App | `/app/inbox` | Opted-in supplier threads + paste box |
| App | `/app/capture/[threadId]` | Thread with evidence highlights, AI extraction, checks, routing preview, Create Change Record |
| App | `/app/changes` | Queue, filtered by current role |
| App | `/app/changes/[id]` | Change record: diff, approval steps, drafts, send, mark signed |
| App | `/app/contracts` + `/[id]` | Current terms with source trace and pending overlays |
| App | `/app/invoices` | Invoice check, SOW-only vs current agreed terms |

## 6. Build order

1. Tokens, fonts, app shell (dark nav + light work surface), CLAUDE.md design rule.
2. Seed data (people, limits, contracts, threads, invoices).
3. Extraction schema, prompt, API route, stored extractions.
4. Rules engine (validity, authority, caps, PO, routing) + terms + invoice check.
5. Prototype screens.
6. Case pages.
7. Lint, build, click through all four threads end to end.

## 7. Open after v1

- North-star metric choice is drafted on the Metrics page; confirm.
- Evaluate extraction on more threads (accuracy on status: agreed vs proposed is the risky call).
- Replace synthetic MSA/SOW with real Law Insider documents.
