# Storyboard runbook

Regenerates the demo storyboard: a screenshot of **every screen of every flow**, with the
pointer shown on each click/hover target, laid out in a **new Figma file** — one labelled
section per flow.

Trigger: the user says "rerun the storyboard" / "regenerate the storyboard" (or similar).
This runbook is **mechanical** — follow it top to bottom, copy the scripts verbatim, do not
improvise. It uses the **Chrome DevTools MCP** (`mcp__chrome-devtools__*`) for capture and the
**Figma MCP** (`mcp__claude_ai_Figma__*`) for assembly. No Puppeteer, no html2canvas, no helper
process.

Fixed values (no config file needed):

| Thing        | Value                          |
|--------------|--------------------------------|
| Target URL   | `http://localhost:8787`        |
| Viewport     | `1440 × 900`                   |
| Password     | `flow` (only if a login shows) |
| Flows        | `churn` (12 screens), `connect` (10 screens) |
| Output dir   | `tools/out/<flow>/`            |

Screen numbering is `1.<flow>.<step>` — repo is `youtility-demo1` (demo **1**); flow 1 = churn,
flow 2 = connect. So churn screens are `1.1.1 … 1.1.12`, connect screens `1.2.1 … 1.2.10`.

---

## Phase 1 — Preflight

1. **Wrangler dev.** Check it is already serving: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8787`.
   - `200` → it is up, continue.
   - else → start it in the background: `npx wrangler dev --port 8787` and poll the curl until `200`.
   - "Address already in use" on start just means it is already up — fine.
2. **Reset output.** `rm -rf tools/out && mkdir -p tools/out/churn tools/out/connect`.
3. **Chrome DevTools MCP.** Load the `mcp__chrome-devtools__*` tools, then `list_pages`.
   - If it errors with **"browser is already running"**, a stale MCP Chrome is holding the
     profile. Kill it (it is a dedicated automation profile — safe):
     `pkill -f "chrome-devtools-mcp/chrome-profile"`, then retry `list_pages`.

Phases 1 and 2 do not need the Figma tools — load those at Phase 3.

---

## Phase 2 — Capture

Capture each flow as **one continuous, brisk run**: do not pause to view screenshots
mid-flow — long idle gaps between tool calls risk the SPA going stale. Verify the shots
*after* each flow finishes, not between steps.

The driver replays the app's own proven step logic (copied from `user-flow.js`) and places a
light-DOM pointer on each target; screenshots are native (`take_screenshot`), so there is no
`color()` / html2canvas fragility. It is `snap-before-action`: frame *N* shows the screen with
the pointer on the element step *N* is about to use, captured before that action runs.

Each flow runs the same loop — **2a → 2b → 2c → 2d**. Do churn first, then connect.

### 2a. Load the page (full reset)

A fresh full document load before **every** flow — including the first — guarantees a
pristine SPA state.

1. `resize_page` to `1440 × 900` — **do this first, while the page is still `about:blank`.**
   `resize_page` can reset the active page to `about:blank`, so it is only safe *before* the
   navigate. Resize once here; never `resize_page` a page that has a flow loaded (see step 3).
2. `navigate_page` (type `url`) to `http://localhost:8787`. This is a complete fresh document
   load; never reuse a page left over from a previous flow.
3. Sanity + auth — `evaluate_script`:
   ```js
   () => JSON.stringify({
     hasLogin: !!document.querySelector('input[type="password"][name="password"]'),
     hasStartScreen: !!document.querySelector('#startScreen'),
     hasUserFlow: !!window.UserFlow,
     iw: window.innerWidth, ih: window.innerHeight
   })
   ```
   - `hasStartScreen` true → continue.
   - `hasLogin` true → `take_snapshot`, `fill` the password field with `flow`, `click`
     **Continue**, wait for navigation, re-run this check.
   - `iw/ih` not `1440/900` → **do not `resize_page` here** — it blanks a loaded page.
     `navigate_page` to the URL again instead (a re-navigate keeps the window size and does
     **not** blank the page), then re-run this check. If `iw` is still short (e.g. ~1189), a
     docked DevTools panel is eating ~251px: `resize_page` to `1691 × 900`, then
     `navigate_page` again and re-check. Proceed only once `iw/ih` reads `1440/900`.

### 2b. Inject the capture driver

One `evaluate_script` call. **Copy this function verbatim:**

```js
() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function findOne(spec) {
    if (!spec) return null;
    if (typeof spec === 'string') return document.querySelector(spec);
    if (typeof spec.find === 'function') return spec.find();
    const list = spec.sel ? Array.from(document.querySelectorAll(spec.sel)) : [];
    if (spec.text) { const n = spec.text.toLowerCase(); return list.find(el => (el.textContent || '').toLowerCase().includes(n)) || null; }
    return list[0] || null;
  }
  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    if (parseFloat(cs.opacity) < 0.1) return false;
    return true;
  }
  function inferAction(step) { return step.do || (step.sel || step.find ? 'click' : 'wait'); }
  async function poll(check, opts) {
    const timeout = (opts && opts.timeout) || 8000, interval = (opts && opts.interval) || 80;
    const start = performance.now();
    while (true) {
      const v = check();
      if (v) return v;
      if (performance.now() - start > timeout) return null;
      await sleep(interval);
    }
  }
  async function resolveTarget(step) {
    if (!step.sel && !step.find) return null;
    return await poll(() => {
      const c = findOne(step);
      if (!c || !isVisible(c)) return null;
      if (step.waitForTextEquals) { if ((c.textContent || '').trim() !== step.waitForTextEquals) return null; }
      return c;
    }, { timeout: 8000 });
  }
  function fireClick(el) { el.click(); }
  function fireHover(el) {
    const r = el.getBoundingClientRect();
    const init = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    el.dispatchEvent(new MouseEvent('mouseover', init));
    el.dispatchEvent(new MouseEvent('mouseenter', init));
  }
  async function captureSettle(nextStep) {
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (!nextStep) { await sleep(200); return; }
    const gateSpec = nextStep.waitFor || (nextStep.sel || nextStep.find ? nextStep : null);
    if (!gateSpec) { await sleep(200); return; }
    await poll(() => {
      const el = findOne(gateSpec);
      if (!el || !isVisible(el)) return null;
      if (gateSpec.waitForTextEquals != null) { if ((el.textContent || '').trim() !== gateSpec.waitForTextEquals) return null; }
      return el;
    }, { timeout: 5000 });
  }
  async function captureStep(step, nextStep) {
    if (step.waitFor) {
      const got = await poll(() => { const el = findOne(step.waitFor); return el && isVisible(el) ? el : null; }, { timeout: 8000 });
      if (!got) throw new Error('waitFor gate never resolved: ' + step.waitFor);
    }
    const action = inferAction(step);
    if (action === 'wait') { if (step.ms != null) await sleep(step.ms); return captureSettle(nextStep); }
    const el = await resolveTarget(step);
    if (!el) throw new Error('could not resolve target: ' + (step.sel || 'find'));
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    if (action === 'click') fireClick(el);
    else if (action === 'hover') fireHover(el);
    return captureSettle(nextStep);
  }
  let cursor = document.getElementById('__cap_cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.id = '__cap_cursor';
    cursor.style.cssText = 'position:fixed;left:-100px;top:-100px;width:32px;height:32px;z-index:2147483647;pointer-events:none;display:none;';
    cursor.innerHTML =
      '<div id="__cap_ring" style="position:absolute;left:-19px;top:-19px;width:50px;height:50px;border-radius:50%;border:3px solid rgba(11,114,253,.9);background:rgba(11,114,253,.18);box-sizing:border-box;display:none;"></div>' +
      '<svg viewBox="0 0 24 24" width="32" height="32" style="display:block;position:relative;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));">' +
      '<path d="M3 2.5 L5.8 18.3 L9.5 13.3 L13.8 19.4 L16.1 18.0 L12.0 12.1 L17.5 11.1 Z" fill="#0c0c0d" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
    document.body.appendChild(cursor);
  }
  const ring = cursor.querySelector('#__cap_ring');
  function hideCursor() { cursor.style.display = 'none'; ring.style.display = 'none'; }
  function placeCursorOn(el, mode) {
    const r = el.getBoundingClientRect();
    cursor.style.left = (r.left + r.width / 2 - 4) + 'px';
    cursor.style.top = (r.top + r.height / 2 - 4) + 'px';
    cursor.style.display = 'block';
    ring.style.display = (mode === 'hover') ? 'none' : 'block';
  }
  async function placeCursorForStep(step) {
    if (!step || (!step.sel && !step.find)) { hideCursor(); return; }
    let el = findOne(step);
    if (!el || !isVisible(el)) { hideCursor(); return; }
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    await sleep(280);
    el = findOne(step) || el;
    if (!el || !isVisible(el)) { hideCursor(); return; }
    placeCursorOn(el, inferAction(step) === 'hover' ? 'hover' : 'click');
    await sleep(60);
  }
  const FLOWS = {
    churn: { id: 'churn', name: 'Churn campaign', steps: [
      { say: 'Start screen', waitFor: '#startScreen' },
      { say: 'Ask: customers most likely to churn', sel: '.start-pill', text: 'Customers most likely to churn' },
      { say: 'Inspect the Reluctant Buyer segment', waitFor: "[id^='ae-widget-']", sel: "[id^='ae-leg-'] > div", text: 'Reluctant Buyer' },
      { say: 'Create a campaign for this segment', sel: "[id^='ae-create-btn-']" },
      { say: 'Also target Lapsed 60-Day', waitFor: '#sg-lapsed', sel: '#sg-lapsed' },
      { say: 'Continue to campaign brief', sel: '#wizNext', waitForTextEquals: 'Continue' },
      { say: 'Compare the High Browse recommendation', waitFor: '#segGrid.phase-brief', sel: '#sg-browse' },
      { say: 'Then the Lapsed 60-Day recommendation', sel: '#sg-lapsed' },
      { say: 'Bump the reactivation reward to £10', waitFor: '#ws2.visible', sel: '#discountPills .offer-pill', text: '£10 reward' },
      { say: 'Raise the urgency to moderate', sel: '.urgency-row .urg-pill', text: 'Moderate' },
      { say: 'Generate content', sel: '#wizNext', waitForTextEquals: 'Generate content' },
      { say: 'Edit the email body', waitFor: '#ws3.visible', find: function () {
          const blocks = document.querySelectorAll('#ws3 .c-block');
          for (const b of blocks) { const lbl = b.querySelector('.cb-lbl');
            if (lbl && lbl.textContent.trim() === 'EMAIL BODY') return b.querySelector('.cb-acts .cact:last-child'); }
          return null; } }
    ] },
    connect: { id: 'connect', name: 'Connect data source', steps: [
      { say: 'Start at home', waitFor: '#startScreen' },
      { say: 'Open the account menu', sel: '.sb-home .user-avatar-btn' },
      { say: 'Open data sources', sel: '#accountModal .acct-menu-item', text: 'Data sources' },
      { say: 'Choose HubSpot CRM', waitFor: '#cdpTabDatasource.visible', sel: '.ds-card', text: 'HubSpot' },
      { say: 'Endpoint configuration', waitFor: '.ds-conn-tabs', do: 'hover', sel: '.ds-conn-body .ds-field input', ms: 1400 },
      { say: 'Configure authentication', sel: '.ds-conn-tab', text: 'Authentication' },
      { say: 'Map fields to behavioural attributes', sel: '.ds-conn-tab', text: 'Field mapping' },
      { say: 'Set the sync schedule', sel: '.ds-conn-tab', text: 'Sync schedule' },
      { say: 'Test the connection', sel: '.ds-test-btn' },
      { say: 'Connected · first sync starting', waitFor: '.ds-pill.ok', ms: 1600 }
    ] }
  };
  let CUR = null;
  window.__cap_init = async function (flowId) {
    CUR = FLOWS[flowId];
    if (!CUR) return JSON.stringify({ error: 'unknown flow ' + flowId });
    document.documentElement.classList.add('uf-capture-mode');
    const s0 = CUR.steps[0];
    if (s0.waitFor) {
      const g = await poll(() => { const e = findOne(s0.waitFor); return e && isVisible(e) ? e : null; }, { timeout: 8000 });
      if (!g) return JSON.stringify({ error: 'initial gate never resolved: ' + s0.waitFor });
    }
    await placeCursorForStep(s0.sel || s0.find ? s0 : null);
    return JSON.stringify({ flowId, total: CUR.steps.length, idx: 0, say: s0.say });
  };
  window.__cap_step = async function (idx) {
    if (!CUR) return JSON.stringify({ error: 'not initialized' });
    try {
      await captureStep(CUR.steps[idx - 1], CUR.steps[idx] || null);
      await sleep(650);
      await placeCursorForStep(CUR.steps[idx] || null);
      const cur = CUR.steps[idx] || null;
      return JSON.stringify({ idx, say: cur ? cur.say : null });
    } catch (e) { return JSON.stringify({ error: (e && e.message) || String(e), idx }); }
  };
  return JSON.stringify({ ready: true, churn: FLOWS.churn.steps.length, connect: FLOWS.connect.steps.length });
}
```

Expect `{"ready":true,"churn":12,"connect":10}`. The `FLOWS` object mirrors `UserFlow.play([...])`
at the end of `index.html` — if a `__cap_init` later reports a `total` other than 12/10, or
steps fail to resolve, the demo's flows changed: re-derive the specs from `index.html`.

### 2c. Drive the flow and shoot each frame

1. `evaluate_script`: `() => window.__cap_init('<flowId>')` → expect `{"idx":0,...}`.
2. `take_screenshot` (filePath = frame 1 below).
3. For `idx` = 1 … `total-1`: `evaluate_script` `() => window.__cap_step(<idx>)`, then
   `take_screenshot` to the matching file. A step that returns `{"error":...}` → Failure modes.

**churn** — `__cap_init('churn')`, then `__cap_step(1…11)`:

| idx call         | file |
|------------------|------|
| (init)           | `tools/out/churn/01-start-screen.png` |
| `__cap_step(1)`  | `tools/out/churn/02-ask-customers-most-likely-to-churn.png` |
| `__cap_step(2)`  | `tools/out/churn/03-inspect-the-reluctant-buyer-segment.png` |
| `__cap_step(3)`  | `tools/out/churn/04-create-a-campaign-for-this-segment.png` |
| `__cap_step(4)`  | `tools/out/churn/05-also-target-lapsed-60-day.png` |
| `__cap_step(5)`  | `tools/out/churn/06-continue-to-campaign-brief.png` |
| `__cap_step(6)`  | `tools/out/churn/07-compare-the-high-browse-recommendation.png` |
| `__cap_step(7)`  | `tools/out/churn/08-then-the-lapsed-60-day-recommendation.png` |
| `__cap_step(8)`  | `tools/out/churn/09-bump-the-reactivation-reward-to-10.png` |
| `__cap_step(9)`  | `tools/out/churn/10-raise-the-urgency-to-moderate.png` |
| `__cap_step(10)` | `tools/out/churn/11-generate-content.png` |
| `__cap_step(11)` | `tools/out/churn/12-edit-the-email-body.png` |

**connect** — `__cap_init('connect')`, then `__cap_step(1…9)`:

| idx call        | file |
|-----------------|------|
| (init)          | `tools/out/connect/01-start-at-home.png` |
| `__cap_step(1)` | `tools/out/connect/02-open-the-account-menu.png` |
| `__cap_step(2)` | `tools/out/connect/03-open-data-sources.png` |
| `__cap_step(3)` | `tools/out/connect/04-choose-hubspot-crm.png` |
| `__cap_step(4)` | `tools/out/connect/05-endpoint-configuration.png` |
| `__cap_step(5)` | `tools/out/connect/06-configure-authentication.png` |
| `__cap_step(6)` | `tools/out/connect/07-map-fields-to-behavioural-attributes.png` |
| `__cap_step(7)` | `tools/out/connect/08-set-the-sync-schedule.png` |
| `__cap_step(8)` | `tools/out/connect/09-test-the-connection.png` |
| `__cap_step(9)` | `tools/out/connect/10-connected-first-sync-starting.png` |

### 2d. Verify the flow

`ls -la tools/out/<flow>` — confirm the expected count (churn 12, connect 10) and that no PNG
is suspiciously small (< ~20 KB ⇒ blank/failed shot — re-run that step or the flow).

Then go back to **2a** for the next flow. After both: 22 PNGs total.

---

## Phase 3 — Figma assembly

Build a **new** Figma file every run. Load the `figma-create-new-file` and `figma-use` skills,
and the `mcp__claude_ai_Figma__*` tools. Captions below are the storyboard labels — keep order.

| # | churn (Flow 1) caption | # | connect (Flow 2) caption |
|---|---|---|---|
| 1.1.1  | Start screen | 1.2.1  | Start at home |
| 1.1.2  | Ask: customers most likely to churn | 1.2.2  | Open the account menu |
| 1.1.3  | Inspect the Reluctant Buyer segment | 1.2.3  | Open data sources |
| 1.1.4  | Create a campaign for this segment | 1.2.4  | Choose HubSpot CRM |
| 1.1.5  | Also target Lapsed 60-Day | 1.2.5  | Endpoint configuration |
| 1.1.6  | Continue to campaign brief | 1.2.6  | Configure authentication |
| 1.1.7  | Compare the High Browse recommendation | 1.2.7  | Map fields to behavioural attributes |
| 1.1.8  | Then the Lapsed 60-Day recommendation | 1.2.8  | Set the sync schedule |
| 1.1.9  | Bump the reactivation reward to £10 | 1.2.9  | Test the connection |
| 1.1.10 | Raise the urgency to moderate | 1.2.10 | Connected · first sync starting |
| 1.1.11 | Generate content | | |
| 1.1.12 | Edit the email body | | |

### 3a. Create the file

- `whoami` for the `planKey`.
- `create_new_file` — `editorType: "design"`, `fileName: "Stokes Orchestrator — Demo Storyboard <YYYY-MM-DD>"`.
- Record the returned `file_key` and `file_url`.

### 3b. Upload the 22 screenshots

`upload_assets` returns ≤5 single-use URLs per call — make **5 calls** (5+5+5+5+2) covering
churn `01…12` then connect `01…10` **in strict order**. For each URL, `curl` the PNG:

```bash
curl -s -X POST -F "file=@<path.png>;filename=<label>" "<submitUrl>"
```

Each response must be `{"success":true,…,"imageHash":"…"}`. If one is not (URLs are single-use
and expire after 10 min), call `upload_assets` for a fresh URL and retry that image only.

Keep an ordered list of 22 `{label, caption, imageHash}` — 12 churn (`1.1.1…1.1.12`) then 10
connect (`1.2.1…1.2.10`). A mis-ordered list mislabels every screen, so map carefully.

### 3c. Build the skeleton

One `use_figma` call (pass `skillNames: "figma-use"`) — verbatim:

```js
await figma.loadFontAsync({family:'Inter',style:'Regular'});
await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});
await figma.loadFontAsync({family:'Inter',style:'Bold'});
// remove the auto-placed upload frames
for (const n of [...figma.currentPage.children]) n.remove();

const INK={r:0.051,g:0.055,b:0.071}, MUTED={r:0.420,g:0.447,b:0.502};
const root = figma.createAutoLayout('VERTICAL',{name:'Storyboard'});
root.x=200; root.y=200;
root.paddingTop=80; root.paddingBottom=80; root.paddingLeft=80; root.paddingRight=80;
root.itemSpacing=64;
root.fills=[{type:'SOLID',color:{r:0.969,g:0.969,b:0.980}}];

const title = figma.createAutoLayout('VERTICAL',{name:'Title'});
root.appendChild(title); title.itemSpacing=10;
const kicker=figma.createText(); kicker.fontName={family:'Inter',style:'Semi Bold'};
kicker.characters='STOKES ORCHESTRATOR'; kicker.fontSize=14;
kicker.letterSpacing={unit:'PERCENT',value:6}; kicker.fills=[{type:'SOLID',color:MUTED}];
title.appendChild(kicker);
const h1=figma.createText(); h1.fontName={family:'Inter',style:'Bold'};
h1.characters='Demo Flow Storyboard'; h1.fontSize=46; h1.fills=[{type:'SOLID',color:INK}];
title.appendChild(h1);
const sub=figma.createText(); sub.fontName={family:'Inter',style:'Regular'};
sub.characters='Every screen of each demo flow · the pointer marks each interaction';
sub.fontSize=16; sub.fills=[{type:'SOLID',color:MUTED}];
title.appendChild(sub);

function buildSection(flowNo, flowName, accent){
  const section = figma.createAutoLayout('VERTICAL',{name:'Flow '+flowNo+' — '+flowName});
  root.appendChild(section); section.itemSpacing=26;
  const header = figma.createAutoLayout('HORIZONTAL',{name:'Section header'});
  section.appendChild(header); header.itemSpacing=14; header.counterAxisAlignItems='CENTER';
  const bar=figma.createRectangle(); bar.resize(6,30);
  bar.fills=[{type:'SOLID',color:accent}]; header.appendChild(bar);
  const fl=figma.createText(); fl.fontName={family:'Inter',style:'Bold'};
  fl.characters='Flow '+flowNo; fl.fontSize=24; fl.fills=[{type:'SOLID',color:INK}];
  header.appendChild(fl);
  const fn=figma.createText(); fn.fontName={family:'Inter',style:'Regular'};
  fn.characters=flowName; fn.fontSize=24; fn.fills=[{type:'SOLID',color:MUTED}];
  header.appendChild(fn);
  const grid = figma.createAutoLayout('HORIZONTAL',{name:'Grid'});
  section.appendChild(grid);
  grid.layoutWrap='WRAP'; grid.itemSpacing=28; grid.counterAxisSpacing=28;
  grid.resize(2020,400); grid.layoutSizingVertical='HUG';
  return grid.id;
}
const grid1 = buildSection(1,'Churn campaign',{r:0.816,g:0.333,b:0.227});
const grid2 = buildSection(2,'Connect data source',{r:0.290,g:0.498,b:0.831});
return { root: root.id, grid1, grid2 };
```

### 3d. Fill each grid with cards

Run this `use_figma` call **twice** — once per flow. Fill in `GRID_ID`, the accent + tint
colours, and the `cards` array (`label`, `caption`, `hash` from 3b). Cards are flat — square
corners, hairline border, no shadow; the number sits in a flat (un-rounded) tint pill.

- Flow 1 (churn) → `grid1`, accent `{r:0.816,g:0.333,b:0.227}`, tint `{r:0.969,g:0.898,b:0.878}`.
- Flow 2 (connect) → `grid2`, accent `{r:0.290,g:0.498,b:0.831}`, tint `{r:0.902,g:0.929,b:0.969}`.

```js
await figma.loadFontAsync({family:'Inter',style:'Regular'});
await figma.loadFontAsync({family:'Inter',style:'Semi Bold'});
const grid = await figma.getNodeByIdAsync('GRID_ID');
const ACCENT = ACCENT_RGB, TINT = TINT_RGB;
const BORDER={r:0.886,g:0.886,b:0.906}, CAP={r:0.200,g:0.212,b:0.247};
const cards = [ /* {label,caption,hash}, … in order */ ];
const made = [];
for (const c of cards){
  const card = figma.createAutoLayout('VERTICAL',{name:'Screen '+c.label});
  grid.appendChild(card);
  card.resize(480,300);
  card.itemSpacing=0;
  card.fills=[{type:'SOLID',color:{r:1,g:1,b:1}}];
  card.clipsContent=true;
  card.strokes=[{type:'SOLID',color:BORDER}]; card.strokeWeight=1;
  card.layoutSizingVertical='HUG';
  const hdr = figma.createAutoLayout('HORIZONTAL',{name:'Label'});
  card.appendChild(hdr); hdr.layoutSizingHorizontal='FILL';
  hdr.paddingLeft=16; hdr.paddingRight=16; hdr.paddingTop=13; hdr.paddingBottom=13;
  hdr.itemSpacing=10; hdr.counterAxisAlignItems='CENTER';
  const badge = figma.createAutoLayout('HORIZONTAL',{name:'Badge'});
  hdr.appendChild(badge);
  badge.paddingLeft=9; badge.paddingRight=9; badge.paddingTop=5; badge.paddingBottom=5;
  badge.fills=[{type:'SOLID',color:TINT}];
  const bt = figma.createText(); bt.fontName={family:'Inter',style:'Semi Bold'};
  bt.characters=c.label; bt.fontSize=12; bt.fills=[{type:'SOLID',color:ACCENT}];
  badge.appendChild(bt);
  const cap = figma.createText(); cap.fontName={family:'Inter',style:'Regular'};
  cap.characters=c.caption; cap.fontSize=13; cap.fills=[{type:'SOLID',color:CAP}];
  hdr.appendChild(cap); cap.layoutSizingHorizontal='FILL';
  const img = figma.createRectangle(); img.name='Screen';
  img.resize(480,300); card.appendChild(img); img.layoutSizingHorizontal='FILL';
  img.fills=[{type:'IMAGE',imageHash:c.hash,scaleMode:'FILL'}];
  made.push(card.id);
}
return { cards: made, count: made.length };
```

### 3e. Verify

`get_screenshot` of the `root` node. Confirm two sections, 12 + 10 numbered cards, the pointer
visible in interaction frames. Then report the `file_url` to the user.

---

## Failure modes

- **A `__cap_step` returns `{"error":...}`** — surface the message. Re-do **2a** (full reload) +
  **2b** (re-inject), and restart that whole flow from `__cap_init`. Do not resume mid-flow —
  the SPA is stateful.
- **`evaluate_script` says `window.__cap_step is not a function`** or the page is `about:blank`
  — the page reloaded/crashed. Re-do 2a + 2b, restart that flow.
- **`__cap_init` returns `initial gate never resolved: #startScreen`** — the page is almost
  always sitting on `about:blank` (a stray `resize_page` blanked it). Confirm with
  `evaluate_script` `() => location.href`; if `about:blank`, re-do 2a (navigate only — **no**
  `resize_page`) + 2b, and restart the flow.
- **A flow fails twice at the same step** — stop retrying. Keep the frames captured so far,
  note which `1.x.y` screens are missing in the final report, and continue. Do not loop.
- **Login page appears** — fill password `flow`, click Continue (2a step 3).
- **`take_screenshot` blank / wrong size** — `resize_page` blanks a loaded page, so this is
  not an in-place fix: re-do 2a (resize on `about:blank`, then navigate) + 2b and restart the
  flow.
- **Chrome DevTools "browser already running"** — `pkill -f "chrome-devtools-mcp/chrome-profile"`, retry.
- **A `curl` upload lacks `"success":true`** — get a fresh URL via `upload_assets`, retry that image.
- **`use_figma` error** — it is atomic (no partial writes). Read the error, fix the script, retry.
- **Wrong frame count** — `ls tools/out/*` must show 12 churn + 10 connect before Phase 3.

## Notes

- Numbering is `1.<flow>.<step>`; the leading `1` is demo 1 (`youtility-demo1`).
- The capture is `snap-before-action`, so the final step's action of each flow is intentionally
  never performed (no frame follows it).
- Legacy capture files — `tools/_html2canvas.min.js`, `tools/_save_screenshot.py`,
  `tools/capture-controller.js`, `tools/storyboard.config.json` — are unused by this runbook
  and can be deleted.
