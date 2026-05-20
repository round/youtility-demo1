// Injected into the demo page by the storyboard runbook.
//
// Three concerns:
//   1. Patch window.setTimeout to bypass background-tab throttling for short
//      delays. Chrome clamps setTimeout to ~1s when a tab is hidden, which
//      stalls the captureFlow poll loop. MessageChannel.postMessage is NOT
//      clamped — we route delays <=200ms through it.
//   2. __sb_snap(name): render the viewport via html2canvas (loaded by the
//      runbook before this file) and POST the PNG bytes to the local helper
//      at http://127.0.0.1:9999/save?name=…
//   3. __storyboard.{start, next, poll}: wrap UserFlow.capture so an external
//      driver (Claude in Chrome) can pause between steps to snap, then advance.
(function () {
  if (window.__storyboard) return;

  // ── 1. setTimeout patch (bypasses background-tab throttling) ─────────────
  if (!window.__sb_patchedST) {
    window.__sb_patchedST = true;
    const orig = window.setTimeout.bind(window);
    const mc = new MessageChannel();
    const queue = [];
    mc.port2.onmessage = () => {
      const item = queue.shift();
      if (item) {
        try { item.fn(); } catch (e) { console.error(e); }
      }
    };
    window.setTimeout = function (fn, ms) {
      if (ms != null && ms <= 200) {
        queue.push({ fn });
        mc.port1.postMessage(null);
        return -1;
      }
      return orig(fn, ms);
    };
  }

  // ── 2. snap helper ────────────────────────────────────────────────────────
  async function snap(name) {
    if (typeof window.html2canvas !== "function") {
      throw new Error("html2canvas not loaded — runbook must inject /tools/_html2canvas.min.js first");
    }
    // Hide the Chrome MCP "Claude is active in this tab group" overlay during render.
    const indicator = document.getElementById("claude-static-indicator-container");
    const prev = indicator ? indicator.style.display : null;
    if (indicator) indicator.style.display = "none";
    try {
      const canvas = await window.html2canvas(document.body, {
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
      const resp = await fetch(
        "http://127.0.0.1:9999/save?name=" + encodeURIComponent(name),
        { method: "POST", body: blob }
      );
      if (!resp.ok) throw new Error("save failed: " + resp.status);
      return await resp.text();
    } finally {
      if (indicator) indicator.style.display = prev || "";
    }
  }
  window.__sb_snap = snap;

  // ── 3. __storyboard: external-advance wrapper around UserFlow.capture ────
  const state = {
    flowId: null,
    lastStep: null,    // { flowId, idx, total, say }
    done: false,
    error: null,
    _advance: null,
  };

  async function start(flowId) {
    state.flowId = flowId;
    state.lastStep = null;
    state.done = false;
    state.error = null;
    state._advance = null;

    try {
      await window.UserFlow.capture(flowId, {
        onStepDone: async (info) => {
          state.lastStep = info;
          await new Promise((resolve) => { state._advance = resolve; });
        },
      });
      state.done = true;
    } catch (e) {
      state.error = (e && e.message) ? e.message : String(e);
      state.done = true;
    }
  }

  function next() {
    const resolve = state._advance;
    state._advance = null;
    if (resolve) resolve();
  }

  function poll() {
    return {
      flowId: state.flowId,
      lastStep: state.lastStep,
      done: state.done,
      error: state.error,
      awaitingAdvance: state._advance !== null,
    };
  }

  window.__storyboard = { start, next, poll };
})();
