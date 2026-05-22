# MoneseVibeCode 1.1 → index2.html — Design Spec

> Companion to [`docs/superpowers/plans/2026-05-17-monese-stokes-integration.md`](../plans/2026-05-17-monese-stokes-integration.md). That plan produced `index.html`. This spec produces `index2.html` from a newer vibe-coded Monese source, applying the same merge discipline at a smaller scope.

## Goal

Produce `index2.html` by folding the new Monese vibe-coded source (`MoneseVibeCode_1.1.html`) into a unified single-file prototype that preserves the prior merge's strategic decisions (semantic brand tokens, client config scaffolding, auth surfaces) but ships only what is required for the **second user-flow** (`'connect'` / Connect data source) to play to completion. The new vibe code is treated as authoritative for Monese; the prior `index.html` survives unchanged as a parallel deployable.

## Architecture

Four conceptual layers, mirroring the prior integration plan but trimmed:

1. **Shared core** — `MoneseVibeCode_1.1.html` in full: chat shell, sidebar, three-step wizard (Mindset targeting / Campaign brief / Review content), audience explorer, vertical reports, search modal, vertical home screens with `VERTICAL_WELCOMES`, all 5 new constants (`DIM_STRATEGY`, `OFFER_FRAMING`, `PRODUCT_CTX`, `DIM_GUIDE`, `VERTICAL_WELCOMES`), all 24 new functions, the new Step 2 contextual header (landing card / targeting chips / profile insight / recommend card), psychographic `SEGS` with `cdataKey` aliasing, offer-pill scoring, stale-content detection. Ports **verbatim except for two classes of edits**: (a) semantic-token migration described in Conventions, and (b) integration points where grafted modules (auth, datasource) attach.
2. **Client config** — single-entry `CLIENTS` array and `USERS` object map (canonical shapes below); `getActiveClient()`, `getCurrentUser()`, `hasRole()` helpers. No Stokes or Ledbury entries. Single-tenant mode hides login, sign-out, and any multi-tenant gating affordances.

   Required `CLIENTS[0]` fields:
   ```js
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
   }
   ```
   `USERS` is an **object map keyed by user id** (not an array). Required entry shape:
   ```js
   { 'monese-demo': { id: 'monese-demo', name: 'Demo User', email: 'demo@monese.com', role: 'user', clientId: 'monese' } }
   ```
   Default `CURRENT_USER_ID = 'monese-demo'`. `hasRole(...roles)` returns `true` if the current user's role matches any argument. In `singleTenant` mode, role is informational only — no admin gates fire.
3. **Brand scaffolding** — semantic `--brand-primary` / `--brand-primary-hover` / `--brand-primary-rgb` CSS tokens, `BRAND_PALETTES.monese` (only entry), `WL_CSS_MAP`, `applyBrandPalette`, `applyColorToInterface`, `injectClientFonts`, `injectClientCopy`. `--brand-primary-rgb` MUST be **space-separated** (e.g. `--brand-primary-rgb: 11 114 253;`) so the `rgb(var(--brand-primary-rgb) / α)` CSS Color Level 4 syntax resolves correctly. Initial values: `--brand-primary: #0b72fd; --brand-primary-hover: #3892ff; --brand-primary-rgb: 11 114 253;`. Lets a future merge re-enable runtime theming or multi-tenant without re-architecting.
4. **Two ported feature modules** (from current `index.html`, which already cleaned and themed them in the prior merge):
   - **Login + account modal** — login screen hidden under `singleTenant`; account modal opens from sidebar `user-avatar-btn`, "Data sources" menu item visible, sign-out hidden. Account modal renders identity from `getCurrentUser()` (name + email + avatar initials derived from name).
   - **Datasource panel** — extracted clean from the current `clientDetailView` wrapper into its own standalone view (working name: `#dataSourcesView`). Includes `.ds-*` CSS, `DS_SOURCES`, `renderCdDataSources`, `selectDs`, `renderDsSettings`, `switchDsTab`, `renderDsTabBody`, `testDsConnection`.

   **Datasource view lifecycle:** when account modal "Data sources" is clicked → close the account modal → show `#dataSourcesView` as a top-level view (sibling to the chat/report views, hides the others). Initial state shows the source-list grid with no selection. Returning to the app: existing sidebar workspace clicks (`switchWs(...)`) hide `#dataSourcesView` like any other view. No dedicated back button; no special `nav-history` integration is required for this scope (nav-history already handles top-level view transitions generically).

## Tech stack

Vanilla HTML5, CSS3 (custom properties, no preprocessor), vanilla JS (no framework, no build step). Output is `index2.html` + two sibling JS files (`nav-history.js`, `user-flow.js`) — the HTML is self-contained for application code but loads the two existing helper scripts via `<script src>` tags, matching current `index.html`'s pattern. No test framework; every task ends with a manual browser smoke check.

## File structure

```
youtility-demo1/
├── index.html                       [unchanged — old merged demo, parallel deploy]
├── index2.html                      [NEW — single-tenant Monese, new vibe code merged]
├── MoneseVibeCode_1.1.html          [read-only source — baseline for index2]
├── Monese_1.1 flow.html             [read-only — historical Monese source]
├── stokes-ledbury-mvp.html          [read-only — historical Stokes source]
├── user-flow.js                     [unchanged — flow definitions live in index2.html bootstrap]
├── nav-history.js                   [unchanged]
├── src/index.js                     [Worker — unchanged]
└── docs/superpowers/specs/
    └── 2026-05-22-monesevibe-index2-design.md   [this file]
```

No Worker code changes. `wrangler.jsonc` already serves any project-root file via `env.ASSETS.fetch(request)` after auth (`assets.directory: "./"`, `run_worker_first: true`). `/index2.html` is gated by the same password as `/`.

## Conventions

- **Semantic CSS tokens.** Replace `--monese` / `--monese2` from MoneseVibeCode with `--brand-primary` / `--brand-primary-hover`. Replace literal `#0b72fd` / `#3892ff` / `rgba(11,114,253,…)` with `var(--brand-primary)` / `var(--brand-primary-hover)` / `rgb(var(--brand-primary-rgb) / α)`.
- **Single source of truth per concept.** One `CLIENTS[]` (one entry), one `USERS[]` (one entry), one `SEGS` (psychographic, from new vibe code), one `CDATA`, one chat seed, one search index, one theme system.
- **New vibe code wins on conflicts.** Where MoneseVibeCode_1.1's structure differs from the prior merge's Monese (e.g., demographic vs psychographic segments, 3-step vs prior wizard, vertical welcome cards), the new file's shape is authoritative.
- **`monese` is the only brand preset.** `BRAND_PALETTES` ships with only the `monese` entry. `WL_CSS_MAP` and `applyColorToInterface` are kept intact for forward compatibility.
- **Single-tenant mode gates UX appropriately.** Login screen begins with `class="hidden"`; account modal's sign-out gets `.hidden` at init; no admin nav, no client switcher, no whitelabel editor entry point.
- **Datasource panel is a peer view, not nested.** Reachable directly from account modal → "Data sources". No client header, no back-to-client-list nav, no surrounding tabs from `clientDetailView`.
- **External scripts.** `<script src="nav-history.js"></script>` and `<script src="user-flow.js"></script>` at end of `<body>`, then a `<script>` block that calls `UserFlow.play([flow2])` — flow 2 only.
- **Commit cadence.** Every task ends with a commit. Phases end with a manual smoke pass against the matrix in the final phase.

## Source landmarks (read once, refer often)

**MoneseVibeCode_1.1.html (3,848 lines — read-only baseline):**
- JS `IC` (icon set), `WS_META` (workspaces) — lines 1203–1207
- JS `STATUS_COL`, `CAMPS` — 1223–1224
- JS `WLBL` (wizard step labels) — 1295
- JS `SEGS` (8 psychographic dimensions with `cdataKey`) — 1297–1306
- JS `CDATA` (content templates keyed by old `loyal`/`lapsed`/`browse`/`new`) — 1307–1411
- JS `DIM_STRATEGY` (per-dimension postures) — 1729
- JS `OFFER_FRAMING` (multi-posture sentence templates) — 1800
- JS `PRODUCT_CTX` (catalog with dimension affinity) — 3403
- JS `DIM_GUIDE` (channel + tone per dimension) — 3427
- JS `VERTICAL_WELCOMES` (5 vertical welcome cards) — 3751
- JS `REPORTS` (vertical reports) — 3120
- JS chart helpers `buildChart` / `buildLineChart` / `buildBarChart` / `buildHBarChart` / `buildDonutChart` — 3299–3402
- DOM `#ws1` / `#ws2` / `#ws3` (wizard steps) — 1130–1165
- DOM `#discountPills` / `#discountPillsStep3` — 1151, 1168
- DOM `#startScreen` + `.start-pill` (including "Customers most likely to churn") — 992–1035
- DOM `#wizNext` — 1179
- New Step 2 surfaces (`#landingCard`, `#targetingChips`, `#profileInsightWrap`, `#recommendCard`) — inside `#ws2` block

**index.html (5,402 lines — read-only source for ported modules):**
- CSS `/* ── LOGIN SCREEN ── */` — line 33
- CSS `/* ── USER AVATAR ── */` — 611
- CSS `/* ── MODAL BASE ── */` — 630
- CSS `/* ── ACCOUNT MODAL ── */` — 641
- CSS `/* ── DATASOURCE ── */` — 696
- JS `const CLIENTS` — 1415
- JS `const USERS` — 1629
- JS `const DS_SOURCES`, `const DS_STATUS_COLORS` — 2171, 2180
- JS `const BRAND_PALETTES`, `WL_CSS_MAP`, `WL_CLIENT_DEFAULTS`, `WL_BRAND_PALETTES` — 2224–2353
- JS `function applyBrandPalette` / `applyColorToInterface` / `injectClientFonts` / `injectClientCopy` — 2596–2696
- JS `function signOut` / `doLogin` / `quickLogin` / `syncAvatarUI` — 2491–2589
- JS `function openClientDetail` (read to identify what wrapper to strip away from datasource view) — 4445
- JS `function renderCdDataSources` / `selectDs` / `renderDsSettings` / `switchDsTab` / `renderDsTabBody` / `testDsConnection` — 4661–4818
- JS user-flow bootstrap call — 5326

**user-flow.js (607 lines — flow player; unchanged):**
- Flow definitions are NOT in this file. They're passed via `UserFlow.play([...])` from the host HTML. `index2.html` will define its own flow-2 array.

## Implementation phases (high-level)

The detailed task list lives in the implementation plan (written next via `writing-plans` skill). Phases:

| Phase | Goal | Approx. tasks |
|---|---|---|
| **1. Baseline** | `cp MoneseVibeCode_1.1.html index2.html`; smoke check it loads standalone. | 1 |
| **2. Brand tokens** | Migrate `--monese` → `--brand-primary` semantic tokens; sweep blue literals; audit chart helpers for tokenized colors. | 3 |
| **3. Client + user config** | Add `CLIENTS`/`USERS`/`getActiveClient`/`getCurrentUser`; `BRAND_PALETTES`/`WL_CSS_MAP`; `applyBrandPalette`/`applyColorToInterface`/`injectClientFonts`/`injectClientCopy`. | 2 |
| **4. Login + account modal** | Port login screen DOM/CSS (hidden); port account modal DOM/CSS/JS; wire sidebar user-avatar trigger; gate sign-out under singleTenant. | 2 |
| **5. Datasource panel** | Extract `.ds-*` CSS + DOM + JS from current `clientDetailView` into standalone `#dataSourcesView`; wire account-modal "Data sources" menu item; verify `testDsConnection` works in isolation. Standalone is the goal — see "Datasource extraction policy" below for the escalation rule if the wrapper turns out to be load-bearing. | 3 |
| **6. user-flow.js wiring** | Inline the flow-2 step array (copied verbatim from `index.html`:5370-5396) into `index2.html`'s bootstrap; register only that one flow via `UserFlow.play([flow2])`; update the single `#cdpTabDatasource` selector to whatever final id Phase 5 lands on (`#dataSourcesView` if extracted clean, otherwise the wrapped id); manual smoke run end-to-end. | 1 |
| **7. Cleanup pass** | Section headers consistent; brand-name leakage sweep (`grep -n "monese\\|Monese"` for unintended matches); console.log audit; final visual diff against MoneseVibeCode_1.1 to confirm wizard/AE/reports/search/vertical-home are unbroken. | 1 |
| **8. Smoke matrix** | Run the regression matrix below. | 1 |

Total: ~14 tasks.

## Datasource extraction policy

Phase 5's stated goal is a clean standalone `#dataSourcesView`. That goal stands. If the first Phase-5 task (read the full `clientDetailView` block in `index.html` and produce a minimum-wrapper diff) reveals genuine entanglement — e.g., `.ds-*` rendering depends on a `.cd-*` ancestor for layout, or `selectDs` reads state set by `openClientDetail` — escalate before coding the workaround. The escalation is a one-message check-in with the user that includes the specific blocker (file + line) and the two options:

- **Stay standalone** — refactor the entangled bit (e.g., promote the layout rule from `.cd-* .ds-*` to a plain `.ds-*` selector; inline the missing state). More work, preserves smoke row 11's no-wrapper acceptance.
- **Wrap fallback** — keep `clientDetailView` as the host, hide its multi-tenant chrome (header / back nav / sibling tabs) under `singleTenant`. Smoke row 11 relaxes to "datasource panel renders and works" without the no-wrapper criterion.

The user picks. Spec captures both paths intentionally; this is deferred-by-design, not unresolved.

## Flow 2 step array (canonical)

The flow-2 step array `index2.html` registers is **verbatim from `index.html`:5370-5396**, with one substitution applied during Phase 6 based on Phase 5's outcome:

```js
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
      waitFor: "<DS_VIEW_SELECTOR>.visible",      // ← Phase 6 substitutes the final id
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
}
```

`<DS_VIEW_SELECTOR>` resolves to `#dataSourcesView` (standalone path) or `#cdpTabDatasource` (wrap-fallback path). All other selectors are stable across both outcomes because they're internal to the datasource panel itself.

## Smoke matrix (Phase 8 acceptance)

| # | Surface | Action | Expected |
|---|---|---|---|
| 1 | Page load | Open `index2.html` (via Worker, password-gated) | Loads with Monese blue brand, NO login screen visible, start screen renders |
| 2 | Wizard | Click "Marketing Spend" workspace → "Create" tab | 3-step wizard with labels: Mindset targeting / Campaign brief / Review content |
| 3 | Wizard Step 1 | Select two psychographic dimensions | `dimReachCard` updates; `dimInfoBanner` visible |
| 4 | Wizard Step 2 | Click Continue | New Step 2 contextual header renders (`landingCard`, `targetingChips`, `profileInsightWrap`, `recommendCard`) |
| 5 | Wizard Step 3 | Click Continue → Generate content | Offer pills render; campaign score card flashes PRIMARY/SECONDARY split |
| 6 | Offer pills | Toggle an offer | Score card re-renders; if content already generated, stale banner appears |
| 7 | Vertical home | Click a vertical pill from start screen | `VERTICAL_WELCOMES` welcome card renders with vertical-specific prompts |
| 8 | Reports | Navigate to a vertical's report | KPIs / charts render with Monese blue accents |
| 9 | Search | Sidebar search button or Cmd+K | Search modal opens; type query; results filter; keyboard nav works; Esc closes |
| 10 | Account modal | Click sidebar user avatar | Account modal opens; sign-out is hidden (singleTenant); "Data sources" menu item visible |
| 11a | Datasource flow (functional) | Click "Data sources" in account modal | Datasource panel opens and is fully interactive |
| 11b | Datasource flow (structural) | Inspect rendered datasource view | Standalone view, no client-detail header/back. **Relaxes to "renders without visible multi-tenant chrome" if Phase 5 escalation lands on the wrap-fallback path.** |
| 12 | DS detail | Click HubSpot card | Connection tabs render (Authentication / Field mapping / Sync schedule) |
| 13 | DS test | Click Test connection | Connected pill appears |
| 14 | user-flow dock | Page loads with flow dock visible | Dock picker shows only "Connect data source" (flow 2); flow 1 absent |
| 15 | user-flow playback | Run flow 2 in dock | Plays end-to-end with no missed selectors |
| 16 | Chat | Send a message from start screen | AI streams a response; stop bar works; copy/edit/vote actions work |
| 17 | Theme | Toggle theme | If `MoneseVibeCode_1.1.html` ships a theme toggle (verify in Phase 1 baseline check), both modes render correctly and the requirement is mandatory. If no toggle exists in the source, this row is dropped — note explicitly in the Phase 1 commit message either way. |
| 18 | Console | Reload, watch dev tools console | No errors (warnings about deprecated Google Fonts URLs acceptable) |
| 19 | Parallel route | Open `index.html` after `index2.html` | Old merged demo still loads, multi-tenant features intact |

**Blocking vs. logged-only rows:**

- **Blocking** (must pass to complete Phase 8): rows 1, 10, 11a, 11b, 12, 13, 14, 15, 18, 19. These cover the auth/datasource/flow-2 critical path and the parallel-route guarantee.
- **Logged-only** (failure files a regression note but does not block Phase 8): rows 2–9, 16, 17. These cover MoneseVibeCode-1.1 surfaces that the spec ports verbatim. If they're broken at port time, the source itself is broken and fixing it is out of scope unless the breakage blocks flow 2. The note goes into a `REGRESSIONS.md` for the user to triage.

This split resolves the tension Codex flagged between the smoke matrix's "any failure blocks" wording and the risk register's "fix only if blocking flow 2" stance on inherited vibe-code bugs.

## Out of scope (explicit non-goals)

- **Flow 1 (`'churn'`) playback.** Disregarded. The new wizard's psychographic structure differs enough that flow 1 needs a fresh re-authoring against the new surfaces. That work is deferred and may happen in a follow-up.
- **Multi-tenant in index2.** No Stokes, no Ledbury, no admin panel, no whitelabel editor, no client detail nav, no user management Users tab. Architecture supports re-enabling these later by adding `CLIENTS[]` entries and re-porting the views; this spec doesn't.
- **Per-segment campaign recommendations / segment-card phase transitions / morphing CT cards.** Post-merge polish from current `index.html` (`triggerPhaseBrief`, `triggerPhaseSelect`, `MORPH_MS`, `SEG_CARD_CAP`, `measureFinalHeights`, skeleton states, `reorderCtCards`, `pickRecCt`, `SEG_CAMPAIGN_REC`, `getMindsetsForSeg`). Saved for later reapplication if useful.
- **Test framework.** Manual smoke checks only.
- **Build pipeline.** Single-file artifact, no bundler.
- **Worker route changes.** `/index2.html` served via existing asset config; no `wrangler.jsonc` edit.
- **Sync mechanism between MoneseVibeCode source files and index2.** Future MoneseVibeCode_1.2 means redoing this exercise; that's accepted.

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Datasource panel won't extract cleanly from `clientDetailView` wrapper — shares CSS, state, or render flow with admin shell | Medium | Medium | Phase 5 task 1 produces a minimum-wrapper diff against `clientDetailView` in `index.html`. If entanglement is real, escalate per the "Datasource extraction policy" section above — user picks standalone-refactor vs. wrap-fallback. Do not silently fall back. |
| New vibe code reintroduces brand-name leakage (`var(--monese)`, hardcoded `#0b72fd`) that the prior merge cleaned | High | Low-Medium | Phase 2 grep sweeps cover this exhaustively; Phase 7 cleanup is a final pass. |
| Account modal in current `index.html` is wired to admin/multi-tenant logic (role-aware menu items, client-switcher panels) | Medium | Low-Medium | Phase 4 audits `renderClientAcctPanel`, `openAccountModal` for admin-mode branches; strip non-singleTenant code paths. |
| `init()` and `bindGlobalEvents()` from current `index.html` have hooks for dropped admin/wl/users surfaces that would error if referenced selectors are missing | Medium | Low | Phase 7 cleanup pass; tolerate the absence by guarding event wiring with `if (el)` rather than assuming selector presence. |
| Datasource panel CSS uses `.cd-*` selectors that depend on a `clientDetailView` ancestor | Low-Medium | Low | Phase 5 task 2 audits selectors; rewrites them to drop the `.cd-*` parent dependency if necessary. |
| Future MoneseVibeCode_1.2 needs the same re-merge; no automated sync | High | Medium | Accepted. Spec calls it out. A future improvement might be to maintain a patch file (e.g., `index2.patch`) capturing only the deltas grafted onto MoneseVibeCode, but that's a separate effort. |
| Flow 2's `#cdpTabDatasource` selector update breaks if naming choice changes mid-implementation | Low | Low | Phase 6 task explicitly updates the selector after Phase 5 settles on the final id. |
| MoneseVibeCode wizard has a subtle bug or inconsistency that prior merge had quietly fixed | Medium | Low | Accepted — this is a prototype. Smoke rows 2–9 / 16 are logged-only per the matrix split above; document the bug in `REGRESSIONS.md` and fix only if it blocks flow 2 (rows 10–15). |
| Merging ~24 new MoneseVibeCode functions with the auth/datasource functions from `index.html` produces duplicate globals, duplicate event bindings, or init-order conflicts | Medium | Medium | Phases 3–5 each include a "collision audit" step before commit: grep new file for the symbols being grafted in, and confirm no duplicate top-level declarations (`function X`, `const X`, `id="X"`). Phase 7 cleanup repeats the audit. Boot order is fixed: brand palette → font import → copy injection → session bootstrap → view show. |
| Account modal click handlers in `index.html` mutate state that no longer exists in index2 (e.g., `DETAIL_CLIENT_ID` for client-detail nav) | Low-Medium | Low | Phase 4 strips orphan state writes when porting the modal; cleanup pass verifies. |

## Self-review

**Spec coverage check** — every clarifying-question answer is reflected:

- ✅ "Drop Stokes/Ledbury entirely" → CLIENTS[] has Monese only; no Stokes/Ledbury data structures.
- ✅ "Update user-flow.js for new IDs/labels" → Phase 6 inlines flow 2 verbatim and substitutes the single `#cdpTabDatasource` selector; flow 1 disregarded (not retargeted, not registered).
- ✅ "Port everything the new vibe code does" → All 24 new functions, all 5 new constants, Step 2 contextual header, vertical home, offer pills, scoring, stale banners all ship.
- ✅ "Both coexist" → index.html untouched; `/index2.html` served via existing Worker assets binding.
- ✅ "Approach B + datasource" → auth + brand scaffolding retained; admin / whitelabel / user mgmt dropped; datasource panel kept because flow 2 requires it.
- ✅ "Decide at extraction time" → Datasource extraction policy section makes the standalone-vs-wrap-fallback decision explicit and escalation-gated; both outcomes have defined smoke-matrix semantics.
- ✅ "Flow 2 is the only acceptance constraint" → Smoke matrix split: rows 10–15 + 1 + 18 + 19 are blocking; rows 2–9 + 16 + 17 are logged-only.

**Codex review pass (2026-05-22):**

- ✅ Flow 2 step array now inlined verbatim — Phase 6 and smoke rows 14–15 are implementable as written.
- ✅ Datasource standalone vs. wrap-fallback is now deferred-by-design with explicit escalation, not silent.
- ✅ `CLIENTS[0]` and `USERS` shapes specified inline; `USERS` confirmed as object map (not array).
- ✅ `--brand-primary-rgb` space-separator requirement called out.
- ✅ "Verbatim" qualifier added to shared-core layer (verbatim except tokens + integration points).
- ✅ Tech-stack wording reconciled with external script dependencies.
- ✅ Theme row resolved to mandatory-or-dropped based on Phase 1 baseline check.
- ✅ Smoke matrix blocking/logged-only split resolves the "any failure blocks" vs. "only blocks if flow 2" tension.
- ✅ Collision-audit risk added with phase-level mitigation.
- ⚠️ Deferred to implementation plan, not the spec: per-source-failure behavior for `testDsConnection` (failure/in-progress/retry paths) and full psychographic-coverage validation for all 8 dimensions. These are runtime details that don't change the architecture.

**Placeholder scan** — no "TBD" or "implement later" remains.

**Internal consistency** — `#cdpTabDatasource` is the source id (in `index.html`); `#dataSourcesView` is the target id on the standalone path; flow 2's `<DS_VIEW_SELECTOR>` placeholder resolves to one of those two based on the Phase 5 extraction outcome. Naming choice is intentional and traceable.

**Ambiguity check** — "Port everything the new vibe code does" interpreted to include in-file animations baked into core functions (spinners in `writeCampaignContent`, flash on `renderCampaignScoreCard`, etc.). The exclusion is strictly the post-merge polish layered on top of current `index.html` (transitions like `triggerPhaseBrief`).

**Scope check** — one implementation plan, ~14 tasks. Self-contained. No decomposition needed.
