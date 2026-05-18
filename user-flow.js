/* user-flow.js — standalone story navigator.
   Lightweight, no deps, no host changes. Drop the script tag at the end of <body>,
   then call UserFlow.play([...steps]).

   Step shape:
     { sel: "#x" }                              // CSS selector
     { sel: ".pill", text: "fragment" }         // first match whose textContent contains
     { do: "click" | "type" | "hover" | "wait" }    // default: "click" (or "wait" if no sel)
     { text: "hello", clear: true }             // for type
     { ms: 800 }                                // for wait, or implicit post-step pause
     { waitFor: "#foo" | { sel, text } }        // gate before resolving target
     { waitForTextEquals: "Generate content" }  // poll target until its text matches
     { say: "caption shown in dock" }
*/
(function () {
  if (window.UserFlow) return;

  const HOST_ID = "__uf_host__";
  const CURSOR_DURATION_BASE = 220;
  const CURSOR_PER_PX = 0.45;
  const CURSOR_DURATION_MAX = 900;
  const RESOLVE_TIMEOUT_MS = 8000;
  const POLL_MS = 80;

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
          content:""; position:absolute; left:8px; top:8px; width:10px; height:10px;
          border-radius:50%; background: rgba(11,114,253,.45);
          animation: uf-pulse .28s ease-out forwards;
        }
        @keyframes uf-pulse {
          0%   { transform: scale(.5); opacity: .85; }
          100% { transform: scale(2);  opacity: 0; }
        }
        .dock {
          position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; min-width: 360px; max-width: 560px;
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
        .count { font-size: 10px; letter-spacing: .08em; color: #8b90a8; text-transform: uppercase; }
        .caption { font-size: 12px; color: #e8eaf2; line-height: 1.3;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .err { color: #ff8d6e; font-size: 11px; padding: 2px 4px 0; }
      </style>
      <div class="cursor" id="cursor">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 2.5 L3 19.5 L8.2 14.6 L11.8 22 L14.6 20.7 L11.1 13.3 L18 13.3 Z"
                fill="#ffffff" stroke="#0b0d18" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="dock" id="dock">
        <div class="grip" id="grip"><span></span><span></span><span></span><span></span></div>
        <button class="btn" id="restart" title="Restart">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/>
          </svg>
        </button>
        <button class="btn" id="prev" title="Previous">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
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
  function nextFrame() { return new Promise(r => requestAnimationFrame(r)); }
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
  function Engine(root, steps) {
    let i = 0;
    let playing = false;
    let busy = false;
    let abortCtl = null;
    const cursor    = root.getElementById("cursor");
    const totalEl   = root.getElementById("count");
    const capEl     = root.getElementById("caption");
    const playIcon  = root.getElementById("play-icon");
    const pauseIcon = root.getElementById("pause-icon");
    const prevBtn   = root.getElementById("prev");
    const nextBtn   = root.getElementById("next");

    function setUI() {
      totalEl.textContent = `${i} / ${steps.length}`;
      capEl.textContent = steps[i] && steps[i].say ? steps[i].say : (i >= steps.length ? "Done" : "Ready");
      playIcon.style.display = playing ? "none" : "";
      pauseIcon.style.display = playing ? "" : "none";
      prevBtn.disabled = i <= 0 || busy;
      nextBtn.disabled = busy;
    }
    function abortInflight() {
      if (abortCtl) { abortCtl.abort(); abortCtl = null; }
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

    async function runStep(step, signal) {
      if (step.waitFor) {
        const got = await poll(() => {
          const el = findOne(step.waitFor);
          return el && isVisible(el) ? el : null;
        }, { signal });
        if (!got) throw new Error("waitFor never resolved");
      }
      const action = step.do || (step.sel || step.find ? "click" : "wait");
      if (action === "wait") {
        await wait(step.ms || 400, signal);
        return;
      }
      let el = await resolveTarget(step, signal);
      if (!el) throw new Error("could not resolve target");
      el.scrollIntoView({ block: "center", inline: "nearest" });
      await nextFrame();
      const travelTo = rectCenter(el);
      await moveCursor(root, cursor, travelTo[0], travelTo[1], signal);

      const live = await resolveTarget(step, signal);
      el = live && live.isConnected ? live : (el.isConnected ? el : null);
      if (!el) throw new Error("target detached during travel");
      const [cx, cy] = rectCenter(el);
      placeCursor(root, cursor, cx, cy);

      if (action === "click") { pulseClick(cursor); fireClick(el); }
      else if (action === "hover") { fireHover(el); }
      else if (action === "type") { await fireType(el, step.text || "", { clear: step.clear, perChar: step.perChar }, signal); }
      if (step.ms) await wait(step.ms, signal);
    }

    async function step(dir) {
      if (busy) return;
      const target = dir > 0 ? i : i - 1;
      if (target < 0 || target >= steps.length) { playing = false; setUI(); return; }
      busy = true; setUI();
      abortCtl = new AbortController();
      try {
        capEl.textContent = steps[target].say || `Step ${target + 1}`;
        await runStep(steps[target], abortCtl.signal);
        i = target + 1;
      } catch (e) {
        if (e && e.message === "abort") { /* paused */ }
        else { capEl.textContent = "⚠︎ " + (e && e.message || "step failed"); playing = false; }
      } finally {
        busy = false; abortCtl = null; setUI();
      }
    }

    async function loop() {
      while (playing && i < steps.length) {
        await step(1);
      }
      playing = false; setUI();
    }

    function toggle() {
      if (playing) { playing = false; abortInflight(); setUI(); }
      else { playing = true; setUI(); loop(); }
    }
    function next() { if (playing) { playing = false; abortInflight(); } step(1); }
    function prev() {
      if (busy) abortInflight();
      if (i > 0) i--;
      setUI();
    }
    function restart() {
      playing = false; abortInflight(); i = 0; setUI();
    }

    root.getElementById("play").addEventListener("click", toggle);
    nextBtn.addEventListener("click", next);
    prevBtn.addEventListener("click", prev);
    root.getElementById("restart").addEventListener("click", restart);

    setUI();
    return { toggle, next, prev, restart };
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
  function play(steps) {
    if (!Array.isArray(steps) || steps.length === 0) return;
    const root = buildHost();
    placeCursor(root, root.getElementById("cursor"), window.innerWidth / 2, window.innerHeight - 80);
    enableDrag(root);
    return Engine(root, steps);
  }

  window.UserFlow = { play };
})();
