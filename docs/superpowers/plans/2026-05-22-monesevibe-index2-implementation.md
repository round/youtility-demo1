# MoneseVibeCode 1.1 → index2.html Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce `index2.html` by folding `MoneseVibeCode_1.1.html` (new Monese vibe-coded source) into a unified single-tenant prototype that grafts on the prior merge's brand/auth scaffolding plus a standalone datasource panel — sized so that user-flow #2 (`'connect'` / Connect data source) plays end-to-end. Flow #1 is disregarded. `index.html` stays intact as a parallel deployable.

**Architecture:** MoneseVibeCode_1.1.html is the baseline; semantic brand tokens replace its `--monese*` vars; a single-entry `CLIENTS[]`/`USERS[]` plus brand-palette infrastructure goes in; the login screen and account modal port verbatim from current `index.html` (gated for single-tenant); the datasource panel extracts cleanly from `clientDetailView` into a standalone `#dataSourcesView` reachable from the account modal's "Data sources" item; flow 2 is registered through `UserFlow.play([...])` in the bootstrap. No worker, no build step, no test framework — every task ends with a manual browser smoke check.

**Tech Stack:** Vanilla HTML/CSS/JS, single-file, served by the existing Cloudflare Worker; external sibling scripts `nav-history.js` and `user-flow.js`. No bundler, no preprocessor, no test framework — manual smoke checks per task.

**Spec:** `docs/superpowers/specs/2026-05-22-monesevibe-index2-design.md`

---

## File structure

```
youtility-demo1/
├── index.html                       [UNCHANGED — old merged demo, parallel deploy]
├── index2.html                      [NEW — the only file this plan writes/edits]
├── MoneseVibeCode_1.1.html          [read-only source — baseline for index2]
├── user-flow.js                     [UNCHANGED — flow definitions live in index2.html bootstrap]
├── nav-history.js                   [UNCHANGED]
├── src/index.js                     [Worker — UNCHANGED]
├── REGRESSIONS.md                   [created in Task 14 ONLY if a logged-only smoke row fails]
└── docs/superpowers/
    ├── plans/2026-05-22-monesevibe-index2-implementation.md   [this plan]
    └── specs/2026-05-22-monesevibe-index2-design.md            [the spec]
```

**Read-only sources** the plan grep/reads from (never edit these):
- `MoneseVibeCode_1.1.html` (3,848 lines) — the new vibe-coded baseline.
- `index.html` (5,402 lines) — source for the login/account-modal/datasource modules that were already cleaned and themed in the prior merge.

**The only file this plan writes or edits is `index2.html`.** Each task touches exactly that file (plus a one-time `REGRESSIONS.md` in Task 14 if needed).

---

## Conventions for every task

- **Smoke check before commit.** Open `index2.html` directly in a browser (double-click or `file://...` URL) after every code-changing step. The page should never break — if a smoke check fails, don't commit; fix it or revert.
- **Working dir.** All paths are relative to `/Users/maxim/Workspace/youtility-demo1/`.
- **Commits.** Conventional commit prefix (`refactor:`, `feat:`, `chore:`, `docs:`, `test:`). One commit per task. Use `git add index2.html` (not `git add -A`).
- **Grep before edit.** When porting ranges from source files, run the grep/wc command first to confirm line numbers haven't drifted; the line numbers in this plan are accurate as of 2026-05-22 but `index.html` is live and may shift.

---

## Phase 1 — Baseline

### Task 1: Create the working baseline file

**Files:**
- Create: `index2.html` (copy of `MoneseVibeCode_1.1.html`)

- [ ] **Step 1: Copy the source.**

Run:
```bash
cp MoneseVibeCode_1.1.html index2.html
```

- [ ] **Step 2: Smoke check the baseline renders.**

Open `index2.html` in a browser (drag the file in, or `open index2.html` on macOS). Verify:
- Page loads with no console errors.
- Sidebar visible on the left with sections.
- Main area shows the start screen with the prompt input + `.start-pill` buttons including "Customers most likely to churn".
- Click "Marketing Spend" workspace pill → enters the campaign workspace, you see the wizard.
- Back to "Home" via sidebar → start screen returns.

- [ ] **Step 3: Note theme-toggle presence in the commit message.**

Open the dev-tools console. Run:
```js
[!!document.getElementById('themeIconDark'), !!document.getElementById('themeIconLight'), document.body.classList.contains('light-mode')]
```

Expected: `[true, true, true]` — the theme toggle exists. Smoke row 17 is **mandatory** as confirmed by this check (record the result in the commit message).

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "chore: index2.html baseline from MoneseVibeCode_1.1.html

Theme toggle confirmed present (themeIconDark + themeIconLight + body.light-mode).
Smoke row 17 is mandatory per spec.
"
```

---

## Phase 2 — Semantic brand tokens

### Task 2: Add semantic brand tokens to `:root`

**Files:**
- Modify: `index2.html` — the `:root{…}` block near the top of `<style>`

- [ ] **Step 1: Locate the `:root` declaration and find the existing `--monese*` lines.**

```bash
grep -nE "^:root|--monese|--ledbury|--brand-primary" index2.html | head -10
```

You should see `--monese:#0b72fd;--monese2:#3892ff;` inside the `:root` block (around the top of `<style>`).

- [ ] **Step 2: Insert the semantic tokens alongside (do NOT delete `--monese` yet).**

In `index2.html`, find the `--monese:#0b72fd;--monese2:#3892ff;` substring inside `:root`. Immediately after it, on the same line or the next, insert:

```css
--brand-primary:#0b72fd;--brand-primary-hover:#3892ff;--brand-primary-rgb:11 114 253;
```

**Critical:** `--brand-primary-rgb` must be **space-separated** (no commas) so the `rgb(var(--brand-primary-rgb) / α)` CSS Color Level 4 syntax resolves correctly. Per spec.

- [ ] **Step 3: Smoke check that visual output is unchanged.**

Reload `index2.html` in the browser. Sidebar accent, message bubbles, start-pill borders — all unchanged (still Monese blue).

In dev-tools console:
```js
getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim()
```

Expected: `#0b72fd`.

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "refactor: add --brand-primary semantic tokens alongside --monese"
```

### Task 3: Migrate `var(--monese*)` references to semantic tokens

**Files:**
- Modify: `index2.html`

- [ ] **Step 1: Count current `var(--monese*)` usages.**

```bash
grep -cE "var\(--monese" index2.html
```

Record the count (call it N). Should be >0.

- [ ] **Step 2: Replace `var(--monese2)` first (more specific match goes first).**

In `index2.html`, **replace all** occurrences of the literal string `var(--monese2)` with `var(--brand-primary-hover)`.

- [ ] **Step 3: Replace `var(--monese)` next.**

In `index2.html`, **replace all** occurrences of the literal string `var(--monese)` with `var(--brand-primary)`.

- [ ] **Step 4: Confirm zero remaining.**

```bash
grep -cE "var\(--monese" index2.html
```

Expected: `0`.

- [ ] **Step 5: Smoke check.**

Reload `index2.html`. Walk: sidebar active state → click "Marketing Spend" → wizard steps → click "Customers most likely to churn" on start → AI response renders. All accents still Monese blue.

- [ ] **Step 6: Commit.**

```bash
git add index2.html
git commit -m "refactor: migrate var(--monese*) usages to --brand-primary*"
```

### Task 4: Replace hardcoded blue literals with brand tokens, then remove `--monese*` declarations

**Files:**
- Modify: `index2.html`

- [ ] **Step 1: Locate hex/rgba literals outside `:root`.**

```bash
grep -nE "#0b72fd|#3892ff|rgba\(11,?\s*114,?\s*253" index2.html
```

Note every line. Many will be inside JS template literals (SVG `stroke=`/`fill=` strings), some in inline `style=` attributes, some in inline scripts.

- [ ] **Step 2: Replace each match outside the `:root` block.**

For each match (excluding the `--brand-primary*` line itself in `:root`):

- `#0b72fd` → `var(--brand-primary)`
- `#3892ff` → `var(--brand-primary-hover)`
- `rgba(11,114,253,X)` → `rgb(var(--brand-primary-rgb) / X)` (for any α value X, including `.12`, `.22`, `.4`, etc.)

**Exception:** SVG attribute strings (e.g. `stroke="#0b72fd"` literally written inside `IC.bot` or chart helpers) — leave those for Step 3, where we audit them as a group.

- [ ] **Step 3: Audit chart helpers and IC icon strings for hardcoded literals.**

```bash
grep -nE "stroke=\"#0b72fd\"|fill=\"#0b72fd\"|stroke=\"rgba\(11" index2.html
```

For each: if the SVG is built dynamically (e.g. inside `buildChart`/`buildLineChart`/`buildBarChart`/`buildHBarChart`/`buildDonutChart`), refactor to take the color from a `getComputedStyle` lookup against `--brand-primary`. Example pattern for an SVG-helper top:

```js
function buildLineChart(data, color){
  // resolve color if a CSS variable token name was passed
  if (typeof color === 'string' && color.indexOf('var(') === 0) {
    color = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim() || '#0b72fd';
  }
  // ... rest unchanged
}
```

If the SVG is a static IC string (e.g., `IC.campaign` icon stroke), replace the literal with `currentColor` and let CSS drive it via `color: var(--brand-primary)` on the enclosing element.

- [ ] **Step 4: Remove the now-orphaned `--monese*` declarations from `:root`.**

In `index2.html`, find `--monese:#0b72fd;--monese2:#3892ff;` inside the `:root` block and delete that exact substring (keep the `--brand-primary*` declarations from Task 2).

- [ ] **Step 5: Verify final counts are zero.**

```bash
grep -cE "#0b72fd|#3892ff" index2.html
```

Expected: only the count inside the `--brand-primary*` values in `:root` (one occurrence each).

```bash
grep -cE "rgba\(11,?\s*114,?\s*253" index2.html
```

Expected: `0`.

```bash
grep -cE "--monese" index2.html
```

Expected: `0`.

- [ ] **Step 6: Smoke check that charts, sidebar, and message bubbles still render with Monese blue.**

Reload. Navigate: start screen → "Customers most likely to churn" → AI response → sidebar campaign list → Marketing Spend workspace → wizard step 1 → wizard step 2 → wizard step 3 → generate content. Inspect any chart/donut surfaces (in the wizard step-3 score card, in any reports view): bars/strokes should be Monese blue.

If any chart renders without color, revisit Step 3 — a chart helper likely still has a stale hex literal.

- [ ] **Step 7: Commit.**

```bash
git add index2.html
git commit -m "refactor: replace blue literals with brand-primary vars; drop --monese*"
```

---

## Phase 3 — Client + user config + brand scaffolding

### Task 5: Add `CLIENTS`, `USERS`, and session helpers

**Files:**
- Modify: `index2.html` — top of the main `<script>` block

- [ ] **Step 1: Locate the top of the main script.**

```bash
grep -nE "^<script>|^const IC=" index2.html | head -5
```

Find the first non-trivial `const` declaration in the main `<script>` (it's `const IC={...}` near line 1203 in MoneseVibeCode_1.1's numbering).

- [ ] **Step 2: Insert the `CLIENTS` + `USERS` + session helpers block immediately before `const IC=`.**

Insert the following code block in `index2.html`, with one blank line separating it from `const IC=` below:

```js
// ── CLIENT + USER CONFIG (grafted from index.html, trimmed for singleTenant Monese) ──
const CLIENTS = [
  {
    id: 'monese',
    name: 'Monese',
    mode: 'singleTenant',
    palette: 'monese',
    fontImport: 'https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&family=Montserrat:wght@300;400;500;600;700&display=swap',
    copy: { productName: 'Monese', tagline: '' },
    enabledFeatures: {
      reports: true, search: true, campaigns: true, audienceExplorer: true,
      admin: false, whitelabel: false, userManagement: false, dataSources: true,
    },
  },
];
let ACTIVE_CLIENT_ID = 'monese';
function getActiveClient(){ return CLIENTS.find(c => c.id === ACTIVE_CLIENT_ID) || CLIENTS[0]; }

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
function hasRole(...roles){ const u = getCurrentUser(); return !!(u && roles.includes(u.role)); }
function isAdminRole(role){ return role === 'admin' || role === 'super'; }

// Datasource panel re-uses the prior merge's getDetailClient() pattern; in
// single-tenant Monese, the "detail" client is always the active client.
function getDetailClient(){ return getActiveClient(); }
```

- [ ] **Step 3: Collision audit.**

```bash
grep -cE "^const CLIENTS|^let CLIENTS|^const USERS|^let USERS|^function getActiveClient|^function getCurrentUser|^function hasRole|^function isAdminRole|^function getDetailClient" index2.html
```

Expected: each appears exactly once (so the total = 9). If any > 1, you have a duplicate — find and resolve before continuing.

- [ ] **Step 4: Smoke check in console.**

Reload `index2.html`. In dev-tools console:

```js
getActiveClient().id           // 'monese'
getActiveClient().mode         // 'singleTenant'
getCurrentUser().email         // 'demo@monese.com'
hasRole('user')                // true
hasRole('admin')               // false
isAdminRole('admin')           // true
getDetailClient() === getActiveClient()  // true
```

All match expected.

- [ ] **Step 5: Commit.**

```bash
git add index2.html
git commit -m "feat: add CLIENTS/USERS registry and session helpers (Monese singleTenant)"
```

### Task 6: Add `BRAND_PALETTES`, `WL_CSS_MAP`, and apply helpers + bootstrap call

**Files:**
- Modify: `index2.html`
- Reference (read-only): `index.html` lines 2224–2353 (`BRAND_PALETTES`, `WL_CSS_MAP`, `WL_CLIENT_DEFAULTS`, `WL_BRAND_PALETTES`) and lines 2596–2696 (`applyBrandPalette`, `applyColorToInterface`, `injectClientFonts`, `injectClientCopy`).

- [ ] **Step 1: Read the source blocks from `index.html`.**

Open `index.html` and read:
- Lines 2220–2360 (covers BRAND_PALETTES + WL_CSS_MAP + WL_CLIENT_DEFAULTS + WL_BRAND_PALETTES).
- Lines 2590–2700 (covers applyBrandPalette + applyColorToInterface + injectClientFonts + injectClientCopy + restoreActiveTenantBranding + resolveBrandColor + shadeHex + hexToRgbTriplet + normalizeHex + makeMonoLogo + deriveUserInitials + deriveUserColor).

- [ ] **Step 2: Trim `BRAND_PALETTES` to only the `monese` preset.**

When you copy `BRAND_PALETTES` from `index.html`, the source has multiple entries (monese, stokes, ledbury, etc.). In your paste, keep ONLY the `monese:` entry. The shape:

```js
const BRAND_PALETTES = {
  monese: {
    // ...keep monese entry verbatim from index.html...
  },
};
```

Same trim for `WL_CLIENT_DEFAULTS` and `WL_BRAND_PALETTES` — keep only the `monese` keys.

- [ ] **Step 3: Insert the cleaned blocks into `index2.html`.**

Paste these blocks (in order) immediately AFTER the `getDetailClient` function from Task 5, BEFORE the `const IC=` line:

1. `const BRAND_PALETTES = { monese: {...} };`
2. `const WL_CSS_MAP = {...};`
3. `const WL_CLIENT_DEFAULTS = { monese: {...} };`
4. `const WL_BRAND_PALETTES = { monese: {...} };`
5. Utility functions: `normalizeHex`, `shadeHex`, `hexToRgbTriplet`, `resolveBrandColor`, `makeMonoLogo`, `deriveUserInitials`, `deriveUserColor`.
6. `function applyBrandPalette(name) { ... }`
7. `function restoreActiveTenantBranding() { ... }`
8. `function applyColorToInterface(token, hex) { ... }`
9. `function injectClientFonts(client) { ... }`
10. `function injectClientCopy() { ... }`
11. `function injectCampaignBriefCopy() { ... }` (if it exists in the source range — include it)

**Do NOT include** any function that references admin/whitelabel/userManagement DOM (e.g., `wireWlInputs`, `cdUpdateSwatch`, `cdPreviewLogo`, etc.) — those belong to the dropped multi-tenant UI.

- [ ] **Step 4: Wire the bootstrap calls in the correct order.**

Locate the `// INIT` block at the bottom of the main `<script>` in `index2.html` (lines ~3061 from the baseline):

```js
// INIT
document.body.classList.add('light-mode');
document.getElementById('themeIconDark').style.display = 'none';
document.getElementById('themeIconLight').style.display = '';
renderProds();
switchWs('home');
renderHomeList();
showStartScreen();
applyBreakpoint();
```

Insert the brand/session bootstrap BEFORE the existing `document.body.classList.add('light-mode');` line. The fixed boot order per spec is: brand palette → font import → copy injection → session bootstrap → existing init.

```js
// INIT — brand/session scaffolding first, then existing MoneseVibeCode init
(function bootstrapSession(){
  const client = getActiveClient();
  injectClientFonts(client);
  applyBrandPalette(client.palette);
  injectClientCopy();
  if (typeof injectCampaignBriefCopy === 'function') injectCampaignBriefCopy();
  // Login gate: singleTenant skips the login screen entirely. The login DOM
  // is added in Task 7 and ships hidden by default, so this is a no-op here
  // until then; structure is in place.
  if (client.mode !== 'singleTenant') {
    const loginEl = document.getElementById('loginScreen');
    if (loginEl) loginEl.classList.remove('hidden');
  }
})();
document.body.classList.add('light-mode');
// ... rest unchanged
```

- [ ] **Step 5: Collision audit.**

```bash
grep -cE "^const BRAND_PALETTES|^const WL_CSS_MAP|^function applyBrandPalette|^function applyColorToInterface|^function injectClientFonts|^function injectClientCopy" index2.html
```

Expected: 6 (one of each). If any > 1, you have a duplicate from the source paste — find and remove the older copy.

- [ ] **Step 6: Smoke check the palette infrastructure works.**

Reload `index2.html`. In dev-tools console:

```js
Object.keys(BRAND_PALETTES)                                       // ['monese']
applyColorToInterface('primary', '#ff00ff'); 'OK'                 // app accents turn magenta
applyBrandPalette('monese'); 'OK'                                 // accents restore to Monese blue
getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim()  // '#0b72fd'
```

If anything errors (e.g., `WL_CSS_MAP is not defined` inside `applyColorToInterface`), you missed pasting a required helper — re-check the source range.

- [ ] **Step 7: Commit.**

```bash
git add index2.html
git commit -m "feat: port BRAND_PALETTES + WL_CSS_MAP + apply helpers (monese-only)"
```

---

## Phase 4 — Login + account modal port

### Task 7: Port login screen DOM + CSS (hidden by default in singleTenant)

**Files:**
- Modify: `index2.html`
- Reference: `index.html` lines 33–59 (CSS), search `id="loginScreen"` for DOM start (typically a few hundred lines below the login CSS section).

- [ ] **Step 1: Locate login DOM in `index.html`.**

```bash
grep -n 'id="loginScreen"' index.html
```

Read from that line to the matching `</div>` end of the login-screen block.

- [ ] **Step 2: Read and copy the login CSS block.**

Open `index.html`, read lines 33 to ~59 (the entire `/* ── LOGIN SCREEN ── */` section, ending where the next CSS section begins, typically with `header{...}` at line 60).

Copy the full block. No edits needed — the CSS is already themed with `var(--brand-primary)` from the prior merge.

- [ ] **Step 3: Paste CSS into `index2.html`.**

Insert at the end of the `<style>` block in `index2.html`, immediately before `</style>`, under a fresh section header:

```css
/* ── LOGIN SCREEN (grafted from index.html for forward compatibility — hidden in singleTenant) ── */
/* ... pasted CSS ... */
```

- [ ] **Step 4: Read and copy the login DOM block.**

From the `id="loginScreen"` line in `index.html`, read the full DOM block (login-screen wrapper, login-card, login-logo, login-tagline, login-client-row, login fields, login-btn, login-users, login-footer). End at the matching `</div>` that closes the `login-screen` div.

- [ ] **Step 5: Genericize and gate the DOM.**

In the copied DOM:
- Any hardcoded "Stokes" / "Ledbury" / "Navier-Stokes" copy → replace with placeholders like `<span class="product-name"></span>` (will be populated by `injectClientCopy()`) or generic phrasing like "Sign in".
- The wrapper `<div class="login-screen" id="loginScreen">` MUST start with class `login-screen hidden` so it's invisible until `bootstrapSession()` chooses to unhide.

- [ ] **Step 6: Paste DOM into `index2.html`.**

Insert immediately after the `<body>` opening tag in `index2.html` (the login screen overlays the app).

- [ ] **Step 7: Port `doLogin`, `signIn`, `signOut`, `quickLogin`, `syncAvatarUI`.**

From `index.html` lines ~2491–2589, copy these functions verbatim. Paste into `index2.html` immediately after the `injectCampaignBriefCopy` function from Task 6.

For any function that branches on `getActiveClient().mode === 'multiTenant'` to do admin-only work, leave the branches in — they're dead code in single-tenant but harmless.

- [ ] **Step 8: Collision audit.**

```bash
grep -cE 'id="loginScreen"|^function doLogin|^function signIn|^function signOut|^function quickLogin|^function syncAvatarUI' index2.html
```

Expected: 6 (the DOM id + 5 functions, each exactly once).

- [ ] **Step 9: Smoke check.**

Reload `index2.html`. Verify:
- Login screen NOT visible (singleTenant).
- App renders normally as in Task 4.

In dev-tools console:
```js
document.getElementById('loginScreen').classList.contains('hidden')   // true
getActiveClient().mode                                                // 'singleTenant'
```

Temporary multi-tenant probe:
```js
CLIENTS[0].mode = 'multiTenant'; location.reload();
```
After reload: login screen IS visible. Then in console:
```js
CLIENTS[0].mode = 'singleTenant';   // EDIT THE SOURCE TOO — see below
```

Important: the console assignment doesn't persist across reload. Open `index2.html` in your editor and ensure `CLIENTS[0].mode` is back to `'singleTenant'` in source before continuing. Reload one more time to confirm login is hidden.

- [ ] **Step 10: Commit.**

```bash
git add index2.html
git commit -m "feat: port login screen DOM/CSS/JS (hidden in singleTenant Monese)"
```

### Task 8: Port account modal DOM + CSS + open/close JS; wire user-avatar trigger

**Files:**
- Modify: `index2.html`
- Reference: `index.html` lines 611–657 (USER AVATAR + MODAL BASE + ACCOUNT MODAL CSS), 5134–5241 (`renderClientAcctPanel` + `openAccountModal` + `closeAccountModal`), DOM `id="accountModal"` (grep for line number).

- [ ] **Step 1: Locate account-modal DOM and user-avatar DOM in `index.html`.**

```bash
grep -n 'id="accountModal"\|id="userAvatarBtn"\|class="sb-home"' index.html | head -10
```

Note the DOM line ranges.

- [ ] **Step 2: Read and copy CSS — three contiguous sections.**

From `index.html`:
- Lines 611–629 (USER AVATAR)
- Lines 630–640 (MODAL BASE)
- Lines 641–658 (ACCOUNT MODAL)

Combine into one block. Already themed — no edits.

- [ ] **Step 3: Paste CSS into `index2.html`.**

Insert at end of `<style>` block, before `</style>`, under three section headers:

```css
/* ── USER AVATAR (grafted from index.html) ── */
/* ... USER AVATAR rules ... */

/* ── MODAL BASE (grafted from index.html) ── */
/* ... MODAL BASE rules ... */

/* ── ACCOUNT MODAL (grafted from index.html) ── */
/* ... ACCOUNT MODAL rules ... */
```

- [ ] **Step 4: Read and copy account-modal DOM from `index.html`.**

Find `id="accountModal"` and copy the full DOM block (the modal wrapper, header with title, body container, footer). Keep `class="...hidden"` on the wrapper so it's invisible until opened.

- [ ] **Step 5: Paste account-modal DOM into `index2.html`.**

Insert immediately before `</body>` in `index2.html`.

- [ ] **Step 6: Add user-avatar button to the sidebar.**

In `index2.html`, locate the sidebar markup. Find a stable anchor: the `class="sb-home"` element (or whichever sidebar wrapper holds the bottom-of-sidebar items in the new vibe code). Add the user-avatar button so it lives at the bottom of the sidebar.

From `index.html`, copy the existing user-avatar button markup (grep `class="user-avatar-btn"` to locate). It looks like:

```html
<button class="user-avatar-btn" id="userAvatarBtn" onclick="openAccountModal()">
  <div class="user-avatar-circle" id="userAvatarCircle"></div>
</button>
```

Paste it into `index2.html`'s `sb-home` block at the bottom (after the existing sidebar items but before the closing `</div>` of `sb-home`).

- [ ] **Step 7: Port account-modal JS — but use the simplified renderer.**

From `index.html` lines 5134–5161 + 5219–5241, port these functions in order:

- `renderClientAcctPanel` (line 5134) — verbatim. This is the user-role panel, which is what `singleTenant` will use.
- `pinSwitchOpposite` (search for its definition) — copy verbatim. Returns `[]` when there's only one demo user, which is our single-tenant case.
- `openAccountModal` (line 5219) — verbatim.
- `closeAccountModal` (line 5239) — verbatim.

**Do NOT port** `renderAdminAcctPanel` or `renderClientAdminAcctPanel` — those are admin-mode-only and are not reachable in single-tenant. The `openAccountModal` branch `if (u.role === 'super')` / `else if (u.role === 'admin')` will simply not fire for our `'user'` role; the `else` branch hits `renderClientAcctPanel` which is what we want.

Insert these functions in `index2.html` immediately after `syncAvatarUI` from Task 7.

- [ ] **Step 8: Add a `getDemoUsers()` helper if not already present.**

`renderClientAcctPanel` references `getDemoUsers()` (line 5136). Locate it in `index.html` (around line 2483):

```js
function getDemoUsers(){
  return Object.values(USERS);
}
```

Port it into `index2.html` near `getCurrentUser` if not already there.

- [ ] **Step 9: Initialize the user-avatar circle on bootstrap.**

In `index2.html`'s `bootstrapSession()` from Task 6, add `syncAvatarUI();` as the LAST line (after the login-gate block):

```js
(function bootstrapSession(){
  const client = getActiveClient();
  injectClientFonts(client);
  applyBrandPalette(client.palette);
  injectClientCopy();
  if (typeof injectCampaignBriefCopy === 'function') injectCampaignBriefCopy();
  if (client.mode !== 'singleTenant') {
    const loginEl = document.getElementById('loginScreen');
    if (loginEl) loginEl.classList.remove('hidden');
  }
  if (typeof syncAvatarUI === 'function') syncAvatarUI();
})();
```

- [ ] **Step 10: Gate sign-out under singleTenant.**

The signout button is rendered by `renderClientAcctPanel` as `<button class="acct-signout" ...>`. Add a post-open hook to hide it in singleTenant mode. Modify `openAccountModal` so that AFTER the `bodyEl.innerHTML = ...` assignment and BEFORE the final `document.getElementById('accountModal').classList.remove('hidden');`, you add:

```js
if (getActiveClient().mode === 'singleTenant') {
  const so = bodyEl.querySelector('.acct-signout');
  if (so) so.style.display = 'none';
}
```

- [ ] **Step 11: Collision audit.**

```bash
grep -cE 'id="accountModal"|id="userAvatarBtn"|^function openAccountModal|^function closeAccountModal|^function renderClientAcctPanel|^function getDemoUsers' index2.html
```

Expected: 6 (one of each). Investigate any > 1.

- [ ] **Step 12: Smoke check.**

Reload `index2.html`. Verify:
- User avatar visible at bottom of sidebar (a circle, possibly with initials).
- Click avatar → account modal opens.
- Modal shows "Demo User · demo@monese.com" or similar identity from `renderClientAcctPanel`.
- The "Data sources" menu item is visible inside the modal body.
- The sign-out button is NOT visible.
- Click outside the modal or its close handler → modal closes.

If avatar isn't visible, double-check Step 6 (sidebar wiring) and Step 9 (`syncAvatarUI` called).

- [ ] **Step 13: Commit.**

```bash
git add index2.html
git commit -m "feat: port account modal + user-avatar trigger (sign-out hidden in singleTenant)"
```

---

## Phase 5 — Datasource panel (standalone)

### Task 9: Port datasource CSS + data + audit for `.cd-*` ancestor dependencies

**Files:**
- Modify: `index2.html`
- Reference: `index.html` lines 696–756 (`.ds-*` CSS), 2171–2185 (`DS_SOURCES`, `DS_STATUS_COLORS`), 4445–4488 (`openClientDetail` — read for entanglement audit only).

- [ ] **Step 1: Read the datasource CSS block.**

Open `index.html` and read lines 696–756 (the full `/* ── DATASOURCE ── */` section, ending where `/* ── WHITELABEL EDITOR ── */` begins at line 757).

- [ ] **Step 2: Audit CSS for `.cd-*` ancestor dependence.**

```bash
grep -nE "\.cd-[a-z]+.*\.ds-|\.cd-detail.*ds-|#client[Dd]etailView.*ds-" index.html | head -20
```

Expected: zero matches in the DATASOURCE CSS block (lines 696–756). All `.ds-*` rules in that block are root-scoped — no `.cd-*` ancestor is required.

The single exception is `.cd-ds-shortcut` (line 753) which IS prefixed `.cd-*` but is used INSIDE the client-detail overview tab as a shortcut button. We will NOT port that rule (out of scope; not used in standalone view). When copying the block, skip lines 753–756 (the four `.cd-ds-shortcut*` rules).

If your grep finds anything unexpected, **STOP and escalate per the Datasource extraction policy in the spec** before continuing — describe the entangled selector + line and ask the user to pick standalone-refactor vs. wrap-fallback.

- [ ] **Step 3: Paste CSS into `index2.html`.**

Insert at end of `<style>` block, before `</style>`, under a fresh section header:

```css
/* ── DATASOURCE PANEL (grafted from index.html; standalone, no client-detail wrapper) ── */
/* ... lines 696–752 from index.html, omitting the .cd-ds-shortcut* rules at 753–756 ... */
```

- [ ] **Step 4: Read and paste `DS_SOURCES` + `DS_STATUS_COLORS`.**

From `index.html`:
- Line 2171 (start of `const DS_SOURCES = [...]`) through its closing `];`.
- Line 2180 (`const DS_STATUS_COLORS = {...};`).

Paste both into `index2.html` immediately after the `WL_BRAND_PALETTES` block from Task 6. No edits needed.

Also add the global state vars these functions use (declared somewhere in `index.html` — grep `let dsSelected\|let dsConnTab`):

```js
let dsSelected = 'hubspot';
let dsConnTab  = 'connection';
```

Paste these immediately after `DS_STATUS_COLORS`.

- [ ] **Step 5: Audit `openClientDetail` for state dependencies the standalone view will need.**

Open `index.html` lines 4445–4480 and read carefully. The function sets `DETAIL_CLIENT_ID = client.id`, hides other views, populates header `cdpClientName`/`cdpClientSub`, shows `#clientDetailView`, sets back-button label, calls `switchCdTab(...)` which dispatches to `renderCdDataSources` for the datasource tab.

For our standalone view, we DON'T need: `DETAIL_CLIENT_ID` (we have `getDetailClient` shim), client-name header populating, back-button labels, or `switchCdTab` (only one tab). We DO need: hide other top-level views + show our view + call `renderCdDataSources(getActiveClient())`.

Confirm there's no hidden state-coupling: `renderCdDataSources` (line 4661) only reads `DS_SOURCES`, `DS_STATUS_COLORS`, `dsSelected`, and writes to `document.getElementById('cdpDatasourceList')`. ✓ No `.cd-*` ancestor needed.

- [ ] **Step 6: Smoke check (manual element injection).**

Reload `index2.html`. In dev-tools console:

```js
DS_SOURCES.length         // a positive number
DS_SOURCES.find(s => s.id === 'hubspot').name   // 'HubSpot'
DS_STATUS_COLORS.connected    // a hex / css color string
dsSelected                    // 'hubspot'
```

No DOM yet; rendering is in the next task. The CSS classes can be visually validated by injecting a probe:

```js
document.body.insertAdjacentHTML('beforeend','<div class="ds-grid"><div class="ds-card"><div class="ds-name">Probe</div></div></div>');
```

Confirm the probe element receives the styled layout (grid, card border, name text). Then remove it:

```js
document.body.removeChild(document.body.lastElementChild);
```

- [ ] **Step 7: Commit.**

```bash
git add index2.html
git commit -m "feat: port datasource CSS + DS_SOURCES data (entanglement audit clean)"
```

### Task 10: Port datasource render + JS functions; add standalone view DOM

**Files:**
- Modify: `index2.html`
- Reference: `index.html` lines 4661–4814 (datasource render functions).

- [ ] **Step 1: Port the six datasource functions verbatim.**

From `index.html` lines 4661–4814, copy these functions in order:

1. `function renderCdDataSources(client)` — line 4661
2. `function selectDs(id)` — line 4695
3. `function renderDsSettings(src)` — line 4700
4. `function switchDsTab(key)` — line 4731
5. `function renderDsTabBody(tab, src)` — line 4742
6. `function testDsConnection()` — line 4798

Paste them into `index2.html` immediately after the account-modal functions from Task 8.

These functions reference `getDetailClient()` (which our shim from Task 5 makes equivalent to `getActiveClient()`). No further edits needed at this step.

- [ ] **Step 2: Add the standalone view DOM.**

In `index2.html`, find the closing `</main>` or similar wrapper of the main app area. Add the standalone datasource view as a sibling to the existing top-level views (`#homeView`, `#campWs`, `#reportView`, `#csView`):

```html
<div id="dataSourcesView" class="hidden" style="display:none; flex-direction:column; padding: 24px 32px; overflow-y: auto; flex: 1;">
  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 18px;">
    <div>
      <div style="font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 4px;">Data sources</div>
      <div style="font-size: 12px; color: var(--text3);">Connect and manage external data flowing into Monese.</div>
    </div>
  </div>
  <div id="cdpDatasourceList"></div>
</div>
```

The `id="cdpDatasourceList"` MUST be preserved — `renderCdDataSources` from `index.html` writes into that exact id (line 4680).

- [ ] **Step 3: Add the `showDataSourcesView()` opener.**

Insert this function in `index2.html` immediately after `testDsConnection`:

```js
function showDataSourcesView(){
  // Hide all top-level views (mirrors the pattern in switchWs / openClientDetail)
  const hV = document.getElementById('homeView');    if (hV) hV.style.display = 'none';
  const cW = document.getElementById('campWs');      if (cW) cW.classList.remove('visible');
  const rV = document.getElementById('reportView');  if (rV) rV.style.display = 'none';
  const cS = document.getElementById('csView');      if (cS) cS.style.display = 'none';
  // Show our view
  const view = document.getElementById('dataSourcesView');
  if (view) {
    view.classList.remove('hidden');
    view.style.display = 'flex';
    view.classList.add('visible');
  }
  // Render datasource grid for the active (only) client
  if (typeof renderCdDataSources === 'function') renderCdDataSources(getActiveClient());
}
```

- [ ] **Step 4: Teach `switchWs` to hide `#dataSourcesView`.**

In `index2.html`, find `function switchWs(ws){` (around line 1209 in the baseline). Add one line inside the function, right after the existing `homeView` / `campWs` / `reportView` toggling, before the closing `}`:

```js
function switchWs(ws){
  currentWs=ws;
  const sbH=document.getElementById('sbHome');if(sbH) sbH.style.display=ws==='home'?'':'none';
  const sbC=document.getElementById('sbCampaign');if(sbC) sbC.classList.toggle('visible',ws==='campaign');
  const hV=document.getElementById('homeView');if(hV) hV.style.display=ws==='home'?'':'none';
  const cW=document.getElementById('campWs');if(cW) cW.classList.toggle('visible',ws==='campaign');
  const rV=document.getElementById('reportView');if(rV) rV.style.display=ws==='report'?'flex':'none';
  // NEW: hide standalone datasource view when navigating back to any other workspace
  const dsv=document.getElementById('dataSourcesView');if(dsv){dsv.classList.add('hidden');dsv.style.display='none';dsv.classList.remove('visible');}
  if(ws==='campaign'){renderCampSb();renderOverview();}
}
```

- [ ] **Step 5: Collision audit.**

```bash
grep -cE "^function renderCdDataSources|^function selectDs|^function renderDsSettings|^function switchDsTab|^function renderDsTabBody|^function testDsConnection|^function showDataSourcesView|id=\"dataSourcesView\"|id=\"cdpDatasourceList\"" index2.html
```

Expected: 9 (six DS functions + showDataSourcesView + two DOM ids, each exactly once).

- [ ] **Step 6: Smoke check the standalone view renders in isolation.**

Reload `index2.html`. In dev-tools console:

```js
showDataSourcesView();
```

The main area should switch to the datasource panel. You should see:
- "Data sources" title at top.
- A grid of source cards (Salesforce, HubSpot, etc. from `DS_SOURCES`).
- HubSpot card selected (`dsSelected = 'hubspot'`).
- Below the grid: the settings panel with tabs (Connection / Authentication / Field mapping / Sync schedule / Confirmation).
- Test connection button at bottom.

Click "Test connection". Expected: a toast "Testing connection…", then after ~1.4s another toast "Connection successful", and the panel re-renders showing HubSpot as connected (status dot color changes; confirmation tab updates).

Test workspace switching:
```js
switchWs('home');     // datasource view hides; home view returns
showDataSourcesView();  // re-opens
switchWs('campaign'); // datasource view hides; campaign workspace shown
```

If anything errors with `getDetailClient is not defined`, your Task 5 shim is missing — fix before continuing.

- [ ] **Step 7: Commit.**

```bash
git add index2.html
git commit -m "feat: add standalone #dataSourcesView; port renderCdDataSources et al"
```

### Task 11: Wire account-modal "Data sources" menu item to open standalone view

**Files:**
- Modify: `index2.html`

- [ ] **Step 1: Locate the "Data sources" menu item in `renderClientAcctPanel`.**

In `index2.html`, find the line inside `renderClientAcctPanel` (originally from `index.html`:5154) that reads:

```js
<div class="acct-menu-item" onclick="closeAccountModal(); if(typeof openClientDetail==='function') openClientDetail('${client.id}','datasource')"><svg ...><div class="acct-menu-label">Data sources</div></div>
```

- [ ] **Step 2: Replace the `onclick` to call `showDataSourcesView()` directly.**

Change that entire `<div class="acct-menu-item" onclick="...">` element so the onclick reads:

```js
onclick="closeAccountModal(); showDataSourcesView();"
```

In context, the new line should look like:

```js
<div class="acct-menu-item" onclick="closeAccountModal(); showDataSourcesView();"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></svg><div class="acct-menu-label">Data sources</div></div>
```

(Same SVG and label; only the `onclick` changes.)

- [ ] **Step 3: Smoke check the full account-modal → datasource flow.**

Reload `index2.html`. Click the sidebar user avatar → account modal opens → click the "Data sources" menu item → modal closes and the datasource panel appears. Click "Marketing Spend" in the sidebar to leave the datasource view → returns to campaign workspace.

Repeat the open/close a few times to confirm there's no stale state.

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "feat: wire account modal Data sources menu item → showDataSourcesView()"
```

---

## Phase 6 — user-flow.js wiring (flow 2 only)

### Task 12: Add nav-history.js + user-flow.js + flow-2 bootstrap

**Files:**
- Modify: `index2.html` — end of `<body>`

- [ ] **Step 1: Add the external script tags + bootstrap block.**

In `index2.html`, locate the `</body>` tag. Immediately before it, insert:

```html
<script src="nav-history.js"></script>
<script src="user-flow.js"></script>
<script>
  window.addEventListener('load', () => {
    UserFlow.play([
      {
        id: 'connect',
        name: 'Connect data source',
        steps: [
          { say: "Start at home", waitFor: "#startScreen" },
          { say: "Open the account menu",
            sel: ".sb-home .user-avatar-btn" },
          { say: "Open data sources",
            sel: "#accountModal .acct-menu-item", text: "Data sources" },
          { say: "Choose HubSpot CRM",
            waitFor: "#dataSourcesView.visible",
            sel: ".ds-card", text: "HubSpot" },
          { say: "Endpoint configuration",
            waitFor: ".ds-conn-tabs",
            do: "hover", sel: ".ds-conn-body .ds-field input", ms: 1400 },
          { say: "Configure authentication",
            sel: ".ds-conn-tab", text: "Authentication" },
          { say: "Map fields to behavioural attributes",
            sel: ".ds-conn-tab", text: "Field mapping" },
          { say: "Set the sync schedule",
            sel: ".ds-conn-tab", text: "Sync schedule" },
          { say: "Test the connection",
            sel: ".ds-test-btn" },
          { say: "Connected · first sync starting",
            waitFor: ".ds-pill.ok", ms: 1600 },
        ],
      },
    ]);
  });
</script>
```

This is the flow-2 array verbatim from `index.html`:5370-5396, with the single `<DS_VIEW_SELECTOR>` placeholder resolved to `#dataSourcesView` (per the standalone path taken in Phase 5).

**Note:** the array contains only `{ id: 'connect', ... }`. Flow 1 (`'churn'`) is NOT registered — disregarded by design per the spec.

- [ ] **Step 2: Confirm the standalone view actually exposes `.visible`.**

Reload `index2.html`. In dev-tools console:

```js
showDataSourcesView();
document.getElementById('dataSourcesView').classList.contains('visible')   // true
switchWs('home');
document.getElementById('dataSourcesView').classList.contains('visible')   // false
```

If either is wrong, revisit Task 10 Step 3 (the `showDataSourcesView` function should add `.visible`) and Step 4 (`switchWs` should remove `.visible`).

- [ ] **Step 3: Smoke check the flow dock + playback.**

Reload `index2.html`. Verify:
- A user-flow dock appears near the bottom of the page (rendered by `user-flow.js` in a shadow DOM).
- The dock's flow picker shows ONE entry: "Connect data source".
- Click the dock's play button → cursor moves to the user avatar → clicks → modal opens → cursor moves to "Data sources" → modal closes and datasource view opens → cursor walks through Authentication / Field mapping / Sync schedule tabs → clicks Test connection → after ~1.4s the connected pill appears and the dock advances to "Connected · first sync starting".

If any step gets stuck on a missing selector, dev-tools console will surface the error (`UserFlow could not resolve target ...`). Fix the offending selector in your flow array (or fix the underlying DOM if it's missing).

- [ ] **Step 4: Commit.**

```bash
git add index2.html
git commit -m "feat: wire nav-history.js + user-flow.js + register flow 2 only"
```

---

## Phase 7 — Cleanup pass

### Task 13: Final brand-leakage sweep, console-log audit, dead-DOM audit

**Files:**
- Modify: `index2.html` (only as cleanup edits)

- [ ] **Step 1: Brand-name leakage sweep.**

```bash
grep -nE "monese|Monese" index2.html | grep -vE "'monese'|\"monese\"|productName.*Monese|copy: \{.*Monese|monese-demo|@monese\.com|BRAND_PALETTES\.monese|WL_CLIENT_DEFAULTS\.monese|WL_BRAND_PALETTES\.monese|palette: 'monese'|CURRENT_USER_ID|getActiveClient|ACTIVE_CLIENT_ID" | head -20
```

Each remaining match should be in a legitimate context (e.g. inside a brand palette value, inside a config string, in `injectClientCopy` lookups). Anything that's an orphan reference (e.g. a CSS class or a comment that mentions Monese as if it's hardcoded) → genericize.

```bash
grep -nE "Ledbury|ledbury|Stokes|stokes" index2.html
```

Expected: zero matches.

- [ ] **Step 2: Console-log audit.**

```bash
grep -nE "console\.(log|warn|error|info|debug)|debugger" index2.html
```

Expected: zero (or only legitimate logs that were in MoneseVibeCode_1.1 originally — compare against the baseline). Any debug leftover from your porting work → delete.

- [ ] **Step 3: Dead-DOM audit — confirm dropped admin/whitelabel/user-mgmt surfaces did NOT sneak in.**

```bash
grep -nE 'id="adminView"|id="clientDetailView"|class="admin-client-|class="wl-|class="user-row|class="cd-header|class="cd-back|id="cdpTab(Whitelabel|Users|Overview)|id="cdt-(whitelabel|users|overview)|function renderAdminClients|function openClientDetail|function closeClientDetail|function cdBack|function switchCdTab|function renderCdOverview|function renderCdUsers|function cycleUserRole|function removeUser|function addUser|function renderCdWhiteLabel|function cdUpdateSwatch|function wireWlInputs|function cdPreviewLogo|function cdApplyLogoToHeader|function cdResetLogoInHeader|function cdPullBrandColors|function cdApplyRecColor|function cdApplyAllColors|function cdSaveWhiteLabel|function cdResetWhiteLabel' index2.html
```

Expected: zero matches. If any do appear, you accidentally pasted multi-tenant code — delete those occurrences (they're outside this plan's scope).

The only exception: if you find `renderAdminAcctPanel` or `renderClientAdminAcctPanel` (which were explicitly excluded in Task 8 Step 7 but might have crept in), delete them — they're dead code in single-tenant.

- [ ] **Step 4: Section-header consistency pass.**

```bash
grep -nE "^/\* ── [A-Z]" index2.html
```

You should see a sequence of `/* ── SECTION ── */` headers in CSS. Confirm each grafted section from Tasks 7, 8, 9 has a consistent header. The order doesn't matter; the consistency does.

- [ ] **Step 5: Visual diff against MoneseVibeCode_1.1.**

Open `MoneseVibeCode_1.1.html` and `index2.html` side-by-side in two browser windows. Walk these surfaces in both:

1. Start screen + pills
2. Click "Customers most likely to churn" → AI response
3. Sidebar "Marketing Spend" → campaign wizard
4. Wizard Step 1 (select 2 dimensions, watch reach card update)
5. Wizard Step 2 (landing card / targeting chips / profile insight / recommend card)
6. Wizard Step 3 (offer pills toggle, campaign score card flash, stale banner)
7. Click a vertical home pill (churn-transfer / accounts / travel / savings / credit / business) → vertical welcome card
8. Sidebar search button → search modal with keyboard nav
9. Theme toggle (top bar) → light/dark switch

For each surface, both files should be visually identical. If anything differs in `index2.html`, it's a regression from your porting — track down and fix. If something differs because the underlying source has a bug both files share, that's fine; log to `REGRESSIONS.md` in Task 14.

- [ ] **Step 6: Commit.**

If any code changed during this task, commit:

```bash
git add index2.html
git commit -m "chore: cleanup pass — brand-leakage / console-logs / dead-DOM audit"
```

If nothing changed (clean sweep), still record the audit result with an empty commit:

```bash
git commit --allow-empty -m "chore: phase 7 cleanup pass — no leakage found"
```

---

## Phase 8 — Smoke matrix

### Task 14: Run the full smoke matrix; log failures

**Files:**
- Possibly create: `REGRESSIONS.md` (only if any logged-only row fails)
- Modify: nothing else

- [ ] **Step 1: Run blocking smoke rows.**

These rows MUST pass to call this plan complete:

| # | Action | Expected | Pass? |
|---|---|---|---|
| 1 | Open `index2.html` via the Worker (`/index2.html`, password-gated) | Monese blue brand, NO login screen, start screen renders | ☐ |
| 10 | Click sidebar user avatar | Account modal opens; sign-out hidden; "Data sources" menu item visible | ☐ |
| 11a | Click "Data sources" in account modal | Datasource panel opens and is fully interactive | ☐ |
| 11b | Inspect rendered datasource view | Standalone view, no client-detail header/back | ☐ |
| 12 | Click HubSpot card | Connection tabs render (Authentication / Field mapping / Sync schedule) | ☐ |
| 13 | Click Test connection | Connected pill appears after ~1.4s | ☐ |
| 14 | Page loads with flow dock visible | Dock picker shows ONLY "Connect data source" (flow 1 absent) | ☐ |
| 15 | Run flow 2 in the dock | Plays end-to-end with no missed selectors | ☐ |
| 18 | Reload, watch dev-tools console | No errors (Google Fonts deprecation warnings OK) | ☐ |
| 19 | Open `/index.html` after `index2.html` | Old merged demo still loads, multi-tenant features intact | ☐ |

For row 1 / 19, the easiest way to test through the Worker is `wrangler dev` (or whatever local dev command the prior team uses) — or just open `file://...index2.html` directly if the Worker isn't running locally. If the password gate is the only thing blocking row 1, that's still a pass (the gate is the Worker, not index2.html).

- [ ] **Step 2: Run logged-only smoke rows.**

These rows are informational — failures don't block but DO get recorded in `REGRESSIONS.md`:

| # | Action | Expected | Pass / Note |
|---|---|---|---|
| 2 | Click "Marketing Spend" → "Create" tab | 3-step wizard with labels: Mindset targeting / Campaign brief / Review content | ☐ |
| 3 | Select two psychographic dimensions in Step 1 | `dimReachCard` updates; `dimInfoBanner` visible | ☐ |
| 4 | Continue to Step 2 | New Step 2 contextual header renders (`landingCard`, `targetingChips`, `profileInsightWrap`, `recommendCard`) | ☐ |
| 5 | Continue to Step 3 → Generate content | Offer pills render; campaign score card flashes PRIMARY/SECONDARY split | ☐ |
| 6 | Toggle an offer pill | Score card re-renders; if content already generated, stale banner appears | ☐ |
| 7 | Click a vertical pill from start screen | `VERTICAL_WELCOMES` welcome card renders with vertical-specific prompts | ☐ |
| 8 | Navigate to a vertical's report | KPIs / charts render with Monese blue accents | ☐ |
| 9 | Open search modal (sidebar search button or Cmd+K) | Modal opens; type query; results filter; keyboard nav works; Esc closes | ☐ |
| 16 | Send a message from start screen | AI streams a response; stop bar works; copy/edit/vote actions work | ☐ |
| 17 | Toggle theme (header button) | Both modes render correctly (mandatory per Task 1's confirmation) | ☐ |

- [ ] **Step 3: If any logged-only row failed, create `REGRESSIONS.md`.**

Only if needed. The file lives at repo root:

```markdown
# Regressions log — index2.html (MoneseVibeCode_1.1 port)

Smoke matrix rows that failed during Task 14 of `docs/superpowers/plans/2026-05-22-monesevibe-index2-implementation.md`. These are logged-only — they did not block plan completion per the spec, but should be triaged.

## YYYY-MM-DD

- **Row N — <surface>:** <what failed, what you saw, the smallest repro>.
- ...
```

If created, commit it:

```bash
git add REGRESSIONS.md
git commit -m "docs: log smoke-matrix regressions for index2.html"
```

- [ ] **Step 4: If any blocking row failed, do NOT mark complete.**

A blocking failure means the plan is not done. File the failure in `REGRESSIONS.md` under a separate "BLOCKING" heading, return to the relevant Phase, debug, fix, re-run the matrix from Step 1.

- [ ] **Step 5: Final commit signalling completion.**

If all blocking rows pass:

```bash
git commit --allow-empty -m "test: smoke matrix passes for index2.html — flow 2 plays end-to-end

Blocking rows (1, 10, 11a, 11b, 12, 13, 14, 15, 18, 19): all pass.
Logged-only rows: see REGRESSIONS.md (if any failed)."
```

---

## Out of scope (reminder)

Per the spec, this plan does NOT cover:

- Flow 1 (`'churn'`) playback — disregarded; the new wizard's psychographic structure needs a fresh re-authoring later.
- Multi-tenant in index2 (no Stokes/Ledbury, no admin panel, no whitelabel editor, no client-detail nav, no user management).
- Per-segment campaign recommendations or segment-card phase transitions or morphing CT cards from current `index.html`.
- Test framework.
- Build pipeline.
- Worker route changes.
- Sync mechanism between MoneseVibeCode source files and index2 (future MoneseVibeCode_1.2 means redoing this exercise).

---

## Self-review

**Spec coverage check** — every spec requirement maps to a task:

- ✅ Goal: produce `index2.html`, single-tenant Monese, flow 2 must play → all phases.
- ✅ Architecture layer 1 (shared core verbatim except token + integration edits) → Task 1 baseline + tokens migration in Phase 2.
- ✅ Architecture layer 2 (single-entry CLIENTS/USERS + helpers) → Task 5 with exact field shapes from spec.
- ✅ Architecture layer 3 (brand scaffolding, space-separated `--brand-primary-rgb`) → Tasks 2 + 6.
- ✅ Architecture layer 4: login + account modal → Tasks 7 + 8.
- ✅ Architecture layer 4: datasource panel as standalone view → Tasks 9–11.
- ✅ Datasource extraction policy escalation gate → Task 9 Step 2 explicit escalation language.
- ✅ Flow 2 step array verbatim with substituted selector → Task 12 Step 1 (with the `#dataSourcesView` substitution baked in since standalone is the goal; if Task 9 escalation lands on wrap-fallback, the substituted id changes accordingly).
- ✅ Convention: `monese` is the only `BRAND_PALETTES` preset → Task 6 Step 2.
- ✅ Convention: single-tenant mode gates UX (login hidden, sign-out hidden) → Tasks 7 (login `hidden`) and 8 (sign-out gating).
- ✅ Convention: datasource is a peer view, not nested → Task 10 Step 2 (standalone DOM).
- ✅ Convention: external scripts at end of body → Task 12 Step 1.
- ✅ Convention: commit cadence — every task ends with a commit.
- ✅ Collision-audit risk mitigation: Phases 3 / 5 each include a "collision audit" grep step (Tasks 5 Step 3, 6 Step 5, 7 Step 8, 8 Step 11, 10 Step 5, 13 Step 3).
- ✅ Boot order: brand palette → font import → copy injection → session bootstrap → existing init → Task 6 Step 4 + Task 8 Step 9.
- ✅ Smoke matrix blocking/logged-only split → Task 14 Steps 1 and 2.
- ✅ `REGRESSIONS.md` for logged-only failures → Task 14 Step 3.
- ✅ Worker stays unchanged → noted in file structure; no task touches `src/index.js` or `wrangler.jsonc`.
- ✅ Theme row mandatory or dropped per Phase 1 baseline check → Task 1 Step 3 records the verdict; Task 14 row 17 references it.

**Placeholder scan** — no "TBD", "implement later", "etc.", or "add appropriate handling" remain. Each step has either an exact command, an exact code block, or an exact source line range to read.

**Type / identifier consistency:**
- `getActiveClient`, `getCurrentUser`, `getDetailClient`, `hasRole`, `isAdminRole`, `getDemoUsers` referenced across Tasks 5 / 8 / 10 / 11 — all defined in Task 5 or imported from `index.html` in Task 8 with matching signatures.
- `DETAIL_CLIENT_ID` referenced in `openClientDetail` (read-only audit in Task 9 Step 5) — NOT used in `index2.html` since we don't port `openClientDetail`. `getDetailClient` shim removes the dependency.
- `dsSelected` / `dsConnTab` declared in Task 9 Step 4, read by functions ported in Task 10.
- `#cdpDatasourceList` (datasource render target) — created in Task 10 Step 2 with the exact id `renderCdDataSources` writes into.
- `#dataSourcesView` referenced by `showDataSourcesView` (Task 10), `switchWs` patch (Task 10), and flow 2 array (Task 12) — same id throughout.
- `BRAND_PALETTES`, `WL_CSS_MAP`, `WL_CLIENT_DEFAULTS`, `WL_BRAND_PALETTES` referenced in `applyBrandPalette` / `applyColorToInterface` — all four declared together in Task 6 Step 3.
- `applyBrandPalette`, `applyColorToInterface`, `injectClientFonts`, `injectClientCopy` — all defined in Task 6, called in Task 6 Step 4 bootstrap.
