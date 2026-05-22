# MoneseVibeCode 1.1 → index2.html — Design Spec

> Companion to [`docs/superpowers/plans/2026-05-17-monese-stokes-integration.md`](../plans/2026-05-17-monese-stokes-integration.md). That plan produced `index.html`. This spec produces `index2.html` from a newer vibe-coded Monese source, applying the same merge discipline at a smaller scope.

## Goal

Produce `index2.html` by folding the new Monese vibe-coded source (`MoneseVibeCode_1.1.html`) into a unified single-file prototype that preserves the prior merge's strategic decisions (semantic brand tokens, client config scaffolding, auth surfaces) but ships only what is required for the **second user-flow** (`'connect'` / Connect data source) to play to completion. The new vibe code is treated as authoritative for Monese; the prior `index.html` survives unchanged as a parallel deployable.

## Architecture

Four conceptual layers, mirroring the prior integration plan but trimmed:

1. **Shared core** — `MoneseVibeCode_1.1.html` in full: chat shell, sidebar, three-step wizard (Mindset targeting / Campaign brief / Review content), audience explorer, vertical reports, search modal, vertical home screens with `VERTICAL_WELCOMES`, all 5 new constants (`DIM_STRATEGY`, `OFFER_FRAMING`, `PRODUCT_CTX`, `DIM_GUIDE`, `VERTICAL_WELCOMES`), all 24 new functions, the new Step 2 contextual header (landing card / targeting chips / profile insight / recommend card), psychographic `SEGS` with `cdataKey` aliasing, offer-pill scoring, stale-content detection. Ports verbatim.
2. **Client config** — single-entry `CLIENTS = [{ id: 'monese', mode: 'singleTenant', ... }]` and `USERS = { 'monese-demo': {...} }`; `getActiveClient()`, `getCurrentUser()`, `hasRole()` helpers. No Stokes or Ledbury entries. Single-tenant mode hides login, sign-out, and any multi-tenant gating affordances.
3. **Brand scaffolding** — semantic `--brand-primary` / `--brand-primary-hover` / `--brand-primary-rgb` CSS tokens, `BRAND_PALETTES.monese` (only entry), `WL_CSS_MAP`, `applyBrandPalette`, `applyColorToInterface`, `injectClientFonts`, `injectClientCopy`. Lets a future merge re-enable runtime theming or multi-tenant without re-architecting.
4. **Two ported feature modules** (from current `index.html`, which already cleaned and themed them in the prior merge):
   - **Login + account modal** — login screen hidden under `singleTenant`; account modal opens from sidebar `user-avatar-btn`, "Data sources" menu item visible, sign-out hidden.
   - **Datasource panel** — extracted clean from the current `clientDetailView` wrapper into its own standalone view (working name: `#dataSourcesView`). Includes `.ds-*` CSS, `DS_SOURCES`, `renderCdDataSources`, `selectDs`, `renderDsSettings`, `switchDsTab`, `renderDsTabBody`, `testDsConnection`.

## Tech stack

Vanilla HTML5, CSS3 (custom properties, no preprocessor), vanilla JS (no framework, no build step). Output is a single self-contained `index2.html` served directly by the existing Cloudflare Worker. External scripts: `nav-history.js` and `user-flow.js` linked from `<script src>` tags as the current `index.html` does. No test framework; every task ends with a manual browser smoke check.

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
| **5. Datasource panel** | Extract `.ds-*` CSS + DOM + JS from current `clientDetailView` into standalone `#dataSourcesView`; wire account-modal "Data sources" menu item; verify `testDsConnection` works in isolation. | 3 |
| **6. user-flow.js wiring** | Register only flow 2 in bootstrap `UserFlow.play([...])`; update flow 2's `#cdpTabDatasource` selector to `#dataSourcesView`; manual smoke run end-to-end. | 1 |
| **7. Cleanup pass** | Section headers consistent; brand-name leakage sweep (`grep -n "monese\\|Monese"` for unintended matches); console.log audit; final visual diff against MoneseVibeCode_1.1 to confirm wizard/AE/reports/search/vertical-home are unbroken. | 1 |
| **8. Smoke matrix** | Run the regression matrix below. | 1 |

Total: ~14 tasks.

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
| 11 | Datasource flow | Click "Data sources" in account modal | Datasource panel opens (standalone view, no client-detail header/back) |
| 12 | DS detail | Click HubSpot card | Connection tabs render (Authentication / Field mapping / Sync schedule) |
| 13 | DS test | Click Test connection | Connected pill appears |
| 14 | user-flow dock | Page loads with flow dock visible | Dock picker shows only "Connect data source" (flow 2); flow 1 absent |
| 15 | user-flow playback | Run flow 2 in dock | Plays end-to-end with no missed selectors |
| 16 | Chat | Send a message from start screen | AI streams a response; stop bar works; copy/edit/vote actions work |
| 17 | Theme | Toggle theme (if MoneseVibeCode_1.1 supports it) | Both modes render correctly |
| 18 | Console | Reload, watch dev tools console | No errors (warnings about deprecated Google Fonts URLs acceptable) |
| 19 | Parallel route | Open `index.html` after `index2.html` | Old merged demo still loads, multi-tenant features intact |

Any row that fails files a regression item and blocks Phase 8 completion.

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
| Datasource panel won't extract cleanly from `clientDetailView` wrapper — shares CSS, state, or render flow with admin shell | Medium | Medium | Phase 5 task 1 is to read the full `clientDetailView` block in `index.html` and identify the minimum wrapper required for `.ds-*` rendering to work in isolation. If extraction is genuinely tangled, fall back to the alternative (keep wrapper, hide multi-tenant bits) and note as tech debt. |
| New vibe code reintroduces brand-name leakage (`var(--monese)`, hardcoded `#0b72fd`) that the prior merge cleaned | High | Low-Medium | Phase 2 grep sweeps cover this exhaustively; Phase 7 cleanup is a final pass. |
| Account modal in current `index.html` is wired to admin/multi-tenant logic (role-aware menu items, client-switcher panels) | Medium | Low-Medium | Phase 4 audits `renderClientAcctPanel`, `openAccountModal` for admin-mode branches; strip non-singleTenant code paths. |
| `init()` and `bindGlobalEvents()` from current `index.html` have hooks for dropped admin/wl/users surfaces that would error if referenced selectors are missing | Medium | Low | Phase 7 cleanup pass; tolerate the absence by guarding event wiring with `if (el)` rather than assuming selector presence. |
| Datasource panel CSS uses `.cd-*` selectors that depend on a `clientDetailView` ancestor | Low-Medium | Low | Phase 5 task 2 audits selectors; rewrites them to drop the `.cd-*` parent dependency if necessary. |
| Future MoneseVibeCode_1.2 needs the same re-merge; no automated sync | High | Medium | Accepted. Spec calls it out. A future improvement might be to maintain a patch file (e.g., `index2.patch`) capturing only the deltas grafted onto MoneseVibeCode, but that's a separate effort. |
| Flow 2's `#cdpTabDatasource` selector update breaks if naming choice changes mid-implementation | Low | Low | Phase 6 task explicitly updates the selector after Phase 5 settles on the final id. |
| MoneseVibeCode wizard has a subtle bug or inconsistency that prior merge had quietly fixed | Medium | Low | Accepted — this is a prototype. Document any new bugs encountered during Phase 8 smoke matrix; fix only if blocking flow 2. |

## Self-review

**Spec coverage check** — every clarifying-question answer is reflected:
- ✅ "Drop Stokes/Ledbury entirely" → CLIENTS[] has Monese only; no Stokes/Ledbury data structures.
- ✅ "Update user-flow.js for new IDs/labels" → Phase 6 updates `#cdpTabDatasource` selector; flow 1 disregarded actively (not retargeted, not registered).
- ✅ "Port everything the new vibe code does" → All 24 new functions, all 5 new constants, Step 2 contextual header, vertical home, offer pills, scoring, stale banners all ship.
- ✅ "Both coexist" → index.html untouched; `/index2.html` served via existing Worker assets binding.
- ✅ "Approach B + datasource" → auth + brand scaffolding retained; admin / whitelabel / user mgmt dropped; datasource panel kept (added back from B's drop list) because flow 2 requires it.
- ✅ "Extract datasource clean to standalone view" → Phase 5 task 1 strips client-detail wrapper; standalone `#dataSourcesView`.
- ✅ "Flow 2 is the only acceptance constraint" → Smoke matrix rows 10–15 explicitly cover the connect flow; flow 1 absent from dock per row 14.

**Placeholder scan** — no "TBD" or "implement later" remains. Phase 5's wrapper-extraction strategy has a documented fallback if extraction proves intractable.

**Internal consistency** — `#cdpTabDatasource` referenced as the current id in source landmarks (`index.html` Phase 5) and noted to be replaced with `#dataSourcesView` in Phase 6. Naming choice is intentional and traceable.

**Ambiguity check** — "Port everything the new vibe code does" interpreted to include in-file animations baked into core functions (spinners in `writeCampaignContent`, flash on `renderCampaignScoreCard`, etc.). The exclusion is strictly the post-merge polish layered on top of current `index.html` (transitions like `triggerPhaseBrief`).

**Scope check** — one implementation plan, ~14 tasks. Self-contained. No decomposition needed.
