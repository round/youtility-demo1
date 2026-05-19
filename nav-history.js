/* nav-history.js — in-memory back/forward navigation for the demo.
   Standalone drop-in: one script tag at end of <body>, after the inline app
   script. Wraps the global nav functions and pushes same-URL history entries
   so browser back/forward retrace the screens you've visited. Reload wipes
   the trail — this is for live nav, not deep-linking. */
(function () {
  if (window.NavHistory) return;

  const mirror = {
    userId: null,      // whatever quickLogin received (id or role string)
    ws: 'home',        // home | campaign | report | churn | engage | ltv
    vertical: null,    // when ws === 'report'
    view: null,        // 'admin' | 'client-detail' | null
    clientId: null,
    cdTab: null,
    chatId: null,
    chatView: 'start', // 'start' | 'chat' — home workspace sub-screen
    cwTab: null,       // 'report' | 'create' — campaign workspace sub-tab
    wizStep: null,     // 1 | 2 | 3 — campaign wizard step
  };

  const clearOverlay = () => {
    mirror.view = null;
    mirror.clientId = null;
    mirror.cdTab = null;
  };

  const clearCampaign = () => {
    mirror.cwTab = null;
    mirror.wizStep = null;
  };

  const readWizStep = () => {
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById('ws' + i);
      if (el && el.classList.contains('visible')) return i;
    }
    return null;
  };

  // push:false → update mirror but don't queue an entry. Used for quickLogin
  // so its follow-up nav (super-admin auto-route via setTimeout, or the
  // post-login switchWs) is the single commit — avoids the race producing
  // two entries per login.
  //
  // when:'after' → run update after orig.apply. Used for observation-based
  // updates that need to read post-call state (renderWizUI reads which
  // wiz-step element became visible in the DOM).
  const TARGETS = {
    switchWs: { push: true, update: (ws) => {
      mirror.ws = ws;
      if (ws !== 'report')   mirror.vertical = null;
      if (ws !== 'campaign') clearCampaign();
      if (ws !== 'home')     mirror.chatView = 'start';
      clearOverlay();
    }},
    showVerticalReport: { push: true, update: (v) => {
      mirror.ws = 'report'; mirror.vertical = v;
      clearOverlay(); clearCampaign();
    }},
    showAdminView:    { push: true, update: () => { mirror.view = 'admin'; mirror.clientId = null; mirror.cdTab = null; } },
    openClientDetail: { push: true, update: (id, tab) => { mirror.view = 'client-detail'; mirror.clientId = id; mirror.cdTab = tab || 'overview'; } },
    closeClientDetail:{ push: true, update: clearOverlay },
    switchCdTab:      { push: true, update: (n) => { mirror.cdTab = n; } },
    selectChatAndShow:{ push: true, update: (id) => { mirror.chatId = id; mirror.chatView = 'start'; } },
    quickLogin:       { push: false, update: (target) => { mirror.userId = target || null; } },
    signOut:          { push: true, update: () => { mirror.userId = null; mirror.chatId = null; mirror.chatView = 'start'; clearOverlay(); clearCampaign(); } },
    showStartScreen:  { push: true, update: () => { mirror.chatView = 'start'; } },
    showChatView:     { push: true, update: () => { mirror.chatView = 'chat'; } },
    switchCwTab:      { push: true, update: (tab) => { mirror.cwTab = tab; if (tab !== 'create') mirror.wizStep = null; } },
    renderWizUI:      { push: true, when: 'after', update: () => { mirror.wizStep = readWizStep(); } },
  };

  let isRestoring = true;
  let pendingPush = null;
  let lastKey = '';

  const snapshot = () => ({ ...mirror });
  const keyOf = (s) => JSON.stringify(s);

  function queuePush() {
    if (isRestoring || pendingPush) return;
    pendingPush = setTimeout(() => {
      pendingPush = null;
      const snap = snapshot();
      const k = keyOf(snap);
      if (k === lastKey) return;
      lastKey = k;
      try { history.pushState(snap, '', ''); } catch (_) {}
    }, 0);
  }

  // Update mirror BEFORE orig.apply by default so the leaf-most call wins
  // when wrappers nest (closeClientDetail → showAdminView ends up with
  // view='admin', not the parent's cleared view).
  Object.entries(TARGETS).forEach(([name, spec]) => {
    const orig = window[name];
    if (typeof orig !== 'function') {
      console.warn('NavHistory: missing target', name);
      return;
    }
    const after = spec.when === 'after';
    window[name] = function (...args) {
      if (!after) {
        try { spec.update(...args); } catch (_) {}
        if (spec.push) queuePush();
      }
      const r = orig.apply(this, args);
      if (after) {
        try { spec.update(...args); } catch (_) {}
        if (spec.push) queuePush();
      }
      return r;
    };
  });

  const call = (fn, ...a) => { if (typeof window[fn] === 'function') window[fn](...a); };

  // Wizard step is `let`-scoped in the inline script so we can't write it
  // directly; simulate clicks on wNext/wBack to reach the target. The bound
  // limit prevents a runaway loop if the DOM doesn't converge.
  function restoreWizStep(target) {
    if (target == null) return;
    for (let i = 0; i < 6; i++) {
      const cur = readWizStep();
      if (cur == null || cur === target) return;
      call(cur < target ? 'wNext' : 'wBack');
    }
  }

  function applyState(state) {
    if (!state) return;
    isRestoring = true;
    try {
      if ((state.userId || null) !== (mirror.userId || null)) {
        if (state.userId) call('quickLogin', state.userId);
        else call('signOut');
      }
      if (state.view === 'admin') {
        call('showAdminView');
      } else if (state.view === 'client-detail' && state.clientId) {
        call('openClientDetail', state.clientId, state.cdTab || undefined);
      } else if (state.ws === 'report' && state.vertical) {
        call('showVerticalReport', state.vertical);
      } else {
        const ws = state.ws || 'home';
        call('switchWs', ws);
        if (ws === 'campaign' && state.cwTab) {
          call('switchCwTab', state.cwTab);
          if (state.cwTab === 'create') restoreWizStep(state.wizStep);
        }
        if (ws === 'home') {
          if (state.chatId) call('selectChatAndShow', state.chatId);
          if (state.chatView === 'chat') call('showChatView');
          else call('showStartScreen');
        }
      }
      lastKey = keyOf(state);
    } finally {
      // Hold across one tick so quickLogin's deferred super-admin route
      // doesn't queue a stray push.
      setTimeout(() => { isRestoring = false; }, 0);
    }
  }

  window.addEventListener('popstate', (e) => applyState(e.state));

  document.addEventListener('DOMContentLoaded', () => {
    const snap = snapshot();
    lastKey = keyOf(snap);
    try { history.replaceState(snap, '', ''); } catch (_) {}
    isRestoring = false;
  });

  window.NavHistory = { _snapshot: snapshot };
})();
