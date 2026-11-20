@AGENTS.md

# Change Capture: Claude instructions

Prototype for the Sirion assessment: AI that captures commercial changes agreed over supplier email and keeps the contract record current. Plan: `docs/V1_PLAN.md`.

## Design guidelines: required before shipping UI

Before you build or change any user-facing feature (new page, component, copy, color, layout), read `docs/DESIGN_GUIDELINES.md` and follow it. Then run the checklist below before calling the work done.

Pre-ship checklist:
- [ ] Colors come from the tokens in `src/app/globals.css` (`--color-sirion-*`). No new hex values in components.
- [ ] Purple (`sirion-accent`) is used only for the one primary action in a region. Never two purple buttons side by side; secondary is outline.
- [ ] Headings are weight 300–400 with slight negative tracking. Bold (700) only for eyebrows and stat lines.
- [ ] Eyebrows: 12px, 700, uppercase, 1.5px tracking, teal-line color.
- [ ] Shell is dark (`#0B1821` / `#073439`); work surfaces are light (`#F5F6F6` bg, white cards, `#E7EFF0` borders).
- [ ] AI moments (extractions, suggestions, drafts) are marked with the teal accent: `2px #0D5E68` left border, `#E7EFF0` fill.
- [ ] Diffs: additions teal-tinted, removals muted red with strikethrough.
- [ ] Hairline borders instead of shadows. Radius: 8px pills/dense buttons, 12px buttons, 16px cards, full for chips.
- [ ] Tables: 14px text, 44–48px rows, hairline dividers, no zebra striping.
- [ ] Icons are lucide-react line icons, 1.5px stroke, teal.
- [ ] Copy: Title Case headings and buttons, sentence case body, short and outcome-led, no exclamation marks, no emoji, no hype words.
- [ ] No Sirion logo or customer logos; plain text wordmark and a visible "Prototype" label.
- [ ] Muted text `#69727D` on dark only at 16px or larger.

If a guideline doesn't cover the case, extend it in the same spirit (calm, teal-led, one accent) and note the new rule in `docs/DESIGN_GUIDELINES.md` under "Applying this to the prototype app".

`docs/DESIGN_GUIDELINES.md` is a copy of `Sirion_Design_Guidelines.md` from the parent research folder. If one changes, update the other.

## Code conventions

- AI reads, code decides: the model (Gemini) extracts changes from threads (`src/lib/ai/`); routing, limits and checks are deterministic (`src/lib/rules.ts`). Don't move routing decisions into the prompt.
- Model: Google Gemini free tier over REST (`src/lib/ai/gemini.ts`), JSON-schema output validated with Zod, model fallback chain. Without `GEMINI_API_KEY` or when every model is busy, demo threads fall back to stored extractions in `src/lib/data/extractions.ts`; keep those in the same schema. Don't add flash-lite to the chain: it failed the agreed-vs-proposed test.
- Seed data lives in `src/lib/data/`. State is client-side (`src/lib/store.tsx`) and persisted to localStorage.
- Run `npm run lint` and `npm run build` before committing.
