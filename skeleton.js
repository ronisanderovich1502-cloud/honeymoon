/** Shared loading skeleton HTML fragments */

export function itinerarySkeleton(cards = 5) {
  return Array.from({ length: cards }, () => `
    <div class="sk-day-card" aria-hidden="true">
      <div class="sk-day-header">
        <div class="sk-line sk-w24"></div>
        <div class="sk-line sk-w60"></div>
        <div class="sk-line sk-w40"></div>
      </div>
      <div class="sk-act"><div class="sk-circle"></div><div class="sk-line sk-w70"></div></div>
      <div class="sk-act"><div class="sk-circle"></div><div class="sk-line sk-w55"></div></div>
      <div class="sk-act"><div class="sk-circle"></div><div class="sk-line sk-w65"></div></div>
    </div>`).join('');
}

export function placePanelSkeleton() {
  return `
    <div class="sk-panel" aria-busy="true" aria-label="טוען פרטים">
      <div class="sk-photo"></div>
      <div class="panel-body">
        <div class="panel-head">
          <div class="sk-circle sk-lg"></div>
          <div class="sk-panel-text">
            <div class="sk-line sk-w70"></div>
            <div class="sk-line sk-w40"></div>
          </div>
        </div>
        <div class="sk-line sk-w90"></div>
        <div class="sk-line sk-w55"></div>
        <div class="sk-actions">
          <div class="sk-chip"></div>
          <div class="sk-chip"></div>
          <div class="sk-chip"></div>
        </div>
        <div class="sk-line sk-w50" style="margin-top:14px"></div>
        <div class="sk-line sk-w80"></div>
        <div class="sk-line sk-w65"></div>
      </div>
    </div>`;
}

export function detailsRowsSkeleton() {
  return `
    <div class="sk-details" aria-hidden="true">
      <div class="sk-line sk-w70"></div>
      <div class="sk-line sk-w50"></div>
      <div class="sk-line sk-w60"></div>
    </div>`;
}

export function transitSkeleton() {
  return `
    <div class="sk-transit" aria-busy="true" aria-label="מחשב מסלולים">
      <div class="sk-transit-row"><div class="sk-circle"></div><div class="sk-line sk-w50"></div><div class="sk-line sk-w24"></div></div>
      <div class="sk-transit-row"><div class="sk-circle"></div><div class="sk-line sk-w55"></div><div class="sk-line sk-w24"></div></div>
      <div class="sk-transit-row"><div class="sk-circle"></div><div class="sk-line sk-w45"></div><div class="sk-line sk-w24"></div></div>
    </div>`;
}

export function searchSkeleton(rows = 3) {
  return Array.from({ length: rows }, () => `
    <div class="sk-search-row" aria-hidden="true">
      <div class="sk-line sk-w60"></div>
      <div class="sk-line sk-w40"></div>
    </div>`).join('');
}

export function inlineChipSkeleton() {
  return `<span class="sk-inline-chip" aria-busy="true"></span>`;
}

export function statsSkeleton() {
  return `
    <div class="sk-stats" aria-hidden="true">
      <div class="sk-stat"><div class="sk-line sk-w40"></div><div class="sk-line sk-w24"></div></div>
      <div class="sk-stat"><div class="sk-line sk-w40"></div><div class="sk-line sk-w24"></div></div>
      <div class="sk-stat"><div class="sk-line sk-w40"></div><div class="sk-line sk-w24"></div></div>
    </div>`;
}

const SIDEBAR_SKEL_HTML = `
<div class="pane-skeleton sidebar-skeleton" id="sidebarSkeleton" aria-busy="true" aria-label="טוען לו״ז">
  <div class="sk-pane-header">
    <div class="sk-line sk-w40" style="height:18px;margin:0 auto 10px"></div>
    <div class="sk-line sk-w60" style="height:10px;margin:0 auto 14px"></div>
    <div class="sk-stats">
      <div class="sk-stat"><div class="sk-line sk-w50"></div><div class="sk-line sk-w24"></div></div>
      <div class="sk-stat"><div class="sk-line sk-w50"></div><div class="sk-line sk-w24"></div></div>
      <div class="sk-stat"><div class="sk-line sk-w50"></div><div class="sk-line sk-w24"></div></div>
    </div>
  </div>
  <div class="sk-pane-tabs"><div class="sk-chip"></div><div class="sk-chip"></div></div>
  <div class="sk-pane-search"><div class="sk-line sk-w90" style="height:36px;border-radius:12px;margin:0"></div></div>
  <div class="sk-pane-filters">
    <div class="sk-chip" style="flex:0 0 52px;height:28px"></div>
    <div class="sk-chip" style="flex:0 0 72px;height:28px"></div>
    <div class="sk-chip" style="flex:0 0 72px;height:28px"></div>
  </div>
  <div class="sk-pane-list">
    <div class="sk-day-card">
      <div class="sk-day-header"><div class="sk-line sk-w24"></div><div class="sk-line sk-w60"></div><div class="sk-line sk-w40"></div></div>
      <div class="sk-act"><div class="sk-circle"></div><div class="sk-line sk-w70"></div></div>
      <div class="sk-act"><div class="sk-circle"></div><div class="sk-line sk-w55"></div></div>
      <div class="sk-act"><div class="sk-circle"></div><div class="sk-line sk-w65"></div></div>
    </div>
    <div class="sk-day-card">
      <div class="sk-day-header"><div class="sk-line sk-w24"></div><div class="sk-line sk-w55"></div><div class="sk-line sk-w40"></div></div>
      <div class="sk-act"><div class="sk-circle"></div><div class="sk-line sk-w60"></div></div>
      <div class="sk-act"><div class="sk-circle"></div><div class="sk-line sk-w70"></div></div>
    </div>
  </div>
</div>`;

const MAP_SKEL_HTML = `
<div class="pane-skeleton map-skeleton" id="mapSkeleton" aria-busy="true" aria-label="טוען מפה">
  <div class="sk-map-surface">
    <div class="sk-map-pin" style="top:28%;left:42%"></div>
    <div class="sk-map-pin" style="top:46%;left:58%"></div>
    <div class="sk-map-pin" style="top:38%;left:51%"></div>
    <div class="sk-map-pin" style="top:62%;left:36%"></div>
    <div class="sk-map-pin" style="top:55%;left:64%"></div>
    <div class="sk-map-route"></div>
  </div>
</div>`;

function ensureSkeletons() {
  const sidebar = document.querySelector('.sidebar');
  const mapBox = document.querySelector('.map-container');
  if (sidebar && !document.getElementById('sidebarSkeleton')) {
    const drag = document.getElementById('sidebarDragBar');
    const wrap = document.createElement('div');
    wrap.innerHTML = SIDEBAR_SKEL_HTML.trim();
    const node = wrap.firstElementChild;
    if (drag?.nextSibling) sidebar.insertBefore(node, drag.nextSibling);
    else sidebar.prepend(node);
  }
  if (mapBox && !document.getElementById('mapSkeleton')) {
    const wrap = document.createElement('div');
    wrap.innerHTML = MAP_SKEL_HTML.trim();
    mapBox.prepend(wrap.firstElementChild);
  }
}

/** Show shimmer overlays on sidebar + map panes */
export function showPaneSkeletons() {
  ensureSkeletons();
  document.body.classList.add('app-loading');
}

/**
 * Close skeletons as soon as cache/Monday data is ready.
 * Removes nodes from the DOM so nothing can stay stuck on the map.
 */
export function hidePaneSkeletons() {
  document.body.classList.remove('app-loading');
  document.getElementById('sidebarSkeleton')?.remove();
  document.getElementById('mapSkeleton')?.remove();
}

/** Call on boot: if cache exists, strip any HTML skeletons immediately */
export function dismissBootSkeletonsIfCached(cacheKey) {
  if (localStorage.getItem(cacheKey)) hidePaneSkeletons();
}
