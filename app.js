import { days, cityNames, cityColors, dayTitlesEn, weekdayEn, TR, foodGuide, foodCategories } from './data.js';
localStorage.setItem('honeymoon-country', 'japan');
import { map, dayMarkers, allMarkersList, selectedDayNum, selectDayOnMap, addMarkerToMap, fetchPlaceDetails, initMap, rebuildMap } from './map.js';
import {
  isConnected, requireMonday, initSync, loadMondayData, revalidateMondayData,
  syncActivityCreate, syncActivityUpdate, syncActivityDelete, syncFoodCreate, syncNoteCreate,
} from './sync.js';
import { initResize } from './resize.js';
import { searchSkeleton, showPaneSkeletons, hidePaneSkeletons } from './skeleton.js';
import {
  validatePlaceForm, validateFoodForm,
  clearFieldErrors, bindClearOnInput, shakeModal,
} from './validate.js';
import { fillTimeSelect, setTimeSelectValue, suggestEndTime, formatTimeRange } from './time-options.js';

if (localStorage.getItem('mondayCache_japan')) hidePaneSkeletons();
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

// --- LANGUAGE ---
let currentLang = localStorage.getItem('lang') || 'he';

function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    const tr = TR[lang];
    document.documentElement.dir = tr.dir;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.dataset.i18n; if (tr[k] !== undefined) el.textContent = tr[k];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const k = el.dataset.i18nPh; if (tr[k] !== undefined) el.placeholder = tr[k];
    });
    document.getElementById('langBtn').textContent = tr.lang_btn;
    updateCountdown();
    updateStats();
    days.forEach(d => {
        const card = document.querySelector(`.day-card[data-day="${d.day}"]`);
        if (!card) return;
        const titleEl = card.querySelector('.day-title');
        if (titleEl) titleEl.textContent = lang === 'en' ? (dayTitlesEn[d.day] || d.title) : d.title;
        const dateEl = card.querySelector('.day-date');
        if (dateEl) {
            const wd = lang === 'en' ? weekdayEn[d.weekday] : d.weekday;
            dateEl.textContent = `${d.date} | ${tr.day_prefix}${wd}`;
        }
    });
}

document.getElementById('langBtn').addEventListener('click', () => applyLang(currentLang === 'he' ? 'en' : 'he'));

// --- DARK MODE ---
const darkToggle = document.getElementById('darkToggle');
if (localStorage.getItem('darkMode') === '1') { document.body.classList.add('dark'); darkToggle.textContent = '☀️'; }
darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark ? '1' : '0');
});

// --- SHARE ---
document.getElementById('shareBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(location.href).then(() => {
        showToast('🔗 הקישור הועתק!', 2500);
    });
});

// --- COUNTDOWN ---
function updateCountdown() {
    const target = new Date('2026-09-27T00:00:00');
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) {
        document.getElementById('countdown').innerHTML = `<div style="color:var(--rose);font-weight:600">${TR[currentLang].trip_started}</div>`;
        return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const tr = TR[currentLang];
    document.getElementById('countdown').innerHTML = `
        <div class="countdown-item"><div class="num">${d}</div><div class="label">${tr.days_lbl}</div></div>
        <div class="countdown-item"><div class="num">${String(h).padStart(2,'0')}</div><div class="label">${tr.hours_lbl}</div></div>
        <div class="countdown-item"><div class="num">${String(m).padStart(2,'0')}</div><div class="label">${tr.min_lbl}</div></div>
        <div class="countdown-item"><div class="num">${String(s).padStart(2,'0')}</div><div class="label">${tr.sec_lbl}</div></div>
    `;
}
updateCountdown();
setInterval(updateCountdown, 1000);

// --- TOAST ---
function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, duration);
}

// --- CHECKLIST STATE ---
function getChecked() { return JSON.parse(localStorage.getItem('checked') || '{}'); }
function setChecked(obj) { localStorage.setItem('checked', JSON.stringify(obj)); }
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNoteTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function notesListHtml(day) {
  const notes = day.notes || [];
  if (!notes.length) {
    return `<div class="day-notes-empty">${isConnected() ? 'אין הערות עדיין' : 'חברי Monday כדי לראות הערות'}</div>`;
  }
  return notes.map(n => `
    <div class="day-note" data-note-id="${n.id || ''}">
      <div class="day-note-meta">${escapeHtml(n.author || 'הערה')}${n.createdAt ? ` · ${formatNoteTime(n.createdAt)}` : ''}</div>
      <div class="day-note-text">${escapeHtml(n.text)}</div>
    </div>
  `).join('');
}

function dayNotesBlockHtml(day) {
  const connected = isConnected();
  return `
    <div class="day-notes-wrap" data-day="${day.day}">
      <div class="day-notes-label">📝 הערות ליום ${day.day}</div>
      <div class="day-notes-list">${notesListHtml(day)}</div>
      ${connected ? `
        <div class="day-notes-composer">
          <textarea class="day-notes-input" data-day="${day.day}" rows="2" placeholder="הוסף הערה, טיפ, מספר הזמנה..."></textarea>
          <button type="button" class="day-notes-add" data-day="${day.day}">הוסף הערה</button>
        </div>
      ` : `<div class="day-notes-empty">חברי Monday כדי להוסיף הערות</div>`}
    </div>`;
}

function countChecked() {
    return Object.values(getChecked()).filter(Boolean).length;
}

function updateStats() {
    const total = days.reduce((s, d) => s + d.activities.length, 0);
    const done = countChecked();
    const pct = Math.round(done / total * 100);
    const str = TR[currentLang];
    document.getElementById('statsBar').innerHTML = `
        <div class="stat">📅 <strong>14</strong> ${str.stat_days}</div>
        <div class="stat">🏙️ <strong>3</strong> ${str.stat_cities}</div>
        <div class="stat">📍 <strong>${total}</strong> ${str.stat_acts}</div>
        <div class="stat">✅ <strong>${done}/${total}</strong> (${pct}%)</div>
    `;
    document.getElementById('overlayProgress').innerHTML = `✅ ${done}/${total} פעילויות (${pct}%)`;
    updateAllProgressBars();
}

function updateAllProgressBars() {
    const checked = getChecked();
    days.forEach(day => {
        const total = day.activities.length;
        const done = day.activities.filter((_, i) => checked[`${day.day}-${i}`]).length;
        const bar = document.getElementById(`bar-fill-${day.day}`);
        if (bar) bar.style.width = (done / total * 100) + '%';
    });
}

// --- TYPE LABELS ---
const typeIcons  = { attraction: '🏛️', cafe: '☕', restaurant: '🍽️' };
const typeLabels = { attraction: 'אטרקציה', cafe: 'בית קפה', restaurant: 'מסעדה' };

// --- SIDEBAR ---
const itineraryEl = document.getElementById('itinerary');
let currentCity = '';

function renderItinerary() {
    itineraryEl.innerHTML = '';
    currentCity = '';
    days.forEach(day => {
    if (day.city !== currentCity) {
        currentCity = day.city;
        const divider = document.createElement('div');
        divider.className = 'city-divider';
        divider.dataset.city = day.city;
        divider.innerHTML = `<span>${cityNames[day.city]}</span><span class="city-progress" id="city-prog-${day.city}"></span>`;
        itineraryEl.appendChild(divider);
    }

    const checked = getChecked();
    const card = document.createElement('div');
    card.className = 'day-card';
    card.dataset.day = day.day;
    card.dataset.city = day.city;

    const activitiesHtml = day.activities.map((a, i) => {
        const key = `${day.day}-${i}`;
        const isDone = checked[key] ? 'done' : '';
        const isChecked = checked[key] ? 'checked' : '';
        const typeBadge = a.type ? `<span class="activity-type type-${a.type}">${typeIcons[a.type]} ${typeLabels[a.type]}</span>` : '';
        return `
            <div class="activity ${isDone}" id="act-${key}">
                <input type="checkbox" class="activity-check" data-key="${key}" ${isChecked}>
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
            <div class="day-badge ${day.city}">${day.day}</div>
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
        </div>
    `;

    card.querySelector('.day-header').addEventListener('click', () => {
        const isActive = card.classList.contains('active');
        document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
        if (!isActive) {
            card.classList.add('active');
            selectDayOnMap(day.day);
        } else {
            selectDayOnMap(null);
        }
    });

    itineraryEl.appendChild(card);
    });
    updateAllProgressBars();
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
  days.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.day;
    opt.textContent = `יום ${d.day} – ${d.title.replace(/[🌋🍄🎃✈️]/gu, '').trim()} (${d.date})`;
    daySelect.appendChild(opt);
  });
  if (prev && [...daySelect.options].some(o => o.value === prev)) daySelect.value = prev;
}

// Activity content click → focus map + open place panel
document.addEventListener('click', e => {
    const content = e.target.closest('.activity-content');
    if (!content) return;
    const dayNum = parseInt(content.dataset.day);
    const idx = parseInt(content.dataset.idx);
    const d = days.find(d => d.day === dayNum);
    if (!d) return;
    const a = d.activities[idx];
    if (!a || !a.lat || !a.lng) return;
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
    const actEl = document.getElementById(`act-${key}`);
    if (actEl) actEl.classList.toggle('done', e.target.checked);
    updateStats();
});

// Day notes → Monday updates
document.addEventListener('click', async (e) => {
  const addBtn = e.target.closest('.day-notes-add');
  if (!addBtn) return;
  if (!requireMonday()) return;
  const dayNum = parseInt(addBtn.dataset.day, 10);
  const day = days.find(d => d.day === dayNum);
  if (!day?.mondayId) {
    showToast('חסר מזהה Monday ליום', 2500);
    return;
  }
  const wrap = addBtn.closest('.day-notes-wrap');
  const input = wrap?.querySelector('.day-notes-input');
  const text = input?.value.trim() || '';
  if (text.length < 2) {
    showToast('כתבי הערה קצרה לפחות', 2000);
    return;
  }
  addBtn.disabled = true;
  const result = await syncNoteCreate(dayNum, text, day.mondayId);
  addBtn.disabled = false;
  if (!result.ok) return;
  day.notes = day.notes || [];
  day.notes.push(result.note);
  const list = wrap.querySelector('.day-notes-list');
  if (list) list.innerHTML = notesListHtml(day);
  if (input) input.value = '';
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || (!e.metaKey && !e.ctrlKey)) return;
  if (!e.target.classList.contains('day-notes-input')) return;
  e.preventDefault();
  e.target.closest('.day-notes-wrap')?.querySelector('.day-notes-add')?.click();
});

function updateEditAccess() {
    const connected = isConnected();
    if (typeof addPlaceBtn !== 'undefined' && addPlaceBtn) {
        addPlaceBtn.style.display = connected ? '' : 'none';
        addPlaceBtn.title = connected ? 'הוסף מקום לתוכנית' : 'חברי Monday כדי להוסיף';
    }
    document.querySelectorAll('.activity-actions').forEach(wrap => {
        const act = wrap.closest('.activity');
        if (!act) return;
        const content = act.querySelector('.activity-content');
        if (!content) return;
        const dayNum = content.dataset.day;
        const idx = content.dataset.idx;
        wrap.innerHTML = connected
            ? `<button class="act-btn edit-btn" data-day="${dayNum}" data-idx="${idx}" title="ערוך">✏️</button>
               <button class="act-btn remove-btn" data-day="${dayNum}" data-idx="${idx}" title="מחק">🗑️</button>`
            : '';
    });
}

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
            const cityDays = days.filter(d => d.city === city);
            const lats = cityDays.flatMap(d => d.activities.map(a => a.lat));
            const lngs = cityDays.flatMap(d => d.activities.map(a => a.lng));
            map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [30, 30], animate: true });
        } else {
            map.setView([35.6762, 139.6503], 11, { animate: true });
        }
    });
});

// --- ADD PLACE MODAL ---
let selectedPlace = null;
const modalOverlay = document.getElementById('modalOverlay');
const daySelect = document.getElementById('newPlaceDay');

document.getElementById('apiKeyHint').textContent = '🗺️ חיפוש חופשי באמצעות OpenStreetMap — ללא מפתח API';

// "+ add place" button on map
const addPlaceBtn = document.createElement('button');
addPlaceBtn.className = 'add-place-btn';
addPlaceBtn.innerHTML = '+';
addPlaceBtn.title = 'הוסף מקום לתוכנית';
// On mobile: append to body so it's in root stacking context (above sidebar z-index)
if (window.innerWidth <= 768) {
    document.body.appendChild(addPlaceBtn);
} else {
    document.querySelector('.map-container').appendChild(addPlaceBtn);
}

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
    document.getElementById('placesSearchInput').value = '';
    document.getElementById('newPlaceName').value = '';
    document.getElementById('newPlaceDesc').value = '';
    setTimeSelectValue(document.getElementById('newPlaceTime'), '');
    setTimeSelectValue(document.getElementById('newPlaceTimeEnd'), '');
    document.getElementById('places-search-results').style.display = 'none';
    selectedPlace = null;
    clearFieldErrors(modalOverlay);
}

// Nominatim search
let searchTimeout;
document.getElementById('placesSearchInput').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById('places-search-results').style.display = 'none'; return; }
    searchTimeout = setTimeout(() => searchNominatim(q), 450);
});

function searchNominatim(query) {
    const container = document.getElementById('places-search-results');
    container.innerHTML = searchSkeleton(3);
    container.style.display = 'block';
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Japan')}&format=json&limit=5&accept-language=he,en`, {
        headers: { 'Accept-Language': 'he,en' }
    })
        .then(r => r.json())
        .then(results => {
            if (!results.length) { container.innerHTML = '<div class="place-result">לא נמצאו תוצאות</div>'; container.style.display = 'block'; return; }
            container.innerHTML = results.map(p => `
                <div class="place-result" data-lat="${p.lat}" data-lng="${p.lon}" data-name="${p.display_name.split(',')[0]}" data-addr="${p.display_name}">
                    ${p.display_name.split(',')[0]}
                    <small>${p.display_name.split(',').slice(1, 3).join(',')}</small>
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
}

// Add new place — optimistic UI, then Monday save banner
document.getElementById('modalConfirm').addEventListener('click', () => {
    if (document.getElementById('modalConfirm').dataset.editDay) return;
    if (!requireMonday()) return;
    const checked = validatePlaceForm({ isEdit: false, daysList: days, selectedPlace });
    if (!checked.ok) { shakeModal('modalOverlay'); return; }
    const { name, desc, time, timeEnd, dayNum, lat, lng } = checked.values;
    const day = days.find(d => d.day === dayNum);
    if (!day) { shakeModal('modalOverlay'); return; }

    const newAct = { name, time, timeEnd, desc, lat, lng };
    day.activities.push(newAct);
    addMarkerToMap(day, newAct);

    const card = document.querySelector(`.day-card[data-day="${dayNum}"]`);
    const activitiesEl = card.querySelector('.activities');
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
            <button class="act-btn edit-btn" data-day="${dayNum}" data-idx="${i}" title="ערוך">✏️</button>
            <button class="act-btn remove-btn" data-day="${dayNum}" data-idx="${i}" title="מחק">🗑️</button>
        </div>`;
    activitiesEl.insertBefore(actDiv, notesWrap);
    updateStats();
    if (selectedDayNum === dayNum) selectDayOnMap(dayNum);
    modalOverlay.classList.remove('open');
    clearFieldErrors(modalOverlay);
    resetModal();

    (async () => {
      const result = await syncActivityCreate(dayNum, day.city, newAct, i);
      if (result.ok) return;
      // rollback optimistic add
      const idx = day.activities.indexOf(newAct);
      if (idx >= 0) {
        const marker = dayMarkers[dayNum]?.[idx];
        if (marker) { map.removeLayer(marker); dayMarkers[dayNum].splice(idx, 1); }
        const mIdx = allMarkersList.findIndex(m => m.marker === marker);
        if (mIdx > -1) allMarkersList.splice(mIdx, 1);
        day.activities.splice(idx, 1);
      }
      renderItinerary();
      rebuildMap();
      updateStats();
      if (selectedDayNum === dayNum) selectDayOnMap(dayNum);
    })();
});

// --- EDIT / REMOVE ---
document.addEventListener('click', e => {
    if (e.target.closest('.remove-btn')) {
        if (!requireMonday()) return;
        const btn = e.target.closest('.remove-btn');
        const dayNum = parseInt(btn.dataset.day);
        const idx = parseInt(btn.dataset.idx);
        const day = days.find(d => d.day === dayNum);
        const act = day.activities[idx];
        if (!confirm(`מחק את "${act.name}"?`)) return;

        const snapshot = { ...act };
        const mondayId = act.mondayId;
        const marker = dayMarkers[dayNum] && dayMarkers[dayNum][idx];
        if (marker) { map.removeLayer(marker); dayMarkers[dayNum].splice(idx, 1); }
        const mIdx = allMarkersList.findIndex(m => m.marker === marker);
        if (mIdx > -1) allMarkersList.splice(mIdx, 1);

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
        const dayNum = parseInt(btn.dataset.day);
        const idx = parseInt(btn.dataset.idx);
        const day = days.find(d => d.day === dayNum);
        const act = day.activities[idx];

        document.getElementById('newPlaceName').value = act.name;
        document.getElementById('newPlaceDesc').value = act.desc || '';
        setTimeSelectValue(document.getElementById('newPlaceTime'), act.time || '');
        setTimeSelectValue(document.getElementById('newPlaceTimeEnd'), act.timeEnd || suggestEndTime(act.time));
        document.getElementById('newPlaceDay').value = dayNum;
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

// Edit confirm — optimistic, banner while Monday responds
document.getElementById('modalConfirm').addEventListener('click', function() {
    const editDay = this.dataset.editDay;
    const editIdx = this.dataset.editIdx;
    if (editDay === undefined || editDay === '') return;
    if (!requireMonday()) return;

    const dayNum = parseInt(editDay);
    const idx = parseInt(editIdx);
    const day = days.find(d => d.day === dayNum);
    const act = day.activities[idx];
    const snapshot = { name: act.name, desc: act.desc, time: act.time, timeEnd: act.timeEnd, lat: act.lat, lng: act.lng };

    const checked = validatePlaceForm({
      isEdit: true,
      daysList: days,
      selectedPlace,
      existingAct: act,
    });
    if (!checked.ok) { shakeModal('modalOverlay'); return; }
    const { name, desc, time, timeEnd, lat, lng } = checked.values;

    act.name = name; act.desc = desc; act.time = time; act.timeEnd = timeEnd;
    act.lat = lat; act.lng = lng;

    const actEl = document.getElementById(`act-${dayNum}-${idx}`);
    if (actEl) {
        actEl.querySelector('.activity-name').textContent = ` ${name}`;
        actEl.querySelector('.activity-desc').textContent = desc;
        actEl.querySelector('.activity-time').textContent = formatTimeRange(time, timeEnd);
    }

    if (dayMarkers[dayNum] && dayMarkers[dayNum][idx]) {
        dayMarkers[dayNum][idx].setLatLng([act.lat, act.lng]);
    }

    if (selectedDayNum === dayNum) selectDayOnMap(dayNum);

    this.textContent = 'הוסף לתוכנית ✓';
    delete this.dataset.editDay;
    delete this.dataset.editIdx;
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
      if (selectedDayNum === dayNum) selectDayOnMap(dayNum);
    })();
});

// --- FOOD GUIDE ---
const cityLabelsHe = { tokyo: '🗼 טוקיו', kyoto: '⛩️ קיוטו', osaka: '🎡 אוסקה' };
const cityVars = { tokyo: 'var(--tokyo-color)', kyoto: 'var(--kyoto-color)', osaka: 'var(--osaka-color)' };
const catOrder = ['cafe', 'icecream', 'ramen', 'sushi', 'yakiniku', 'katsu', 'gyoza', 'burger', 'pizza', 'bar', 'street'];
let _foodGuideCurrentCity = 'all';

function renderFoodGuide(cityFilter = 'all') {
    const panel = document.getElementById('foodGuidePanel');
    const items = cityFilter === 'all' ? foodGuide : foodGuide.filter(f => f.city === cityFilter);

    const grouped = {};
    items.forEach(f => { (grouped[f.category] = grouped[f.category] || []).push(f); });

    let html = '<div class="food-city-filter">';
    [['all', 'הכל'], ['tokyo', '🗼 טוקיו'], ['kyoto', '⛩️ קיוטו'], ['osaka', '🎡 אוסקה']].forEach(([c, lbl]) => {
        html += `<button class="food-city-btn ${cityFilter === c ? 'active' : ''} ${c !== 'all' ? 'city-' + c : ''}" data-city="${c}">${lbl}</button>`;
    });
    if (isConnected()) html += '<button class="food-add-btn" id="foodAddBtn">＋ הוסף</button>';
    html += '</div>';

    catOrder.forEach(cat => {
        if (!grouped[cat]) return;
        const ci = foodCategories[cat];
        html += `<div class="food-cat-section"><div class="food-cat-header">${ci.emoji} ${ci.label}</div>`;
        grouped[cat].forEach(f => {
            const cv = cityVars[f.city];
            html += `<div class="food-item">
                <div class="food-item-row">
                    <span class="food-item-name">${f.name}</span>
                    <span class="food-area-chip" style="background:${cv}1A;color:${cv};border-color:${cv}33">${f.area}</span>
                </div>
                <div class="food-item-desc">${f.desc}</div>
                ${f.day ? `<span class="food-day-badge food-day-${f.city}">יום ${f.day}</span>` : '<span class="food-day-badge food-day-extra">💡 אופציה</span>'}
            </div>`;
        });
        html += '</div>';
    });

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

// --- FOOD GUIDE MODAL ---
document.getElementById('foodModalCancel').addEventListener('click', () => {
    document.getElementById('foodModalOverlay').classList.remove('open');
    resetFoodModal();
});
document.getElementById('foodModalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('foodModalOverlay')) {
        document.getElementById('foodModalOverlay').classList.remove('open');
        resetFoodModal();
    }
});
function resetFoodModal() {
    ['foodItemName','foodItemArea','foodItemDesc','foodItemDay'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('foodItemCity').value = 'tokyo';
    document.getElementById('foodItemCategory').value = 'cafe';
    clearFieldErrors(document.getElementById('foodModalOverlay'));
}
document.getElementById('foodModalConfirm').addEventListener('click', () => {
    if (!requireMonday()) return;
    const checked = validateFoodForm({ maxDay: 14 });
    if (!checked.ok) { shakeModal('foodModalOverlay'); return; }
    const { name, city, area, category, desc, day } = checked.values;
    const entry = { name, city, area, category, desc };
    if (day != null) entry.day = day;
    foodGuide.push(entry);
    document.getElementById('foodModalOverlay').classList.remove('open');
    resetFoodModal();
    renderFoodGuide(_foodGuideCurrentCity);
    (async () => {
      const result = await syncFoodCreate(entry);
      if (result.ok) return;
      const i = foodGuide.indexOf(entry);
      if (i >= 0) foodGuide.splice(i, 1);
      renderFoodGuide(_foodGuideCurrentCity);
    })();
});

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

// --- PANEL BACK BUTTON ---
document.getElementById('panelBackBtn')?.addEventListener('click', () => {
    document.getElementById('placePanel').classList.remove('open');
});

function applyItineraryData(data, { toast } = {}) {
  hidePaneSkeletons(); // close skeleton as soon as we have cache/Monday data
  replaceArray(days, data.days);
  replaceArray(foodGuide, data.foodGuide);
  rebuildDaySelect();
  const stats = document.getElementById('statsBar');
  if (stats) stats.dataset.ready = '1';
  renderItinerary();
  rebuildMap();
  updateStats();
  updateEditAccess();
  document.querySelector('.day-card')?.classList.add('active');
  selectDayOnMap(days[0]?.day || 1);
  setTimeout(() => map.invalidateSize(), 80);
  if (toast) showToast(toast, 2500);
}

async function refreshFromMonday(force = false) {
  const hadCache = !force && !!localStorage.getItem('mondayCache_japan');
  if (!hadCache) {
    showPaneSkeletons();
    showItineraryLoading();
  } else {
    hidePaneSkeletons();
  }
  try {
    const data = await loadMondayData('japan', { force });
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
      revalidateMondayData('japan').then(fresh => {
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
  const hasCache = !!localStorage.getItem('mondayCache_japan');
  if (!hasCache) {
    showPaneSkeletons();
    showItineraryLoading();
  } else {
    hidePaneSkeletons();
  }
  initMap();
  initResize(() => map.invalidateSize());
  initSync('japan', { autoLoad: false });
  updateEditAccess();
  try {
    await refreshFromMonday(false);
  } catch (e) {
    hidePaneSkeletons();
    showItineraryLoading(`❌ שגיאה בטעינה: ${e.message || e}`);
    showToast('❌ לא ניתן לטעון מ-Monday', 3500);
  }
  updateStats();
  if (currentLang !== 'he') applyLang(currentLang);
}
if (isConnected()) boot();
