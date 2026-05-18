# Monese × Stokes Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the Stokes/Ledbury admin + whitelabel + auth system into the Monese chat app so the result is a single-file prototype that runs as either brand without losing any feature from either source file.

**Architecture:** Keep `Monese_1.1 flow.html` as the baseline (it has Reports + Search + chart helpers that Stokes deliberately dropped). Introduce four conceptual layers on top of it: (1) shared core — chat shell, sidebar, campaign builder, theming primitives; (2) client config object — `CLIENTS[]`, `USERS[]`, per-client copy/branding; (3) feature modules — login, account modal, admin shell, client detail, datasource panel, whitelabel editor, user management — each ported from Stokes as a self-contained block; (4) role/capability gating — single-tenant Monese mode hides admin surfaces, multi-tenant mode exposes them. Brand variables become semantic tokens (`--brand-primary`, `--brand-primary-hover`) driven by a `BRAND_PALETTES` preset; Monese and Ledbury are both presets.

**Tech Stack:** Vanilla HTML5, CSS3 (custom properties, no preprocessor), vanilla JS (no framework, no build step). Output is a single self-contained `.html` file opened directly in a browser. No test framework — every task ends with a scripted browser smoke-check.

---

## Source landmarks (read once, refer often)

These line numbers are from the unmodified source files. They're the addresses you'll grep for when porting blocks.

**Monese (`Monese_1.1 flow.html`):**
- CSS: PRODUCT VERTICAL REPORTS — lines 149-178
- CSS: SEARCH CONVERSATIONS MODAL — lines 187-212
- DOM: `<div id="reportView" class="report-view">` — line 1035
- JS: `openSearchModal`/`searchModalSelect` block — lines 1905-1949
- JS: `const REPORTS = {…}` — line 1952
- JS: SVG chart helpers (`polyline`, `areaPath`, `gridLines`) — ~line 2147 onward

**Stokes (`stokes-ledbury-mvp.html`):**
- CSS: USER AVATAR — lines 560+
- CSS: CLIENT WHITE-LABEL LOGO — lines 579+
- CSS: SEARCH BUTTON — lines 592+
- CSS: MODAL BASE — lines 596+
- CSS: LOGIN SCREEN — lines 620+
- CSS: ACCOUNT MODAL (`acct-*`) — lines 649-664
- CSS: ADMIN PANEL (`admin-client-*`) — lines 666-674
- CSS: WHITE LABEL PANEL (`wl-*`) — lines 676+
- DOM: `<div class="login-screen" id="loginScreen">` — line 1205
- DOM: `<div id="accountModal">` — line 1263
- JS: `const USERS = {…}` — line 2368
- JS: `function signOut()` — line 2399
- JS: `const CLIENTS = […]` — line 2484
- JS: `const WL_CSS_MAP = {…}` — line 2542
- JS: `const BRAND_PALETTES = {…}` — line 2550
- JS: `applyColorToInterface` / palette-binding — ~line 2647

Also examine these for the "send/stop button state improvements" the reviewer called out: search Stokes for `sendBtn`, `stopBtn`, `isStreaming`, `setStreamingState`.

---

## File structure

```text
youtility-demo1/
├── Monese_1.1 flow.html             [read-only source]
├── stokes-ledbury-mvp.html          [read-only source]
├── youtility.html                   [NEW — the merged artifact, the only file you edit]
└── docs/superpowers/plans/
    ├── 2026-05-17-monese-stokes-integration.md   [this plan]
    └── 2026-05-17-feature-inventory.md           [created in Task 1]
```

Everything lives in `youtility.html` for now. The reviewer recommends modularizing only after merged behavior is stable; that's an explicit non-goal of this plan.

---

## Conventions

- **Semantic CSS tokens.** Replace `--monese` / `--monese2` / `--ledbury` / `--ledbury2` with `--brand-primary` / `--brand-primary-hover`. Replace `rgba(11,114,253,…)` and `rgba(74,103,65,…)` with `rgb(var(--brand-primary-rgb) / <alpha>)` (or pre-computed equivalents). No brand name survives in CSS class names or variable names.
- **One source of truth per concept.** One `CLIENTS[]`, one `USERS[]`, one search system, one theme system, one router.
- **Brand defaults.** Monese-blue palette is the default preset and the only preset visible to single-tenant Monese mode.
- **Single-tenant flag.** Each `CLIENTS[]` entry has a `mode: 'singleTenant' | 'multiTenant'` field. Single-tenant clients hide login screen, admin nav, account-switcher, and user-management surfaces.
- **Commit cadence.** Every task ends with a commit. Phases end with a manual smoke pass against the regression matrix in Task 38.
- **Browser smoke checks.** Every task that changes runtime behavior ends with: open `youtility.html` in a browser, perform the listed clicks, observe the listed result. No automated assertions exist in this codebase.

---

## Phase 1 — Feature inventory (no code changes)

The reviewer's strongest derisking move. We don't know what we don't know until we list every visible behavior in both files.

### Task 1: Build feature inventory

**Files:**
- Create: `docs/superpowers/plans/2026-05-17-feature-inventory.md`
- Read-only: `Monese_1.1 flow.html`, `stokes-ledbury-mvp.html`

- [ ] **Step 1: Enumerate every `function`, `id="…"`, and top-level CSS section in Monese.**

Run:
```bash
grep -nE "^function [A-Za-z]|id=\"[A-Za-z][A-Za-z0-9_-]+\"|^/\* " "Monese_1.1 flow.html" > /tmp/monese-surface.txt
wc -l /tmp/monese-surface.txt
```

- [ ] **Step 2: Same for Stokes.**

Run:
```bash
grep -nE "^function [A-Za-z]|id=\"[A-Za-z][A-Za-z0-9_-]+\"|^/\* " "stokes-ledbury-mvp.html" > /tmp/stokes-surface.txt
wc -l /tmp/stokes-surface.txt
```

- [ ] **Step 3: Diff the two surface files and write the inventory.**

Run:
```bash
diff /tmp/monese-surface.txt /tmp/stokes-surface.txt | less
```

Then create `docs/superpowers/plans/2026-05-17-feature-inventory.md` with this exact structure:

```markdown
# Feature Inventory — Monese × Stokes

## Shared (appear in both files, identical or near-identical)
| Surface | Type | Notes |
|---|---|---|
| `sidebar`, `sb-new`, `sb-link`, … | DOM/CSS | base shell |
| `newChat()`, `renderCampSb()`, `openCtx()`, … | JS function | identical implementations |
| `.gc-card`, `.camp-item`, `.msg-*`, … | CSS | shared chat/campaign UI |
| (continue for every shared surface) | | |

## Monese-only (will be preserved as-is)
| Surface | Type | Source range | Dependencies |
|---|---|---|---|
| `reportView` | DOM | Monese:1035 | REPORTS, chart helpers |
| `.report-*` styles | CSS | Monese:149-178 | --brand-primary (after Phase 2) |
| `const REPORTS` | JS | Monese:1952 | — |
| `openSearchModal`, `searchModalSelect` | JS | Monese:1905-1949 | searchModalOverlay DOM |
| `.search-modal-*`, `.sb-search-btn` | CSS | Monese:187-212 | — |
| SVG chart helpers (areaPath, polyline, gridLines) | JS | Monese:~2147 | reportView |
| (any Monese copy strings) | text | (find by reading) | — |

## Stokes-only (will be ported)
| Surface | Type | Source range | Dependencies | Port order |
|---|---|---|---|---|
| Login screen | DOM+CSS+JS | Stokes:1205, 620+ | USERS, signIn | 1 |
| Quick-login / role switcher | DOM+JS | (find by grep `quickLogin`) | USERS | 2 |
| Account modal | DOM+CSS+JS | Stokes:1263, 649-664 | session state | 3 |
| Admin client list | DOM+CSS+JS | Stokes:666-674, (find `adminView`) | CLIENTS, role gate | 4 |
| Client detail panel | DOM+CSS+JS | (find `cd-*`) | active client | 5 |
| Datasource panel | DOM+CSS+JS | (find `DS_SOURCES`, `ds-*`) | client detail | 6 |
| Whitelabel editor | DOM+CSS+JS | Stokes:676+, WL_CSS_MAP | applyColorToInterface | 7 |
| User management | DOM+CSS+JS | (find `user-mgmt` or similar) | USERS, role gate | 8 |
| Send/stop button state | JS | (find `sendBtn`, `stopBtn`) | chat composer | 9 |
| `BRAND_PALETTES`, `WL_CSS_MAP`, `cssVar`, `applyColorToInterface` | JS | Stokes:2542-2657 | semantic CSS tokens | (Phase 2) |
| `CLIENTS`, `USERS` | JS | Stokes:2368, 2484 | — | (Phase 3) |

## Conflict points (require explicit resolution)
| Concept | Monese version | Stokes version | Resolution |
|---|---|---|---|
| Brand colors | `--monese` (#0b72fd) hardcoded | `--ledbury` + BRAND_PALETTES | Semantic `--brand-primary`, monese as preset |
| Search modal | Rich modal with keyboard nav | Simpler/absent | Keep Monese version, scope results to active client |
| Sidebar new button row | `.sb-new` + `.sb-search-btn` | `.sb-new` only | Keep Monese version |
| Reporting | `reportView` exists | absent | Preserve Monese; do not let admin view overwrite |
| Copy strings | Hardcoded Monese | Hardcoded Ledbury | Move to per-client config |
| Session/login | Direct access | Login screen gates everything | `mode: singleTenant` bypasses login |
| Font stack | Inter + Montserrat | Montserrat only | Per-brand `fontImport` field; Monese keeps Inter |
```

Fill the tables exhaustively. The "find by grep" placeholders must resolve to concrete line numbers before this task is marked done. The inventory is the contract for everything that follows.

- [ ] **Step 4: Verify completeness.**

Read the inventory back. For every `function` declaration in Stokes that is not in the "Shared" or "Stokes-only" tables, add a row. For every `id="…"` in Stokes that is not in the tables, add a row. Same for Monese. The inventory must account for every distinct surface in both files.

- [ ] **Step 5: Commit.**

```bash
git add docs/superpowers/plans/2026-05-17-feature-inventory.md
git commit -m "docs: feature inventory for Monese × Stokes integration"
```

---

## Phase 2 — Baseline + semantic brand tokens

Create the working file and refactor Monese's brand variables to semantic tokens. The file must render identically before and after.

### Task 2: Create working baseline

**Files:**
- Create: `youtility.html` (copy of `Monese_1.1 flow.html`)

- [ ] **Step 1: Copy the file.**

```bash
cp "Monese_1.1 flow.html" youtility.html
```

- [ ] **Step 2: Smoke check.**

Open `youtility.html` in a browser. Confirm:
- Sidebar renders with blue accent.
- Chat surface loads.
- Sidebar "Reports" link (if present) opens `#reportView`.
- Search button in sidebar opens the search modal; Esc closes it.

If any of these fail, the baseline is broken and the copy is wrong — re-copy and re-check.

- [ ] **Step 3: Commit.**

```bash
git add youtility.html
git commit -m "chore: youtility.html baseline from Monese"
```

### Task 3: Replace `--monese` with semantic tokens in `:root`

**Files:**
- Modify: `youtility.html` (the `:root{…}` block near top of `<style>`)

- [ ] **Step 1: Locate the `:root` block.**

Run:
```bash
grep -n "^:root\|--monese\|--ledbury" youtility.html | head -20
```

You should find lines like `--monese:#0b72fd;--monese2:#3892ff;` inside the `:root{}` declaration.

- [ ] **Step 2: Add semantic tokens alongside the brand-named ones (do not delete yet).**

Edit `youtility.html`. Inside the `:root` block, immediately after `--monese:#0b72fd;--monese2:#3892ff;`, add:

```css
--brand-primary:#0b72fd;--brand-primary-hover:#3892ff;--brand-primary-rgb:11 114 253;
```

Keep the original `--monese` lines for now. Both will resolve to the same color, so nothing breaks.

- [ ] **Step 3: Smoke check.**

Open `youtility.html`. Confirm visual output is unchanged from Task 2.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "refactor: add --brand-primary semantic tokens alongside --monese"
```

### Task 4: Migrate all CSS `var(--monese*)` references to semantic tokens

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Find every usage.**

```bash
grep -nE "var\(--monese|--monese2" youtility.html | wc -l
```

Record the count (call it N).

- [ ] **Step 2: Replace `var(--monese2)` first (more specific match goes first to avoid `--monese` swallowing it).**

In `youtility.html`, replace_all `var(--monese2)` with `var(--brand-primary-hover)`.

- [ ] **Step 3: Replace `var(--monese)` next.**

In `youtility.html`, replace_all `var(--monese)` with `var(--brand-primary)`.

- [ ] **Step 4: Confirm count is now 0.**

```bash
grep -cE "var\(--monese" youtility.html
```

Expected: `0`.

- [ ] **Step 5: Remove the now-orphaned declarations from `:root`.**

Delete `--monese:#0b72fd;--monese2:#3892ff;` from the `:root` block. Keep the `--brand-primary*` declarations.

- [ ] **Step 6: Smoke check.**

Open `youtility.html`. Confirm visual output is unchanged. Pay attention to: sidebar active state, message bubbles, chart accents in `reportView`, search modal hover states.

- [ ] **Step 7: Commit.**

```bash
git add youtility.html
git commit -m "refactor: migrate --monese usages to --brand-primary"
```

### Task 5: Replace hardcoded blue color literals with brand vars

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Find literal `#0b72fd` and `#3892ff` outside the `:root` block.**

```bash
grep -nE "#0b72fd|#3892ff|rgba\(11,?\s*114,?\s*253" youtility.html
```

- [ ] **Step 2: For each match outside the `:root` block, replace.**

- `#0b72fd` → `var(--brand-primary)`
- `#3892ff` → `var(--brand-primary-hover)`
- `rgba(11,114,253,X)` → `rgb(var(--brand-primary-rgb) / X)` (CSS Color Module Level 4 syntax — modern browsers support this).

If any literal appears inside an inline `style="…"` attribute on an SVG `stroke` or `fill`, leave it for Task 16 (chart-helper refactor) rather than touching it here.

- [ ] **Step 3: Verify final count.**

```bash
grep -cE "#0b72fd|#3892ff" youtility.html
```

Expected: `0` (or only inside `:root`).

```bash
grep -cE "rgba\(11,?\s*114,?\s*253" youtility.html
```

Expected: `0`.

- [ ] **Step 4: Smoke check.**

Open `youtility.html`. Click through Reports view; verify chart strokes/fills are still blue (now driven by brand var).

- [ ] **Step 5: Commit.**

```bash
git add youtility.html
git commit -m "refactor: replace blue literals with brand-primary vars"
```

---

## Phase 3 — Client config object (Monese as preset)

Introduce the data structures that will let Monese coexist with Stokes brands. Monese becomes one entry in `CLIENTS[]`.

### Task 6: Add minimal `CLIENTS` + active-client globals

**Files:**
- Modify: `youtility.html` (top of main `<script>` block)

- [ ] **Step 1: Locate the start of the main script block.**

```bash
grep -n "^<script>\|^  const IC=" youtility.html | head -5
```

Find the first non-trivial `const` declaration in the main `<script>`.

- [ ] **Step 2: Immediately before that line, insert the `CLIENTS` definition.**

```javascript
const CLIENTS = [
  {
    id: 'monese',
    name: 'Monese',
    mode: 'singleTenant',
    fontImport: 'https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap',
    palette: 'monese',
    copy: {
      productName: 'Monese',
      tagline: '',
    },
    enabledFeatures: {
      reports: true,
      search: true,
      campaigns: true,
      audienceExplorer: true,
      admin: false,
      whitelabel: false,
      userManagement: false,
    },
  },
];
let ACTIVE_CLIENT_ID = 'monese';
function getActiveClient(){ return CLIENTS.find(c => c.id === ACTIVE_CLIENT_ID) || CLIENTS[0]; }
```

- [ ] **Step 3: Smoke check.**

Open `youtility.html`, open browser console, type `getActiveClient()`. Expected output: the Monese client object.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: add CLIENTS registry with Monese as singleTenant default"
```

### Task 7: Add `USERS` and a session stub

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Immediately after the `CLIENTS` block from Task 6, insert.**

```javascript
const USERS = {
  'monese-demo': {
    id: 'monese-demo',
    name: 'Demo User',
    email: 'demo@monese.com',
    role: 'user',
    clientId: 'monese',
  },
};
let CURRENT_USER_ID = 'monese-demo';
function getCurrentUser(){ return USERS[CURRENT_USER_ID] || null; }
function hasRole(...roles){ const u = getCurrentUser(); return u && roles.includes(u.role); }
```

- [ ] **Step 2: Smoke check.**

Browser console: `getCurrentUser()` → returns demo user. `hasRole('user')` → `true`. `hasRole('admin')` → `false`.

- [ ] **Step 3: Commit.**

```bash
git add youtility.html
git commit -m "feat: add USERS registry and session stub"
```

### Task 8: Add `BRAND_PALETTES` and `applyBrandPalette`

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Immediately after the `USERS` block, insert.**

```javascript
const BRAND_PALETTES = {
  monese: {
    '--brand-primary': '#0b72fd',
    '--brand-primary-hover': '#3892ff',
    '--brand-primary-rgb': '11 114 253',
    '--bg': '#ffffff', '--bg2': '#f7f9fc', '--bg3': '#f1f4f9',
    '--bg4': '#e9eef5', '--bg5': '#dde4ee',
  },
};
function applyBrandPalette(name){
  const p = BRAND_PALETTES[name] || BRAND_PALETTES['monese'];
  for (const [k, v] of Object.entries(p)) document.documentElement.style.setProperty(k, v);
}
applyBrandPalette(getActiveClient().palette);
```

- [ ] **Step 2: Smoke check.**

Open `youtility.html`. Open dev tools → Elements → inspect `<html>` and confirm inline `style` shows `--brand-primary: #0b72fd` etc. Visual output identical to Task 5.

- [ ] **Step 3: Test palette swap in console.**

Browser console:
```javascript
BRAND_PALETTES.test = { '--brand-primary': '#ff00ff', '--brand-primary-hover': '#ff66ff' };
applyBrandPalette('test');
```

Expected: blue accents turn magenta immediately. Then:
```javascript
applyBrandPalette('monese');
```

Expected: blue restored.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: BRAND_PALETTES with monese preset and applyBrandPalette()"
```

### Task 9: Add a Ledbury preset to validate multi-brand support

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Inside `BRAND_PALETTES`, add the `ledbury` entry.**

Find the `BRAND_PALETTES = {` block from Task 8. Add after the `monese:` entry:

```javascript
  ledbury: {
    '--brand-primary': '#4a6741',
    '--brand-primary-hover': '#6a8f60',
    '--brand-primary-rgb': '74 103 65',
    '--bg': '#f4f2ee', '--bg2': '#ebe9e4', '--bg3': '#e2e0da',
    '--bg4': '#d8d5cf', '--bg5': '#ccc9c2',
  },
```

- [ ] **Step 2: Test palette swap.**

Browser console: `applyBrandPalette('ledbury')`. Expected: page shifts to green/warm-neutral. `applyBrandPalette('monese')` restores blue.

- [ ] **Step 3: Commit.**

```bash
git add youtility.html
git commit -m "feat: add ledbury brand palette preset"
```

---

## Phase 4 — Port BRAND_PALETTES infrastructure from Stokes

The minimal palette swap works. Now bring in Stokes's full whitelabel infrastructure so palettes can be edited at runtime by the (forthcoming) whitelabel editor.

### Task 10: Port `WL_CSS_MAP` and `applyColorToInterface`

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` lines 2542-2657

- [ ] **Step 1: Read the source block.**

Read `stokes-ledbury-mvp.html` lines 2540-2660 to capture: `WL_CSS_MAP`, the full `BRAND_PALETTES` declaration (replace the seed from Task 8/9 with this fuller one), `applyColorToInterface`, and any palette-binding helpers.

- [ ] **Step 2: Port `WL_CSS_MAP` and `applyColorToInterface` verbatim into `youtility.html`.**

Place them immediately after the `applyBrandPalette` function from Task 8.

If Stokes's `BRAND_PALETTES` is more detailed than the seed you added in Tasks 8-9 (e.g. includes additional CSS variables for borders, text colors), replace the seed with Stokes's version BUT rename the brand keys to match yours (`monese`, `ledbury`) and rename any `--monese` / `--ledbury` CSS var references inside the palette values to `--brand-primary` / `--brand-primary-hover`.

- [ ] **Step 3: Smoke check.**

Open `youtility.html`. Visual unchanged. Browser console:
```javascript
applyColorToInterface('primary', '#ff0000');
```
Expected: brand accents turn red. Then `applyBrandPalette('monese')` restores.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: port WL_CSS_MAP and applyColorToInterface from Stokes"
```

---

## Phase 5 — Port login & session model

First feature module. Wired off by default for Monese (`mode: singleTenant`); demonstrable by adding a `mode: multiTenant` test client.

### Task 11: Port login screen DOM + CSS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` lines 620+ (CSS), 1205+ (DOM)

- [ ] **Step 1: Read source CSS block.**

Read `stokes-ledbury-mvp.html` from line 620 to the next `/* ──` section header. Capture the full `.login-screen`, `.login-card`, `.login-input`, `.login-btn`, etc. block.

- [ ] **Step 2: Replace any `--ledbury` or `--monese` references in the block with `var(--brand-primary)` / `var(--brand-primary-hover)`.**

Same treatment for hardcoded green or blue literals: `#4a6741` / `#6a8f60` → brand vars; `#0b72fd` → brand var.

- [ ] **Step 3: Paste the cleaned CSS block into `youtility.html`.**

Insert at the end of the `<style>` block, immediately before `</style>`, under a fresh `/* ── LOGIN SCREEN ── */` section header.

- [ ] **Step 4: Read source DOM block.**

Read `stokes-ledbury-mvp.html` starting at line 1205 (`<div class="login-screen" id="loginScreen">`) to the matching `</div>`. Capture the full markup.

- [ ] **Step 5: Replace any Ledbury-specific copy.**

`"Welcome to Ledbury"` → `"Welcome"`. `"Sign in to Ledbury"` → `"Sign in"`. Any other hardcoded brand strings → generic versions. We will inject brand-specific copy at runtime in a later task.

- [ ] **Step 6: Paste the DOM block.**

Insert into `youtility.html` immediately after `<body>` opening tag (the login screen overlays the app). The block must have `id="loginScreen"` and start with `class="login-screen hidden"` — note the `hidden` so single-tenant mode doesn't show it.

- [ ] **Step 7: Smoke check.**

Open `youtility.html`. Login screen must NOT be visible (single-tenant Monese mode). Chat surface visible as before. In console: `document.getElementById('loginScreen')` returns the element; `.classList.contains('hidden')` is `true`.

- [ ] **Step 8: Commit.**

```bash
git add youtility.html
git commit -m "feat: port login screen DOM+CSS from Stokes (hidden in singleTenant mode)"
```

### Task 12: Port `doLogin` / `quickLogin` / `signOut` JS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` lines 2374+ (`doLogin`), 2381+ (`quickLogin`), 2399+ (`signOut`)

- [ ] **Step 1: Read source JS.**

Read `stokes-ledbury-mvp.html` around lines 2374–2405 to capture `doLogin`, `quickLogin`, and `signOut`. Also grep for any `showLogin` helper.

- [ ] **Step 2: Paste functions into `youtility.html`.**

Place them immediately after `getCurrentUser` / `hasRole` from Task 7. Replace any direct DOM mutations that referenced Ledbury-specific class names with the generic equivalents.

> **Porting rule (applies to every Stokes JS port from here on):** Stokes references a global `let currentUser`. That global does NOT exist in the merged file — Task 7 replaced it with `CURRENT_USER_ID` + `getCurrentUser()`. In every block you paste from Stokes:
>
> - Replace every read `currentUser` → `getCurrentUser()`.
> - Replace every assignment `currentUser = <userId>` → `CURRENT_USER_ID = <userId>; updateAvatarUI();`.
>
> Missing this rule produces `ReferenceError: currentUser is not defined` the first time the surface is exercised. This applies to Tasks 12, 15, 17, 23, and any later port that touches user/role state.

- [ ] **Step 3: Add bootstrap gate.**

At the very end of the main `<script>` block (after all other globals/handlers), add:

```javascript
(function bootstrapSession(){
  const client = getActiveClient();
  if (client.mode === 'singleTenant') return; // skip login
  const loginEl = document.getElementById('loginScreen');
  if (loginEl) loginEl.classList.remove('hidden');
})();
```

- [ ] **Step 4: Smoke check.**

Open `youtility.html` (Monese, singleTenant). Login screen NOT shown. In console:
```javascript
CLIENTS[0].mode = 'multiTenant'; location.reload();
```
After reload, login screen IS shown. Sign in works (or shows a stub form — the actual sign-in handler will be tested in Task 13). Restore: `CLIENTS[0].mode = 'singleTenant'` in source, reload.

- [ ] **Step 5: Commit.**

```bash
git add youtility.html
git commit -m "feat: port doLogin/quickLogin/signOut and singleTenant login gating"
```

### Task 13: Verify login flow end-to-end (no persistent code changes)

**Files:**
- Modify: `youtility.html` (test edits only, reverted at end)

- [ ] **Step 1: Add a temporary multi-tenant client for testing.**

Inside `CLIENTS`, after the `monese` entry, add:

```javascript
  {
    id: 'test-mt',
    name: 'Test MultiTenant',
    mode: 'multiTenant',
    fontImport: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
    palette: 'ledbury',
    copy: { productName: 'Test', tagline: '' },
    enabledFeatures: { reports: false, search: true, campaigns: true, audienceExplorer: false, admin: true, whitelabel: true, userManagement: true },
  },
```

And temporarily change `let ACTIVE_CLIENT_ID = 'monese';` to `let ACTIVE_CLIENT_ID = 'test-mt';`.

- [ ] **Step 2: Smoke check the flow.**

Open `youtility.html`. Login screen visible. Enter any credentials (or click any quick-login). Login screen hides; chat surface visible. Click sign-out (account modal → sign out). Login screen returns.

- [ ] **Step 3: Revert test edits.**

Remove the `test-mt` entry. Restore `ACTIVE_CLIENT_ID = 'monese'`. Confirm Monese still loads without login.

- [ ] **Step 4: Record verification only (no commit required if no file changes).**

This task is a verification pass; after Step 3's revert there should be nothing to commit. If you intentionally kept any non-test improvement (e.g. a small bootstrap fix you discovered while testing), stage and commit only that file with a descriptive message — do not run `git add`/`git commit` on an empty working tree.

---

## Phase 6 — Port account modal

### Task 14: Port `.acct-*` CSS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` lines 649-664

- [ ] **Step 1: Copy the block from Stokes 649-664 (the entire `/* ── ACCOUNT MODAL ── */` section).**

Same color/brand-var cleanup as Task 11 step 2.

- [ ] **Step 2: Paste at end of `<style>` block in `youtility.html` under a fresh `/* ── ACCOUNT MODAL ── */` header.**

- [ ] **Step 3: Smoke check.**

Open `youtility.html`. No visual change yet (markup not added). In dev tools, paste an `acct-user-card` element manually and verify it styles correctly.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: port account modal CSS (.acct-*) from Stokes"
```

### Task 15: Port account modal DOM + open/close JS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` line 1263+ (DOM), search `openAccountModal` for JS

- [ ] **Step 1: Read DOM block (line 1263 to matching close).**

- [ ] **Step 2: Read JS handlers (search Stokes for `openAccountModal`, `closeAccountModal`, click handlers for `acct-menu-item`, `acct-signout`).**

- [ ] **Step 3: Paste DOM into `youtility.html` right before `</body>`.**

- [ ] **Step 4: Paste JS handlers into the main `<script>` block, near `doLogin`/`quickLogin`/`signOut`.**

- [ ] **Step 5: Wire the trigger.**

Find the existing sidebar user button in `youtility.html` (Monese has a user avatar; identify by grep `user-avatar` or similar). Add `onclick="openAccountModal()"`.

If single-tenant mode should hide the sign-out item (since there's no auth), add `if (getActiveClient().mode === 'singleTenant') element.classList.add('hidden')` for the `.acct-signout` button at init time.

- [ ] **Step 6: Smoke check.**

Open `youtility.html`. Click user avatar → account modal opens, shows demo user name/email, sign-out is hidden (singleTenant). Click outside → modal closes. Esc → modal closes.

Temporarily flip `CLIENTS[0].mode = 'multiTenant'` in console + reload → sign-out now visible.

- [ ] **Step 7: Commit.**

```bash
git add youtility.html
git commit -m "feat: port account modal DOM/JS and wire user-avatar trigger"
```

---

## Phase 7 — Port admin client list

### Task 16: Port `.admin-client-*` CSS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` lines 666-674

- [ ] **Step 1-2: Same pattern as Task 14.**

Copy CSS block, clean brand references, paste under `/* ── ADMIN PANEL ── */` section header.

- [ ] **Step 3: Smoke check.**

No visual change yet. Spot-check styles by injecting a `<div class="admin-client-row">…</div>` via dev tools.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: port admin client list CSS from Stokes"
```

### Task 17: Port admin view DOM + render JS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` (find by grep `adminView`, `renderAdminClients`, `admin-client-row`)

- [ ] **Step 1: Locate the admin view in Stokes.**

```bash
grep -nE "id=\"adminView\"|renderAdminClients|adminClientList" stokes-ledbury-mvp.html
```

- [ ] **Step 2: Read the full DOM block and render JS.**

- [ ] **Step 3: Paste DOM into `youtility.html` alongside the other views (near `<div id="reportView">`).**

The admin view must have `class="admin-view hidden"` initially.

- [ ] **Step 4: Paste render JS into the main `<script>`.**

Apply the Task 12 porting rule: replace every `currentUser` read with `getCurrentUser()` and every `currentUser =` assignment with `CURRENT_USER_ID = <id>; updateAvatarUI();`. `renderAdminPanel` in particular depends on `currentUser.isAdmin`, not just `CLIENTS`. If it references Ledbury-specific copy strings, generalize them.

- [ ] **Step 5: Add sidebar nav entry, gated on `enabledFeatures.admin`.**

In `youtility.html`, find the sidebar links section. Add (with the existing pattern):

```html
<div class="sb-link" id="sbLinkAdmin" onclick="showAdminView()" style="display:none">
  <!-- icon SVG --> <span>Admin</span>
</div>
```

And in the bootstrap section, add:

```javascript
if (getActiveClient().enabledFeatures.admin) {
  document.getElementById('sbLinkAdmin').style.display = '';
}
```

- [ ] **Step 6: Implement `showAdminView()`.**

```javascript
function showAdminView(){
  document.getElementById('reportView').style.display = 'none';
  // hide other views similarly — match existing showXxx() pattern in the file
  document.getElementById('adminView').classList.remove('hidden');
  renderAdminClients();
}
```

- [ ] **Step 7: Smoke check.**

In Monese (singleTenant, admin: false): sidebar has no Admin link. Reports + Search still work.

Temporarily flip `enabledFeatures.admin = true` in source + reload: Admin link appears, clicking it shows the client list. Revert.

- [ ] **Step 8: Commit.**

```bash
git add youtility.html
git commit -m "feat: port admin client list view, gated on enabledFeatures.admin"
```

---

## Phase 8 — Port client detail panel

### Task 18: Port `.cd-*` CSS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` (grep `cd-panel`, `cd-tab`, `cd-kpi`)

- [ ] **Step 1: Locate CSS block.**

```bash
grep -n "^\.cd-" stokes-ledbury-mvp.html | head -5
```

Read from the first match to the next `/* ──` section header.

- [ ] **Step 2-3: Same pattern as Task 14.** Clean brand refs, paste under `/* ── CLIENT DETAIL ── */`.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: port client detail (.cd-*) CSS"
```

### Task 19: Port client detail DOM + render JS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` (grep `clientDetailView`, `openClientDetail`)

- [ ] **Step 1-4: Same pattern as Task 17.** Locate DOM, render JS, paste into `youtility.html`, wire from admin client list rows.

The client detail view is opened from the admin list, so wiring is `admin-client-row` click → `openClientDetail(clientId)`. Should be already wired in Stokes; verify it survives the port.

- [ ] **Step 5: Smoke check.**

Temporarily enable admin: from admin client list, click a row → client detail opens with tabs (Overview, Datasource, Whitelabel, Users). Back button returns to admin list. Revert.

- [ ] **Step 6: Commit.**

```bash
git add youtility.html
git commit -m "feat: port client detail panel and admin-list wiring"
```

---

## Phase 9 — Port datasource panel

### Task 20: Port datasource panel CSS + DOM + JS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` (grep `DS_SOURCES`, `DS_STATUS_COLORS`, `ds-`, `datasource`)

- [ ] **Step 1: Locate all datasource surfaces in Stokes.**

```bash
grep -nE "DS_SOURCES|DS_STATUS_COLORS|class=\"ds-|datasource" stokes-ledbury-mvp.html | head -30
```

Compile: CSS line range, DOM (inside client detail view as a tab), JS render function, data constants `DS_SOURCES` + `DS_STATUS_COLORS`.

- [ ] **Step 2: Port the data constants.**

Paste `DS_SOURCES` and `DS_STATUS_COLORS` near `CLIENTS` / `USERS`. If they're keyed per-client, keep that structure; if globally shared, port as-is.

- [ ] **Step 3: Port CSS.** Same cleanup pattern.

- [ ] **Step 4: Port DOM.** It lives inside the client detail view as a tab body — slot it in.

- [ ] **Step 5: Port render JS.** Wire to the datasource tab activation handler.

- [ ] **Step 6: Smoke check.**

Multi-tenant test: admin → client → Datasource tab → list renders, status colors correct.

- [ ] **Step 7: Commit.**

```bash
git add youtility.html
git commit -m "feat: port datasource panel + DS_SOURCES data"
```

---

## Phase 10 — Port whitelabel editor

### Task 21: Port `.wl-*` CSS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` lines 676+ (WHITE LABEL PANEL)

- [ ] **Step 1-3: Same pattern as Task 14.** Clean brand refs, paste under `/* ── WHITELABEL EDITOR ── */`.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: port whitelabel editor CSS (.wl-*)"
```

### Task 22: Port whitelabel editor DOM + JS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` (grep `whitelabelView`, `applyColorToInterface`, `logoUpload`)

- [ ] **Step 1: Locate the editor DOM and event wiring.**

```bash
grep -nE "id=\"whitelabel|class=\"wl-|applyColorToInterface|onLogoUpload|saveWhitelabel" stokes-ledbury-mvp.html | head -30
```

- [ ] **Step 2: Port DOM into client detail view as the Whitelabel tab.**

> **Duplicate ID warning:** Stokes ships the whitelabel editor in BOTH `#wlModal` (lines 1312–1328) and inside `renderCdWhiteLabel()` (lines 2315–2345), with the same input IDs (`#wlinput-primary`, `#wlinput-secondary`, `#wlinput-background`, `#wlinput-accent`) in both. `wireWlInputs()` uses `getElementById()`, which returns only the first match — porting both DOMs verbatim silently breaks half the editor. Choose one:
>
> - **(a) Recommended:** do NOT port `#wlModal`. Render the editor only into the tab; update any `openWhiteLabel()` callers to navigate to the client-detail Whitelabel tab instead of opening a modal.
> - **(b)** Prefix the tab instance's IDs with `cd-` (e.g. `id="cd-wlinput-primary"`) and update `renderCdWhiteLabel()` + `wireWlInputs()` to read those prefixed IDs.

- [ ] **Step 3: Port JS handlers: color picker change → `applyColorToInterface`; logo upload → file-to-data-URL → injected into CSS var; save → update `CLIENTS[i].palette` / logo URL in memory.**

`applyColorToInterface` was already ported in Task 10; reuse it.

- [ ] **Step 4: Smoke check.**

Multi-tenant test: client detail → Whitelabel tab → color picker live-updates brand color; logo uploader replaces logo. Switch back to Monese: Monese brand unaffected.

- [ ] **Step 5: Commit.**

```bash
git add youtility.html
git commit -m "feat: port whitelabel editor with live color/logo updates"
```

---

## Phase 11 — Port user management

### Task 23: Port user management CSS + DOM + JS

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` (grep `userManagement`, `user-row`, `user-mgmt`)

- [ ] **Step 1: Locate surfaces.**

```bash
grep -nE "userManagement|user-mgmt|user-row|class=\"um-|renderUsers" stokes-ledbury-mvp.html | head -30
```

- [ ] **Step 2-5: Port CSS, DOM (Users tab inside client detail), render JS, role-edit handlers.**

- [ ] **Step 6: Smoke check.**

Multi-tenant test: client detail → Users tab → list renders from `USERS`. Role-change updates `USERS[id].role`. Add user / remove user (if Stokes had it).

- [ ] **Step 7: Commit.**

```bash
git add youtility.html
git commit -m "feat: port user management panel"
```

---

## Phase 12 — Port send/stop button improvements

The reviewer flagged Stokes had improved send/stop button state handling. Bring it over.

### Task 24: Port send/stop streaming state

**Files:**
- Modify: `youtility.html`
- Reference: `stokes-ledbury-mvp.html` (grep `sendBtn`, `stopBtn`, `isStreaming`, `setStreamingState`)

- [ ] **Step 1: Locate.**

```bash
grep -nE "sendBtn|stopBtn|isStreaming|setStreamingState" stokes-ledbury-mvp.html | head -20
grep -nE "sendBtn|stopBtn|isStreaming|setStreamingState" "Monese_1.1 flow.html" | head -20
```

Compare. Identify what's different.

- [ ] **Step 2: Port the Stokes improvements.**

If Stokes has `setStreamingState(bool)` that swaps icon, disables/enables input, and the Monese version is missing this, replace the Monese version with Stokes's.

If Monese has features Stokes doesn't (e.g. retry on error), preserve them — merge rather than overwrite.

- [ ] **Step 3: Smoke check.**

In Monese mode, send a chat message → button shows stop icon during simulated response, returns to send when done. Cancel mid-stream works (if supported).

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: adopt Stokes send/stop button state improvements"
```

---

## Phase 13 — Ensure Reports and Search are preserved & themable

The reviewer's "Reporting vs admin panels: do not reuse or overwrite reportView" concern. Validate that admin port didn't trample Monese features.

### Task 25: Audit Reports view CSS for brand-token compliance

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Find any remaining hardcoded blue/green inside `.report-*` rules.**

```bash
grep -nE "report-.*#[0-9a-f]{3,6}|report-.*rgb\(" youtility.html
```

For any matches that are brand-related (not utility colors like green-success / red-error), replace with `var(--brand-primary)` / etc.

- [ ] **Step 2: Same audit for chart helper output.**

Find `polyline`, `areaPath`, `gridLines`, `arcs`, `bars` in the JS chart helpers. Any `stroke="#0b72fd"` or `fill="rgba(11,114,253,…)"` baked into the SVG generation strings → swap to `getComputedStyle(document.documentElement).getPropertyValue('--brand-primary')` cached at render time, or use `stroke="currentColor"` and let CSS drive it via `.rc-*` classes.

- [ ] **Step 3: Smoke check.**

Open Reports view. Switch palette to `ledbury` via console: `applyBrandPalette('ledbury')`. Chart strokes and bars should turn green. Switch back to `monese`. Restored.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "refactor: brand-token compliance for reports view + chart helpers"
```

### Task 26: Verify Search modal scoping

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Find the data source for `openSearchModal`.**

```bash
grep -nE "openSearchModal|searchModalSelect|homeChats|SEARCH_DATA" youtility.html
```

- [ ] **Step 2: If Stokes's `SEARCH_DATA` was ported during admin/datasource phases, ensure search now reads from `getActiveClient().searchData || SEARCH_DATA[getActiveClient().id]` and falls back to Monese's existing `homeChats`.**

If `SEARCH_DATA` wasn't ported (it's tenant-aware data), wire the search modal to filter by `ACTIVE_CLIENT_ID` so it stays scoped to the current tenant.

- [ ] **Step 3: Smoke check.**

In Monese mode: open search modal (sidebar search button or Cmd+K), type a query, results appear from Monese's homeChats. Keyboard nav (up/down/enter/esc) works.

In multi-tenant test mode: search results scoped to active client.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "fix: scope search modal results to active client"
```

---

## Phase 14 — Per-brand font import & copy injection

### Task 27: Apply `fontImport` per client

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Remove the static font `@import` from the top of `<style>` (the one inherited from Monese).**

- [ ] **Step 2: Add a dynamic injector in the bootstrap script.**

```javascript
(function injectClientFonts(){
  const client = getActiveClient();
  if (!client.fontImport) return;
  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = client.fontImport;
  document.head.appendChild(linkEl);
})();
```

- [ ] **Step 3: Smoke check.**

Open Monese: Inter fonts load (headings still use Inter weights 600/700/800). Network tab shows the Google Fonts request including `Inter`.

Multi-tenant test (ledbury palette with Montserrat-only `fontImport`): only Montserrat loads.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: per-client font import (preserves Inter for Monese)"
```

### Task 28: Inject per-client copy strings

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Find Monese-specific copy that needs to become client-driven.**

```bash
grep -nE "Monese|monese\.com" youtility.html | grep -v "id=\|class=\|//\|/\\*"
```

Examples likely include: page `<title>`, header product name, footer attribution, welcome text in chat empty state.

- [ ] **Step 2: Replace each with a span/element that gets populated at runtime.**

Example, in the page title:
```html
<title>Youtility</title>
```
And on bootstrap:
```javascript
document.title = getActiveClient().copy.productName || 'Youtility';
```

For inline product name strings inside DOM, give them `class="product-name"` and:
```javascript
document.querySelectorAll('.product-name').forEach(el => el.textContent = getActiveClient().copy.productName);
```

- [ ] **Step 3: Smoke check.**

Monese: title shows "Monese", header shows "Monese". Multi-tenant test client: title and headers show that client's name.

- [ ] **Step 4: Commit.**

```bash
git add youtility.html
git commit -m "feat: drive product copy strings from client config"
```

---

## Phase 15 — Final regression and cleanup

### Task 29: Full regression matrix

**Files:**
- None modified (verification only)

- [ ] **Step 1: Run the matrix below. For each row, perform the action and confirm the expected outcome.**

| # | Mode | Action | Expected |
|---|---|---|---|
| 1 | Monese (default) | Open `youtility.html` | Blue brand, NO login screen, chat surface visible |
| 2 | Monese | Click sidebar "Reports" | reportView renders with KPIs, charts, insights — bars/arcs blue |
| 3 | Monese | Click sidebar search button | Search modal opens; type query; results filter; arrow keys move selection; Enter opens chat; Esc closes |
| 4 | Monese | Open campaign workspace | Campaign builder loads; create campaign flow works |
| 5 | Monese | Open audience explorer (if present in Monese) | Loads correctly |
| 6 | Monese | Theme toggle (if Monese has light/dark) | Both modes work; search modal box-shadow correct in light mode |
| 7 | Monese | Send chat message | Send icon → stop icon during stream → back to send |
| 8 | Monese | Open account modal | Shows demo user, sign-out hidden |
| 9 | Monese | Sidebar collapse (icon-mode) | Reports + search buttons hide/show per existing Monese behavior |
| 10 | Multi-tenant test client (temporarily added to CLIENTS, mode: multiTenant, admin: true, whitelabel: true, userManagement: true, palette: ledbury) | Open page | Login screen appears |
| 11 | Multi-tenant | Sign in | Login hides, chat shows green/warm-neutral brand |
| 12 | Multi-tenant | Open admin panel from sidebar | Client list renders |
| 13 | Multi-tenant | Click client row | Client detail panel opens |
| 14 | Multi-tenant | Switch to Datasource tab | Datasource list renders with status colors |
| 15 | Multi-tenant | Switch to Whitelabel tab | Color picker updates brand color live; logo upload works |
| 16 | Multi-tenant | Switch to Users tab | User list renders; role changes persist in `USERS` |
| 17 | Multi-tenant | Open Reports (if enabled for this client) | Renders with green brand color |
| 18 | Multi-tenant | Open Search modal | Results scoped to this client |
| 19 | Multi-tenant | Open account modal | Sign-out visible; click → returns to login |
| 20 | After revert to Monese | All Monese behaviors still work | Same as #1-9 |

If ANY row fails, file it in a `REGRESSIONS.md` and address before marking the plan complete.

- [ ] **Step 2: Capture browser console errors.**

Open dev tools console. Reload Monese mode. Reload multi-tenant test mode. Console must be free of errors (warnings about deprecated Google Fonts URLs are OK).

- [ ] **Step 3: Capture file size + line count for record.**

```bash
wc -l youtility.html
ls -lh youtility.html
```

Append to bottom of feature inventory.

- [ ] **Step 4: Remove the multi-tenant test client.**

If any temporary `CLIENTS` entry was added for testing in Task 13 / Phase 15, ensure it has been removed. `ACTIVE_CLIENT_ID = 'monese'`. Reload to confirm Monese loads cleanly.

- [ ] **Step 5: Commit.**

```bash
git add youtility.html docs/superpowers/plans/2026-05-17-feature-inventory.md
git commit -m "test: full regression matrix passes for Monese × Stokes merge"
```

### Task 30: Final cleanup pass

**Files:**
- Modify: `youtility.html`

- [ ] **Step 1: Search for any leftover Ledbury references.**

```bash
grep -nE "Ledbury|ledbury|Stokes|stokes" youtility.html
```

The ONLY allowed matches: the `ledbury` brand palette key, any genuine reference to a "Stokes" or "Ledbury" client name in a multi-tenant entry's `copy.productName`. Anything else (CSS class names, JS function names, inline copy) → genericize.

- [ ] **Step 2: Search for orphaned `--monese` references.**

```bash
grep -nE "monese|Monese" youtility.html | grep -v "'monese'\|\"monese\"\|productName.*Monese"
```

Same rule: only allowed inside the `monese` brand palette key or `CLIENTS[0]` config values.

- [ ] **Step 3: Verify no `console.log` debug leftovers.**

```bash
grep -n "console\.log\|debugger" youtility.html
```

Expected: 0 matches (or only legitimate logs that were there in the originals).

- [ ] **Step 4: Smoke check one more time.**

Open `youtility.html`. Monese mode. All features work.

- [ ] **Step 5: Commit.**

```bash
git add youtility.html
git commit -m "chore: final cleanup of brand-name leakage"
```

---

## Out of scope (explicit non-goals)

- **Modularization.** The reviewer's last point: split into `styles.css`, `core.js`, `features/*.js`, `config/monese.js`. Defer to a follow-up plan after merge stability is proven.
- **Playwright/automated tests.** No test runner exists in this repo. The smoke matrix is manual. Setting up a test framework is a separate effort.
- **Server-side persistence.** All `CLIENTS` / `USERS` mutations are in-memory and lost on reload. Stokes was the same; preserving that.
- **Build pipeline.** No bundler, no transpiler, no minifier. Single-file artifact.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A Stokes-only CSS rule conflicts with a Monese-only class (same selector, different intent) | Medium | Medium | Phase 1 inventory must list every selector in both files; cross-reference before pasting. Stokes uses `cd-*`, `acct-*`, `wl-*`, `admin-client-*` — all prefixed; unlikely to collide. |
| Stokes JS expects a global that Monese doesn't have (`SEARCH_DATA`, `DS_SOURCES` keyed by client) | High | Low-Medium | Each port task explicitly notes the dependent globals; introduce shims (e.g. `SEARCH_DATA[getActiveClient().id] \|\| []`). |
| Search modal's z-index (9999) collides with Stokes account dropdown or admin overlay | Low | Low | Audit z-indices in Task 26 / 29 row #18 / row #19. |
| Monese has subtle workspace behaviors not covered by feature inventory | Medium | Medium | Phase 1 forces enumeration of every `id=` and `function`. If something gets missed, regression matrix row #4-5 will catch it. |
| Inter font dropped from base CSS breaks Monese headings if dynamic injector races render | Low | Low | Inject font link synchronously at top of bootstrap, before first render. |
| Chart helpers hardcode color literals deep inside SVG template strings | Medium | Low | Task 25 explicitly audits chart-helper output. |
| `body.light-mode` styles from Monese conflict with Stokes light-mode toggle | Low | Low | Regression row #6. |
| singleTenant gates miss a surface and a Monese user sees admin nav | Low | Medium | Every `enabledFeatures.X` flag is checked at bootstrap and on view-switch. |

---

## Self-review

**1. Spec coverage check** — every reviewer recommendation accounted for:
- ✅ Use Monese as baseline → Phase 2.
- ✅ Four-layer architecture (shared core / client config / feature modules / role gating) → Phases 2/3/5-12/(gating throughout).
- ✅ Preserve every Monese-only feature → Phase 13 (audit), Phase 15 regression.
- ✅ Preserve every Stokes-only feature → Phases 5-12 port each.
- ✅ Freeze feature inventory before editing → Task 1.
- ✅ Extract shared core, normalize duplicates → implicit in baseline (Monese already IS the shared core for shared rules; we port Stokes additions selectively).
- ✅ Client config object → Tasks 6-9.
- ✅ Port Stokes features as isolated modules in order (login/account → admin → client detail → datasource → whitelabel → user management) → Phases 5-11.
- ✅ Unify duplicates → semantic tokens, one search system, one user/session, one router (Phases 2-14).
- ✅ Resolve conflict points → "Conflict points" table in Task 1 + Phase 13.
- ✅ Regression matrix → Task 29.
- ✅ Modularize last (out of scope here, called out explicitly).

**2. Placeholder scan** — no "TBD", "implement later", "etc." remain. Where Stokes source line numbers are imprecise, the plan tells the engineer to grep with specific patterns rather than guessing.

**3. Type consistency** — `CLIENTS` is an array throughout; `USERS` is an object keyed by id throughout; `BRAND_PALETTES` is an object keyed by palette name throughout; `applyBrandPalette(name)` and `applyColorToInterface(token, hex)` signatures consistent across Tasks 8, 10, 22.
