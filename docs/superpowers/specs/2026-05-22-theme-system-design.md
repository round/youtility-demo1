# Theme & Design-System Refactor — index2.html

**Status:** Draft for review
**Target file:** `index2.html`
**Scope:** Everything tokenizable — colors, surfaces, text, borders, typography, spacing, radius, shadow, motion, z-index. v1 ships only the existing "Default Dark" look, but the infrastructure is built so additional themes are a single CSS block plus a registry entry.

## Goal

Turn `index2.html`'s ad-hoc styling into a real design system with three properties:

1. **Unified.** Every visible value comes from a token. No raw hex, no raw rgba, no magic numbers in CSS or JS.
2. **Organized.** Tokens live in two named layers — primitives (raw values) and semantic (the API the stylesheet uses). A thin component layer captures recipes that repeat 3+ times.
3. **Systematized.** Themes are declared as data, not code. Adding a theme = one CSS block + one registry entry. Switcher reads the registry; no logic to update per theme.

A switcher in the header lets the user flip between themes at runtime. localStorage persists choice. No flash on load.

## Non-goals

- Not a build pipeline. Tokens live in `<style>` inside `index2.html` (preserves the single-file artifact constraint).
- Not a brand-switcher replacement. The existing `BRAND_PALETTES` / `applyBrandPalette` / `WL_CSS_MAP` engine stays — it handles per-tenant brand-color overrides, which is a different axis from "which theme is the user looking at."
- Not a token consolidation campaign on its own. Where the existing 18 font-sizes / 17 radii can be unified into role-based tokens during migration, we do it inline. We do not commit to a separate sweep.
- Not a multi-file refactor. `index.html`, `stokes-ledbury-mvp.html`, and the `MoneseVibeCode_*.html` files are out of scope.

## Architecture: two-layer CSS tokens + `data-theme` attribute

```css
:root {
  /* Layer 1 — Primitives. Themes pick FROM these. Stylesheet never references these directly. */
  --color-blue-500: #0b72fd;
  --color-neutral-950: #08091a;
  --font-family-sans: 'Montserrat', sans-serif;
  --radius-control: 8px;
  --space-3: 12px;
  ...

  /* Layer 2 — Semantic. The stylesheet ONLY references these. Themes override these. */
  --bg: var(--color-neutral-950);
  --text: var(--color-neutral-50);
  --brand-primary: var(--color-blue-500);
  --status-success: var(--color-emerald-500);
  ...

  /* Layer 3 — Component (thin). Recipes repeated 3+ times. References semantic only. */
  --dropdown-bg: var(--bg3);
  --dropdown-border: 1px solid var(--border2);
  --dropdown-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
  ...
}

html[data-theme="default-light"] {
  /* Only re-binds semantic vars. Primitives unchanged. */
  --bg: var(--color-neutral-50);
  --text: var(--color-neutral-950);
  ...
}
```

Default-dark is `:root`'s default state — no attribute needed for the baseline. The `data-theme` attribute only varies when the user selects a non-default theme. Removing the attribute always returns the user to a working default.

**Why this shape:**

- Pure CSS swap on theme change. No JS recalculates per theme.
- DevTools-inspectable: every semantic var shows what primitive it resolves to.
- A new theme is a single block. The registry adds one row.
- The brand engine writes inline styles on `documentElement`, which outrank any stylesheet theme — so per-tenant brand overrides apply on top of any theme without further wiring.

## Token taxonomy

### Primitives (`:root`, never redeclared per theme)

| Category | Naming | Example |
|---|---|---|
| Color ramps | `--color-{family}-{shade}` | `--color-blue-500: #0b72fd` |
| Font family | `--font-family-{role}` | `--font-family-sans`, `--font-family-display`, `--font-family-system` |
| Font weight | `--font-weight-{name}` | `--font-weight-medium: 500` |
| Letter spacing | `--letter-spacing-{name}` | `--letter-spacing-tight`, `--letter-spacing-caps` |
| Spacing | `--space-{step}` | 4px base scale (`--space-1: 4px`, `--space-2: 8px`, etc.) |
| Z-index | `--z-{role}` | `--z-sticky`, `--z-dropdown`, `--z-overlay`, `--z-toast` (replaces 20/50/60/100/200) |
| Motion | `--duration-{role}`, `--ease-{role}` | `--duration-fast: 0.15s`, `--ease-out` |
| Shadow | `--shadow-{step}` | Sm/md/lg/xl from current usage |

Color ramps: only the shades we actually use get defined. We do not generate full 50–950 ramps for shades nothing references.

### Semantic (`:root` defaults — themes redeclare these)

Existing variables kept where they already function as semantic — minimizes churn and keeps the diff focused on swaps, not renames.

| Existing | Status | New meaning |
|---|---|---|
| `--bg`, `--bg2`, `--bg3`, `--bg4`, `--bg5` | Keep | Surface ramp, canvas → most-elevated. Resolves to `var(--color-neutral-*)`. |
| `--text`, `--text2`, `--text3` | Keep | Text ramp, primary → tertiary. |
| `--border`, `--border2`, `--border3` | Keep | Border ramp, subtle → strong. |
| `--brand-primary`, `--brand-primary-hover`, `--brand-primary-rgb` | Keep | Brand color trio. |
| `--sw` | Alias to `--sidebar-width` | Layout token. `--sw` kept as alias for low churn. |

Formalized (rename + alias for low-churn migration):

| Existing | New canonical | Reason |
|---|---|---|
| `--green` (14 uses) | `--status-success` + `--status-success-rgb` | Used exclusively for success/connected states. |
| `--accent` (12 uses) | `--status-danger` + `--status-danger-rgb` | Used exclusively for error/delete/destructive states. |
| `--accent2` (8 uses) | `--status-warning` + `--status-warning-rgb` | Used for warning/idle/alert. |
| `--accent3` (7 uses) | `--control-active` + `--focus-ring` | NOT informational — used for active/selected control state (`.proj-btn.open` at [index2.html:102](../../../index2.html#L102), `.ds-conn-tab.active` at [index2.html:933](../../../index2.html#L933)). `--focus-ring` is a sibling token that may diverge in future themes. |
| `--purple` (13 uses) | `--decoration-accent` | Non-semantic decoration; alias kept. |

Aliases (e.g., `--green: var(--status-success);`) sit in `:root` so existing callsites continue to work. Migration of callsites to canonical names happens during Phase 2's literal sweep — we touch each rule once.

Promoted tokens (new):

- `--surface-overlay-scrim` — for the modal/dialog backdrop pattern (`rgba(0, 0, 0, .5)` and family).
- `--status-{name}-rgb` companions — let consumers compose alphas: `rgb(var(--status-success-rgb) / .12)` replaces hardcoded `rgba(46, 168, 106, .12)`.
- `--focus-ring`, `--control-active`, `--decoration-accent` — see formalized rename table above.

Typography role tokens (replaces deferred font-size consolidation per Codex review):

| Role | Approximate px | Used for |
|---|---|---|
| `--font-size-caption-xs` | 8–8.5px | Smallest labels, badge tags |
| `--font-size-caption` | 9–9.5px | Caption text, labels |
| `--font-size-label` | 10–10.5px | Section labels, kbd hints |
| `--font-size-body-sm` | 11–11.5px | Compact body text |
| `--font-size-body` | 12–12.5px | Default body text |
| `--font-size-body-lg` | 13–13.5px | Emphasized body |
| `--font-size-subhead` | 14px | Subheadings |
| `--font-size-heading-sm` | 15–16px | Card titles |
| `--font-size-heading` | 18–22px | Section headings |
| `--font-size-display` | 24–34px | Page titles, big numbers |

Each role token resolves to a single px value chosen from the current 18 distinct sizes. Where two adjacent sizes collapse into the same role (e.g., 9 and 9.5 both become caption), we pick whichever has the higher callsite count and accept a sub-pixel visual change in the loser. The choice is recorded inline as a comment in `:root`. The remaining isolated sizes that don't fit any role (rare) stay as one-off `--font-size-*` primitives until they earn a role.

Radius role tokens (same shape — replaces deferred radius consolidation):

| Role | Approximate px | Used for |
|---|---|---|
| `--radius-tiny` | 2–3px | Tiny pills, chips |
| `--radius-input` | 4–6px | Inputs, small controls |
| `--radius-control` | 7–9px | Buttons, badges |
| `--radius-card` | 10–14px | Cards, modals |
| `--radius-modal` | 16–20px | Large modals |
| `--radius-pill` | (defined as a recipe, e.g., 9999px or 22px) | Pill-shaped chips |
| `--radius-full` | 50% | Circles |

### Component layer (thin)

Only where a recipe repeats 3+ times. Initial set (subject to grow during Phase 2):

- `--dropdown-bg`, `--dropdown-border`, `--dropdown-shadow` — dropdowns at [index2.html:109](../../../index2.html#L109) (`.proj-dropdown`), [index2.html:131](../../../index2.html#L131) (`.ws-dropdown`), and similar.
- `--badge-bg`, `--badge-border`, `--badge-text` — badges/pills at [index2.html:143](../../../index2.html#L143) (`.badge-soon`), [index2.html:961](../../../index2.html#L961), and similar.
- `--card-bg`, `--card-border`, `--card-radius` — `.report-kpi`, `.report-chart-card`, `.report-insight-card`, and similar.

If during Phase 2 we find a recipe that does *not* yet have 3+ callsites, we leave it as direct semantic-var usage. The component layer earns its tokens by repetition.

## Theme registry & switcher

### Registry

```js
const THEMES = {
  'default-dark':  { name: 'Default Dark',  mode: 'dark'  },
  // future entries:
  // 'default-light': { name: 'Default Light', mode: 'light' },
};
const DEFAULT_THEME_ID = 'default-dark';
```

The `mode` field is metadata — used by the switcher to group themes, by `@media (prefers-color-scheme)` resolution, and by the print stylesheet. It does not gate any logic.

### Flash-free loader

Inline `<script>` in `<head>` **before** the existing `<style>` block at [index2.html:7](../../../index2.html#L7):

```html
<script>
(function () {
  var THEMES = { 'default-dark': 1 /* keep in sync; only IDs are used here */ };
  var stored = null;
  try { stored = localStorage.getItem('theme'); } catch (e) {}
  var id = (stored && THEMES[stored]) ? stored : null;
  if (!id) {
    try {
      id = (matchMedia && matchMedia('(prefers-color-scheme: light)').matches)
        ? 'default-light' : 'default-dark';
    } catch (e) { id = 'default-dark'; }
    if (!THEMES[id]) id = 'default-dark';
  }
  document.documentElement.setAttribute('data-theme', id);
})();
</script>
```

The ID-only `THEMES` map in the loader is a deliberate duplicate (kept minimal — IDs only). The full registry lives in the main `<script>` block. Both must stay in sync; we add a comment to that effect on both definitions.

### applyTheme

```js
function applyTheme(id) {
  if (!THEMES[id]) id = DEFAULT_THEME_ID;
  try { localStorage.setItem('theme', id); } catch (e) {}

  // Disable transitions for the swap to avoid 1000s of simultaneous color interpolations.
  // Required because controls at index2.html:323 and :781 use `transition: all`.
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

window.addEventListener('storage', (e) => {
  if (e.key === 'theme' && e.newValue && THEMES[e.newValue]) {
    applyTheme(e.newValue);
  }
});
```

CSS for the transition-suppression class:

```css
html.theme-switching,
html.theme-switching *,
html.theme-switching *::before,
html.theme-switching *::after {
  transition: none !important;
  animation: none !important;
}
```

### Switcher UI

Replace the existing single `.theme-btn` (currently a light/dark toggle at [index2.html:1021](../../../index2.html#L1021) with a popover mirroring the existing `.proj-dropdown` / `.ws-dropdown` shape. With v1's single theme, the menu has one row marked active — proves the wiring and shows what adding a theme looks like.

Accessibility requirements:

- `<button>` trigger: `aria-haspopup="menu"`, `aria-expanded`, accessible name ("Theme" or "Switch theme").
- Menu: `role="menu"`, `aria-label="Themes"`.
- Items: `role="menuitemradio"`, `aria-checked` reflects the active theme.
- Keyboard: arrow keys navigate, Enter/Space selects, Escape closes (restores focus to trigger), Tab closes.
- The current title-only attribute is replaced by an `aria-label`.

## Brand engine coexistence

The existing brand engine (`BRAND_PALETTES`, `applyBrandPalette`, `WL_CSS_MAP`, `applyColorToInterface`, `WL_BRAND_PALETTES`, `WL_CLIENT_DEFAULTS`, `restoreActiveTenantBranding`) stays in place with one breaking change:

**Remove `background` from `WL_CSS_MAP`.** [index2.html:1565-1572](../../../index2.html#L1565-L1572) currently lets a tenant white-label override paint `--bg`/`--bg2`/`--bg3` via inline styles. That makes any tenant who saved a light brand-background "flatten" a dark theme switch. Surfaces belong to the theme; brand owns brand-colors only.

Concretely:

- `WL_CSS_MAP`: drop the `background: '--bg'` entry.
- `applyColorToInterface`: drop the `if (token === 'background')` branch that writes `--bg2`/`--bg3`.
- `WL_CLIENT_DEFAULTS.*.background`: stays in the data (read by no one after this change), or gets pruned in a follow-up; non-breaking for single-tenant Monese which has no saved override.

Order of operations on init and on theme switch:

1. Set `data-theme` on `<html>`.
2. Call `applyBrandPalette(tenant.palette)` — writes `--brand-primary*` inline.
3. Re-apply `client.wlColors` — writes only `--brand-primary` (and any other brand-color tokens) inline.

Brand-color overrides always win because they're inline styles on `documentElement`.

## Accessibility & platform integration

| Concern | Treatment |
|---|---|
| `prefers-color-scheme` | Honored on first load when no localStorage entry exists. Loader picks a default light/dark theme from the registry. Once user explicitly chooses, their choice wins. |
| `prefers-reduced-motion: reduce` | Global rule disables all `transition` and `animation` on every element. Independent of theme switching. |
| Theme-switch animation | Disabled via `html.theme-switching` class wrapping the swap (see above). |
| `@media print` | A print stylesheet forces an ink-friendly palette (white surfaces, black text, no dark backgrounds) regardless of active theme. Implemented as semantic-var overrides in a `@media print { :root { ... } }` block, not as a new theme. |
| Multi-tab sync | `storage` event listener applies theme changes from sibling tabs. |
| localStorage failures | All reads/writes wrapped in `try/catch`. Failure falls back to `prefers-color-scheme` then `default-dark`. |
| Switcher keyboard/ARIA | Full menu semantics (see Switcher UI section above). |

## Migration phases

Each phase ends with the app **visually identical** to the previous phase (we say "visually identical," not "byte-identical" — RGB-companion swaps change byte content but preserve rendered output). Each phase is independently shippable.

### Phase 1 — Primitive layer (additive)

Add all color/font-family/font-weight/letter-spacing/spacing/radius/shadow/z-index/motion primitives to `:root`. No existing rules change. Visual: identical.

### Phase 2 — Promote semantic-by-accident vars + add aliases

Introduce `--status-success`, `--status-warning`, `--status-danger`, `--control-active`, `--focus-ring`, `--decoration-accent`, and their `-rgb` companions. Add aliases so old names continue to resolve:

```css
:root {
  --status-success: var(--color-emerald-500);
  --status-success-rgb: 46 168 106;
  --green: var(--status-success); /* alias, removed during opportunistic migration */
  ...
}
```

This phase runs **before** the literal sweep so the next phase can migrate callsites directly to canonical names. Visual: identical.

### Phase 3 — Literal sweep + role-token consolidation

For each of the ~90 hardcoded hex literals and ~25 rgba literals:

- If the literal duplicates a canonical semantic var (e.g., `#2ea86a` and `--status-success` from Phase 2), use the canonical name.
- If the literal can be expressed as `rgb(var(--{token}-rgb) / α)`, use that form.
- Otherwise, use the closest primitive.

In the same pass, replace ad-hoc `font-size: 12.5px` with role tokens (`--font-size-body`) and ad-hoc `border-radius: 8px` with role tokens (`--radius-control`). Each rule is touched once.

Also opportunistically migrate any rule that still uses an old alias (`--green`, `--accent`, `--accent2`, `--accent3`, `--purple`) to its canonical name. Aliases that have no remaining callsites at end of phase get deleted from `:root`. Aliases with stragglers stay until a later cleanup.

`DS_STATUS_COLORS` in JS becomes a small mapping to semantic-var strings (`{ connected: 'var(--status-success)', error: 'var(--status-danger)', idle: 'var(--text3)' }`).

Risks to watch during this phase:

- **`currentColor` consumers.** [index2.html:177](../../../index2.html#L177) bullets inherit `currentColor` from a parent's `color: var(--text)`. Aliasing semantic vars doesn't change the inherited color; safe.
- **`getComputedStyle(...).trim()` reads.** [index2.html:1485](../../../index2.html#L1485) reads `--brand-primary` and trims. Valid aliases return the resolved primitive's color. Invalid or cyclic aliases return empty string — we test the helper against the new var setup before finalizing.
- **SVG chart helpers** around lines 4123/4153/4175/4192 may map `var(...)` color strings to brand primary. Inspect each callsite during the sweep; swap to passing the resolved color or refactor the helper to accept any var.

Visual: identical (per visual diff at end of phase).

### Phase 4 — Re-point semantic vars at primitives

Change semantic-var declarations from raw values to primitive references:

```css
/* before */
--bg: #08091a;
/* after */
--bg: var(--color-neutral-950);
```

Same treatment for `--text*`, `--border*`, `--brand-primary*`, status/control/decoration tokens. The light-mode block (`body.light-mode { --bg: ...; }`) gets the same treatment in place. Visual: identical.

### Phase 5 — Theme attribute & flash-free loader

- Wrap the current `:root` semantic block under `:root, html[data-theme="default-dark"]` (purely additive — the selector still matches `:root` standalone).
- Convert the existing `body.light-mode { ... }` block to `html[data-theme="default-light"] { ... }`. Keep it in the file even though it's not yet wired to the switcher — proves multi-theme infrastructure works.
- Add the inline `<head>` loader script. Remove the forced-light boot at [index2.html:3878-3880](../../../index2.html#L3878-L3880).
- Add the `html.theme-switching` transition-suppression rule and the `prefers-reduced-motion` rule and the `@media print` block.

Default state with no localStorage and a dark system preference = `default-dark` = identical to today. Visual: identical when storage is empty and system is dark. Visual changes when user has a light system preference (now respected on first load — intentional).

### Phase 6 — Switcher UI

Replace `.theme-btn`'s click handler with a popover listing entries from `THEMES`. Implement keyboard/ARIA per the Switcher UI section above. Wire `applyTheme()` on selection. Wire the `storage` event for multi-tab sync.

With v1's single theme the menu has one row, marked active. Adding a theme later is one CSS block + one `THEMES` entry — no switcher code changes.

### Phase 7 — Brand engine cleanup

- Drop `background` from `WL_CSS_MAP`.
- Drop the `if (token === 'background')` branch in `applyColorToInterface`.
- Confirm `restoreActiveTenantBranding` order plays well with `applyTheme` (theme attribute set first, then brand inline styles).

Visual: identical for single-tenant Monese (no saved `wlColors.background`).

## Verification

At every phase boundary:

1. Run the programmatic smoke matrix from commit `4241056` (`test: programmatic smoke matrix passes for index2.html`).
2. Visual diff: load `index2.html` at HEAD-before and HEAD-after of the phase, take screenshots of every primary view (home, reports, audience, campaigns, datasources, account modal), compare side by side. Phases 1–4 and Phase 7 should produce zero diff. Phase 5 may differ on the very first load for users with a light system preference (intentional). Phase 6 changes the switcher UI by design.

If any phase produces an unexpected diff, fix before moving to the next phase. Don't accumulate visual drift across phases.

## Token inventory output (for reference / future tooling)

After Phase 4, a single block-comment at the top of `:root` enumerates every primitive and semantic var with a one-line description. This serves as the human-readable manifest until/unless we want a separate doc. No runtime cost; just discoverability.

## Open questions deferred to implementation

These don't block the design but will be decided during the plan/implementation phase:

- **Exact px value chosen per role token** when two current sizes collapse (e.g., does `--font-size-caption` resolve to 9 or 9.5?). Recorded inline as a comment when chosen.
- **Whether `--purple` keeps its name as an alias forever** or gets migrated to `--decoration-accent` over time.
- **Whether the print stylesheet uses semantic-var overrides** or a tiny dedicated set of `--print-*` tokens. Both work; pick the simpler one when writing it.
- **Whether `WL_CLIENT_DEFAULTS.*.background` gets pruned** in Phase 7 or left dead for one release for safety.

## Summary of changes per area

| Area | Change |
|---|---|
| CSS `<style>` block | New primitive layer; semantic vars re-pointed at primitives; component layer for repeated recipes; theme blocks under `data-theme`; transition-suppression rule; `prefers-reduced-motion` rule; print rule. |
| Inline `<head>` script (new) | Flash-free theme loader. |
| Main `<script>` block | `THEMES` registry; `applyTheme()`; `storage` event listener; switcher popover handler. Forced-light boot removed. `WL_CSS_MAP.background` removed; `applyColorToInterface` background branch removed. |
| Header DOM | `.theme-btn` becomes a popover trigger; new menu DOM with `role="menu"`. |
| `DS_STATUS_COLORS` | References semantic vars instead of inline hex. |
| Test surface | Existing smoke matrix unchanged; theme switch added as a new smoke case in Phase 6. |
