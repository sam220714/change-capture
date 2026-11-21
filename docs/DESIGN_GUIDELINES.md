# Sirion Design Guidelines (for Claude Code)

> Source: live styles pulled from https://www.sirion.ai/ on 2026-11-20 (computed CSS, `:root` variables, screenshots).
> Use these when building the Sirion assessment prototype so the UI feels native to Sirion's brand.
> **Observed** = taken directly from the site. **Derived** = my extension for app/product UI where the marketing site gives no direct answer.

---

## 1. Brand feel in one line

Dark, deep-teal, calm and premium. Light-weight large type, lots of breathing room, a single loud purple for actions, thin teal hairlines and soft teal glows for detail. Confident, enterprise-grade, "AI that just works", not playful.

**Do:** dark teal canvas, thin (300) big headings, one purple CTA per view, generous spacing, stat-led copy.
**Don't:** bright gradients everywhere, heavy drop shadows, bold chunky headings, multiple accent colors, emoji, cartoon illustrations.

---

## 2. Color tokens

### Core palette (Observed)

| Token | Hex | Where Sirion uses it |
|---|---|---|
| `--bg-base` | `#0B1821` | Page/body background (`--primary-color`) |
| `--bg-deep` | `#06141E` | Deepest sections / footer |
| `--surface-1` | `#05272C` | Nav pill buttons, dark chips |
| `--surface-2` | `#073439` | Fixed header bar, persona cards |
| `--surface-3` | `#0D5E68` | Active/hover teal surface, glow color |
| `--teal-line` | `#5D939A` | 0.8px borders, eyebrow labels, icon tiles |
| `--teal-soft` | `#B4CDD0` | Muted teal fills |
| `--surface-light` | `#E7EFF0` | Light "callout" panel on dark page (e.g. analyst block) |
| `--text-primary` | `#F5F6F6` | Body + heading text on dark (`--text-color`) |
| `--text-on-light` | `#0B1821` | Headings on light panels |
| `--text-muted` | `#69727D` | Secondary text |
| `--text-muted-2` | `#4D565D` | Tertiary / captions |
| `--accent` | `#92429F` | **Primary CTA purple** (`--secondary-color`) |
| `--accent-hover` | `#773A86` | CTA hover (`--btn-hover-color`) |
| `--white` | `#FFFFFF` | Button text, outline button borders |

### Gradients (Observed)
- Announcement bar: `linear-gradient(90deg, #0F3FBB -97%, #7F208F 102%)` (blue → purple). Use only for a thin top banner.
- Hero: dark teal canvas with a soft radial teal glow behind the headline. Approximate with
  `radial-gradient(ellipse at 50% 30%, rgba(13,94,104,0.55) 0%, rgba(11,24,33,0) 60%), #0B1821`.

### Usage rules
- Purple `#92429F` is **only** for primary actions and the active nav "Demo" pill. Never for text blocks or backgrounds of large areas.
- Teal family carries everything else: borders, icons, eyebrow labels, glows, card fills.
- Status colors are not defined on the site (Derived; keep muted so they sit on teal):
  - Success `#3FB68B`, Warning `#E0A84A`, Danger `#E0566B`, Info `#5D939A` (reuse teal-line).

---

## 3. Typography

**Font (Observed):** `"PP Radio Grotesk", sans-serif` for everything. It's a licensed Pangram Pangram face.
**Prototype fallback (Derived):** use a free grotesk with similar proportions:
```css
font-family: "PP Radio Grotesk", "Hanken Grotesk", "Inter Tight", "Inter", system-ui, sans-serif;
```
(Load Hanken Grotesk or Inter Tight from Google Fonts, weights 300/400/700.)

**Signature trait:** headings are **light (300) or regular (400)**, never bold, with slight negative tracking. Bold (700) is reserved for small uppercase eyebrows and short stat lines.

### Type scale (Observed, desktop)

| Role | Size / line-height | Weight | Tracking | Notes |
|---|---|---|---|---|
| Display / H1 | 44–64px / 1.1 | 300 | -0.01em (-0.44px @44) | Hero headline, centered |
| H2 section title | 32px / 36px | 400 | -0.32px | Title Case |
| H3 card/feature title | 28px / 32px | 400 | normal | |
| Lead / body-L | 18px / 22px | 300 | normal | Hero subcopy, feature descriptions |
| Stat line | 18px / 22px | 700 | normal | "90% Faster Contract Centralization" |
| Body | 16px / 24px | 400 | normal | |
| UI / nav | 14px / 20px | 400 | normal | Nav links, small UI text |
| Eyebrow | 12px / 16px | 700 | 1.5px, UPPERCASE | Color `--teal-line` |
| Caption | 12px / 16px | 300 | normal | |

Headings use **Title Case** ("AI Agents That Understand Your Business").

---

## 4. Spacing, radius, borders, shadow

- **Spacing:** 4px base. Common steps: 8, 12, 16, 24, 32, 48, 64, 96. Sections are tall with lots of vertical air (aim 96–128px section padding on desktop).
- **Radius (Observed):**
  - Nav pills: 8px
  - Buttons: 12px (large CTA 16px)
  - Icon tiles: ~9–10px
  - Cards / panels: 16px (cards with media on top use `16px 16px 0 0` on the image)
  - Eyebrow tag / chips: fully rounded (50px)
- **Borders:** hairline `0.8px solid #5D939A` (teal) or `0.8px solid #FFFFFF` for outline buttons on dark. Prefer borders over shadows.
- **Shadow / glow:** almost none. The accent effect is a **teal glow**: `box-shadow: 0 0 20px 0 #0D5E68` on the active/hovered item. A soft elevation for overlays only: `0 2px 30px 10px rgba(0,0,0,0.15)`.

---

## 5. Components

### Buttons (Observed)
```css
.btn-primary { background:#92429F; color:#fff; border:0; border-radius:12px;
  padding:14px 16px 13px; font-size:18px; font-weight:400; }
.btn-primary:hover { background:#773A86; }

.btn-secondary { background:transparent; color:#fff; border:0.8px solid #fff;
  border-radius:12px; padding:13px 16px 12px; font-size:18px; font-weight:400; }

.btn-link { background:none; color:#F5F6F6; font-size:16px; }  /* "Learn More →" */
```
- Labels are short, Title Case, often with a trailing arrow: `Request a Demo →`, `Watch Overview →`, `Learn More →`.
- Pair = one purple primary + one white-outline secondary. Never two purple buttons side by side.
- For dense app UI (Derived), scale to 14px text, 8px 14px padding, 8px radius.

### Header / nav (Observed)
- Fixed top bar, ~76px tall, background `#073439`.
- Logo left; nav items right as dark pills (`#05272C`, radius 8px, padding 9px 16px, 14px text, `#F5F6F6`).
- The single purple "Demo" pill is the only colored item in the nav.

### Eyebrow tag (Observed)
Pill with thin light border above the hero headline: transparent fill, 1px `#F5F6F6`/teal border, radius 50px, padding 5px 25px, ~16–18px text. Example: "Sirion AI Contract Management Platform".

### Icon tile (Observed)
50×50px, transparent fill, `0.8px solid #5D939A`, radius ~9px, teal line icon centered. Active state adds teal glow `0 0 20px #0D5E68` and a small teal dot indicator below. Use line icons (e.g. Lucide) in `#5D939A` / `#B4CDD0`, 1.5px stroke.

### Tabs (Observed, feature section)
Row of icon tiles + labels ("Centralize Contracts", "Find Answers", "Create Agreements", "Realize Value", "Build Agents"). Selecting one swaps a panel showing a product screenshot left and H3 + bold stat + 18/300 description + "Learn More" on the right.

### Cards (Observed)
- Persona / feature cards: fill `#073439`, radius 16px, image on top, text block bottom-aligned (title 28/400, body 14–16px, `Learn More →`).
- Light callout panel: fill `#E7EFF0`, radius 16px, padding 32px, dark text `#0B1821`. Use sparingly to break up a dark page.

### Stats
Big claim + short label, e.g. **"90%"** Faster Contract Centralization. Use 700 weight for the stat line, keep to one stat per card.

### Product UI framing (Observed)
Product screenshots sit inside a rounded (16px) dark frame on the teal canvas, often with a small floating pill label on top ("Negotiate"). The app UI itself is light (white/near-white surfaces) inside that dark frame.

---

## 6. Applying this to the prototype app (Derived)

The marketing site is all dark; Sirion's actual product screenshots are light. For a working CLM prototype:

- **App shell:** dark (`#0B1821` sidebar/top bar, `#073439` header), teal hairlines, purple primary actions.
- **Work surface** (contract text, tables, forms): light. Background `#F5F6F6`, cards `#FFFFFF`, borders `#E7EFF0`, text `#0B1821`, muted `#4D565D`. Purple stays the primary action color; teal `#0D5E68` for links, selected rows, and AI highlights.
- **AI / agent moments** (chat panel, suggestions, extracted clauses): mark with a teal accent: left border `2px #0D5E68`, a soft `#E7EFF0` fill on light, or the teal glow on dark. Keep a conversational "just ask" input prominent, since that's Sirion's headline positioning ("Conversational AI for Enterprise Contracting").
- **Diffs / change capture:** additions teal-tinted (`rgba(13,94,104,0.12)` bg), removals muted red (`rgba(224,86,107,0.12)` bg, strikethrough).
- Tables: 14px text, 44–48px rows, hairline row dividers, no zebra striping.
- **Alignment (Derived):**
  - Repeated tables (e.g. one per invoice) share fixed column widths via `table-fixed` + `colgroup`, so columns line up from card to card. Only the table scrolls on narrow screens, never the card title.
  - Cards in a row that have the same inner sections (title, body, stat) align those sections with CSS subgrid (`row-span-N` + `grid-rows-subgrid`) or by pinning the last element to the bottom (`mt-auto`). Don't rely on equal text lengths.
  - Side-by-side panels start on the same line: give both the same panel pattern (card, `p-5`, title row first).
  - Content breakpoints count the 240px sidebar. Use `lg:` for 2–3 column card grids and `xl:` for 4–5 across; `md:` is the shell breakpoint only.
  - Responsive grids declare `grid-cols-1` as the base so a wide child can't stretch the single track.
- **Review buckets (Derived):** a change is sorted into one of three buckets and keeps that colour family wherever it appears (icon tile, counter, tint). You Can Approve = teal (`sirion-s3`, tint `sirion-s3/10`). Needs Sign-Off = warning (`sirion-warning`, `sirion-warning-soft`, ink `sirion-warning-ink`). Not Allowed As Agreed = danger (`sirion-danger`, tint `sirion-danger/[0.07]`, ink `sirion-danger-ink`). Bucket colour marks status only; the primary action is still the single purple button.
- **Verdict card (Derived):** a light card that opens a review screen: bucket icon tile, eyebrow, a one-line verdict in 28px/300, a sentence of detail, three counter tiles that scroll to their section (a zero count is muted), then the action row with one purple primary. Text written by code is not AI-marked; only model output gets the teal mark.
- **Thread tracing (Derived):** quotes the AI used are highlighted in the source thread. Hover or keyboard focus on a change previews only its quotes; a Show in Thread button pins it. While focused, messages with none of its quotes fade to 40% and the focused card gets the teal border and glow. A bar above the thread says what is shown and offers Show All.

---

## 7. Voice & copy

- Confident, outcome-led, short. Lead with the result, often a number: "Up to 90% Faster Time To Contract".
- Conversational framing: "Forget forms, filters, and workflows - just ask."
- Audience is senior legal, procurement, sales and finance buyers: precise, enterprise-grade, trust-oriented. No hype words like "revolutionary", no exclamation marks.
- Title Case for headings and buttons; sentence case for body.
- Key vocabulary: agents, agentic, conversational contracting, request to renewal, obligations, repository, precision, trust.

---

## 8. Ready-to-paste tokens

### CSS variables
```css
:root {
  --bg-base:#0B1821; --bg-deep:#06141E;
  --surface-1:#05272C; --surface-2:#073439; --surface-3:#0D5E68;
  --surface-light:#E7EFF0; --surface-app:#F5F6F6; --surface-card:#FFFFFF;
  --teal-line:#5D939A; --teal-soft:#B4CDD0;
  --text-primary:#F5F6F6; --text-on-light:#0B1821;
  --text-muted:#69727D; --text-muted-2:#4D565D;
  --accent:#92429F; --accent-hover:#773A86;
  --success:#3FB68B; --warning:#E0A84A; --danger:#E0566B;
  --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-pill:999px;
  --hairline:0.8px solid var(--teal-line);
  --glow:0 0 20px 0 #0D5E68;
  --font-sans:"PP Radio Grotesk","Hanken Grotesk","Inter Tight","Inter",system-ui,sans-serif;
}
```

### Tailwind `theme.extend`
```js
colors: {
  sirion: {
    base:'#0B1821', deep:'#06141E',
    s1:'#05272C', s2:'#073439', s3:'#0D5E68',
    line:'#5D939A', soft:'#B4CDD0', light:'#E7EFF0', app:'#F5F6F6',
    text:'#F5F6F6', ink:'#0B1821', muted:'#69727D', muted2:'#4D565D',
    accent:'#92429F', 'accent-hover':'#773A86',
  },
},
fontFamily: { sans: ['"PP Radio Grotesk"','"Hanken Grotesk"','"Inter Tight"','Inter','system-ui','sans-serif'] },
borderRadius: { sm:'8px', md:'12px', lg:'16px' },
boxShadow: { glow:'0 0 20px 0 #0D5E68', overlay:'0 2px 30px 10px rgba(0,0,0,0.15)' },
```

---

## 9. Guardrails

- Don't copy Sirion's logo, customer logos, or analyst badges into the prototype; use a plain text wordmark and label the build as a prototype.
- One purple primary action per screen region.
- Keep heading weights at 300–400; if something looks "too bold", it's off-brand.
- Check contrast: `#F5F6F6` on `#0B1821` and white on `#92429F` both pass AA; `#69727D` on `#0B1821` is borderline, so use it only for ≥16px secondary text.
