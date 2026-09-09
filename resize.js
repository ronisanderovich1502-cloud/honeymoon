/** Shared pane resize: desktop sidebar width, mobile sidebar height, item card height */

const KEYS = {
  sidebarW: 'honeymoon-sidebar-w',
  sidebarH: 'honeymoon-sidebar-h',
  panelH: 'honeymoon-panel-h',
};

function isMobile() {
  return window.innerWidth <= 768;
}

function invalidateMap() {
  window.dispatchEvent(new Event('resize'));
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('honeymoon-map-resize'));
  }, 50);
}

function applySidebarWidth(px) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || isMobile()) return;
  const min = 280;
  const max = Math.min(640, window.innerWidth * 0.55);
  const w = Math.min(max, Math.max(min, px));
  sidebar.style.width = w + 'px';
  localStorage.setItem(KEYS.sidebarW, String(w));
  invalidateMap();
}

function applySidebarHeight(px) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || !isMobile()) return;
  const vh = window.innerHeight;
  const h = Math.min(vh * 0.96, Math.max(44, px));
  sidebar.style.height = h + 'px';
  localStorage.setItem(KEYS.sidebarH, String(h));
  invalidateMap();
}

function applyPanelHeight(px) {
  const panel = document.getElementById('placePanel');
  if (!panel) return;
  const vh = window.innerHeight;
  const h = Math.min(vh * 0.88, Math.max(vh * 0.22, px));
  panel.style.maxHeight = h + 'px';
  panel.style.height = h + 'px';
  localStorage.setItem(KEYS.panelH, String(h));
}

export function initResize(mapInvalidate) {
  const onMapResize = () => {
    try { mapInvalidate?.(); } catch (_) {}
  };
  window.addEventListener('honeymoon-map-resize', onMapResize);

  // Restore saved sizes
  const savedW = Number(localStorage.getItem(KEYS.sidebarW));
  const savedH = Number(localStorage.getItem(KEYS.sidebarH));
  const savedP = Number(localStorage.getItem(KEYS.panelH));
  if (savedW) applySidebarWidth(savedW);
  if (savedH && isMobile()) applySidebarHeight(savedH);
  if (savedP) applyPanelHeight(savedP);

  // Desktop vertical splitter between sidebar and map
  const split = document.getElementById('paneSplitter');
  if (split) {
    let dragging = false;
    split.addEventListener('pointerdown', e => {
      if (isMobile()) return;
      dragging = true;
      split.setPointerCapture(e.pointerId);
      document.body.classList.add('is-resizing');
      e.preventDefault();
    });
    split.addEventListener('pointermove', e => {
      if (!dragging || isMobile()) return;
      const rtl = document.documentElement.dir !== 'ltr';
      applySidebarWidth(rtl ? window.innerWidth - e.clientX : e.clientX);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('is-resizing');
      onMapResize();
    };
    split.addEventListener('pointerup', end);
    split.addEventListener('pointercancel', end);
  }

  // Mobile sidebar height via existing drag bar
  const bar = document.getElementById('sidebarDragBar');
  const sidebar = document.querySelector('.sidebar');
  if (bar && sidebar) {
    let startY = 0, startH = 0, active = false;
    const start = (y) => {
      if (!isMobile()) return;
      active = true;
      startY = y;
      startH = sidebar.getBoundingClientRect().height;
      sidebar.style.transition = 'none';
    };
    const move = (y) => {
      if (!active || !isMobile()) return;
      applySidebarHeight(startH + (startY - y));
    };
    const stop = () => {
      if (!active) return;
      active = false;
      sidebar.style.transition = '';
      // snap: collapsed / mid / full
      const vh = window.innerHeight;
      const h = sidebar.getBoundingClientRect().height;
      if (h < vh * 0.25) applySidebarHeight(44);
      else if (h < vh * 0.72) applySidebarHeight(vh * 0.58);
      else applySidebarHeight(vh * 0.92);
      onMapResize();
    };
    bar.addEventListener('pointerdown', e => { start(e.clientY); bar.setPointerCapture(e.pointerId); });
    bar.addEventListener('pointermove', e => move(e.clientY));
    bar.addEventListener('pointerup', stop);
    bar.addEventListener('pointercancel', stop);
    bar.addEventListener('touchstart', e => start(e.touches[0].clientY), { passive: true });
    bar.addEventListener('touchmove', e => move(e.touches[0].clientY), { passive: true });
    bar.addEventListener('touchend', stop);
  }

  // Item card height via panel handle
  const handle = document.querySelector('#placePanel .panel-handle');
  const panel = document.getElementById('placePanel');
  if (handle && panel) {
    let dragging = false, startY = 0, startH = 0;
    handle.addEventListener('pointerdown', e => {
      if (!panel.classList.contains('open')) return;
      dragging = true;
      startY = e.clientY;
      startH = panel.getBoundingClientRect().height;
      panel.style.transition = 'none';
      handle.setPointerCapture(e.pointerId);
      document.body.classList.add('is-resizing');
      e.preventDefault();
      e.stopPropagation();
    });
    handle.addEventListener('pointermove', e => {
      if (!dragging) return;
      // drag up = taller
      applyPanelHeight(startH + (startY - e.clientY));
    });
    const endPanel = () => {
      if (!dragging) return;
      dragging = false;
      panel.style.transition = '';
      document.body.classList.remove('is-resizing');
    };
    handle.addEventListener('pointerup', endPanel);
    handle.addEventListener('pointercancel', endPanel);
    // prevent click-to-close while resizing intent
    handle.addEventListener('click', e => {
      // only close on simple click if not just resized — leave close to X button
      e.stopPropagation();
    });
  }

  window.addEventListener('resize', () => {
    if (!isMobile()) {
      const w = Number(localStorage.getItem(KEYS.sidebarW));
      if (w) applySidebarWidth(w);
    }
  });
}
