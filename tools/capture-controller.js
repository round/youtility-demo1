// Injected into the demo page by the storyboard runbook.
// Wraps UserFlow.capture so an external driver (Claude in Chrome) can
// pause between steps, take a screenshot, then advance.
(function () {
  if (window.__storyboard) return;

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
          await new Promise(resolve => { state._advance = resolve; });
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
