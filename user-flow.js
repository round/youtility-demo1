/* user-flow.js — standalone story navigator.
   Lightweight, no deps, no host changes. Drop the script tag at the end of <body>,
   then call UserFlow.play([...steps]) or UserFlow.play([{id, name, steps}, ...]).

   Step shape:
     { sel: "#x" }                              // CSS selector
     { sel: ".pill", text: "fragment" }         // first match whose textContent contains
     { do: "click" | "type" | "hover" | "wait" }    // default: "click" (or "wait" if no sel)
     { text: "hello", clear: true }             // for type
     { ms: 800 }                                // for wait, or implicit post-step pause
     { waitFor: "#foo" | { sel, text } }        // gate before resolving target
     { waitForTextEquals: "Generate content" }  // poll target until its text matches
     { say: "caption shown in dock" }

   Multi-flow shape (enables the dock's flow picker):
     [
       { id: "churn",   name: "Churn campaign",     steps: [ ...steps ] },
       { id: "connect", name: "Connect data source", steps: [ ...steps ] },
     ]
*/
(function () {
  if (window.UserFlow) return;

  const HOST_ID = "__uf_host__";
  const CURSOR_DURATION_BASE = 220;
  const CURSOR_PER_PX = 0.45;
  const CURSOR_DURATION_MAX = 900;
  const RESOLVE_TIMEOUT_MS = 8000;
  const POLL_MS = 80;
  const WAIT_DEFAULT_MS = 600;          // explicit { do: "wait" } step default
  const SETTLE_BEFORE_CLICK_MS = 140;   // micro-pause at target before firing
  const POST_ACTION_MS = 900;           // dwell so the result is visible
  const SCROLL_MARGIN = 96;             // viewport safe-zone for "needs scroll"
  const SCROLL_SETTLE_TIMEOUT_MS = 1500;

  // ── Shadow DOM scaffold ────────────────────────────────────────────────
  function buildHost() {
    let host = document.getElementById(HOST_ID);
    if (host) return host.shadowRoot;
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `
      <style>
        :host, * { box-sizing: border-box; }
        .cursor {
          position: fixed; left: 0; top: 0; width: 26px; height: 26px;
          pointer-events: none; will-change: transform;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,.45));
          transform: translate3d(-100px,-100px,0);
        }
        .cursor svg { display:block; width:100%; height:100%; }
        .cursor.click-pulse::after {
          content: ""; position: absolute;
          left: 3px; top: 3px;
          width: 28px; height: 28px;
          margin-left: -14px; margin-top: -14px;
          border-radius: 50%;
          border: 2px solid rgba(11, 114, 253, .9);
          background: rgba(11, 114, 253, .22);
          animation: uf-pulse .38s cubic-bezier(.2, .7, .2, 1) forwards;
        }
        @keyframes uf-pulse {
          0%   { transform: scale(.25); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .dock {
          position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; width: 480px;
          background: rgba(14,18,30,.92); color: #e8eaf2;
          border: 1px solid rgba(255,255,255,.12); border-radius: 12px;
          font-family: -apple-system, "Inter", "Montserrat", system-ui, sans-serif;
          font-size: 12px; pointer-events: auto;
          box-shadow: 0 12px 36px rgba(0,0,0,.45);
          backdrop-filter: blur(8px);
          user-select: none;
        }
        .dock.dragging { opacity: .85; }
        .btn {
          width: 28px; height: 28px; border-radius: 7px; cursor: pointer;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
          color: #e8eaf2; display:flex; align-items:center; justify-content:center;
          padding: 0; transition: background .12s, transform .08s;
        }
        .btn:hover { background: rgba(255,255,255,.12); }
        .btn:active { transform: scale(.94); }
        .btn.primary { background: #0b72fd; border-color: #0b72fd; color: #fff; }
        .btn.primary:hover { background: #3892ff; }
        .btn[disabled] { opacity: .35; cursor: not-allowed; }
        .btn svg { width: 13px; height: 13px; }
        .grip {
          width: 12px; height: 22px; cursor: grab;
          display:flex; flex-direction:column; justify-content:center; gap:3px;
          opacity: .5;
        }
        .grip:active { cursor: grabbing; }
        .grip span { display:block; width: 3px; height: 3px; border-radius: 50%; background:#e8eaf2; margin: 0 auto; }
        .meta { display:flex; flex-direction:column; gap: 2px; min-width: 0; flex:1; }
        .count { font-size: 10px; letter-spacing: .08em; color: #8b90a8; text-transform: uppercase;
          font-variant-numeric: tabular-nums; min-width: 52px; }
        .caption { font-size: 12px; color: #e8eaf2; line-height: 1.3;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .err { color: #ff8d6e; font-size: 11px; padding: 2px 4px 0; }
        .pick {
          height: 28px; width: 160px; flex: 0 0 auto;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 7px;
          color: #e8eaf2;
          font-family: inherit; font-size: 11px;
          padding: 0 22px 0 8px; cursor: pointer;
          text-overflow: ellipsis; overflow: hidden; white-space: nowrap;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%238b90a8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
          background-repeat: no-repeat;
          background-position: right 6px center;
        }
        .pick:hover { background-color: rgba(255,255,255,.12); }
        .pick:focus { outline: none; border-color: rgba(11,114,253,.6); }
        .pick option { background: #0e121e; color: #e8eaf2; }
      </style>
      <div class="cursor" id="cursor">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 2.5 L5.8 18.3 L9.5 13.3 L13.8 19.4 L16.1 18.0 L12.0 12.1 L17.5 11.1 Z"
                fill="#000000" stroke="#ffffff" stroke-width="1.5"
                stroke-linejoin="round" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="dock" id="dock">
        <div class="grip" id="grip"><span></span><span></span><span></span><span></span></div>
        <button class="btn primary" id="play" title="Play / pause">
          <svg id="play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg>
          <svg id="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none">
            <rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>
          </svg>
        </button>
        <button class="btn" id="next" title="Next">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <select class="pick" id="flowPick" title="Choose flow"></select>
        <div class="meta">
          <div class="count" id="count">0 / 0</div>
          <div class="caption" id="caption">Ready</div>
        </div>
      </div>
    `;
    return root;
  }

  // ── Resolver ───────────────────────────────────────────────────────────
  function findOne(spec) {
    if (!spec) return null;
    if (typeof spec === "string") return document.querySelector(spec);
    if (typeof spec.find === "function") return spec.find();
    const list = spec.sel ? Array.from(document.querySelectorAll(spec.sel)) : [];
    if (spec.text) {
      const needle = spec.text.toLowerCase();
      return list.find(el => (el.textContent || "").toLowerCase().includes(needle)) || null;
    }
    return list[0] || null;
  }
  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    if (typeof el.checkVisibility === "function") {
      return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return false;
    if (parseFloat(cs.opacity) < 0.1) return false;
    return true;
  }
  function inferAction(step) {
    return step.do || (step.sel || step.find ? "click" : "wait");
  }
  async function scrollIntoViewSmooth(el, signal) {
    const r = el.getBoundingClientRect();
    if (r.top >= SCROLL_MARGIN && r.bottom <= window.innerHeight - SCROLL_MARGIN) return false;
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    let prev = el.getBoundingClientRect();
    let stable = 0;
    await poll(() => {
      const cur = el.getBoundingClientRect();
      if (Math.abs(cur.top - prev.top) < 0.5 && Math.abs(cur.left - prev.left) < 0.5) {
        if (++stable >= 4) return true;
      } else {
        stable = 0;
      }
      prev = cur;
      return null;
    }, { timeout: SCROLL_SETTLE_TIMEOUT_MS, interval: 16, signal });
    return true;
  }
  function wait(ms, signal) {
    return new Promise((res, rej) => {
      const t = setTimeout(res, ms);
      if (signal) signal.addEventListener("abort", () => { clearTimeout(t); rej(new Error("abort")); }, { once: true });
    });
  }
  async function poll(check, { timeout = RESOLVE_TIMEOUT_MS, interval = POLL_MS, signal } = {}) {
    const start = performance.now();
    while (true) {
      if (signal && signal.aborted) throw new Error("abort");
      const v = check();
      if (v) return v;
      if (performance.now() - start > timeout) return null;
      await wait(interval, signal);
    }
  }
  async function resolveTarget(step, signal) {
    if (!step.sel && !step.find) return null;
    return await poll(() => {
      const cand = findOne(step);
      if (!cand || !isVisible(cand)) return null;
      if (step.waitForTextEquals) {
        if ((cand.textContent || "").trim() !== step.waitForTextEquals) return null;
      }
      return cand;
    }, { signal });
  }

  // ── Cursor ─────────────────────────────────────────────────────────────
  function cursorState(root) {
    return root.__uf_cursor || (root.__uf_cursor = { x: window.innerWidth / 2, y: window.innerHeight - 80 });
  }
  function placeCursor(root, cursor, x, y) {
    const s = cursorState(root);
    s.x = x; s.y = y;
    cursor.style.transform = `translate3d(${x - 3}px, ${y - 3}px, 0)`;
  }
  async function moveCursor(root, cursor, x, y, signal) {
    const s = cursorState(root);
    const dist = Math.hypot(x - s.x, y - s.y);
    const dur = Math.min(CURSOR_DURATION_MAX, CURSOR_DURATION_BASE + dist * CURSOR_PER_PX);
    const anim = cursor.animate(
      [
        { transform: `translate3d(${s.x - 3}px, ${s.y - 3}px, 0)` },
        { transform: `translate3d(${x - 3}px, ${y - 3}px, 0)` },
      ],
      { duration: dur, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }
    );
    s.x = x; s.y = y;
    await new Promise((res, rej) => {
      anim.onfinish = res;
      anim.oncancel = () => rej(new Error("abort"));
      if (signal) signal.addEventListener("abort", () => anim.cancel(), { once: true });
    }).catch(() => {});
  }
  function pulseClick(cursor) {
    cursor.classList.remove("click-pulse");
    void cursor.offsetWidth;
    cursor.classList.add("click-pulse");
  }
  function rectCenter(el) {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  // ── Event synthesis ────────────────────────────────────────────────────
  function fireClick(el) {
    el.click();
  }
  function fireHover(el) {
    const [cx, cy] = rectCenter(el);
    const init = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy };
    el.dispatchEvent(new MouseEvent("mouseover", init));
    el.dispatchEvent(new MouseEvent("mouseenter", init));
  }
  async function fireType(el, text, { clear = false, perChar = 28 } = {}, signal) {
    el.focus();
    if (clear) {
      el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
    for (const ch of text) {
      if (signal && signal.aborted) throw new Error("abort");
      el.value = (el.value || "") + ch;
      el.dispatchEvent(new InputEvent("input", { bubbles: true, data: ch, inputType: "insertText" }));
      await wait(perChar, signal);
    }
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ── Engine ─────────────────────────────────────────────────────────────
  function Engine(root, flows) {
    let activeIdx = 0;
    let i = 0;
    let playing = false;
    let busy = false;
    let abortCtl = null;
    // Promise chain that gates step() execution. Each step() awaits the
    // previous one so callers (loop, next) can safely abort and then queue
    // a fresh step without racing the in-flight finally block.
    let stepGate = Promise.resolve();
    const cursor    = root.getElementById("cursor");
    const totalEl   = root.getElementById("count");
    const capEl     = root.getElementById("caption");
    const playIcon  = root.getElementById("play-icon");
    const pauseIcon = root.getElementById("pause-icon");
    const nextBtn   = root.getElementById("next");
    const pickEl    = root.getElementById("flowPick");

    function steps() { return flows[activeIdx].steps; }

    function setUI() {
      const s = steps();
      totalEl.textContent = `${i} / ${s.length}`;
      if (!busy) capEl.textContent = s[i] && s[i].say ? s[i].say : (i >= s.length ? "Done" : "Ready");
      // Show pause icon whenever anything is happening (playing OR running a
      // single step from NEXT), so the user can interrupt any state.
      const active = playing || busy;
      playIcon.style.display = active ? "none" : "";
      pauseIcon.style.display = active ? "" : "none";
    }
    function abortInflight() {
      if (abortCtl) { abortCtl.abort(); abortCtl = null; }
    }

    // Populate the picker. Hide it if there's only one flow.
    pickEl.innerHTML = flows.map(f =>
      `<option value="${f.id}">${(f.name || f.id || "Flow").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</option>`
    ).join("");
    pickEl.value = flows[activeIdx].id;
    if (flows.length < 2) pickEl.style.display = "none";

    function selectFlow(id) {
      const idx = flows.findIndex(f => f.id === id);
      if (idx < 0 || idx === activeIdx) return;
      if (playing || busy) { playing = false; abortInflight(); }
      activeIdx = idx;
      i = 0;
      pickEl.value = flows[activeIdx].id;
      setUI();
    }

    async function runStep(step, signal) {
      if (step.waitFor) {
        const got = await poll(() => {
          const el = findOne(step.waitFor);
          return el && isVisible(el) ? el : null;
        }, { signal });
        if (!got) throw new Error("waitFor never resolved");
      }
      const action = inferAction(step);
      if (action === "wait") {
        if (step.ms != null) await wait(step.ms, signal);
        else if (!step.waitFor) await wait(WAIT_DEFAULT_MS, signal);
        // waitFor-only steps are pure gates — no extra dwell once the gate opens.
        return;
      }

      let el = await resolveTarget(step, signal);
      if (!el) throw new Error("could not resolve target");

      // Scroll can swap or re-render the target (virtualized lists, lazy mounts) —
      // only re-check when a scroll actually happened.
      if (await scrollIntoViewSmooth(el, signal)) {
        const live = findOne(step);
        if (live && isVisible(live)) el = live;
        else if (!el.isConnected) throw new Error("target detached before action");
      }

      const [cx, cy] = rectCenter(el);
      await moveCursor(root, cursor, cx, cy, signal);
      placeCursor(root, cursor, cx, cy);
      await wait(SETTLE_BEFORE_CLICK_MS, signal);

      if (action === "click")      { pulseClick(cursor); fireClick(el); }
      else if (action === "hover") { fireHover(el); }
      else if (action === "type")  { await fireType(el, step.text || "", { clear: step.clear, perChar: step.perChar }, signal); }

      await wait(step.ms ?? POST_ACTION_MS, signal);
    }

    function step() {
      // Chain onto the gate so successive step() calls serialize cleanly even
      // when the prior one is still inside its finally block after an abort.
      const next = stepGate.then(async () => {
        const s = steps();
        if (i >= s.length) { playing = false; setUI(); return; }
        busy = true; setUI();
        abortCtl = new AbortController();
        const flowAtStart = activeIdx;
        try {
          capEl.textContent = s[i].say || `Step ${i + 1}`;
          await runStep(s[i], abortCtl.signal);
          // Don't advance the cursor if the user switched flows mid-step.
          if (activeIdx === flowAtStart) i += 1;
        } catch (e) {
          if (e && e.message === "abort") { /* paused or flow switched */ }
          else { capEl.textContent = "⚠︎ " + (e && e.message || "step failed"); playing = false; }
        } finally {
          busy = false; abortCtl = null; setUI();
        }
      });
      stepGate = next.catch(() => {});
      return next;
    }

    async function loop() {
      while (playing && i < steps().length) {
        const before = i;
        await step();
        // Aborted/errored step left i unchanged — bail out so we don't spin.
        if (i === before) break;
      }
      playing = false; setUI();
    }

    function isSilentStep(s) {
      return !!s && inferAction(s) === "wait" && s.ms == null && !!s.waitFor;
    }

    function toggle() {
      // Pause is available during ANY active state — continuous play OR a
      // single-step NEXT animation. Either way, clicking stops it.
      if (playing || busy) {
        playing = false;
        abortInflight();
        setUI();
        return;
      }
      if (i >= steps().length) return;
      playing = true; setUI();
      loop();
    }
    async function next() {
      // From any state — settled, mid-animation, or interrupted — abort what's
      // running and queue a fresh step. stepGate guarantees the queued step
      // waits for the aborted one to fully settle before kicking off.
      if (playing || busy) {
        playing = false;
        abortInflight();
      }
      // Chain through silent gate-only steps so one click lands on a visible action.
      do {
        const before = i;
        await step();
        if (i === before) return; // step failed or aborted
      } while (i < steps().length && isSilentStep(steps()[i - 1]));
    }

    root.getElementById("play").addEventListener("click", toggle);
    nextBtn.addEventListener("click", next);
    pickEl.addEventListener("change", e => selectFlow(e.target.value));

    setUI();
    return { toggle, next, selectFlow };
  }

  // ── Dock dragging ──────────────────────────────────────────────────────
  function enableDrag(root) {
    if (root.__uf_drag) return;
    root.__uf_drag = true;
    const dock = root.getElementById("dock");
    const grip = root.getElementById("grip");
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
    grip.addEventListener("mousedown", (e) => {
      dragging = true; dock.classList.add("dragging");
      const r = dock.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      dock.style.left = ox + "px"; dock.style.top = oy + "px";
      dock.style.bottom = "auto"; dock.style.transform = "none";
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      dock.style.left = (ox + e.clientX - sx) + "px";
      dock.style.top = (oy + e.clientY - sy) + "px";
    });
    window.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false; dock.classList.remove("dragging");
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────
  // Accepts either a flat array of steps (legacy) OR an array of flow objects
  // [{ id, name, steps }, ...]. Flat-array callers get a single anonymous flow
  // wrapper so the dock's picker stays hidden.
  function normalizeFlows(input) {
    if (!Array.isArray(input) || input.length === 0) return null;
    const first = input[0];
    const looksLikeFlow = first && typeof first === "object" && Array.isArray(first.steps);
    if (!looksLikeFlow) return [{ id: "default", name: "Flow", steps: input }];
    return input
      .filter(f => f && Array.isArray(f.steps) && f.steps.length > 0)
      .map((f, idx) => ({ id: f.id || `flow-${idx}`, name: f.name || f.id || `Flow ${idx + 1}`, steps: f.steps }));
  }

  function play(input) {
    const flows = normalizeFlows(input);
    if (!flows || flows.length === 0) return;
    const root = buildHost();
    placeCursor(root, root.getElementById("cursor"), window.innerWidth / 2, window.innerHeight - 80);
    enableDrag(root);
    return Engine(root, flows);
  }

  window.UserFlow = { play };
})();
