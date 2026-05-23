# Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `index2.html` into a two-layer CSS-token design system (primitives → semantic → thin component layer), ship a `data-theme` attribute-driven theme switcher in the header, and make adding a new theme a single CSS block + one registry entry.

**Architecture:** All raw values move into a primitive layer in `:root`. Semantic variables (`--bg`, `--text`, `--brand-primary`, `--status-*`, etc.) become the API the stylesheet uses, resolved through the primitives. A `data-theme` attribute on `<html>` re-binds the semantic layer. An inline `<head>` script applies the saved theme before paint to prevent flash. The existing `applyBrandPalette` brand engine coexists — tenant brand-color overrides apply on top via inline styles, but `--bg/--bg2/--bg3` are removed from its writeable set so brand can't flatten themes.

**Tech Stack:** Vanilla HTML/CSS/JS, single-file `index2.html`, served by the existing Cloudflare Worker. External sibling scripts `nav-history.js` and `user-flow.js` are untouched. No bundler, no preprocessor, no test framework — manual browser smoke checks per task.

**Spec:** [docs/superpowers/specs/2026-05-22-theme-system-design.md](../specs/2026-05-22-theme-system-design.md)

---

## File structure

```
youtility-demo1/
├── index2.html                      [the only file this plan writes/edits]
├── docs/superpowers/
│   ├── plans/2026-05-22-theme-system.md      [this plan]
│   └── specs/2026-05-22-theme-system-design.md [the spec]
```

The plan never edits any other file. Read-only references during execution:
- `index.html`, `MoneseVibeCode_1.1.html`, `stokes-ledbury-mvp.html` — out of scope.
- `nav-history.js`, `user-flow.js` — out of scope.
- `src/index.js` (Worker) — unchanged.

---

## Conventions for every task

- **Smoke check before commit.** Open `index2.html` directly in a browser (`open index2.html` or `file://...`) after every code-changing task. The page must render without console errors, the header/sidebar/main views must look identical to before (unless the task explicitly changes appearance), and the existing storyboard flows must still play.
- **Visual diff at phase boundaries.** At the end of Phases 1–3 (Tasks 4, 5, 8), at the end of Phase 4 (Task 9), and at the end of Phase 7 (Task 15), capture a screenshot of `home`, `reports`, `audienceExplorer`, `campaigns`, `dataSources`, and the account modal. Compare against the pre-phase screenshots; the diff must be empty (Phase 1–4, Phase 7) or contained to switcher chrome (Phase 6). Use the existing `tools/_save_screenshot.py` or any browser screenshot tool.
- **Working dir.** All paths are relative to `/Users/maxim/Workspace/youtility-demo1/`.
- **Commits.** Conventional commit prefix (`refactor:`, `feat:`, `chore:`, `docs:`). One commit per task. Always `git add index2.html` (never `-A`). The docs folder is in `.gitignore` — that doesn't affect this plan since it only edits `index2.html`.
- **Grep before edit.** Line numbers in this plan are accurate as of commit `20a114f` (2026-05-22). If `index2.html` has drifted, re-grep before applying patches.
- **No new files.** Every edit lands in `index2.html`. The token system, theme blocks, registry, switcher JS, and switcher DOM all live inline.

---

## Phase 1 — Primitive layer (additive)

Tasks 1–4 add new variables to `:root`. No existing rules change. The visual diff at the end of Phase 1 (after Task 4) must be empty.

### Task 1: Add color primitives

**Files:**
- Modify: `index2.html:10-18` (existing `:root` block)

- [ ] **Step 1: Inspect current `:root`.**

Run:
```bash
sed -n '10,18p' index2.html
```

Expected to show the current `:root` block declaring `--bg`, `--bg2..5`, `--border*`, `--text*`, `--accent*`, `--green`, `--purple`, `--brand-primary*`, `--sw`.

- [ ] **Step 2: Insert color primitives above the existing semantic declarations.**

Edit `index2.html`. Replace the line `:root{` and the existing variable declarations inside it (lines 10–17) with the following. **Do not change the existing semantic declarations** — keep them after the primitives block; the new structure is `:root { /* primitives */ ... /* semantic (unchanged below) */ ... }`.

Insert immediately after the opening `:root{` and before `--bg:#08091a;...`:

```css
  /* ─── PRIMITIVES — raw values, never referenced directly by component rules ─── */
  /* Neutrals */
  --color-neutral-0: #ffffff;
  --color-neutral-50: #f7f9fc;
  --color-neutral-100: #f1f4f9;
  --color-neutral-200: #e9eef5;
  --color-neutral-300: #dde4ee;
  --color-neutral-400: #9eb1c9;
  --color-neutral-500: #8a8da8;
  --color-neutral-600: #4a4e66;
  --color-neutral-700: #555a72;
  --color-neutral-800: #1a1c28;
  --color-neutral-850: #1c2438;
  --color-neutral-870: #161e30;
  --color-neutral-900: #111828;
  --color-neutral-925: #0d1124;
  --color-neutral-950: #08091a;
  --color-neutral-text2-dark: #8b90a8;

  /* Pure grays (kept distinct from the neutral ramp for unambiguous mapping) */
  --color-gray-300: #777;
  --color-gray-400: #666;
  --color-gray-500: #555;
  --color-gray-700: #444;
  --color-gray-900: #1a1a1a;
  --color-gray-925: #1a1a18;
  --color-gray-950: #1a1a2e;

  /* Brand blues */
  --color-blue-100: #f4f8ff;
  --color-blue-200: #eef3fa;
  --color-blue-300: #a8c8ff;
  --color-blue-400: #5fa8ff;
  --color-blue-450: #4a7fd4;
  --color-blue-500: #1a8fff;
  --color-blue-600: #3892ff;
  --color-blue-700: #0b72fd;

  /* Status — semantic ramps */
  --color-emerald-500: #2ea86a;
  --color-emerald-600: #00a374;
  --color-emerald-700: #00c389;
  --color-amber-300: #f4c842;
  --color-amber-500: #e8b929;
  --color-amber-600: #e8a020;
  --color-amber-700: #daa520;
  --color-red-500: #d0553a;
  --color-red-600: #c05040;
  --color-violet-500: #7c5cbf;

  /* Tenant-flavor accents (used by alt themes / brand discovery defaults) */
  --color-mint-100: #f7faf9;

  /* Alpha overlays (kept as primitives for clarity at callsites) */
  --color-alpha-white-07: rgba(255, 255, 255, 0.07);
  --color-alpha-white-08: rgba(255, 255, 255, 0.08);
  --color-alpha-white-12: rgba(255, 255, 255, 0.12);
  --color-alpha-white-20: rgba(255, 255, 255, 0.2);
  --color-alpha-black-07: rgba(0, 0, 0, 0.07);
  --color-alpha-black-12: rgba(0, 0, 0, 0.12);
  --color-alpha-black-20: rgba(0, 0, 0, 0.2);
  --color-alpha-black-35: rgba(0, 0, 0, 0.35);
  --color-alpha-black-50: rgba(0, 0, 0, 0.5);
  --color-alpha-black-55: rgba(0, 0, 0, 0.55);
  --color-alpha-black-60: rgba(0, 0, 0, 0.6);

  /* ─── SEMANTIC (unchanged in this task — kept verbatim below) ─── */
```

Then preserve the existing `--bg:#08091a;...--sw:268px;` lines as they are.

- [ ] **Step 3: Smoke check.**

Open `index2.html` in a browser. Confirm zero console errors. Visual must match the pre-edit page exactly (additive primitives can't change anything since nothing references them yet).

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "refactor(tokens): add color primitives to :root"
```

---

### Task 2: Add typography primitives + role tokens

**Files:**
- Modify: `index2.html:10-…` (extend the primitive block added in Task 1)

- [ ] **Step 1: Insert typography primitives + role tokens.**

Edit `index2.html`. Inside the `:root` block, immediately after the alpha-overlay primitives from Task 1 and before the "SEMANTIC (unchanged…)" comment, add:

```css

  /* Font families */
  --font-family-sans: 'Montserrat', sans-serif;
  --font-family-display: 'Inter', 'Montserrat', sans-serif;
  --font-family-system: -apple-system, sans-serif;

  /* Font weights */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* Letter spacing */
  --letter-spacing-tight: -0.02em;
  --letter-spacing-snug: -0.01em;
  --letter-spacing-micro: -0.005em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.04em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.06em;
  --letter-spacing-caps: 0.08em;
  --letter-spacing-caps-wide: 0.1em;
  --letter-spacing-caps-wider: 0.11em;
  --letter-spacing-caps-widest: 0.12em;
  --letter-spacing-caps-display: 0.16em;

  /* Font-size role tokens — pick the higher-count representative when two sizes collapse */
  --font-size-caption-xs: 8px;          /* 8, 8.5 → 8 */
  --font-size-caption: 9px;             /* 9, 9.5 → 9 */
  --font-size-label: 10px;              /* 10, 10.5 → 10 */
  --font-size-body-sm: 11px;            /* 11, 11.5 → 11 */
  --font-size-body: 12px;               /* 12, 12.5 → 12 */
  --font-size-body-lg: 13px;            /* 13, 13.5 → 13 */
  --font-size-subhead: 14px;
  --font-size-heading-sm: 15px;
  --font-size-heading-md: 16px;
  --font-size-heading: 18px;
  --font-size-heading-lg: 22px;
  --font-size-display-sm: 24px;
  --font-size-display: 28px;
  --font-size-display-lg: 34px;

  /* Half-pixel sizes — kept as escape hatches for rare callsites that genuinely need them.
     Prefer role tokens above; only reach for these when a visual diff exposes a 0.5px gap. */
  --font-size-caption-half: 9.5px;
  --font-size-label-half: 10.5px;
  --font-size-body-sm-half: 11.5px;
  --font-size-body-half: 12.5px;
  --font-size-body-lg-half: 13.5px;
  --font-size-caption-xs-half: 8.5px;
```

- [ ] **Step 2: Smoke check.**

Open `index2.html`. Zero console errors. Visual identical to pre-edit (additive only).

- [ ] **Step 3: Commit.**

```bash
git add index2.html
git commit -m "refactor(tokens): add typography primitives and font-size role tokens"
```

---

### Task 3: Add spacing + radius primitives + radius role tokens

**Files:**
- Modify: `index2.html` (extend primitives block)

- [ ] **Step 1: Insert spacing + radius primitives.**

Inside `:root`, after the font-size primitives from Task 2, insert:

```css

  /* Spacing — 4px base scale */
  --space-0: 0;
  --space-px: 1px;
  --space-0_5: 2px;
  --space-1: 4px;
  --space-1_5: 6px;
  --space-2: 8px;
  --space-2_5: 10px;
  --space-3: 12px;
  --space-3_5: 14px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 28px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-14: 56px;

  /* Radius role tokens — pick the most-common representative when adjacent values collapse */
  --radius-tiny: 2px;                /* 2, 3 → 2 */
  --radius-input: 5px;               /* 4, 5, 6 → 5 */
  --radius-control: 8px;             /* 7, 8, 9 → 8 */
  --radius-card: 12px;               /* 10, 11, 12, 14 → 12 */
  --radius-modal: 16px;
  --radius-pill: 22px;               /* 20, 22 → 22 */
  --radius-full: 50%;

  /* Escape-hatch radii for callsites where the rounded shape is load-bearing */
  --radius-3: 3px;
  --radius-4: 4px;
  --radius-7: 7px;
  --radius-9: 9px;
  --radius-10: 10px;
  --radius-11: 11px;
  --radius-14: 14px;
  --radius-20: 20px;
```

- [ ] **Step 2: Smoke check + commit.**

```bash
open index2.html  # verify no console errors, visual unchanged
git add index2.html
git commit -m "refactor(tokens): add spacing and radius primitives + role tokens"
```

---

### Task 4: Add motion + shadow + z-index primitives

**Files:**
- Modify: `index2.html` (extend primitives block)

- [ ] **Step 1: Insert motion / shadow / z-index primitives.**

Inside `:root`, after the radius primitives from Task 3, insert:

```css

  /* Motion */
  --duration-instant: 0.1s;
  --duration-fast: 0.15s;
  --duration-base: 0.22s;
  --duration-slow: 0.4s;
  --duration-slower: 0.8s;
  --ease-out: ease-out;
  --ease-out-quint: cubic-bezier(.4, 0, .2, 1);
  --ease-linear: linear;

  /* Shadows */
  --shadow-sm: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 8px 20px -6px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 10px 28px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.6);
  --shadow-modal: 0 24px 60px -10px rgba(0, 0, 0, 0.35), 0 8px 20px -6px rgba(0, 0, 0, 0.15);

  /* Z-index — semantic stops */
  --z-base: 1;
  --z-sticky: 20;
  --z-dropdown: 50;
  --z-popover: 60;
  --z-overlay: 98;
  --z-modal: 100;
  --z-tooltip: 200;
```

- [ ] **Step 2: Phase 1 visual diff.**

Open `index2.html`, navigate to home, reports, audienceExplorer, campaigns, dataSources, and the account modal. Confirm zero visual change from main HEAD-before. Use the storyboard tooling or any screenshot tool to capture, then compare.

- [ ] **Step 3: Commit.**

```bash
git add index2.html
git commit -m "refactor(tokens): add motion, shadow, and z-index primitives — Phase 1 complete"
```

---

## Phase 2 — Promote semantic-by-accident vars + add aliases

### Task 5: Add canonical semantic tokens (`--status-*`, `--control-active`, `--focus-ring`, `--decoration-accent`) with aliases for old names

**Files:**
- Modify: `index2.html:10-…` (extend `:root`)
- Modify: `index2.html:19-23` (`body.light-mode` block — also receives the new tokens)

- [ ] **Step 1: Inside `:root`, after the existing semantic block (`--brand-primary`, etc.), append the new canonical tokens + RGB companions + aliases.**

Add at the end of `:root`:

```css

  /* ─── PROMOTED SEMANTIC TOKENS ─── */
  /* Status colors */
  --status-success: var(--color-emerald-500);
  --status-success-rgb: 46 168 106;
  --status-warning: var(--color-amber-600);
  --status-warning-rgb: 232 160 32;
  --status-danger: var(--color-red-500);
  --status-danger-rgb: 208 85 58;

  /* Control state + focus */
  --control-active: var(--color-blue-450);
  --focus-ring: var(--color-blue-450);

  /* Non-semantic decoration */
  --decoration-accent: var(--color-violet-500);

  /* Surface overlay */
  --surface-overlay-scrim: var(--color-alpha-black-50);

  /* ─── LOW-CHURN ALIASES — old names continue resolving ─── */
  --green: var(--status-success);
  --accent: var(--status-danger);
  --accent2: var(--status-warning);
  --accent3: var(--control-active);
  --purple: var(--decoration-accent);
```

- [ ] **Step 2: Inside `body.light-mode` (line 19), append the same canonical tokens with light-mode-appropriate values.**

The light-mode block at lines 19–23 currently only overrides `--bg`/`--bg2..5`, `--border*`, `--text*`. Append at the end of the block (before the closing `}`):

```css
  --status-success: var(--color-emerald-500);
  --status-warning: var(--color-amber-600);
  --status-danger: var(--color-red-500);
  --control-active: var(--color-blue-450);
  --focus-ring: var(--color-blue-450);
  --decoration-accent: var(--color-violet-500);
  --surface-overlay-scrim: var(--color-alpha-black-50);
```

(RGB companions and aliases inherit from `:root` — they don't need to be redeclared per mode.)

- [ ] **Step 3: Smoke check.**

Open `index2.html` in dark and light modes. Confirm zero visual change — old aliases (`--green`, `--accent`, etc.) still resolve identically.

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "refactor(tokens): promote semantic-by-accident vars with low-churn aliases — Phase 2 complete"
```

---

## Phase 3 — Literal sweep + role-token migration

Phase 3 touches every rule once. At the end of Task 8, the visual diff must be empty.

### Task 6: Hex literal sweep

**Files:**
- Modify: `index2.html` (every line containing a hex literal in CSS or inline-styled JS strings)

- [ ] **Step 1: Enumerate the hex literals.**

Run:
```bash
grep -nE "#[0-9a-fA-F]{3,6}" index2.html | grep -v "^[0-9]*:#\|svg\|svg+xml\|fill='" | head -60
```

(SVG-fill hex strings inside `data:image/svg+xml` payloads are URL-encoded and must NOT be rewritten — they're not CSS values.)

- [ ] **Step 2: Apply the hex → token mapping. Each rule is touched exactly once.**

Map every hex literal in CSS/JS string positions according to the table below. Use `Edit` with `replace_all` carefully — verify each substitution doesn't hit a SVG payload.

| Hex literal | Replace with |
|---|---|
| `#2ea86a` | `var(--status-success)` |
| `#d0553a` | `var(--status-danger)` |
| `#e8a020` | `var(--status-warning)` |
| `#4a7fd4` | `var(--control-active)` |
| `#7c5cbf` | `var(--decoration-accent)` |
| `#0b72fd` | `var(--brand-primary)` (already aliased; this finishes the migration) |
| `#3892ff` | `var(--brand-primary-hover)` |
| `#1a8fff` | `var(--color-blue-500)` |
| `#5fa8ff` | `var(--color-blue-400)` |
| `#a8c8ff` | `var(--color-blue-300)` |
| `#eef3fa` | `var(--color-blue-200)` |
| `#f4f8ff` | `var(--color-blue-100)` |
| `#fff`, `#ffffff` (CSS color values only — NOT inside `url("data:image/svg+xml;...fill='%23fff'")`) | `var(--color-neutral-0)` |
| `#f7faf9` | `var(--color-mint-100)` |
| `#1a1a2e` | `var(--color-gray-950)` |
| `#1a1a1a` | `var(--color-gray-900)` |
| `#1a1a18` | `var(--color-gray-925)` |
| `#1a1c28` | `var(--color-neutral-800)` |
| `#444` | `var(--color-gray-700)` |
| `#555` | `var(--color-gray-500)` |
| `#666` | `var(--color-gray-400)` |
| `#777` | `var(--color-gray-300)` |
| `#555a72` | `var(--color-neutral-700)` |
| `#8b90a8` | `var(--color-neutral-text2-dark)` |
| `#9eb1c9` | `var(--color-neutral-400)` |
| `#daa520` | `var(--color-amber-700)` |
| `#f4c842` | `var(--color-amber-300)` |
| `#e8b929` | `var(--color-amber-500)` |
| `#c05040` | `var(--color-red-600)` |
| `#00c389` | `var(--color-emerald-700)` |
| `#00a374` | `var(--color-emerald-600)` |

- [ ] **Step 3: Migrate `DS_STATUS_COLORS` in JS.**

At [index2.html:1455](index2.html#L1455), the constant currently reads:
```js
const DS_STATUS_COLORS = {connected:'#2ea86a', error:'#d0553a', idle:'#555a72'};
```
Replace with:
```js
const DS_STATUS_COLORS = {
  connected: 'var(--status-success)',
  error:     'var(--status-danger)',
  idle:      'var(--text3)',
};
```

Then verify by searching for `DS_STATUS_COLORS[` callsites and confirming each uses the value as a CSS string (e.g., `el.style.color = DS_STATUS_COLORS[...]`). If any callsite uses it in a context that can't accept `var(...)` (e.g., canvas fill), revert that single entry to its literal value and add a code comment.

- [ ] **Step 4: Audit SVG chart helpers around `index2.html:4123, 4153, 4175, 4192`.**

Open each line. If the helper passes a CSS-var string to an SVG `fill`/`stroke` attribute, it works (SVG accepts `currentColor` and `var(...)` in modern browsers, but older Safari versions may not — verify). If a helper reads a var via `getComputedStyle(...).trim()` (like line 1485), the resolved value will still be a hex/rgb string — that path is safe.

- [ ] **Step 5: Smoke check.**

Open `index2.html` in dark + light. Every previously-colored element must look identical. Console must be clean.

- [ ] **Step 6: Commit.**

```bash
git add index2.html
git commit -m "refactor(tokens): replace hex literals with semantic vars and primitives"
```

---

### Task 7: rgba literal sweep

**Files:**
- Modify: `index2.html` (every `rgba(...)` literal in CSS)

- [ ] **Step 1: Enumerate.**

Run:
```bash
grep -nE "rgba?\([0-9]" index2.html | head -40
```

- [ ] **Step 2: Apply the rgba → token mapping.**

| rgba literal | Replace with |
|---|---|
| `rgba(46,168,106,X)` (any alpha X) | `rgb(var(--status-success-rgb) / X)` |
| `rgba(232,160,32,X)` | `rgb(var(--status-warning-rgb) / X)` |
| `rgba(208,85,58,X)` | `rgb(var(--status-danger-rgb) / X)` |
| `rgba(74,127,212,X)` | `rgb(var(--control-active) / X)` — but `--control-active` resolves to a hex, not a triplet. Instead introduce a new primitive `--color-blue-450-rgb: 74 127 212;` in the color-primitives block (Task 1 area) and use `rgb(var(--color-blue-450-rgb) / X)`. |
| `rgba(85,90,114,X)` | If X≤0.16: keep as escape hatch (`--color-neutral-700` doesn't have an rgb companion; promote one if 3+ callsites collapse here) |
| `rgba(0,0,0,0.5)` | `var(--color-alpha-black-50)` |
| `rgba(0,0,0,0.55)` | `var(--color-alpha-black-55)` |
| `rgba(0,0,0,0.6)` | `var(--color-alpha-black-60)` |
| `rgba(0,0,0,0.35)` | `var(--color-alpha-black-35)` |
| `rgba(255,255,255,0.07)` | `var(--color-alpha-white-07)` |
| `rgba(255,255,255,0.08)` | `var(--color-alpha-white-08)` |
| `rgba(255,255,255,0.12)` | `var(--color-alpha-white-12)` |
| `rgba(255,255,255,0.2)` | `var(--color-alpha-white-20)` |
| `rgba(8,11,28,0.55)` | Use `--surface-overlay-scrim` if context is a modal scrim; otherwise inline-comment and keep |

- [ ] **Step 3: Add the `--color-blue-450-rgb` primitive if Step 2 referenced it.**

Inside `:root`, in the color-primitives block (next to `--color-blue-450`), add:
```css
  --color-blue-450-rgb: 74 127 212;
```

- [ ] **Step 4: Smoke check + commit.**

```bash
open index2.html  # verify visual unchanged
git add index2.html
git commit -m "refactor(tokens): replace rgba literals with rgb(var(...) / α) form"
```

---

### Task 8: Role-token migration for font-size and border-radius

**Files:**
- Modify: `index2.html` (every `font-size:` and `border-radius:` declaration in CSS)

- [ ] **Step 1: Replace `font-size: Xpx` with role tokens.**

Mapping (when in doubt, prefer the role token closest to the px value; the `-half` escape-hatch is only for cases where a visual diff exposes a 0.5px gap that the role token can't absorb):

| px value | Replace with |
|---|---|
| `8px` | `var(--font-size-caption-xs)` |
| `8.5px` | `var(--font-size-caption-xs)` (first pass — verify no visual diff; if diff appears, swap to `var(--font-size-caption-xs-half)`) |
| `9px` | `var(--font-size-caption)` |
| `9.5px` | `var(--font-size-caption)` (first pass; escape-hatch on diff) |
| `10px` | `var(--font-size-label)` |
| `10.5px` | `var(--font-size-label)` (first pass; escape-hatch on diff) |
| `11px` | `var(--font-size-body-sm)` |
| `11.5px` | `var(--font-size-body-sm)` (first pass; escape-hatch on diff) |
| `12px` | `var(--font-size-body)` |
| `12.5px` | `var(--font-size-body)` (first pass; escape-hatch on diff) |
| `13px` | `var(--font-size-body-lg)` |
| `13.5px` | `var(--font-size-body-lg)` (first pass; escape-hatch on diff) |
| `14px` | `var(--font-size-subhead)` |
| `15px` | `var(--font-size-heading-sm)` |
| `16px` | `var(--font-size-heading-md)` |
| `18px` | `var(--font-size-heading)` |
| `22px` | `var(--font-size-heading-lg)` |
| `24px` | `var(--font-size-display-sm)` |
| `28px` | `var(--font-size-display)` |
| `34px` | `var(--font-size-display-lg)` |

- [ ] **Step 2: Replace `border-radius: Xpx` with role tokens.**

| px value | Replace with |
|---|---|
| `2px`, `3px` | `var(--radius-tiny)` |
| `4px`, `5px`, `6px` | `var(--radius-input)` |
| `7px`, `8px`, `9px` | `var(--radius-control)` |
| `10px`, `11px`, `12px`, `14px` | `var(--radius-card)` |
| `16px` | `var(--radius-modal)` |
| `20px`, `22px` | `var(--radius-pill)` |
| `50%` | `var(--radius-full)` |

If a card's `border-radius: 14px` looks visibly different from `border-radius: 12px` after the swap (likely won't), revert to the `--radius-14` escape-hatch primitive.

- [ ] **Step 3: Phase 3 visual diff.**

Open `index2.html`. Capture screenshots of home, reports, audienceExplorer, campaigns, dataSources, account modal in BOTH dark and light modes. Compare against pre-phase screenshots. The diff must be empty. If any half-px font-size shows a visible reflow, swap that callsite to the `-half` escape-hatch token and reshoot.

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "refactor(tokens): migrate font-size and border-radius to role tokens — Phase 3 complete"
```

---

## Phase 4 — Re-point semantic vars at primitives

### Task 9: Re-point `--bg`/`--text`/`--border`/`--brand-primary`/`--sw` declarations

**Files:**
- Modify: `index2.html:11-17` (dark-mode `:root` semantic block)
- Modify: `index2.html:19-23` + the additions from Task 5 (`body.light-mode` block)

- [ ] **Step 1: Rewrite the dark-mode semantic block.**

The current declarations at lines 11–17 look like:
```css
  --bg:#08091a;--bg2:#0d1124;--bg3:#111828;--bg4:#161e30;--bg5:#1c2438;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);--border3:rgba(255,255,255,0.2);
  --text:#e8eaf2;--text2:#8b90a8;--text3:#555a72;
  --accent:#d0553a;--accent2:#e8a020;--accent3:#4a7fd4;
  --green:#2ea86a;--purple:#7c5cbf;
  --brand-primary:#0b72fd;--brand-primary-hover:#3892ff;--brand-primary-rgb:11 114 253;
  --sw:268px;
```

(Note: Task 5 added the canonical tokens like `--status-success` and re-defined `--green` etc. as aliases AFTER these. So the lines above currently still declare `--green:#2ea86a;` first, then Task 5's alias `--green: var(--status-success);` later — the alias wins by source order.)

First, add a primitive for the dark-mode text color. In Task 1's color-neutrals block in `:root`, insert (above `--color-neutral-50`):
```css
  --color-neutral-25: #e8eaf2;
```

Then replace lines 11–17 with:
```css
  --bg: var(--color-neutral-950);
  --bg2: var(--color-neutral-925);
  --bg3: var(--color-neutral-900);
  --bg4: var(--color-neutral-870);
  --bg5: var(--color-neutral-850);
  --border: var(--color-alpha-white-07);
  --border2: var(--color-alpha-white-12);
  --border3: var(--color-alpha-white-20);
  --text: var(--color-neutral-25);
  --text2: var(--color-neutral-text2-dark);
  --text3: var(--color-neutral-700);
  --brand-primary: var(--color-blue-700);
  --brand-primary-hover: var(--color-blue-600);
  --brand-primary-rgb: 11 114 253;
  --sw: 268px;
```

Drop the `--accent`/`--accent2`/`--accent3`/`--green`/`--purple` declarations on these lines — they're already defined as aliases in Task 5's block lower in `:root`.

- [ ] **Step 2: Rewrite the light-mode semantic block.**

Current lines 20–22 read:
```css
  --bg:#ffffff;--bg2:#f7f9fc;--bg3:#f1f4f9;--bg4:#e9eef5;--bg5:#dde4ee;
  --border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.12);--border3:rgba(0,0,0,0.2);
  --text:#1a1c28;--text2:#4a4e66;--text3:#8a8da8;
```

Replace with:
```css
  --bg: var(--color-neutral-0);
  --bg2: var(--color-neutral-50);
  --bg3: var(--color-neutral-100);
  --bg4: var(--color-neutral-200);
  --bg5: var(--color-neutral-300);
  --border: var(--color-alpha-black-07);
  --border2: var(--color-alpha-black-12);
  --border3: var(--color-alpha-black-20);
  --text: var(--color-neutral-800);
  --text2: var(--color-neutral-600);
  --text3: var(--color-neutral-500);
```

(Note: `--color-neutral-500` is `#8a8da8` per Task 1's primitive list — confirm the value matches `#8a8da8` and adjust the primitive table if a typo crept in. If the light-mode and dark-mode `--text3` resolve to different primitives, that's intentional — semantic vars get redefined per theme.)

- [ ] **Step 3: Visual diff.**

Toggle dark and light. Inspect a sampling of components (header, sidebar, cards, dropdowns, modals). The visual must be identical to pre-edit.

If a primitive value doesn't match its semantic-var target exactly (e.g., light-mode `--text3` was `#8a8da8` and `--color-neutral-500` was set to a different hex in Task 1), correct the primitive value in Task 1's block and re-screenshot.

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "refactor(tokens): re-point semantic vars at primitives — Phase 4 complete"
```

---

## Phase 5 — Theme attribute & flash-free loader

### Task 10: Wrap `:root` under `data-theme="default-dark"`; convert `body.light-mode` to `html[data-theme="default-light"]`

**Files:**
- Modify: `index2.html:10` (selector that opens `:root`)
- Modify: `index2.html:19` (selector that opens `body.light-mode`)

- [ ] **Step 1: Change the dark selector.**

Replace `:root{` at line 10 with:
```css
:root,
html[data-theme="default-dark"] {
```

This is additive: `:root` still matches as before, and we add the `data-theme` selector for explicit selection.

- [ ] **Step 2: Change the light selector.**

Replace `body.light-mode{` at line 19 with:
```css
html[data-theme="default-light"] {
```

(Note: this is NOT additive — we drop the `body.light-mode` selector. The forced-light boot and `toggleTheme` both currently use `body.light-mode`; Steps 3 and 4 update them so the working tree stays valid before committing.)

- [ ] **Step 3: Remove the forced-light boot.**

At lines 3878–3880, delete:
```js
document.body.classList.add('light-mode');
document.getElementById('themeIconDark').style.display = 'none';
document.getElementById('themeIconLight').style.display = '';
```

- [ ] **Step 4: Update `toggleTheme` to set the `data-theme` attribute directly.**

At lines 3675–3681, replace the existing function with:
```js
let isLight = false;
function toggleTheme(){
  isLight = !isLight;
  const id = isLight ? 'default-light' : 'default-dark';
  document.documentElement.setAttribute('data-theme', id);
  document.getElementById('themeIconDark').style.display = isLight ? 'none' : '';
  document.getElementById('themeIconLight').style.display = isLight ? '' : 'none';
}
```

(Task 13 will swap the direct attribute-set with `applyTheme(id)` once that helper exists.)

- [ ] **Step 5: Smoke check.**

Open `index2.html`. The page must render in dark mode by default (no `data-theme` attribute → `:root` defaults apply). Click the `.theme-btn` icon — page must switch to light mode (`html[data-theme="default-light"]`). Re-click — back to dark.

If light-mode rendering looks broken, verify the `html[data-theme="default-light"]` block has every property the old `body.light-mode` block had.

- [ ] **Step 6: Commit.**

```bash
git add index2.html
git commit -m "refactor(theme): convert :root and light-mode to data-theme attribute selectors"
```

---

### Task 11: Add flash-free `<head>` loader script

**Files:**
- Modify: `index2.html:7` (just above the opening `<style>` block — actually just above the `<style>` opener which is at line 7)

- [ ] **Step 1: Confirm the loader insertion point.**

Run:
```bash
sed -n '1,9p' index2.html
```

Expected: `<html>`, `<head>`, meta tags, `<title>Stokes Orchestrator</title>`, then `<style>` opens at line 7.

- [ ] **Step 2: Insert the inline loader before `<style>`.**

Insert immediately before `<style>`:
```html
<script>
(function () {
  var THEMES = { 'default-dark': 1, 'default-light': 1 };
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  var id = (stored && THEMES[stored]) ? stored : null;
  if (!id) {
    try {
      id = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
        ? 'default-light' : 'default-dark';
    } catch (e) { id = 'default-dark'; }
    if (!THEMES[id]) id = 'default-dark';
  }
  document.documentElement.setAttribute('data-theme', id);
})();
</script>
```

Add a code comment above this block stating "Keep `THEMES` here in sync with the registry in the main `<script>` block (search: `const THEMES =`)."

- [ ] **Step 3: Smoke check.**

Open `index2.html`. With clean localStorage:
- If your OS prefers light → page loads light. Confirm.
- If your OS prefers dark → page loads dark. Confirm.

Then set `localStorage.setItem('theme', 'default-light')` in DevTools, reload — page loads light regardless of OS preference. Set to `'default-dark'`, reload — dark.

There should be no visible flash of the wrong mode on load (the inline `<script>` runs before `<style>` is even parsed).

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "feat(theme): add flash-free <head> theme loader"
```

---

### Task 12: Add `html.theme-switching` transition-suppression, `prefers-reduced-motion` global, `@media print` rule

**Files:**
- Modify: `index2.html` (extend the main `<style>` block — append rules at the end, before `</style>`)

- [ ] **Step 1: Find the end of the `<style>` block.**

Run:
```bash
grep -n "^</style>" index2.html
```

Note the line number. Insert the new rules immediately before it.

- [ ] **Step 2: Insert the three blocks.**

```css

/* ─── THEME SWITCH — disable transitions during data-theme change ─── */
html.theme-switching,
html.theme-switching *,
html.theme-switching *::before,
html.theme-switching *::after {
  transition: none !important;
  animation: none !important;
}

/* ─── REDUCED MOTION — honor OS-level setting globally ─── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
}

/* ─── PRINT — ink-friendly palette regardless of active theme ─── */
@media print {
  :root,
  html[data-theme],
  html[data-theme="default-dark"],
  html[data-theme="default-light"] {
    --bg: #ffffff;
    --bg2: #ffffff;
    --bg3: #f5f5f5;
    --bg4: #ebebeb;
    --bg5: #e0e0e0;
    --text: #000000;
    --text2: #333333;
    --text3: #666666;
    --border: rgba(0, 0, 0, 0.15);
    --border2: rgba(0, 0, 0, 0.25);
    --border3: rgba(0, 0, 0, 0.4);
  }
  body { background: #ffffff !important; color: #000000 !important; }
  .sidebar, .sb-overlay, .ctx-menu, .sb-tooltip { display: none !important; }
}
```

- [ ] **Step 3: Smoke check.**

- With dev tools open, run `document.documentElement.classList.add('theme-switching')` — confirm any `:hover` color animation freezes. Remove the class — animations resume.
- In DevTools "Rendering" panel, emulate `prefers-reduced-motion: reduce`. Confirm transitions cease.
- File → Print Preview. Confirm the print view is light + sidebar hidden.

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "feat(theme): add transition-suppression, prefers-reduced-motion, and print rules"
```

---

## Phase 6 — Switcher

### Task 13: Add `THEMES` registry + `applyTheme()` + `storage` event listener (JS only, no UI yet)

**Files:**
- Modify: `index2.html` (insert in main `<script>` block, near the top before any flow logic that may call it; a natural home is right after the `CLIENTS` / `USERS` block around line 1394)

- [ ] **Step 1: Locate insertion point.**

Run:
```bash
grep -n "^let CURRENT_USER_ID" index2.html
```

Insert immediately after the `getCurrentUser` / `hasRole` helpers (around line 1395).

- [ ] **Step 2: Insert the registry + helpers.**

```js

// ─── THEME REGISTRY ─── (keep IDs in sync with the loader in <head>)
const THEMES = {
  'default-dark':  { name: 'Default Dark',  mode: 'dark'  },
  'default-light': { name: 'Default Light', mode: 'light' },
};
const DEFAULT_THEME_ID = 'default-dark';

function getActiveThemeId() {
  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME_ID;
}

function applyTheme(id) {
  if (!THEMES[id]) id = DEFAULT_THEME_ID;
  try { localStorage.setItem('theme', id); } catch (e) { /* ignore */ }

  // Suppress transitions during the swap to avoid simultaneous color interpolations.
  document.documentElement.classList.add('theme-switching');
  document.documentElement.setAttribute('data-theme', id);

  // Re-apply tenant brand overrides on top of the new theme.
  if (typeof restoreActiveTenantBranding === 'function') restoreActiveTenantBranding();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('theme-switching');
    });
  });
}

window.addEventListener('storage', function (e) {
  if (e.key === 'theme' && e.newValue && THEMES[e.newValue]) {
    applyTheme(e.newValue);
  }
});
```

- [ ] **Step 3: Reinstate the `applyTheme` call in `toggleTheme`.**

At lines 3675–3681 (where Task 10 placed a placeholder), restore:
```js
let isLight = false;
function toggleTheme(){
  isLight = !isLight;
  const id = isLight ? 'default-light' : 'default-dark';
  applyTheme(id);
  document.getElementById('themeIconDark').style.display = isLight ? 'none' : '';
  document.getElementById('themeIconLight').style.display = isLight ? '' : 'none';
}
```

(This already calls `applyTheme(id)`. Confirm the temporary `document.documentElement.setAttribute` inline call from Task 10 is removed.)

Also: on page load, sync `isLight` to the actual `data-theme` so the first toggle goes the right direction:
```js
isLight = (getActiveThemeId() === 'default-light');
document.getElementById('themeIconDark').style.display = isLight ? 'none' : '';
document.getElementById('themeIconLight').style.display = isLight ? '' : 'none';
```

Place this initializer near the existing boot code (where the forced-light block used to live).

- [ ] **Step 4: Smoke check.**

- Open `index2.html` in two tabs.
- In tab 1, click the theme toggle to switch to light.
- Tab 2 should switch to light within a frame (storage event).
- DevTools console: `applyTheme('default-dark')` → switches; `applyTheme('garbage')` → falls back to `default-dark`.

- [ ] **Step 5: Commit.**

```bash
git add index2.html
git commit -m "feat(theme): add THEMES registry, applyTheme, and multi-tab sync"
```

---

### Task 14: Build the switcher popover UI (DOM + CSS + JS)

**Files:**
- Modify: `index2.html` (replace the existing `.theme-btn` button DOM around line 1021; extend `<style>` with popover CSS; extend `<script>` with popover behavior)

- [ ] **Step 1: Locate the existing `.theme-btn` DOM.**

Run:
```bash
grep -n 'class="theme-btn"' index2.html
```

Note the line number (expected near line 1021 based on the spec's reference, but verify).

- [ ] **Step 2: Replace the single button with a popover trigger + menu.**

Replace the `<button class="theme-btn" ...>...</button>` block with:
```html
<div class="theme-switcher" id="themeSwitcher">
  <button
    class="theme-btn"
    id="themeBtn"
    type="button"
    aria-haspopup="menu"
    aria-expanded="false"
    aria-label="Switch theme"
    onclick="toggleThemeMenu(event)"
  >
    <svg id="themeIconDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
    <svg id="themeIconLight" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  </button>
  <div class="theme-menu" id="themeMenu" role="menu" aria-label="Themes" hidden></div>
</div>
```

(If the existing button has different SVG icons, copy them in here exactly — the structural change is wrapping the button in `.theme-switcher` and adding the menu sibling.)

- [ ] **Step 3: Append switcher CSS in the `<style>` block.**

Find where the existing `.theme-btn` rule lives (lines 95–96) and add immediately after:
```css
.theme-switcher { position: relative; }
.theme-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: var(--radius-card);
  padding: var(--space-1);
  min-width: 180px;
  z-index: var(--z-dropdown);
  box-shadow: var(--shadow-xl);
  font-family: var(--font-family-sans);
}
.theme-menu[hidden] { display: none; }
.theme-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2_5);
  border-radius: var(--radius-input);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--text);
  cursor: pointer;
  user-select: none;
}
.theme-menu-item:hover,
.theme-menu-item.kbd-active { background: var(--bg4); }
.theme-menu-item[aria-checked="true"] .theme-check { opacity: 1; }
.theme-check { opacity: 0; color: var(--brand-primary); }
```

- [ ] **Step 4: Append switcher JS in the main `<script>` block.**

Place near the existing `toggleTheme` function. Replace `toggleTheme` with a router that opens the menu instead of binary-flipping; the menu items each call `applyTheme()` directly.

```js
function renderThemeMenu() {
  const menu = document.getElementById('themeMenu');
  if (!menu) return;
  const active = getActiveThemeId();
  menu.innerHTML = Object.entries(THEMES).map(function ([id, t]) {
    const checked = (id === active) ? 'true' : 'false';
    return ''
      + '<div class="theme-menu-item" role="menuitemradio" aria-checked="' + checked + '" '
      +      'data-theme-id="' + id + '" tabindex="-1">'
      +   '<span>' + t.name + '</span>'
      +   '<svg class="theme-check" width="14" height="14" viewBox="0 0 24 24" fill="none" '
      +        'stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
      + '</div>';
  }).join('');
  Array.from(menu.querySelectorAll('.theme-menu-item')).forEach(function (el) {
    el.addEventListener('click', function () {
      applyTheme(el.dataset.themeId);
      renderThemeMenu();
      closeThemeMenu();
    });
  });
}

function openThemeMenu() {
  renderThemeMenu();
  const menu = document.getElementById('themeMenu');
  const btn  = document.getElementById('themeBtn');
  menu.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  const first = menu.querySelector('.theme-menu-item[aria-checked="true"]')
             || menu.querySelector('.theme-menu-item');
  if (first) first.focus();
  document.addEventListener('keydown', themeMenuKeydown);
  document.addEventListener('click', themeMenuOutsideClick, true);
}

function closeThemeMenu() {
  const menu = document.getElementById('themeMenu');
  const btn  = document.getElementById('themeBtn');
  menu.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
  document.removeEventListener('keydown', themeMenuKeydown);
  document.removeEventListener('click', themeMenuOutsideClick, true);
  btn.focus();
}

function toggleThemeMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('themeMenu');
  if (menu.hidden) openThemeMenu(); else closeThemeMenu();
}

function themeMenuKeydown(e) {
  const menu = document.getElementById('themeMenu');
  if (menu.hidden) return;
  const items = Array.from(menu.querySelectorAll('.theme-menu-item'));
  const idx = items.indexOf(document.activeElement);
  if (e.key === 'Escape') { e.preventDefault(); closeThemeMenu(); return; }
  if (e.key === 'Tab')    { closeThemeMenu(); return; /* don't prevent default — let Tab proceed */ }
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1 + items.length) % items.length].focus(); return; }
  if (e.key === 'ArrowUp')   { e.preventDefault(); items[(idx - 1 + items.length) % items.length].focus(); return; }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (document.activeElement && document.activeElement.classList.contains('theme-menu-item')) {
      document.activeElement.click();
    }
  }
}

function themeMenuOutsideClick(e) {
  const sw = document.getElementById('themeSwitcher');
  if (sw && !sw.contains(e.target)) closeThemeMenu();
}

// Initialize button-state on boot (icon visibility tracks the active theme's mode).
(function initThemeButton() {
  const active = THEMES[getActiveThemeId()] || THEMES[DEFAULT_THEME_ID];
  const isLightMode = (active.mode === 'light');
  const dark  = document.getElementById('themeIconDark');
  const light = document.getElementById('themeIconLight');
  if (dark)  dark.style.display  = isLightMode ? 'none' : '';
  if (light) light.style.display = isLightMode ? ''     : 'none';
})();
```

Also: remove the old `let isLight` / `toggleTheme()` lines (Task 13's reinstated version). The popover handles everything now. Search for `function toggleTheme()` and delete the function and its sibling `let isLight = …`.

- [ ] **Step 5: Smoke check.**

- Click the theme button — popover opens with "Default Dark" and "Default Light", current one checked.
- Click "Default Light" — page flips to light, popover closes, button focused, check moves on next open.
- Re-open, ArrowDown / ArrowUp navigate, Enter selects, Escape closes (focus returns to button), Tab also closes.
- Click outside the popover — closes.
- Set OS to reduced-motion → switch theme → no `transition` interpolation visible.

- [ ] **Step 6: Commit.**

```bash
git add index2.html
git commit -m "feat(theme): switcher popover with ARIA, keyboard nav, and theme registry — Phase 6 complete"
```

---

## Phase 7 — Brand engine cleanup

### Task 15: Remove `background` from `WL_CSS_MAP` + drop `applyColorToInterface` background branch

**Files:**
- Modify: `index2.html:1428-1433` (`WL_CSS_MAP`)
- Modify: `index2.html:1564-1572` (`applyColorToInterface` body)
- Modify: `index2.html:1526-1531` (`restoreActiveTenantBranding` clears `--bg`/`--bg2`/`--bg3`)

- [ ] **Step 1: Remove `background` entry from `WL_CSS_MAP`.**

At line 1428–1433, change:
```js
const WL_CSS_MAP = {
  primary:    '--brand-primary',
  secondary:  '--brand-primary-hover',
  background: '--bg',
  accent:     '--accent2',
};
```
to:
```js
const WL_CSS_MAP = {
  primary:   '--brand-primary',
  secondary: '--brand-primary-hover',
  accent:    '--accent2',
};
```

(`--accent2` is still a valid alias to `--status-warning` — leave it for now; renaming is a separate concern.)

- [ ] **Step 2: Drop the background branch in `applyColorToInterface`.**

At lines 1564–1572 the function currently has:
```js
  // Derived depth-ramp vars: mirror at body scope so light-mode cannot shadow.
  if(token === 'background'){
    const bg2 = shadeHex(hex, -5);
    const bg3 = shadeHex(hex, -10);
    document.documentElement.style.setProperty('--bg2', bg2);
    document.documentElement.style.setProperty('--bg3', bg3);
    document.body.style.setProperty('--bg2', bg2);
    document.body.style.setProperty('--bg3', bg3);
  }
```
Delete that entire `if(token === 'background')` block.

Also: since `WL_CSS_MAP` no longer has a `background` key, the earlier portion of the function (which writes `document.documentElement.style.setProperty(cssVar, hex)`) will short-circuit out for `token === 'background'` because `cssVar` resolves to `undefined`. That's fine — but double-check that path doesn't crash on `undefined`. Read the function from `index2.html:1550`:
```js
function applyColorToInterface(token, hex){
  const cssVar = WL_CSS_MAP[token];
  if(!cssVar) return;
  ...
}
```
The `if(!cssVar) return;` guard handles `background` safely.

- [ ] **Step 3: Update `restoreActiveTenantBranding` to no longer clear surface vars.**

At lines 1527–1531:
```js
    const props = new Set([
      ...targets,
      '--brand-primary','--brand-primary-hover','--brand-primary-rgb',
      '--bg','--bg2','--bg3','--accent2',
    ]);
```
Change to:
```js
    const props = new Set([
      ...targets,
      '--brand-primary','--brand-primary-hover','--brand-primary-rgb',
      '--accent2',
    ]);
```

(Removing `--bg`/`--bg2`/`--bg3` from the clear-list — they're owned by the theme now.)

- [ ] **Step 4: Verify the brand engine still works end-to-end.**

In DevTools, run:
```js
applyColorToInterface('primary', '#ff0000');
```
Sidebar/badge/active-tab elements that use `--brand-primary` should turn red. Then:
```js
applyColorToInterface('background', '#ff0000');
```
Should be a no-op (no `--bg` change). Then:
```js
applyTheme('default-light');
```
Theme switches to light, but the red brand override persists (re-applied by `restoreActiveTenantBranding`). Then:
```js
restoreActiveTenantBranding();
```
Brand resets to Monese blue.

- [ ] **Step 5: Visual diff.**

Phase 7 should produce zero visual diff for single-tenant Monese (no saved `wlColors.background`). Confirm.

- [ ] **Step 6: Commit.**

```bash
git add index2.html
git commit -m "refactor(brand): remove surface override path from WL_CSS_MAP — Phase 7 complete"
```

---

## Phase 8 — Final smoke matrix

### Task 16: Full smoke + visual-diff matrix

**Files:**
- No code changes. Verification only.

- [ ] **Step 1: Smoke matrix.**

Open `index2.html` and walk through every primary view at least once in each theme:
- Home
- Reports
- Audience Explorer
- Campaigns (including new-campaign wizard)
- Data Sources (including detail panel)
- Account modal

For each: no console errors, no broken layouts, theme switcher works, light/dark toggle works.

- [ ] **Step 2: Switcher matrix.**

- Mouse: open menu, click each theme, confirm switch.
- Keyboard: Tab to switcher, Enter opens menu, ArrowDown/Up navigates, Enter selects, Escape closes (focus returns).
- Persistence: switch, reload, theme persists.
- Multi-tab: open two tabs, switch in tab A, tab B updates.
- localStorage failure: in DevTools Application → clear `theme` key; reload — defaults to `prefers-color-scheme` then `default-dark`.
- Reduced motion: enable in DevTools Rendering panel → switch theme → no transition flash.
- Print preview: print view is light + sidebar hidden.

- [ ] **Step 3: Brand-engine compatibility check.**

In DevTools:
```js
applyColorToInterface('primary', '#ff0000');
applyTheme('default-light');
// Confirm brand stays red, surfaces flip light.
applyTheme('default-dark');
// Confirm brand stays red, surfaces flip dark.
restoreActiveTenantBranding();
// Brand resets to default Monese blue.
```

- [ ] **Step 4: If any matrix row fails — file an issue in `REGRESSIONS.md` (create it if it doesn't exist).**

Format:
```
## YYYY-MM-DD theme system
- [Row name]: [what broke]
- Cause (if known): ...
- Workaround (if found): ...
```

- [ ] **Step 5: Commit a marker.**

If all rows pass:
```bash
git commit --allow-empty -m "test: theme system smoke matrix passes for index2.html"
```

If failures exist (logged in REGRESSIONS.md), commit the regressions file with `-f` (the docs folder is gitignored but specs/plans/regressions are force-tracked):
```bash
git add -f REGRESSIONS.md
git commit -m "test: theme system smoke matrix — see REGRESSIONS.md for non-blocking failures"
```

---

## Out of scope (reminder)

- `index.html`, `MoneseVibeCode_1.1.html`, `stokes-ledbury-mvp.html` — untouched.
- New themes beyond Default Dark / Default Light — infra ready, content deferred.
- Component-level vars beyond what's added in Task 14 (`--dropdown-*`, `--card-*`, `--badge-*`) — promote only when the same recipe repeats 3+ times during a future feature.
- Migration of the existing alias names (`--green`, `--accent*`, `--purple`) to canonical names — partial during Phase 3; aliases stay until a dedicated cleanup task.

## Self-review checklist (run before declaring the plan complete)

- [ ] Every spec section maps to at least one task (Phase 1–7 spec sections → Tasks 1–15; Phase 8 → Task 16).
- [ ] No placeholders — every step shows the actual code or command.
- [ ] Type/name consistency: `applyTheme`, `THEMES`, `DEFAULT_THEME_ID`, `getActiveThemeId`, `restoreActiveTenantBranding`, `WL_CSS_MAP`, `applyColorToInterface`, `data-theme`, `default-dark`, `default-light` — all used identically across tasks.
- [ ] No task depends on a function not defined in a prior task (loader runs before `<style>`; `applyTheme` defined in Task 13 before being called in Task 14's button JS).
- [ ] Every code-changing task ends with a smoke check + commit step.
- [ ] Task 10 and Task 11 are explicitly noted as needing tight sequencing (or single commit) to avoid an intermediate broken state.
