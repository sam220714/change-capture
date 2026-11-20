# Change Capture

Prototype for the Sirion assessment (Stage 1: Contract Intake). Commercial changes to live supplier contracts (rates, headcount, dates, scope, payment terms) get agreed over email and never reach the contract. Change Capture reads those threads, works out what was actually agreed, checks it against the MSA and approval limits, routes it to Business, Finance and Legal, drafts the amendment and supplier confirmation, and keeps the contract's current terms up to date so invoices are checked against what was really agreed.

The case (why this stage, stakeholder map, the problem, success metrics, assumptions) is written inside the app.

## Run

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for live AI
npm run dev
```

Open http://localhost:3000.

- **Without a key:** the four demo threads use stored extractions (same schema the model returns, labelled "Stored extraction" in the UI). Pasting your own thread is disabled.
- **With a key:** every thread, including pasted ones, is read live by `claude-opus-5-5` with structured output.

## How it works

| Layer | Where | Notes |
|---|---|---|
| AI extraction | `src/app/api/extract/route.ts`, `src/lib/ai/` | Claude returns changes with status (proposed / agreed / rejected / superseded) and verbatim evidence quotes |
| Rules | `src/lib/rules.ts` | MSA validity (is email enough?), authority, rate caps, PO headroom, payment terms, stamp duty and GST notes, routing. No AI. |
| Current terms | `src/lib/terms.ts` | MSA → SOW → amendments → approved email changes, each value with its source; invoice check |
| Drafts | `src/lib/drafts.ts` | Amendment / change order, supplier confirmation, decline |
| State | `src/lib/store.tsx` | Browser localStorage; "Reset Demo" in the sidebar clears it |
| Seed data | `src/lib/data/` | 3 suppliers, MSAs/SOWs, 4 threads, 3 invoices, people and approval limits (all synthetic) |

Plan: `docs/V1_PLAN.md`. Design rules: `docs/DESIGN_GUIDELINES.md` (see `CLAUDE.md` for the pre-ship checklist).

## Deploy

Vercel: import the repo, optionally set `ANTHROPIC_API_KEY`, deploy.
