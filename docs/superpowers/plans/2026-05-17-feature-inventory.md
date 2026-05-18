# Feature Inventory — Monese × Stokes

## Shared (appear in both files, identical or near-identical)

| Surface | Type | Notes |
|---|---|---|
| `sidebar` (`#sidebar`) | DOM/CSS | Base `<aside>` shell with three states: full / icon-rail / collapsed |
| `sbOverlay` (`#sbOverlay`) | DOM | Semi-transparent overlay for mobile sidebar; identical `onclick="closeSbOverlay()"` |
| `.sidebar.icon-mode` state | CSS | Icon rail at 52 px; hides text labels, shows tooltips; same rules in both |
| `.sidebar.collapsed` state | CSS | Zero-width hidden state; same rules |
| `projSwitcher` / `#projBtn` / `#projDrop` | DOM/CSS/JS | Project/segment selector dropdown — present in both (disabled/greyed in Stokes) |
| `wsSwitcher` / `#wsBtn` / `#wsDrop` | DOM/CSS/JS | Workspace switcher dropdown — active in Monese, disabled with COMING SOON tag in Stokes |
| `#themeBtn` / `toggleTheme()` | DOM+JS | Light/dark toggle button with sun/moon SVG icons; logic identical |
| `#sbHome` | DOM | Home section of sidebar |
| `#homeList` | DOM | Rendered list of chat history items |
| `#sbCampaign` | DOM | Campaign section of sidebar |
| `#gcCard` | DOM/CSS | Grand-campaign summary card at top of campaign sidebar section |
| `#campScroll` | DOM | Scrollable list of campaign items |
| `#mainArea` | DOM | Main content flex container |
| `#homeView` | DOM | Home workspace container |
| `#startScreen` | DOM | Start screen shown on fresh session |
| `#timeOfDay` | DOM | Injected greeting span ("afternoon" etc.) |
| `#startTa` | DOM | Start-screen textarea for first message |
| `#messages` | DOM | Chat message list container (hidden class toggled) |
| `#chatInputBar` | DOM | Bottom input bar with `#chatIn` textarea |
| `#chatIn` | DOM | Chat textarea element |
| `#stopBar` / `.stop-bar` | DOM/CSS | "STOP GENERATING" bar shown while streaming; appears above input bar |
| `.stop-btn` | CSS | Styled stop button inside `#stopBar` |
| `#campWs` | DOM | Campaign workspace container |
| `#cwt-report` / `#cwt-create` | DOM | Campaign workspace tabs (Overview / Create campaign) |
| `#cwp-report` / `#cwp-create` | DOM | Campaign workspace panels |
| `#sparkBars` / `#donutWrap` / `#campTable` | DOM | Overview panel chart containers |
| `#stepTrack` | DOM | Wizard step track |
| `#ws1` / `#ws2` / `#ws3` | DOM | Wizard step containers |
| `#promoPanel` / `#productPanel` / `#seriesPanel` | DOM | Campaign type sub-panels |
| `#discountPills` | DOM | Discount offer pill row |
| `#discPct` / `#minSpend` / `#offerScope` | DOM | Promo form fields |
| `#prodGrid` / `#prodSelCount` | DOM | Product selector grid and count |
| `#seriesName` / `#seriesDate` | DOM | Series form fields |
| `#campName` / `#campDate` / `#campMsg` | DOM | General campaign form fields |
| `#segContent` | DOM | Segment selector container |
| `#outputContent` | DOM | Generated content output container |
| `#outTabs` / `#outputSplit` / `#outputLeft` / `#outputRight` | DOM | Output split layout |
| `#wizNav` / `#wizInfo` / `#wizBack` / `#wizNext` | DOM | Wizard navigation bar |
| `#csView` | DOM | "Coming soon" placeholder view |
| `#ctxMenu` / `#ctxRename` / `#ctxDelete` | DOM | Right-click context menu for campaign items |
| `#sbTooltip` | DOM | Icon rail tooltip element |
| `#toast` | DOM | Toast notification element |
| `const IC` | JS | SVG icon map (bot, user, copy, retry, up, down, edit, chk, chat, del, pen) — identical |
| `const WS_META` | JS | Workspace metadata map (home, campaign, churn, engage, ltv) — near-identical; color differs for campaign entry |
| `const STATUS_COL` | JS | Campaign status colour map — active color differs (`#0b72fd` vs `#4a6741`) |
| `const CAMPS` | JS | Sample campaign data array |
| `const PRODUCTS` | JS | Sample product data array |
| `const WLBL` | JS | Wizard step labels array — identical |
| `const SEGS` | JS | Audience segment data array |
| `const CDATA` | JS | Per-segment, per-channel copy data |
| `const BP_FULL` / `const BP_ICON` | JS | Sidebar breakpoint constants (900 / 580) — identical |
| `const TOOLTIPS` | JS | Icon-rail tooltip definitions array |
| `newChat()` | JS | Creates new chat entry in homeChats, resets state, shows start screen, triggers rename |
| `renderCampSb()` | JS | Renders campaign sidebar list with status badges and action buttons |
| `selectType()` | JS | Handles campaign type card selection |
| `selDiscount()` / `selUrg()` | JS | Pill selection helpers |
| `filterProds()` / `renderProds()` / `toggleProd()` | JS | Product selector logic |
| `renderOverview()` | JS | Renders campaign overview (spark bars, donut, table); only color token differs |
| `switchCwTab()` | JS | Switches between Overview and Create tabs |
| `renderWizUI()` / `renderWizTrack()` | JS | Wizard step rendering |
| `wNext()` / `wBack()` / `exportCamp()` | JS | Wizard navigation |
| `renderSegs()` / `toggleSeg()` | JS | Segment selector rendering; only brand name string differs |
| `renderGenOverlay()` / `renderOutput()` | JS | Output generation and rendering |
| `swSeg()` / `swChan()` / `renderSplitContent()` | JS | Output split view tab switching |
| `buildPreview()` / `buildEmailPreview()` / `buildSmsPreview()` / `buildAdPreview()` | JS | Channel preview builders |
| `cpy()` / `editBlk()` | JS | Copy and inline-edit helpers for content blocks |
| `showStartScreen()` / `showChatView()` | JS | View switching helpers |
| `startPrompt()` / `isAudienceQuery()` | JS | Prompt handling; `isAudienceQuery` is simpler in Stokes (single phrase check) |
| `sendFromStart()` / `sendFromToolbar()` / `sendMsg()` | JS | Message sending entrypoints |
| `eh()` | JS | HTML-entity escaping helper — identical inline function |
| `renderMsgs()` | JS | Renders the full message list |
| `rAI()` / `rUser()` | JS | AI and user message renderers |
| `cpyMsg()` / `vote()` / `retryMsg()` / `editMsg()` / `saveEdit()` | JS | Message action handlers |
| `simAI()` | JS | Streaming simulation loop; differs only in brand string and stop mechanism |
| `stopGen()` | JS | Stops streaming; in Monese manipulates `#stopBar` directly, in Stokes calls `setSendBtnState` |
| `handleKey()` / `handleStartKey()` | JS | Keyboard submit handlers — identical |
| `autoResize()` / `autoResizeEl()` | JS | Textarea auto-resize helpers — identical |
| `buildAudienceExplorerHTML()` / `bootAudienceExplorer()` | JS | Audience explorer widget builder and boot; near-identical, color differs |
| `renderHomeList()` / `selectChat()` / `startChatRename()` / `deleteChat()` | JS | Chat list management |
| `openHomCtx()` / `openCtx()` / `closeCtx()` | JS | Context menu handlers |
| `toggleTheme()` | JS | Light/dark toggle — identical logic |
| `toggleProjDrop()` / `switchProj()` | JS | Project dropdown logic |
| `toggleWsDrop()` / `switchWs()` | JS | Workspace dropdown; `toggleWsDrop()` is a no-op stub in Monese |
| `setSbState()` / `toggleSb()` / `closeSbOverlay()` / `applyBreakpoint()` | JS | Sidebar state management — identical |
| `attachIconTooltips()` / `setTip()` / `onTipEnter()` / `onTipLeave()` / `detachIconTooltips()` | JS | Icon rail tooltip system — identical |
| `renderCS()` | JS | "Coming soon" view renderer; only brand string differs |
| `showToast()` | JS | Toast notification — identical implementation |
| `selectChatAndShow()` | JS | Helper to activate a chat and show start screen |
| `.sb-new` / `.sb-new-btn` | CSS | New conversation button row; in Monese also contains `.sb-search-btn`; in Stokes added as sibling via inline style |
| `.sb-search-btn` | CSS | Search trigger button; present in both (slightly different CSS rules) |
| `.sb-list` / `.sb-scroll` scrollbars | CSS | 3 px webkit scrollbar style — identical |
| `.messages` scrollbar | CSS | 4 px webkit scrollbar — identical |
| `.msg-bubble.streaming::after` | CSS | Blinking cursor animation during streaming — identical |
| `.gc-card` / `.camp-item` / `.ci-bar` / `.ci-body` / `.ci-badge` / `.ci-act` | CSS | Campaign list item components — identical rules |
| `.badge-active` / `.badge-done` / `.badge-sched` / `.badge-draft` | CSS | Campaign status badge colors — identical |
| `.msg-group` / `.msg-row` / `.msg-avatar` / `.msg-bubble` / `.msg-actions` / `.act-btn` | CSS | Chat message component styles — identical |
| `.seg-card` / `.seg-chk` / `.seg-name` / `.seg-tags` / `.sig-tag` | CSS | Segment selector card styles — identical |
| `.output-split` / `.output-left` / `.output-right` / `.c-block` / `.c-text` | CSS | Output split layout styles — identical |
| `.email-preview` / `.sms-preview` / `.ad-preview` | CSS | Channel preview styles — identical |
| `.step-track` / `.step-node` / `.step-circ` / `.step-lbl` / `.step-line` | CSS | Wizard step indicator — identical |
| `.wiz-btn` / `.wiz-nav` / `.wiz-info` | CSS | Wizard navigation bar — identical |
| `body.light-mode` overrides | CSS | Light mode variable overrides — near-identical; bg palette differs between files |
| `@media(max-width:580px)` breakpoint | CSS | Mobile sidebar collapse — identical rules |
| `@media(max-width:480px)` breakpoint | CSS | Client logo hide — identical |
| `#ae-widget` / `#ae-donut` / `#ae-slices` / `#ae-leg` / `#ae-vbadge` / `#ae-slbl` / `#ae-slist` / `#ae-pid` / `#ae-ppill` / `#ae-pconf` / `#ae-dims` / `#ae-mkt` | DOM | Audience Explorer widget internals — structurally identical, brand color differs |
| `.user-avatar-btn` / `.user-av` / `.user-av-body` / `.user-av-name` / `.user-av-role` | CSS | User avatar button in sidebar footer — identical rules |
| `#projSwitcher` / `#wsSwitcher` responsive icon-mode | CSS | Sidebar shrink rules — identical |
| `.client-logo` / `.client-logo-mark` | CSS | Client logo component in topbar — identical |
| `#ae-footer-seg` / `#ae-footer-ct` | DOM | Audience explorer footer targeting info — identical |
| `#themeIconDark` | DOM | Sun SVG icon inside `#themeBtn`; `toggleTheme()` swaps `display` with `#themeIconLight`. Monese:675, Stokes:811 |
| `#themeIconLight` | DOM | Moon SVG icon inside `#themeBtn`; `toggleTheme()` swaps `display` with `#themeIconDark`. Monese:676, Stokes:812 |
| `#ctGrid` | DOM | Campaign-type card grid container rendered by `selectType()`. Monese:932, Stokes:1093 |
| `#projIndicator` | DOM | Colored dot in project switcher; `switchProj()` updates `background` style. Monese:688, Stokes:824 |
| `#projNameEl` | DOM | Project name label in switcher header; `switchProj()` updates `textContent`. Monese:691, Stokes:827 |
| `bDonut`, `bLeg`, `selC`, `bSamps`, `selS`, `mkId`, `bDims`, `bMkt` (nested inside `bootAudienceExplorer`) | JS (nested fns) | AE widget internal helpers — port as a unit with `bootAudienceExplorer`. Monese:1580-1683, Stokes:1790-1893. Identical implementations in both files. |

---

## Monese-only (will be preserved as-is)

| Surface | Type | Source range | Dependencies |
|---|---|---|---|
| `#reportView` | DOM | Monese:1035 | `REPORTS`, `showVerticalReport()`, chart helpers |
| `/* PRODUCT VERTICAL REPORTS */` CSS section | CSS | Monese:149–178 | `--monese` (will become `--brand-primary` in Phase 2) |
| `.report-view` / `.report-hdr` / `.report-title` / `.report-subtitle` / `.report-narrative` | CSS | Monese:149–177 | Report DOM |
| `.report-kpi-grid` / `.report-kpi` / `.report-kpi-label` / `.report-kpi-value` / `.report-kpi-trend` | CSS | Monese:157–165 | Report DOM |
| `.report-chart-wrap` / `.report-chart-title` / `.report-insight` / `.report-insight-lbl` / `.report-insight-list` | CSS | Monese:166–177 | Report DOM |
| `.rc-axis-lbl` / `.rc-bar-lbl` / `.rc-grid-line` / `.rc-donut-lbl` | CSS | Monese:179–185 | SVG chart helpers |
| `/* SVG chart helpers */` section | CSS | Monese:178–186 | Used by `buildChart()` |
| `/* SEARCH CONVERSATIONS MODAL */` as overlay pattern | CSS | Monese:187–212 | Monese uses `search-modal-overlay` + `.open` class; Stokes replaced with `modal-overlay hidden` pattern |
| `.search-modal-overlay` / `.search-modal` | CSS | Monese:188–190 | Monese-specific overlay positioning (padding-top:88px, flex-start align) |
| `.search-modal-item.kbd-active` | CSS | Monese:200 | Keyboard navigation state |
| `.search-modal-foot` / `.search-modal-hint kbd` | CSS | Monese:204–207 | Footer with keyboard hints |
| `#searchModalOverlay` | DOM | Monese:2235 | `openSearchModal()`, `closeSearchModal()` |
| `#searchModalInput` | DOM | Monese:2239 | `filterSearchModal()` |
| `#searchModalLbl` / `#searchModalList` / `#searchModalCount` | DOM | Monese:2244–2248 | `renderSearchModal()` |
| `filterSearchModal()` | JS | Monese:1915 | Searches live `homeChats` array |
| `renderSearchModal()` | JS | Monese:1919 | Renders results from `homeChats`; includes keyboard `Escape` listener |
| `searchModalSelect()` | JS | Monese:1939 | Calls `selectChat()` on item click |
| `const REPORTS` | JS | Monese:1952 | All product-vertical report data (all, churn-transfer, accounts, travel, savings, credit, business) |
| `showVerticalReport()` | JS | Monese:2080 | Renders a vertical report into `#reportView` |
| `buildReportHTML()` | JS | Monese:2095 | Builds full report HTML including KPIs, chart, insights |
| `buildChart()` | JS | Monese:2131 | Dispatches to line/bar/hbar/donut chart builders |
| `buildLineChart()` | JS | Monese:2138 | SVG line chart renderer |
| `buildBarChart()` | JS | Monese:2167 | SVG vertical bar chart renderer |
| `buildHBarChart()` | JS | Monese:2188 | SVG horizontal bar chart renderer |
| `buildDonutChart()` | JS | Monese:2204 | SVG donut chart renderer |
| `body.dark-mode .client-logo-img` | CSS | Monese:648 | Brightness filter for dark mode logo (Monese has `<img>` logo; Stokes uses SVG monogram) |
| `@media(max-width:900px)` | CSS | Monese:182–185 | Wider search modal breakpoint — Stokes has no equivalent |
| `#stopBar` / `.stop-dot` animation | CSS | Monese:307–312 | Stop-generating bar with animated dot — present in both but Stokes replaces primary stop UI with `sendBtn` toggle |
| `injectAudienceExplorer(kind)` | JS | Monese:1408 | Accepts a `kind` parameter for different audience segmentation contexts |
| `widgetIntro` / `widgetKind` message properties | JS | Monese:1428 | Extended message object properties for AE widget |
| `isAudienceQuery(val)` multi-phrase version | JS | Monese:1401 | Matches multiple phrases; Stokes version only matches one exact phrase |
| `#proj-all` | DOM | Project switcher option — "All customers". Monese:696 | `switchProj('all', …)` |
| `#proj-churn-transfer` | DOM | Project switcher option — "Churn on transfer to Monese". Monese:703 | `switchProj` |
| `#proj-accounts` | DOM | Project switcher option — "Personal Accounts". Monese:710 | `switchProj` |
| `#proj-travel` | DOM | Project switcher option — "Travel and FX". Monese:717 | `switchProj` |
| `#proj-savings` | DOM | Project switcher option — "Savings and Budgeting". Monese:724 | `switchProj` |
| `#proj-credit` | DOM | Project switcher option — "Credit and Lending". Monese:731 | `switchProj` |
| `#proj-business` | DOM | Project switcher option — "Business". Monese:738 | `switchProj` |

---

## Stokes-only (will be ported)

| Surface | Type | Source range | Dependencies | Port order |
|---|---|---|---|---|
| Login screen | DOM+CSS+JS | Stokes:1205 (DOM), Stokes:620–648 (CSS) | `USERS`, `doLogin()`, `quickLogin()` | 1 |
| `.login-screen` / `.login-card` / `.login-logo` / `.login-field` / `.login-btn` | CSS | Stokes:620–648 | Login DOM | 1 |
| `.login-users` / `.login-user-row` / `.login-user-av` / `.login-user-name` / `.login-user-role` / `.login-footer` | CSS | Stokes:641–648 | Login DOM | 1 |
| `#loginScreen` | DOM | Stokes:1205 | `doLogin()`, `quickLogin()` | 1 |
| `#loginEmail` / `#loginPass` | DOM | Stokes:1215, 1219 | `doLogin()` | 1 |
| `doLogin()` | JS | Stokes:2374 | `USERS`, `quickLogin()` | 1 |
| `quickLogin(role)` | JS | Stokes:2381 | `USERS`, `updateAvatarUI()` | 2 |
| `updateAvatarUI()` | JS | Stokes:2389 | `currentUser`, `.user-av`, `.user-av-name`, `.user-av-role` DOM selectors | 2 |
| `signOut()` | JS | Stokes:2399 | `currentUser`, `#loginScreen` | 2 |
| `const USERS` | JS | Stokes:2368 | `currentUser` state, role-gated rendering | 3 |
| `let currentUser` | JS | Stokes:2372 | Referenced by all auth-aware functions | 3 |
| Account modal | DOM+CSS+JS | Stokes:1263 (DOM), Stokes:649–664 (CSS) | `currentUser`, `renderClientPanel()`, `renderAdminPanel()` | 3 |
| `.acct-user-card` / `.acct-av` / `.acct-name` / `.acct-role` / `.acct-badge` / `.badge-admin` / `.badge-super` | CSS | Stokes:649–656 | Account modal DOM | 3 |
| `.acct-section-lbl` / `.acct-menu-item` / `.acct-menu-label` / `.acct-divider` / `.acct-signout` | CSS | Stokes:657–664 | Account modal DOM | 3 |
| `#accountModal` / `#acctModalTitle` / `#acctModalBody` | DOM | Stokes:1263–1271 | `openAccountModal()`, `currentUser` | 3 |
| `openAccountModal()` | JS | Stokes:2440 | `currentUser`, `renderClientPanel()`, `renderAdminPanel()` | 3 |
| `closeAccountModal()` | JS | Stokes:2446 | `#accountModal` | 3 |
| `renderClientPanel()` | JS | Stokes:2448 | `currentUser`, `CLIENTS`, `openWhiteLabel()` | 3 |
| Modal base system | CSS | Stokes:596–606 | All modals (`searchModal`, `accountModal`, `wlModal`) | 3 |
| `.modal-overlay` / `.modal-box` / `.modal-hdr` / `.modal-title` / `.modal-close` / `.modal-body` | CSS | Stokes:597–606 | Shared by all three Stokes modals | 3 |
| Search modal (Stokes variant) | DOM+CSS+JS | Stokes:1244 (DOM), Stokes:608–619 (CSS) | `SEARCH_DATA`, `runSearch()`, `renderSearchResults()` | 4 |
| `/* ── SEARCH MODAL ──*/` section | CSS | Stokes:608–619 | Uses `.modal-overlay hidden` pattern vs Monese's custom overlay | 4 |
| `.search-modal-box` / `.search-input` / `.search-result` / `.search-result-title` / `.search-result-meta` / `.search-result-snippet` / `.search-empty` | CSS | Stokes:608–619 | Search modal DOM | 4 |
| `#searchModal` / `#searchInput` / `#searchResults` | DOM | Stokes:1244–1257 | `openSearchModal()`, `runSearch()` | 4 |
| `runSearch()` / `renderSearchResults()` | JS | Stokes:2421, 2424 | `SEARCH_DATA` — searches static array with title + snippet, not live `homeChats` | 4 |
| `const SEARCH_DATA` | JS | Stokes:2406 | Static searchable conversation history with snippets | 4 |
| Admin client list | DOM+CSS+JS | Stokes:666–674 (CSS), Stokes:2492 (JS renders into `#acctModalBody`) | `CLIENTS`, `currentUser.isAdmin`, `openClientDetail()` | 5 |
| `.admin-client-row` / `.admin-client-dot` / `.admin-client-name` / `.admin-client-status` / `.status-live` / `.status-setup` / `.admin-client-chevron` | CSS | Stokes:667–674 | Admin panel DOM | 5 |
| `renderAdminPanel()` | JS | Stokes:2492 | `CLIENTS`, `currentUser`, `openClientDetail()`, `quickLogin()`, `signOut()` | 5 |
| `const CLIENTS` | JS | Stokes:2484 | Array of 5 clients with name, color, status | 5 |
| Client detail panel | DOM+CSS+JS | Stokes:706–733 (CSS), Stokes:2127–2200 (JS renders into `#acctModalBody`) | `CLIENTS`, `renderCdOverview()`, `renderCdDataSources()`, `renderCdWhiteLabel()`, `renderCdUsers()` | 6 |
| `.client-detail` / `.client-detail-hdr` / `.client-detail-back` / `.client-detail-name` / `.client-detail-sub` | CSS | Stokes:707–712 | Client detail DOM | 6 |
| `.cd-tabs` / `.cd-tab` / `.cd-panel` | CSS | Stokes:716–721 | Client detail tab system | 6 |
| `.cd-kpi-row` / `.cd-kpi` / `.cd-kpi-lbl` / `.cd-kpi-val` / `.cd-kpi-sub` | CSS | Stokes:724–728 | Client overview KPI cards | 6 |
| `.cd-status-row` / `.cd-status-dot` / `.cd-status-label` / `.cd-status-val` | CSS | Stokes:729–732 | Client data-source status rows | 6 |
| `#cdt-overview` / `#cdt-datasources` / `#cdt-whitelabel` / `#cdt-users` | DOM | Stokes:2158–2161 | `switchCdTab()` | 6 |
| `#cdp-overview` / `#cdp-datasources` / `#cdp-whitelabel` / `#cdp-users` | DOM | Stokes:2163–2166 | `renderCdPanel()` | 6 |
| `openClientDetail()` | JS | Stokes:2127 | `CLIENTS`, `renderClientDetail()` | 6 |
| `backToAdminList()` | JS | Stokes:2138 | `renderAdminPanel()` | 6 |
| `renderClientDetail()` | JS | Stokes:2144 | `CLIENTS`, client detail tab HTML | 6 |
| `switchCdTab()` | JS | Stokes:2170 | `renderCdPanel()` | 6 |
| `renderCdPanel()` | JS | Stokes:2178 | Dispatches to Overview/DataSources/WhiteLabel/Users renderers | 6 |
| `renderCdOverview()` | JS | Stokes:2185 | `CLIENTS`, KPI and status row HTML | 6 |
| Datasource panel | DOM+CSS+JS | Stokes:735–766 (CSS), Stokes:2201–2315 (JS) | `DS_SOURCES`, `DS_STATUS_COLORS`, `renderDsSettings()`, `selectDs()` | 7 |
| `.ds-grid` / `.ds-card` / `.ds-card.selected` / `.ds-card.add-card` | CSS | Stokes:735–741 | Datasource grid | 7 |
| `.ds-status-dot` / `.ds-check` / `.ds-icon` / `.ds-name` / `.ds-type` / `.ds-add-label` | CSS | Stokes:741–746 | Datasource card internals | 7 |
| `.ds-settings` / `.ds-settings-hdr` / `.ds-settings-title` / `.ds-settings-name` / `.ds-settings-sub` | CSS | Stokes:749–752 | Datasource settings panel | 7 |
| `.ds-connected-badge` / `.ds-remove-btn` | CSS | Stokes:754–756 | Datasource status/action | 7 |
| `.ds-conn-tabs` / `.ds-conn-tab` / `.ds-conn-body` | CSS | Stokes:757–761 | Datasource detail tabs (credentials, field map, authentication) | 7 |
| `.ds-field` / `.ds-toggle-row` | CSS | Stokes:762–766 | Datasource form fields | 7 |
| `#dsTabBody` | DOM | Stokes:2257 | `renderDsTabBody()` | 7 |
| `const DS_SOURCES` | JS | Stokes:2114 | Array of datasource definitions (Klaviyo, Shopify, GA4, custom) | 7 |
| `const DS_STATUS_COLORS` | JS | Stokes:2123 | connected/error/idle colour map | 7 |
| `renderCdDataSources()` | JS | Stokes:2201 | `DS_SOURCES`, `DS_STATUS_COLORS`, `selectDs()` | 7 |
| `selectDs()` | JS | Stokes:2229 | `DS_SOURCES`, `renderDsSettings()` | 7 |
| `renderDsSettings()` | JS | Stokes:2234 | Renders settings panel for a selected datasource | 7 |
| `switchDsTab()` | JS | Stokes:2265 | Switches credentials/field-map/authentication tabs | 7 |
| `renderDsTabBody()` | JS | Stokes:2276 | Renders tab body HTML per datasource and tab key | 7 |
| `testDsConnection()` | JS | Stokes:2310 | Shows toast simulating connection test | 7 |
| White-label editor (modal) | DOM+CSS+JS | Stokes:676–701 (CSS), Stokes:1276–1334 (DOM modal), Stokes:2523–2714 (JS) | `WL_CSS_MAP`, `BRAND_PALETTES`, `applyColorToInterface()`, `currentUser` | 8 |
| `/* ── WHITE LABEL PANEL ── */` section | CSS | Stokes:676–701 | White-label modal and color editor | 8 |
| `.wl-section` / `.wl-lbl` / `.wl-logo-drop` / `.wl-logo-drop-text` / `.wl-logo-drop-sub` | CSS | Stokes:677–683 | WL modal sections | 8 |
| `.wl-input-row` / `.wl-input` / `.wl-url-btn` | CSS | Stokes:684–689 | URL pull field | 8 |
| `.wl-swatch-row` / `.wl-swatch` / `.wl-color-field` / `.wl-color-label` / `.wl-color-preview` / `.wl-color-hex` | CSS | Stokes:690–697 | Color editor fields | 8 |
| `.wl-recommend-row` / `.wl-rec-chip` / `.wl-rec-dot` / `.wl-save-btn` | CSS | Stokes:698–701 | Recommendation chips and save button | 8 |
| `#wlModal` / `#wlClientName` / `#wlLogoInput` / `#wlLogoPreview` / `#wlLogoImg` | DOM | Stokes:1276–1294 | `openWhiteLabel()`, `previewLogo()` |  8 |
| `#wlUrl` / `#wlPullBtn` / `#wlColorRecs` / `#wlRecRow` | DOM | Stokes:1300–1305 | `pullBrandColors()` | 8 |
| `#cprimary` / `#csecondary` / `#cbackground` / `#caccent` / `#wlinput-primary` / `#wlinput-secondary` / `#wlinput-background` / `#wlinput-accent` | DOM | Stokes:1312–1328 | `updateSwatch()`, `wireWlInputs()` | 8 |
| `openWhiteLabel()` | JS | Stokes:2523 | `closeAccountModal()`, `#wlClientName`, `wireWlInputs()` | 8 |
| `previewLogo()` | JS | Stokes:2560 | `applyLogoToHeader()` | 8 |
| `applyLogoToHeader()` | JS | Stokes:2573 | `.client-logo-mark` DOM | 8 |
| `pullBrandColors()` | JS | Stokes:2583 | `BRAND_PALETTES`, `#wlColorRecs`, `#wlRecRow` | 8 |
| `applyAllColors()` | JS | Stokes:2624 | `applyColorToInterface()` per token | 8 |
| `applyRecColor()` | JS | Stokes:2631 | `updateSwatch()`, `applyColorToInterface()` | 8 |
| `updateSwatch()` | JS | Stokes:2643 | `WL_CSS_MAP`, `applyColorToInterface()` | 8 |
| `applyColorToInterface()` | JS | Stokes:2650 | `WL_CSS_MAP`, `shadeHex()`, `document.documentElement.style.setProperty` | 8 |
| `shadeHex()` | JS | Stokes:2666 | Pure utility; no dependencies | 8 |
| `saveWhiteLabel()` | JS | Stokes:2676 | Shows toast, closes modal | 8 |
| `wireWlInputs()` | JS | Stokes:2689 | Binds `oninput` to all wlinput-* fields | 8 |
| `const WL_CSS_MAP` | JS | Stokes:2542 | Maps 4 semantic tokens to CSS variable names | (Phase 2) |
| `const BRAND_PALETTES` | JS | Stokes:2550 | 7 brand presets keyed by domain string | (Phase 2) |
| White-label panel inside client detail | DOM+JS | Stokes:2315–2345 | `renderCdWhiteLabel()`, `wireWlInputs()`, duplicate color inputs `#wlinput-*` | 8 |
| `renderCdWhiteLabel()` | JS | Stokes:2315 | Renders duplicate WL editor inside client detail panel; also calls `wireWlInputs()` | 8 |
| User management (client detail tab) | DOM+CSS+JS | Stokes:780–784 (CSS), Stokes:2348–2367 (JS) | `CLIENTS`, `renderCdUsers()` | 9 |
| `.user-row` / `.user-row-av` / `.user-row-name` / `.user-row-role` / `.user-row-badge` | CSS | Stokes:780–784 | User list rows in client detail | 9 |
| `renderCdUsers()` | JS | Stokes:2348 | Renders hardcoded user list for client; no backing data store | 9 |
| Send/stop button state (single-button toggle) | DOM+CSS+JS | Stokes:252–254 (CSS), Stokes:1001–1003 (DOM), Stokes:1684–1701 (JS) | `#sendBtn`, `#sendIcon`, `#stopIcon`, `streaming`, `setSendBtnState()`, `handleSendBtn()` | 10 |
| `.send-btn` / `.send-btn.stopping` | CSS | Stokes:252–253 | Send button; turns red with stop icon when streaming | 10 |
| `#sendBtn` / `#sendIcon` / `#stopIcon` | DOM | Stokes:1001–1003 | Single button; `sendIcon` hidden when streaming, `stopIcon` shown | 10 |
| `setSendBtnState(state)` | JS | Stokes:1684 | Toggles `.stopping` class, swaps `sendIcon`/`stopIcon` display | 10 |
| `handleSendBtn()` | JS | Stokes:1699 | Routes click to `stopGen()` or `sendMsg()` depending on `streaming` | 10 |
| `/* ── COMING SOON BADGE on disabled selectors ── */` | CSS | Stokes:703–704 | `.coming-soon-tag` badge for disabled proj/ws switchers | (note) |
| `.coming-soon-tag` | CSS | Stokes:704 | Absolute-positioned badge on disabled sidebar items | (note) |
| `#wsIconEl` | DOM | Workspace switcher icon element; `switchWs()` updates content. Stokes:859 | `switchWs()` | include in shared shell port |
| `#wsNameEl` | DOM | Workspace switcher name label; `switchWs()` updates `textContent`. Stokes:860 | `switchWs()` | include in shared shell port |
| `#ws-home` | DOM | Workspace switcher option — "Home". Stokes:865 | `switchWs('home', …)` | include in shared shell port |
| `#ws-campaign` | DOM | Workspace switcher option — "Campaign". Stokes:872 | `switchWs` | include in shared shell port |
| `#ws-churn` | DOM | Workspace switcher option — "Churn". Stokes:877 | `switchWs` | include in shared shell port |
| `#ws-engage` | DOM | Workspace switcher option — "Engage". Stokes:882 | `switchWs` | include in shared shell port |
| `#ws-ltv` | DOM | Workspace switcher option — "LTV". Stokes:887 | `switchWs` | include in shared shell port |
| `#proj-digital` | DOM | Project switcher option — "Digital Sales". Stokes:832 | `switchProj` | include in shared shell port |
| `#proj-retail` | DOM | Project switcher option — "Retail Sales". Stokes:839 | `switchProj` | include in shared shell port |
| `#ae-cct` | DOM | AE donut center count `<text>` element; `bDonut()` updates content. Stokes:1729 | `bDonut()` | include in shared shell port |
| `#ae-clbl` | DOM | AE donut center label `<text>` element; `bDonut()` updates content. Stokes:1728 | `bDonut()` | include in shared shell port |
| `#cdLogoInput` | DOM | Client-detail whitelabel file input (duplicate of `#wlLogoInput`). Stokes:2323 | `previewLogo()` | include in shared shell port |

---

## Conflict points (require explicit resolution)

| Concept | Monese version | Stokes version | Resolution |
|---|---|---|---|
| Brand colors | `--monese:#0b72fd` / `--monese2:#3892ff` hardcoded throughout | `--ledbury:#4a6741` / `--ledbury2:#6a8f60`; runtime-swappable via `WL_CSS_MAP` + `applyColorToInterface()` | Introduce semantic `--brand-primary` / `--brand-secondary`; map Monese blue as default preset; `WL_CSS_MAP` maps semantic tokens |
| Search modal implementation | Custom full-screen `search-modal-overlay` with `.open` class; keyboard navigation (arrow keys, `.kbd-active`); searches live `homeChats`; `Escape` listener; footer with `<kbd>` hints | Generic `.modal-overlay hidden` pattern; simpler `#searchModal` structure; searches static `SEARCH_DATA` with snippets; no keyboard arrow navigation | Keep Monese's richer implementation and overlay pattern; migrate `SEARCH_DATA` to be populated from active client's `homeChats`; add snippet display from Stokes |
| Sidebar new-button row | `.sb-new` contains both `.sb-new-btn` AND `.sb-search-btn` side by side; responsive icon-mode hides search button | `.sb-new` has only `.sb-new-btn`; `.sb-search-btn` added via inline `style="display:flex;gap:6px;"` as sibling | Keep Monese version (cleaner, explicit class for search btn hide in icon-mode) |
| Reporting | `reportView` DOM element at Monese:1035; full `REPORTS` const with 7 verticals; 4 chart builders; routed via `switchWs('report')` | Absent — no `reportView`, no `REPORTS`, no chart builders | Preserve Monese reporting untouched; add guard in `switchWs` so admin view cannot overwrite `reportView` container |
| Copy strings / brand names | Hardcoded "Monese" in segment intros, `renderCS()` messages, audience explorer widget, chat placeholder | Hardcoded "Ledbury" everywhere | Move to per-client config object (e.g. `client.displayName`); driven by `currentUser.client` in multi-tenant mode |
| Session / login gate | No login screen; direct access; user avatar is purely decorative (calls `showToast('Account settings')`) | Login screen gates everything (z-index 500); `currentUser` null check in `openAccountModal()`; `signOut()` reverts to login screen | Introduce `config.mode`; `singleTenant` bypasses login and sets a default `currentUser`; `multiTenant` shows login; Monese ships as `singleTenant` |
| Font stack | Inter (600, 700, 800) + Montserrat (300–700) both imported | Montserrat only (300–700); no Inter import | Move to per-brand `fontImport` config field; Monese preset includes Inter; other clients default to Montserrat only |
| Initial theme | Starts dark; `toggleTheme()` adds `light-mode` class; `light-mode` search modal has blue-tinted shadow | Starts light (`document.body.classList.add('light-mode')` on init line 2712); no dark-mode-specific rules for modals | Decide on canonical default; Stokes starts light because its color palette is light-first (cream background `#f4f2ee`); Monese is dark-first; add per-brand `defaultTheme` config field |
| Light-mode background palette | Light mode: `--bg:#ffffff; --bg2:#f7f9fc; --bg3:#f1f4f9; --bg4:#e9eef5; --bg5:#dde4ee` (blue-grey tones) | Light mode: `--bg:#f4f2ee; --bg2:#ebe9e4; --bg3:#e2e0da; --bg4:#d8d5cf; --bg5:#ccc9c2` (warm earth tones) | Per-brand background palette; semantic tokens `--bg` through `--bg5` must be included in `WL_CSS_MAP` / brand preset |
| `isAudienceQuery()` trigger phrase set | Matches multiple audience-intent phrases (broader regex) | Matches exactly one phrase: `"who is my best customer"` | Merge to use Monese's broader detection; Stokes simplification was regressive |
| Audience Explorer widget color | `#ae-create-btn` uses `#0b72fd` hardcoded; `#ae-vbadge` and `#ae-ppill` borders also `#0b72fd` | `#ae-create-btn` uses `#4a6741` hardcoded | Replace hardcoded hex in AE widget with `var(--brand-primary)`; requires Phase 2 token introduction |
| `injectAudienceExplorer` signature | Accepts `kind` parameter; passes `widgetIntro` and `widgetKind` to message object | No `kind` parameter; no `widgetIntro`/`widgetKind` properties | Keep Monese extended signature |
| Stop-generation UX | Separate `#stopBar` element above input bar; send button is always a send button | Single `#sendBtn` toggles between send (arrow) and stop (square) icons; `#stopBar` still present but `setSendBtnState` is the primary mechanism; `stopGen()` also calls `setSendBtnState('send')` | Port Stokes single-button pattern (cleaner UX); deprecate `#stopBar` visibility toggle in favour of `setSendBtnState`; keep `#stopBar` as fallback for start-screen context |
| Account avatar click action | `onclick="showToast('Account settings')"` — purely decorative | `onclick="openAccountModal()"` — opens role-aware modal | Use Stokes behaviour; in `singleTenant` mode the modal shows the simplified client panel only |

---

## File metrics

| Metric | Monese | Stokes |
|---|---|---|
| Total lines | 2253 | 2729 |
| Byte size | 185,240 bytes (181K) | 201,449 bytes (197K) |
| `function ` declarations | 100 | 127 |
| `id="…"` attributes | 104 | 150 |
| Top-level CSS section headers (`/* ──` or `/* [A-Z]{3,}`) | 18 | 24 |
