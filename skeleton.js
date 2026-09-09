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
