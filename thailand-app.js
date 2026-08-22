import { thailandDays, thailandCityNames, thailandCityColors, thailandFoodGuide, thailandFoodCategories } from './thailand-data.js';
import { map, dayMarkers, allMarkersList, selectedDayNum, selectDayOnMap, addMarkerToMap, fetchPlaceDetails, initMap } from './thailand-map.js';

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
function getNotes() { return JSON.parse(localStorage.getItem('th-notes') || '{}'); }
function setNotes(obj) { localStorage.setItem('th-notes', JSON.stringify(obj)); }

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
    const notes = getNotes();
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
            <div class="day-notes-wrap">
                <div class="day-notes-label">📝 הערות ליום ${day.day}</div>
                <textarea class="day-notes" data-day="${day.day}" placeholder="הוסף הערות, טיפים, מספרי הזמנה...">${notes[day.day] || ''}</textarea>
            </div>
        </div>`;

    card.querySelector('.day-header').addEventListener('click', () => {
        const isActive = card.classList.contains('active');
        document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
        if (!isActive) { card.classList.add('active'); selectDayOnMap(day.day); }
        else { selectDayOnMap(null); }
    });

    itineraryEl.appendChild(card);
});

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

thailandDays.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.day;
    opt.textContent = `יום ${d.day} – ${d.title.replace(/[🛬🏖️⛰️🌴🤿🏙️]/gu,'').trim().substring(0,22)} (${d.date})`;
    daySelect.appendChild(opt);
});

document.getElementById('apiKeyHint').textContent = '🗺️ חיפוש חופשי באמצעות OpenStreetMap';

const addPlaceBtn = document.createElement('button');
addPlaceBtn.className = 'add-place-btn';
addPlaceBtn.innerHTML = '+';
addPlaceBtn.title = 'הוסף מקום לתוכנית';
if (window.innerWidth <= 768) { document.body.appendChild(addPlaceBtn); }
else { document.querySelector('.map-container').appendChild(addPlaceBtn); }

addPlaceBtn.addEventListener('click', () => {
    if (selectedDayNum) daySelect.value = selectedDayNum;
    modalOverlay.classList.add('open');
    document.getElementById('placesSearchInput').focus();
});

document.getElementById('modalCancel').addEventListener('click', () => { modalOverlay.classList.remove('open'); resetModal(); });
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) { modalOverlay.classList.remove('open'); resetModal(); } });

function resetModal() {
    ['placesSearchInput','newPlaceName','newPlaceDesc','newPlaceTime'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    document.getElementById('places-search-results').style.display = 'none';
    selectedPlace = null;
}

let searchTimeout;
document.getElementById('placesSearchInput').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    const q = this.value.trim();
    if (q.length < 2) { document.getElementById('places-search-results').style.display = 'none'; return; }
    searchTimeout = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Thailand')}&format=json&limit=5`)
            .then(r => r.json())
            .then(results => {
                const container = document.getElementById('places-search-results');
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
            }).catch(() => {});
    }, 450);
});

// Add place confirm
document.getElementById('modalConfirm').addEventListener('click', function() {
    if (this.dataset.editDay) return;
    const name = document.getElementById('newPlaceName').value.trim();
    const desc = document.getElementById('newPlaceDesc').value.trim();
    const time = document.getElementById('newPlaceTime').value.trim() || '?';
    const dayNum = parseInt(daySelect.value);
    const day = thailandDays.find(d => d.day === dayNum);
    if (!name || !selectedPlace) { showToast('נא לחפש ולבחור מקום', 2000); return; }
    const newAct = { name, time, desc, lat: selectedPlace.lat, lng: selectedPlace.lng };
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
            <span class="activity-time">${time}</span>
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
    resetModal();
    showToast(`✅ ${name} נוסף`, 3000);
});

// Edit / Remove
document.addEventListener('click', e => {
    if (e.target.closest('.remove-btn')) {
        const btn = e.target.closest('.remove-btn');
        const dayNum = parseInt(btn.dataset.day), idx = parseInt(btn.dataset.idx);
        const day = thailandDays.find(d => d.day === dayNum);
        if (!confirm(`מחק "${day.activities[idx].name}"?`)) return;
        const marker = dayMarkers[dayNum]?.[idx];
        if (marker) { map.removeLayer(marker); dayMarkers[dayNum].splice(idx, 1); }
        day.activities.splice(idx, 1);
        document.getElementById(`act-${dayNum}-${idx}`)?.remove();
        if (selectedDayNum === dayNum) selectDayOnMap(dayNum);
        updateStats();
        showToast('🗑️ נמחק', 2000);
        return;
    }
    if (e.target.closest('.edit-btn')) {
        const btn = e.target.closest('.edit-btn');
        const dayNum = parseInt(btn.dataset.day), idx = parseInt(btn.dataset.idx);
        const act = thailandDays.find(d => d.day === dayNum).activities[idx];
        document.getElementById('newPlaceName').value = act.name;
        document.getElementById('newPlaceDesc').value = act.desc || '';
        document.getElementById('newPlaceTime').value = act.time || '';
        daySelect.value = dayNum;
        selectedPlace = { name: act.name, lat: act.lat, lng: act.lng };
        document.getElementById('placesSearchInput').value = act.name;
        const confirmBtn = document.getElementById('modalConfirm');
        confirmBtn.textContent = 'עדכן ✓';
        confirmBtn.dataset.editDay = dayNum;
        confirmBtn.dataset.editIdx = idx;
        modalOverlay.classList.add('open');
    }
});

// Edit confirm
document.getElementById('modalConfirm').addEventListener('click', function() {
    if (!this.dataset.editDay) return;
    const dayNum = parseInt(this.dataset.editDay), idx = parseInt(this.dataset.editIdx);
    const day = thailandDays.find(d => d.day === dayNum);
    const act = day.activities[idx];
    const name = document.getElementById('newPlaceName').value.trim();
    if (!name) return;
    act.name = name;
    act.desc = document.getElementById('newPlaceDesc').value.trim();
    act.time = document.getElementById('newPlaceTime').value.trim() || act.time;
    if (selectedPlace) { act.lat = selectedPlace.lat; act.lng = selectedPlace.lng; }
    const actEl = document.getElementById(`act-${dayNum}-${idx}`);
    if (actEl) {
        actEl.querySelector('.activity-name').textContent = ` ${name}`;
        actEl.querySelector('.activity-desc').textContent = act.desc;
        actEl.querySelector('.activity-time').textContent = act.time;
    }
    this.textContent = 'הוסף לתוכנית ✓';
    delete this.dataset.editDay; delete this.dataset.editIdx;
    modalOverlay.classList.remove('open');
    resetModal();
    showToast(`✅ ${name} עודכן`, 2500);
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
    html += '<button class="food-add-btn" id="foodAddBtn">＋ הוסף</button></div>';

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
}
document.getElementById('foodModalConfirm').addEventListener('click', () => {
    const name = document.getElementById('foodItemName').value.trim();
    const city = document.getElementById('foodItemCity').value;
    const area = document.getElementById('foodItemArea').value.trim();
    const category = document.getElementById('foodItemCategory').value;
    const desc = document.getElementById('foodItemDesc').value.trim();
    const dayVal = document.getElementById('foodItemDay').value.trim();
    if (!name || !area) { showToast('נא למלא שם ואיזור', 2000); return; }
    const entry = { name, city, area, category, desc };
    if (dayVal) entry.day = parseInt(dayVal);
    thailandFoodGuide.push(entry);
    document.getElementById('foodModalOverlay').classList.remove('open');
    resetFoodModal();
    renderFoodGuide(_foodGuideCurrentCity);
    showToast(`✅ ${name} נוסף למדריך`, 2500);
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

// --- MOBILE SIDEBAR DRAG ---
(function() {
    const bar = document.getElementById('sidebarDragBar');
    if (!bar) return;
    const sidebar = document.querySelector('.sidebar');
    let startY = 0, startH = 0;
    const isMobile = () => window.innerWidth <= 768;
    bar.addEventListener('touchstart', e => { if (!isMobile()) return; startY = e.touches[0].clientY; startH = sidebar.getBoundingClientRect().height; sidebar.style.transition = 'none'; }, { passive: true });
    bar.addEventListener('touchmove', e => { if (!isMobile()) return; const dy = startY - e.touches[0].clientY; const vh = window.innerHeight; sidebar.style.height = Math.min(Math.max(startH + dy, 44), vh * 0.96) + 'px'; }, { passive: true });
    bar.addEventListener('touchend', () => {
        if (!isMobile()) return;
        const vh = window.innerHeight, h = sidebar.getBoundingClientRect().height;
        sidebar.style.transition = '';
        if (h < vh * 0.25) sidebar.style.height = '44px';
        else if (h < vh * 0.72) sidebar.style.height = (vh * 0.58) + 'px';
        else sidebar.style.height = (vh * 0.92) + 'px';
        setTimeout(() => map.invalidateSize(), 320);
    });
})();

// Panel back button
document.getElementById('panelBackBtn')?.addEventListener('click', () => document.getElementById('placePanel').classList.remove('open'));

// --- INIT ---
initMap();
document.querySelector('.day-card')?.classList.add('active');
selectDayOnMap(1);
updateStats();
