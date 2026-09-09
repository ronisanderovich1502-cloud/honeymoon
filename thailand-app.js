import { thailandDays, thailandCityNames, thailandCityColors, thailandFoodGuide, thailandFoodCategories } from './thailand-data.js';
import { map, dayMarkers, allMarkersList, selectedDayNum, selectDayOnMap, addMarkerToMap, fetchPlaceDetails, initMap, rebuildMap } from './thailand-map.js';
import {
  isConnected, requireMonday, initSync, loadMondayData, revalidateMondayData,
  syncActivityCreate, syncActivityUpdate, syncActivityDelete, syncFoodCreate,
} from './sync.js';
import { dayNotesBlockHtml, bindDayNotesHandlers } from './day-notes.js';
import { initResize } from './resize.js';
import { searchSkeleton, showPaneSkeletons, hidePaneSkeletons } from './skeleton.js';
import {
  validatePlaceForm, validateFoodForm,
  clearFieldErrors, bindClearOnInput, shakeModal,
} from './validate.js';
import { fillTimeSelect, setTimeSelectValue, suggestEndTime, formatTimeRange } from './time-options.js';

if (localStorage.getItem('mondayCache_thailand')) hidePaneSkeletons();
fillTimeSelect(document.getElementById('newPlaceTime'));
fillTimeSelect(document.getElementById('newPlaceTimeEnd'));
document.getElementById('newPlaceTime')?.addEventListener('change', () => {
  const start = document.getElementById('newPlaceTime').value;
  const endEl = document.getElementById('newPlaceTimeEnd');
  if (start && endEl && (!endEl.value || endEl.value <= start)) {
    setTimeSelectValue(endEl, suggestEndTime(start));
  }
});
bindClearOnInput([
  'placesSearchInput', 'newPlaceName', 'newPlaceDesc', 'newPlaceTime', 'newPlaceTimeEnd', 'newPlaceDay',
  'foodItemName', 'foodItemArea', 'foodItemCity', 'foodItemCategory', 'foodItemDesc', 'foodItemDay',
  'mondayKeyInput',
]);

if (!isConnected()) {
  location.replace('index.html');
}

function replaceArray(target, source) {
  target.length = 0;
  source.forEach(item => target.push(item));
}

localStorage.setItem('honeymoon-country', 'thailand');

// --- DARK MODE ---
const darkToggle = document.getElementById('darkToggle');
if (localStorage.getItem('darkMode') === '1') { document.body.classList.add('dark'); darkToggle.textContent = '☀️'; }
darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    darkToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    localStorage.setItem('darkMode', document.body.classList.contains('dark') ? '1' : '0');
});

// --- SHARE ---
document.getElementById('shareBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(location.href).then(() => showToast('🔗 הקישור הועתק!', 2500));
});

// --- COUNTDOWN ---
function updateCountdown() {
    const target = new Date('2026-10-10T00:00:00');
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) {
        document.getElementById('countdown').innerHTML = `<div style="color:var(--rose);font-weight:600">🇹🇭 ברוכות הבאות לתאילנד!</div>`;
        return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('countdown').innerHTML = `
        <div class="countdown-item"><div class="num">${d}</div><div class="label">ימים</div></div>
        <div class="countdown-item"><div class="num">${String(h).padStart(2,'0')}</div><div class="label">שעות</div></div>
        <div class="countdown-item"><div class="num">${String(m).padStart(2,'0')}</div><div class="label">דקות</div></div>
        <div class="countdown-item"><div class="num">${String(s).padStart(2,'0')}</div><div class="label">שניות</div></div>`;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// --- TOAST ---
function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// --- CHECKLIST STATE ---
function getChecked() { return JSON.parse(localStorage.getItem('th-checked') || '{}'); }
function setChecked(obj) { localStorage.setItem('th-checked', JSON.stringify(obj)); }

function updateStats() {
    const total = thailandDays.reduce((s, d) => s + d.activities.length, 0);
    const done = Object.values(getChecked()).filter(Boolean).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    document.getElementById('statsBar').innerHTML = `
        <div class="stat">📅 <strong>${thailandDays.length}</strong> ימים</div>
        <div class="stat">🏙️ <strong>${[...new Set(thailandDays.map(d=>d.city))].length}</strong> יעדים</div>
        <div class="stat">📍 <strong>${total}</strong> פעילויות</div>
        <div class="stat">✅ <strong>${done}/${total}</strong> (${pct}%)</div>`;
    const checked = getChecked();
    thailandDays.forEach(day => {
        const tot = day.activities.length;
        const dn = day.activities.filter((_, i) => checked[`${day.day}-${i}`]).length;
        const bar = document.getElementById(`bar-fill-${day.day}`);
        if (bar) bar.style.width = (dn / tot * 100) + '%';
    });
}

// --- SIDEBAR ---
const itineraryEl = document.getElementById('itinerary');
const typeIcons  = { attraction: '🏛️', cafe: '☕', restaurant: '🍽️' };
const typeLabels = { attraction: 'אטרקציה', cafe: 'בית קפה', restaurant: 'מסעדה' };
let currentCity = '';

function renderItinerary() {
    itineraryEl.innerHTML = '';
    currentCity = '';
    thailandDays.forEach(day => {
    if (day.city !== currentCity) {
        currentCity = day.city;
        const divider = document.createElement('div');
        divider.className = 'city-divider';
        divider.dataset.city = day.city;
        divider.innerHTML = `<span>${thailandCityNames[day.city] || day.city}</span>`;
        itineraryEl.appendChild(divider);
    }

    const checked = getChecked();
    const card = document.createElement('div');
    card.className = 'day-card';
    card.dataset.day = day.day;
    card.dataset.city = day.city;

    const activitiesHtml = day.activities.map((a, i) => {
        const key = `${day.day}-${i}`;
        const typeBadge = a.type ? `<span class="activity-type type-${a.type}">${typeIcons[a.type]} ${typeLabels[a.type]}</span>` : '';
        return `
            <div class="activity ${checked[key] ? 'done' : ''}" id="act-${key}">
                <input type="checkbox" class="activity-check" data-key="${key}" ${checked[key] ? 'checked' : ''}>
                <div class="activity-content" data-day="${day.day}" data-idx="${i}">
                    <span class="activity-time">${formatTimeRange(a.time, a.timeEnd)}</span>
                    <span class="activity-name"> ${a.name}</span>
                    <div class="activity-desc">${a.desc}</div>
                    ${typeBadge}
                </div>
                <div class="activity-actions">
                    ${isConnected() ? `
                    <button class="act-btn edit-btn" data-day="${day.day}" data-idx="${i}" title="ערוך">✏️</button>
                    <button class="act-btn remove-btn" data-day="${day.day}" data-idx="${i}" title="מחק">🗑️</button>
                    ` : ''}
                </div>
            </div>`;
    }).join('');

    card.innerHTML = `
        <div class="day-header">
            <div class="day-badge" style="background:${thailandCityColors[day.city] || '#888'}">${day.day}</div>
            <div style="flex:1">
                <div class="day-title">${day.title}</div>
                <div class="day-date">${day.date} | יום ${day.weekday}</div>
            </div>
            <div class="day-weather">${day.weather}</div>
        </div>
        <div class="day-progress-bar"><div class="day-progress-fill" id="bar-fill-${day.day}" style="width:0%"></div></div>
        <div class="activities">
            ${activitiesHtml}
            ${dayNotesBlockHtml(day)}
        </div>`;

    card.querySelector('.day-header').addEventListener('click', () => {
        const isActive = card.classList.contains('active');
        document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
        if (!isActive) { card.classList.add('active'); selectDayOnMap(day.day); }
        else { selectDayOnMap(null); }
    });

    itineraryEl.appendChild(card);
    });
}

function showItineraryLoading(msg) {
  // Pane overlays already cover loading UI — only inject message on error/empty
  const el = document.getElementById('itinerary');
  if (!el) return;
  if (msg) el.innerHTML = `<div class="boot-loading">${msg}</div>`;
  else el.innerHTML = '';
}

function rebuildDaySelect() {
  if (!daySelect) return;
  const prev = daySelect.value;
  daySelect.innerHTML = '';
  thailandDays.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.day;
    opt.textContent = `יום ${d.day} – ${d.title.replace(/[🛬🏖️⛰️🌴🤿🏙️]/gu,'').trim().substring(0,22)} (${d.date})`;
    daySelect.appendChild(opt);
  });
  if (prev && [...daySelect.options].some(o => o.value === prev)) daySelect.value = prev;
}

// Activity click → map
document.addEventListener('click', e => {
    const content = e.target.closest('.activity-content');
    if (!content) return;
    const d = thailandDays.find(d => d.day === parseInt(content.dataset.day));
    if (!d) return;
    const a = d.activities[parseInt(content.dataset.idx)];
    if (!a?.lat) return;
    map.setView([a.lat, a.lng], 17, { animate: true });
    fetchPlaceDetails(a, d);
});

// Checkboxes
document.addEventListener('change', e => {
    if (!e.target.classList.contains('activity-check')) return;
    const key = e.target.dataset.key;
    const checked = getChecked();
    checked[key] = e.target.checked;
    setChecked(checked);
    document.getElementById(`act-${key}`)?.classList.toggle('done', e.target.checked);
    updateStats();
});

// Day notes (Monday updates + local hide)
bindDayNotesHandlers({ getDays: () => thailandDays, showToast });

// --- SEARCH ---
document.getElementById('searchInput').addEventListener('input', function() {
    const q = this.value.trim().toLowerCase();
    document.querySelectorAll('.day-card').forEach(card => {
        card.classList.toggle('hidden', q.length > 0 && !card.textContent.toLowerCase().includes(q));
    });
});

// --- CITY FILTER ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const city = btn.dataset.city;
        document.querySelectorAll('.day-card').forEach(card => {
            card.classList.toggle('hidden', city !== 'all' && card.dataset.city !== city);
        });
        document.querySelectorAll('.city-divider').forEach(div => {
            div.style.display = (city !== 'all' && div.dataset.city !== city) ? 'none' : '';
        });
        if (city !== 'all') {
            const cityDays = thailandDays.filter(d => d.city === city);
            const lats = cityDays.flatMap(d => d.activities.map(a => a.lat));
            const lngs = cityDays.flatMap(d => d.activities.map(a => a.lng));
            if (lats.length) map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [30,30] });
        } else {
            map.setView([13.7563, 100.5018], 11, { animate: true });
        }
    });
});

// --- ADD PLACE ---
let selectedPlace = null;
const modalOverlay = document.getElementById('modalOverlay');
const daySelect    = document.getElementById('newPlaceDay');

document.getElementById('apiKeyHint').textContent = '🗺️ חיפוש חופשי באמצעות OpenStreetMap';

function updateEditAccess() {
    const connected = isConnected();
    if (typeof addPlaceBtn !== 'undefined' && addPlaceBtn) addPlaceBtn.style.display = connected ? '' : 'none';
    document.querySelectorAll('.activity-actions').forEach(wrap => {
        const content = wrap.closest('.activity')?.querySelector('.activity-content');
        if (!content) return;
        const dayNum = content.dataset.day, idx = content.dataset.idx;
        wrap.innerHTML = connected
            ? `<button class="act-btn edit-btn" data-day="${dayNum}" data-idx="${idx}" title="ערוך">✏️</button>
               <button class="act-btn remove-btn" data-day="${dayNum}" data-idx="${idx}" title="מחק">🗑️</button>`
            : '';
    });
}

const addPlaceBtn = document.createElement('button');
addPlaceBtn.className = 'add-place-btn';
addPlaceBtn.innerHTML = '+';
addPlaceBtn.title = 'הוסף מקום לתוכנית';
if (window.innerWidth <= 768) { document.body.appendChild(addPlaceBtn); }
else { document.querySelector('.map-container').appendChild(addPlaceBtn); }

addPlaceBtn.addEventListener('click', () => {
    if (!requireMonday()) return;
    resetModal();
    if (selectedDayNum) daySelect.value = selectedDayNum;
    modalOverlay.classList.add('open');
    document.getElementById('placesSearchInput').focus();
});

document.getElementById('modalCancel').addEventListener('click', () => { modalOverlay.classList.remove('open'); resetModal(); });
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) { modalOverlay.classList.remove('open'); resetModal(); } });

function resetModal() {
    ['placesSearchInput','newPlaceName','newPlaceDesc'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    setTimeSelectValue(document.getElementById('newPlaceTime'), '');
    setTimeSelectValue(document.getElementById('newPlaceTimeEnd'), '');
    document.getElementById('places-search-results').style.display = 'none';
    selectedPlace = null;
    clearFieldErrors(modalOverlay);
}

let searchTimeout;
document.getElementById('placesSearchInput').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById('places-search-results').style.display = 'none'; return; }
    searchTimeout = setTimeout(() => {
        const container = document.getElementById('places-search-results');
        container.innerHTML = searchSkeleton(3);
        container.style.display = 'block';
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Thailand')}&format=json&limit=5`)
            .then(r => r.json())
            .then(results => {
                if (!results.length) { container.innerHTML = '<div class="place-result">לא נמצאו תוצאות</div>'; container.style.display = 'block'; return; }
                container.innerHTML = results.map(p => `
                    <div class="place-result" data-lat="${p.lat}" data-lng="${p.lon}" data-name="${p.display_name.split(',')[0]}">
                        ${p.display_name.split(',')[0]}
                        <small>${p.display_name.split(',').slice(1,3).join(',')}</small>
                    </div>`).join('');
                container.style.display = 'block';
                container.querySelectorAll('.place-result').forEach(el => {
                    el.addEventListener('click', () => {
                        selectedPlace = { name: el.dataset.name, lat: parseFloat(el.dataset.lat), lng: parseFloat(el.dataset.lng) };
                        document.getElementById('newPlaceName').value = el.dataset.name;
                        document.getElementById('placesSearchInput').value = el.dataset.name;
                        container.style.display = 'none';
                        map.setView([selectedPlace.lat, selectedPlace.lng], 15, { animate: true });
                    });
                });
            }).catch(() => {
                container.innerHTML = '<div class="place-result">שגיאה בחיפוש</div>';
            });
    }, 450);
});

// Add place confirm — optimistic
document.getElementById('modalConfirm').addEventListener('click', function() {
    if (this.dataset.editDay) return;
    if (!requireMonday()) return;
    const checked = validatePlaceForm({ isEdit: false, daysList: thailandDays, selectedPlace });
    if (!checked.ok) { shakeModal('modalOverlay'); return; }
    const { name, desc, time, timeEnd, dayNum, lat, lng } = checked.values;
    const day = thailandDays.find(d => d.day === dayNum);
    if (!day) { shakeModal('modalOverlay'); return; }
    const newAct = { name, time, timeEnd, desc, lat, lng };
    day.activities.push(newAct);
    addMarkerToMap(day, newAct);
    const card = document.querySelector(`.day-card[data-day="${dayNum}"]`);
    const notesWrap = card.querySelector('.day-notes-wrap');
    const i = day.activities.length - 1;
    const key = `${dayNum}-${i}`;
    const actDiv = document.createElement('div');
    actDiv.className = 'activity'; actDiv.id = `act-${key}`;
    actDiv.innerHTML = `
        <input type="checkbox" class="activity-check" data-key="${key}">
        <div class="activity-content" data-day="${dayNum}" data-idx="${i}">
            <span class="activity-time">${formatTimeRange(time, timeEnd)}</span>
            <span class="activity-name"> ${name}</span>
            <div class="activity-desc">${desc}</div>
        </div>
        <div class="activity-actions">
            <button class="act-btn edit-btn" data-day="${dayNum}" data-idx="${i}">✏️</button>
            <button class="act-btn remove-btn" data-day="${dayNum}" data-idx="${i}">🗑️</button>
        </div>`;
    card.querySelector('.activities').insertBefore(actDiv, notesWrap);
    updateStats();
    modalOverlay.classList.remove('open');
    clearFieldErrors(modalOverlay);
    resetModal();
    (async () => {
      const result = await syncActivityCreate(dayNum, day.city, newAct, i);
      if (result.ok) return;
      const idx = day.activities.indexOf(newAct);
      if (idx >= 0) day.activities.splice(idx, 1);
      renderItinerary();
      rebuildMap();
      updateStats();
    })();
});

// Edit / Remove
document.addEventListener('click', e => {
    if (e.target.closest('.remove-btn')) {
        if (!requireMonday()) return;
        const btn = e.target.closest('.remove-btn');
        const dayNum = parseInt(btn.dataset.day), idx = parseInt(btn.dataset.idx);
        const day = thailandDays.find(d => d.day === dayNum);
        const act = day.activities[idx];
        if (!confirm(`מחק "${act.name}"?`)) return;
        const snapshot = { ...act };
        const mondayId = act.mondayId;
        const marker = dayMarkers[dayNum]?.[idx];
        if (marker) { map.removeLayer(marker); dayMarkers[dayNum].splice(idx, 1); }
        day.activities.splice(idx, 1);
        renderItinerary();
        if (selectedDayNum === dayNum) selectDayOnMap(dayNum);
        updateStats();
        (async () => {
          const result = await syncActivityDelete(mondayId);
          if (result.ok) return;
          day.activities.splice(idx, 0, snapshot);
          renderItinerary();
          rebuildMap();
          updateStats();
          if (selectedDayNum === dayNum) selectDayOnMap(dayNum);
        })();
        return;
    }
    if (e.target.closest('.edit-btn')) {
        if (!requireMonday()) return;
        const btn = e.target.closest('.edit-btn');
        const dayNum = parseInt(btn.dataset.day), idx = parseInt(btn.dataset.idx);
        const act = thailandDays.find(d => d.day === dayNum).activities[idx];
        document.getElementById('newPlaceName').value = act.name;
        document.getElementById('newPlaceDesc').value = act.desc || '';
        setTimeSelectValue(document.getElementById('newPlaceTime'), act.time || '');
        setTimeSelectValue(document.getElementById('newPlaceTimeEnd'), act.timeEnd || suggestEndTime(act.time));
        daySelect.value = dayNum;
        selectedPlace = { name: act.name, lat: act.lat, lng: act.lng };
        document.getElementById('placesSearchInput').value = act.name;
        clearFieldErrors(modalOverlay);
        const confirmBtn = document.getElementById('modalConfirm');
        confirmBtn.textContent = 'עדכן ✓';
        confirmBtn.dataset.editDay = dayNum;
        confirmBtn.dataset.editIdx = idx;
        modalOverlay.classList.add('open');
    }
});

// Edit confirm — optimistic
document.getElementById('modalConfirm').addEventListener('click', function() {
    if (!this.dataset.editDay) return;
    if (!requireMonday()) return;
    const dayNum = parseInt(this.dataset.editDay), idx = parseInt(this.dataset.editIdx);
    const day = thailandDays.find(d => d.day === dayNum);
    const act = day.activities[idx];
    const snapshot = { name: act.name, desc: act.desc, time: act.time, timeEnd: act.timeEnd, lat: act.lat, lng: act.lng };
    const checked = validatePlaceForm({
      isEdit: true,
      daysList: thailandDays,
      selectedPlace,
      existingAct: act,
    });
    if (!checked.ok) { shakeModal('modalOverlay'); return; }
    const { name, desc, time, timeEnd, lat, lng } = checked.values;
    act.name = name;
    act.desc = desc;
    act.time = time;
    act.timeEnd = timeEnd;
    act.lat = lat;
    act.lng = lng;
    const actEl = document.getElementById(`act-${dayNum}-${idx}`);
    if (actEl) {
        actEl.querySelector('.activity-name').textContent = ` ${name}`;
        actEl.querySelector('.activity-desc').textContent = act.desc;
        actEl.querySelector('.activity-time').textContent = formatTimeRange(time, timeEnd);
    }
    if (dayMarkers[dayNum]?.[idx]) {
        dayMarkers[dayNum][idx].setLatLng([act.lat, act.lng]);
    }
    this.textContent = 'הוסף לתוכנית ✓';
    delete this.dataset.editDay; delete this.dataset.editIdx;
    modalOverlay.classList.remove('open');
    clearFieldErrors(modalOverlay);
    resetModal();
    (async () => {
      const result = await syncActivityUpdate(act);
      if (result.ok) return;
      Object.assign(act, snapshot);
      const el = document.getElementById(`act-${dayNum}-${idx}`);
      if (el) {
        el.querySelector('.activity-name').textContent = ` ${snapshot.name}`;
        el.querySelector('.activity-desc').textContent = snapshot.desc || '';
        el.querySelector('.activity-time').textContent = formatTimeRange(snapshot.time, snapshot.timeEnd);
      }
      if (dayMarkers[dayNum]?.[idx]) dayMarkers[dayNum][idx].setLatLng([snapshot.lat, snapshot.lng]);
    })();
});

// --- FOOD GUIDE ---
const catOrder = ['thai', 'seafood', 'street', 'rooftop', 'cafe', 'bar'];
let _foodGuideCurrentCity = 'all';

function renderFoodGuide(cityFilter = 'all') {
    const panel = document.getElementById('foodGuidePanel');
    const items = cityFilter === 'all' ? thailandFoodGuide : thailandFoodGuide.filter(f => f.city === cityFilter);
    const grouped = {};
    items.forEach(f => { (grouped[f.category] = grouped[f.category] || []).push(f); });

    let html = '<div class="food-city-filter">';
    [['all','הכל'], ...Object.entries(thailandCityNames)].forEach(([c, lbl]) => {
        html += `<button class="food-city-btn ${cityFilter === c ? 'active' : ''}" data-city="${c}" ${c !== 'all' ? `style="--th-city-color:${thailandCityColors[c]}"` : ''}>${lbl}</button>`;
    });
    if (isConnected()) html += '<button class="food-add-btn" id="foodAddBtn">＋ הוסף</button>';
    html += '</div>';

    if (!items.length) {
        html += `<div style="padding:40px 20px;text-align:center;color:var(--text-light);line-height:1.8">
            עדיין אין מקומות במדריך האוכל של תאילנד.<br>לחצי על <strong>＋ הוסף</strong> להתחיל!
        </div>`;
    } else {
        catOrder.forEach(cat => {
            if (!grouped[cat]) return;
            const ci = thailandFoodCategories[cat];
            html += `<div class="food-cat-section"><div class="food-cat-header">${ci.emoji} ${ci.label}</div>`;
            grouped[cat].forEach(f => {
                const color = thailandCityColors[f.city] || '#888';
                html += `<div class="food-item">
                    <div class="food-item-row">
                        <span class="food-item-name">${f.name}</span>
                        <span class="food-area-chip" style="background:${color}1A;color:${color};border-color:${color}33">${f.area}</span>
                    </div>
                    <div class="food-item-desc">${f.desc}</div>
                    ${f.day ? `<span class="food-day-badge" style="background:${color}">יום ${f.day}</span>` : '<span class="food-day-badge food-day-extra">💡 אופציה</span>'}
                </div>`;
            });
            html += '</div>';
        });
    }

    panel.innerHTML = html;
    panel.querySelectorAll('.food-city-btn').forEach(btn => {
        btn.addEventListener('click', () => { _foodGuideCurrentCity = btn.dataset.city; renderFoodGuide(btn.dataset.city); });
    });
    document.getElementById('foodAddBtn')?.addEventListener('click', () => {
        if (!requireMonday()) return;
        resetFoodModal();
        document.getElementById('foodModalOverlay').classList.add('open');
        document.getElementById('foodItemName').focus();
    });
}

// Food modal
document.getElementById('foodModalCancel').addEventListener('click', () => {
    document.getElementById('foodModalOverlay').classList.remove('open'); resetFoodModal();
});
document.getElementById('foodModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('foodModalOverlay')) { document.getElementById('foodModalOverlay').classList.remove('open'); resetFoodModal(); }
});
function resetFoodModal() {
    ['foodItemName','foodItemArea','foodItemDesc','foodItemDay'].forEach(id => document.getElementById(id).value = '');
    clearFieldErrors(document.getElementById('foodModalOverlay'));
}
document.getElementById('foodModalConfirm').addEventListener('click', () => {
    if (!requireMonday()) return;
    const checked = validateFoodForm({ maxDay: 18 });
    if (!checked.ok) { shakeModal('foodModalOverlay'); return; }
    const { name, city, area, category, desc, day } = checked.values;
    const entry = { name, city, area, category, desc };
    if (day != null) entry.day = day;
    thailandFoodGuide.push(entry);
    document.getElementById('foodModalOverlay').classList.remove('open');
    resetFoodModal();
    renderFoodGuide(_foodGuideCurrentCity);
    (async () => {
      const result = await syncFoodCreate(entry);
      if (result.ok) return;
      const i = thailandFoodGuide.indexOf(entry);
      if (i >= 0) thailandFoodGuide.splice(i, 1);
      renderFoodGuide(_foodGuideCurrentCity);
    })();
});

// Tab switching
document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isFood = tab.dataset.tab === 'food';
        document.getElementById('itinerary').style.display = isFood ? 'none' : '';
        document.getElementById('itineraryFilter').style.display = isFood ? 'none' : '';
        document.getElementById('searchBar').style.display = isFood ? 'none' : '';
        document.getElementById('foodGuidePanel').style.display = isFood ? 'block' : 'none';
        if (isFood) renderFoodGuide(_foodGuideCurrentCity);
    });
});

// Panel back button
document.getElementById('panelBackBtn')?.addEventListener('click', () => document.getElementById('placePanel').classList.remove('open'));

function applyItineraryData(data, { toast } = {}) {
  hidePaneSkeletons(); // close skeleton as soon as we have cache/Monday data
  replaceArray(thailandDays, data.days);
  replaceArray(thailandFoodGuide, data.foodGuide);
  rebuildDaySelect();
  const stats = document.getElementById('statsBar');
  if (stats) stats.dataset.ready = '1';
  renderItinerary();
  rebuildMap();
  updateStats();
  updateEditAccess();
  document.querySelector('.day-card')?.classList.add('active');
  selectDayOnMap(thailandDays[0]?.day || 1);
  setTimeout(() => map.invalidateSize(), 80);
  if (toast) showToast(toast, 2500);
}

async function refreshFromMonday(force = false) {
  const hadCache = !force && !!localStorage.getItem('mondayCache_thailand');
  if (!hadCache) {
    showPaneSkeletons();
    showItineraryLoading();
  } else {
    hidePaneSkeletons();
  }
  try {
    const data = await loadMondayData('thailand', { force });
    if (!data?.days?.length) {
      hidePaneSkeletons();
      showItineraryLoading('⚠️ לא נמצאו ימים ב-Monday. בדקו את הלוח או רעננו.');
      return;
    }
    applyItineraryData(data, {
      toast: force
        ? '✅ נטען מ-Monday'
        : (data.fromCache
          ? (data.stale ? '⚡ מטמון · בודק עדכונים…' : '⚡ נטען מהמטמון')
          : '✅ נטען מ-Monday'),
    });

    if (!force && data.fromCache) {
      revalidateMondayData('thailand').then(fresh => {
        if (!fresh?.days?.length) return;
        applyItineraryData(fresh, { toast: '🔄 עודכן מ-Monday — יש שינויים בלוח' });
      });
    }
  } catch (e) {
    hidePaneSkeletons();
    throw e;
  }
}

window.addEventListener('monday-connected', (e) => refreshFromMonday(!!e.detail?.force));
window.addEventListener('monday-disconnected', () => updateEditAccess());

// --- INIT ---
async function boot() {
  const hasCache = !!localStorage.getItem('mondayCache_thailand');
  if (!hasCache) {
    showPaneSkeletons();
    showItineraryLoading();
  } else {
    hidePaneSkeletons();
  }
  initMap();
  initResize(() => map.invalidateSize());
  initSync('thailand', { autoLoad: false });
  updateEditAccess();
  try {
    await refreshFromMonday(false);
  } catch (e) {
    hidePaneSkeletons();
    showItineraryLoading(`❌ שגיאה בטעינה: ${e.message || e}`);
    showToast('❌ לא ניתן לטעון מ-Monday', 3500);
  }
  updateStats();
}
if (isConnected()) boot();