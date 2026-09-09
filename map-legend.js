/**
 * Shared map legend (Japan + Thailand).
 * Mount into a map-container root; update progress from checklist stats.
 */

/**
 * @param {Array<{ key: string, label: string, color: string }>} cities
 * @param {{ title?: string, showProgress?: boolean }} [opts]
 */
export function buildMapLegendHtml(cities, { title = 'מקרא', showProgress = true } = {}) {
  const items = (cities || []).map(c => `
    <div class="map-legend-item">
      <div class="legend-dot" style="background:${c.color}"></div>
      <span>${c.label}</span>
    </div>`).join('');

  return `
    <div class="map-overlay" id="mapOverlay">
      <div class="map-overlay-title">${title}</div>
      ${items}
      ${showProgress ? `
        <hr class="map-overlay-divider">
        <div id="overlayProgress" class="map-overlay-progress"></div>
      ` : ''}
    </div>`;
}

/**
 * Strip emoji / decoration for a shorter legend label.
 * @param {string} name
 */
export function legendLabelFromCityName(name) {
  return String(name || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * @param {HTMLElement|null} mapContainer
 * @param {Array<{ key: string, label: string, color: string }>} cities
 * @param {{ title?: string }} [opts]
 */
export function mountMapLegend(mapContainer, cities, opts = {}) {
  if (!mapContainer) return null;
  mapContainer.querySelector('#mapOverlay')?.remove();
  mapContainer.insertAdjacentHTML('beforeend', buildMapLegendHtml(cities, opts));
  return mapContainer.querySelector('#mapOverlay');
}

/**
 * @param {number} done
 * @param {number} total
 */
export function updateLegendProgress(done, total) {
  const el = document.getElementById('overlayProgress');
  if (!el) return;
  const t = Number(total) || 0;
  const d = Number(done) || 0;
  const pct = t ? Math.round((d / t) * 100) : 0;
  el.textContent = t ? `✅ ${d}/${t} פעילויות (${pct}%)` : '✅ 0 פעילויות';
}
