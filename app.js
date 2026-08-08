import { days, cityNames, cityColors, dayTitlesEn, weekdayEn, TR, foodGuide, foodCategories } from './data.js';
import { map, dayMarkers, allMarkersList, selectedDayNum, selectDayOnMap, addMarkerToMap, fetchPlaceDetails, initMap } from './map.js';
import { ghToken, syncSave, initSync } from './sync.js';

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
    document.querySelectorAll('.day-notes').forEach(el => el.placeholder = tr.notes_ph);
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
function getNotes() { return JSON.parse(localStorage.getItem('notes') || '{}'); }
function setNotes(obj) { localStorage.setItem('notes', JSON.stringify(obj)); }

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
    const notes = getNotes();
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
                    <span class="activity-time">${a.time}</span>
                    <span class="activity-name"> ${a.name}</span>
                    <div class="activity-desc">${a.desc}</div>
                    ${typeBadge}
                </div>
                <div class="activity-actions">
                    <button class="act-btn edit-btn" data-day="${day.day}" data-idx="${i}" title="ערוך">✏️</button>
                    <button class="act-btn remove-btn" data-day="${day.day}" data-idx="${i}" title="מחק">🗑️</button>
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
            <div class="day-notes-wrap">
                <div class="day-notes-label">📝 הערות ליום ${day.day}</div>
                <textarea class="day-notes" data-day="${day.day}" placeholder="הוסף הערות, טיפים, מספרי הזמנה...">${notes[day.day] || ''}</textarea>
            </div>
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

// Notes
document.addEventListener('input', e => {
    if (!e.target.classList.contains('day-notes')) return;
    const notes = getNotes();
    notes[e.target.dataset.day] = e.target.value;
    setNotes(notes);
});

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

days.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.day;
    opt.textContent = `יום ${d.day} – ${d.title.replace(/[🌋🍄🎃✈️]/gu, '').trim()} (${d.date})`;
    daySelect.appendChild(opt);
});

document.getElementById('apiKeyHint').textContent = '🗺️ חיפוש חופשי באמצעות OpenStreetMap — ללא מפתח API';

// "+ add place" button on map
const addPlaceBtn = document.createElement('button');
addPlaceBtn.className = 'add-place-btn';
addPlaceBtn.innerHTML = '+';
addPlaceBtn.title = 'הוסף מקום לתוכנית';
document.querySelector('.map-container').appendChild(addPlaceBtn);

addPlaceBtn.addEventListener('click', () => {
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
    document.getElementById('newPlaceTime').value = '';
    document.getElementById('places-search-results').style.display = 'none';
    selectedPlace = null;
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
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Japan')}&format=json&limit=5&accept-language=he,en`, {
        headers: { 'Accept-Language': 'he,en' }
    })
        .then(r => r.json())
        .then(results => {
            const container = document.getElementById('places-search-results');
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
        }).catch(() => {});
}

// Add new place
document.getElementById('modalConfirm').addEventListener('click', () => {
    if (document.getElementById('modalConfirm').dataset.editDay) return;
    const name = document.getElementById('newPlaceName').value.trim();
    const desc = document.getElementById('newPlaceDesc').value.trim();
    const time = document.getElementById('newPlaceTime').value.trim() || '?';
    const dayNum = parseInt(daySelect.value);
    const day = days.find(d => d.day === dayNum);
    if (!name) { alert('נא להזין שם מקום'); return; }
    if (!selectedPlace) { alert('אנא בחר מקום מהרשימה'); return; }

    const newAct = { name, time, desc, lat: selectedPlace.lat, lng: selectedPlace.lng };
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
            <span class="activity-time">${time}</span>
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
    syncSave(`Add place: ${name} (Day ${dayNum})`);
    modalOverlay.classList.remove('open');
    resetModal();

    showToast(ghToken ? `✅ ${name} נוסף — מעלה ל-GitHub...` : `✅ ${name} נוסף מקומית — לא מחובר ל-GitHub ☁️`, 3000);
});

// --- EDIT / REMOVE ---
document.addEventListener('click', e => {
    if (e.target.closest('.remove-btn')) {
        const btn = e.target.closest('.remove-btn');
        const dayNum = parseInt(btn.dataset.day);
        const idx = parseInt(btn.dataset.idx);
        const day = days.find(d => d.day === dayNum);
        const act = day.activities[idx];
        if (!confirm(`מחק את "${act.name}"?`)) return;

        const marker = dayMarkers[dayNum] && dayMarkers[dayNum][idx];
        if (marker) { map.removeLayer(marker); dayMarkers[dayNum].splice(idx, 1); }
        const mIdx = allMarkersList.findIndex(m => m.marker === marker);
        if (mIdx > -1) allMarkersList.splice(mIdx, 1);

        day.activities.splice(idx, 1);
        document.getElementById(`act-${dayNum}-${idx}`)?.remove();

        if (selectedDayNum === dayNum) selectDayOnMap(dayNum);
        updateStats();
        showToast(ghToken ? '🗑️ מחוק ומסונכרן...' : '🗑️ מחוק מקומית — לא מחובר לסנכרון ☁️', 3000);
        syncSave(`Remove place: ${act.name} (Day ${dayNum})`);
        return;
    }

    if (e.target.closest('.edit-btn')) {
        const btn = e.target.closest('.edit-btn');
        const dayNum = parseInt(btn.dataset.day);
        const idx = parseInt(btn.dataset.idx);
        const day = days.find(d => d.day === dayNum);
        const act = day.activities[idx];

        document.getElementById('newPlaceName').value = act.name;
        document.getElementById('newPlaceDesc').value = act.desc || '';
        document.getElementById('newPlaceTime').value = act.time || '';
        document.getElementById('newPlaceDay').value = dayNum;
        selectedPlace = { name: act.name, lat: act.lat, lng: act.lng };
        document.getElementById('placesSearchInput').value = act.name;

        const confirmBtn = document.getElementById('modalConfirm');
        confirmBtn.textContent = 'עדכן ✓';
        confirmBtn.dataset.editDay = dayNum;
        confirmBtn.dataset.editIdx = idx;

        modalOverlay.classList.add('open');
    }
});

// Edit confirm handler
document.getElementById('modalConfirm').addEventListener('click', function() {
    const editDay = this.dataset.editDay;
    const editIdx = this.dataset.editIdx;
    if (editDay === undefined || editDay === '') return;

    const dayNum = parseInt(editDay);
    const idx = parseInt(editIdx);
    const day = days.find(d => d.day === dayNum);
    const act = day.activities[idx];

    const name = document.getElementById('newPlaceName').value.trim();
    const desc = document.getElementById('newPlaceDesc').value.trim();
    const time = document.getElementById('newPlaceTime').value.trim() || act.time;

    if (!name) return;

    act.name = name; act.desc = desc; act.time = time;
    if (selectedPlace) { act.lat = selectedPlace.lat; act.lng = selectedPlace.lng; }

    const actEl = document.getElementById(`act-${dayNum}-${idx}`);
    if (actEl) {
        actEl.querySelector('.activity-name').textContent = ` ${name}`;
        actEl.querySelector('.activity-desc').textContent = desc;
        actEl.querySelector('.activity-time').textContent = time;
    }

    if (selectedPlace && dayMarkers[dayNum] && dayMarkers[dayNum][idx]) {
        dayMarkers[dayNum][idx].setLatLng([act.lat, act.lng]);
    }

    if (selectedDayNum === dayNum) selectDayOnMap(dayNum);
    syncSave(`Edit place: ${name} (Day ${dayNum})`);

    this.textContent = 'הוסף לתוכנית ✓';
    delete this.dataset.editDay;
    delete this.dataset.editIdx;
    modalOverlay.classList.remove('open');
    resetModal();

    showToast(ghToken ? `✅ ${name} עודכן ומסונכרן!` : `✅ ${name} עודכן מקומית — לא מחובר לסנכרון ☁️`, 3000);
});

// --- FOOD GUIDE ---
const cityLabelsHe = { tokyo: '🗼 טוקיו', kyoto: '⛩️ קיוטו', osaka: '🎡 אוסקה' };
const cityVars = { tokyo: 'var(--tokyo-color)', kyoto: 'var(--kyoto-color)', osaka: 'var(--osaka-color)' };
const catOrder = ['cafe', 'icecream', 'ramen', 'sushi', 'yakiniku', 'katsu', 'gyoza', 'burger', 'pizza', 'bar', 'street'];

function renderFoodGuide(cityFilter = 'all') {
    const panel = document.getElementById('foodGuidePanel');
    const items = cityFilter === 'all' ? foodGuide : foodGuide.filter(f => f.city === cityFilter);

    const grouped = {};
    items.forEach(f => { (grouped[f.category] = grouped[f.category] || []).push(f); });

    let html = '<div class="food-city-filter">';
    [['all', 'הכל'], ['tokyo', '🗼 טוקיו'], ['kyoto', '⛩️ קיוטו'], ['osaka', '🎡 אוסקה']].forEach(([c, lbl]) => {
        html += `<button class="food-city-btn ${cityFilter === c ? 'active' : ''} ${c !== 'all' ? 'city-' + c : ''}" data-city="${c}">${lbl}</button>`;
    });
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
        btn.addEventListener('click', () => renderFoodGuide(btn.dataset.city));
    });
}

document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isFood = tab.dataset.tab === 'food';
        document.getElementById('itinerary').style.display = isFood ? 'none' : '';
        document.getElementById('itineraryFilter').style.display = isFood ? 'none' : '';
        document.querySelector('.search-bar').style.display = isFood ? 'none' : '';
        document.getElementById('foodGuidePanel').style.display = isFood ? 'block' : 'none';
        if (isFood) renderFoodGuide();
    });
});

// --- INIT ---
initMap();
initSync();
document.querySelector('.day-card').classList.add('active');
selectDayOnMap(1);
updateStats();
if (currentLang !== 'he') applyLang(currentLang);
