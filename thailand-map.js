import { thailandDays as days, thailandCityColors as cityColors } from './thailand-data.js';

export const map = L.map('map', { zoomControl: false }).setView([13.7563, 100.5018], 12);
L.control.zoom({ position: 'topleft' }).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd', maxZoom: 19
}).addTo(map);

export const dayMarkers = {};
export const allMarkersList = [];
let currentPolyline = null;
export let selectedDayNum = null;

export function getPlaceEmoji(act) {
    const t = (act.name + ' ' + (act.desc || '')).toLowerCase();
    if (/pad thai|tom yum|massaman|green curry|somtam|mango sticky|restaurant|מסעדה|אוכל/i.test(t)) return '🍽️';
    if (/temple|wat |shrine|buddha|วัด/i.test(t)) return '🏛️';
    if (/שוק|market|chatuchak|floating|bazaar|night market/i.test(t)) return '🛍️';
    if (/מלון|hotel|resort|check.in/i.test(t)) return '🏨';
    if (/airport|שדה תעופה|suvarnabhumi|dmk|hkt|usm|bkk/i.test(t)) return '✈️';
    if (/beach|חוף|island|ko |koh |samui|phuket|phi phi|krabi/i.test(t)) return '🏖️';
    if (/elephant|פיל|tiger|zoo|sanctuary/i.test(t)) return '🐘';
    if (/waterfall|מפל/i.test(t)) return '💧';
    if (/rooftop|sky bar|leilה|night/i.test(t)) return '🌆';
    if (/spa|massage|עיסוי/i.test(t)) return '💆';
    if (/boat|longtail|cruise|שייט|kayak/i.test(t)) return '⛵';
    if (/mall|central|iconsiam|קניות|shopping/i.test(t)) return '🛍️';
    if (/grab|taxi|tuk.tuk|tuktuk/i.test(t)) return '🛺';
    return '📍';
}

export function buildMarkerIcon(day, act, opacity = 1) {
    const emoji = getPlaceEmoji(act);
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width:34px;height:34px;
            background:${cityColors[day.city]};
            border:2.5px solid white;
            border-radius:50%;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
            display:flex;align-items:center;justify-content:center;
            font-size:15px;
            opacity:${opacity};
            transition:opacity 0.3s;
        ">${emoji}</div>`,
        iconSize: [34, 34], iconAnchor: [17, 17]
    });
}

export function selectDayOnMap(dayNum) {
    selectedDayNum = dayNum;
    if (currentPolyline) { map.removeLayer(currentPolyline); currentPolyline = null; }

    if (dayNum === null) {
        allMarkersList.forEach(({ marker, day: d, act: a }) => marker.setIcon(buildMarkerIcon(d, a, 1)));
        const allMks = Object.values(dayMarkers).flat();
        if (allMks.length > 1) map.fitBounds(L.featureGroup(allMks).getBounds().pad(0.1), { animate: true });
        return;
    }

    allMarkersList.forEach(({ marker, dayNum: dn, day: d, act: a }) => {
        marker.setIcon(buildMarkerIcon(d, a, dn === dayNum ? 1 : 0.2));
    });

    const markers = dayMarkers[dayNum];
    if (markers && markers.length > 1) {
        const day = days.find(d => d.day === dayNum);
        currentPolyline = L.polyline(markers.map(m => m.getLatLng()), {
            color: cityColors[day.city], weight: 3, opacity: 0.8, dashArray: '8, 6', lineJoin: 'round'
        }).addTo(map);
    }

    const mks = dayMarkers[dayNum];
    if (mks && mks.length === 1) { map.setView(mks[0].getLatLng(), 14, { animate: true }); }
    else if (mks && mks.length > 1) { map.fitBounds(L.featureGroup(mks).getBounds().pad(0.2), { animate: true }); }
}

export function addMarkerToMap(day, act) {
    const icon = buildMarkerIcon(day, act, selectedDayNum && selectedDayNum !== day.day ? 0.2 : 1);
    const marker = L.marker([act.lat, act.lng], { icon }).addTo(map);
    marker.on('click', () => fetchPlaceDetails(act, day));
    if (!dayMarkers[day.day]) dayMarkers[day.day] = [];
    dayMarkers[day.day].push(marker);
    allMarkersList.push({ marker, dayNum: day.day, day, act });
    return marker;
}

export function fetchPlaceDetails(act, day) {
    const placePanel = document.getElementById('placePanel');
    const panelContent = document.getElementById('panelContent');

    placePanel.classList.add('open');
    placePanel.dataset.lat  = act.lat;
    placePanel.dataset.lng  = act.lng;
    placePanel.dataset.city = day.city;

    const actIdx = day.activities.indexOf(act);
    const actEl = document.getElementById(`act-${day.day}-${actIdx}`);
    if (actEl) {
        const card = actEl.closest('.day-card');
        if (card && !card.classList.contains('active')) {
            document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        }
        setTimeout(() => {
            actEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            actEl.classList.add('focused');
            setTimeout(() => actEl.classList.remove('focused'), 2500);
        }, 100);
    }

    const { lat, lng, name } = act;
    const cityEmoji = { bangkok: '🏙️', phuket: '🏖️', chiangmai: '⛰️', samui: '🌴', krabi: '🤿' };

    const actIndex = day.activities.indexOf(act);
    let defaultFrom = actIndex > 0 ? day.activities[actIndex - 1] : null;
    const sameCityOpts = days.filter(d => d.city === day.city).flatMap(d => d.activities).filter(a => a.lat !== lat || a.lng !== lng);
    const optionsHtml = sameCityOpts.map(a => `<option value="${a.lat},${a.lng}">${a.name}</option>`).join('');

    panelContent.innerHTML = `
        <div id="panelPhotoArea" class="skeleton-box skeleton-photo"></div>
        <div class="panel-body">
            <div class="panel-title">${name}</div>
            <span class="panel-day-badge" style="background:${cityColors[day.city]}">יום ${day.day} · ${act.time}</span>
            <div class="panel-details" id="panelDetails">
                ${act.desc ? `<div class="panel-row"><span class="panel-row-icon">📝</span><span class="panel-row-val">${act.desc}</span></div>` : ''}
                <span class="skeleton-box skeleton-line w60"></span>
                <span class="skeleton-box skeleton-line w40"></span>
            </div>
            <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener"
                   style="flex:1;text-align:center;padding:9px 6px;background:#4285F4;color:white;border-radius:10px;text-decoration:none;font-size:0.78rem;font-weight:600;">🗺️ Google Maps</a>
                <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" rel="noopener"
                   style="flex:1;text-align:center;padding:9px 6px;background:#05C3DE;color:white;border-radius:10px;text-decoration:none;font-size:0.78rem;font-weight:600;">🚗 Waze</a>
                <a href="https://www.google.com/search?q=${encodeURIComponent(name + ' Thailand')}" target="_blank" rel="noopener"
                   style="flex:1;text-align:center;padding:9px 6px;background:#34A853;color:white;border-radius:10px;text-decoration:none;font-size:0.78rem;font-weight:600;">🔍 Google</a>
            </div>
            <div class="transit-section">
                <div class="transit-title">🚦 איך מגיעים לכאן?</div>
                <select class="transit-from-select" id="transitFrom">
                    <option value="">📍 מיקומי הנוכחי</option>
                    ${optionsHtml}
                </select>
                <div class="transit-options" id="transitOptions"><div class="transit-loading">בחר נקודת מוצא לחישוב מסלולים...</div></div>
            </div>
        </div>`;

    if (defaultFrom) {
        const sel = document.getElementById('transitFrom');
        if (sel) { sel.value = `${defaultFrom.lat},${defaultFrom.lng}`; calcTransitOptions(defaultFrom.lat, defaultFrom.lng, lat, lng); }
    }

    const panelKey = `${lat},${lng}`;

    fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name.split('–')[0].trim())}&prop=pageimages&format=json&pithumbsize=600&origin=*`)
        .then(r => r.json()).catch(() => null)
        .then(data => {
            if (`${placePanel.dataset.lat},${placePanel.dataset.lng}` !== panelKey) return;
            const photoEl = document.getElementById('panelPhotoArea');
            if (!photoEl) return;
            const page = data?.query?.pages && Object.values(data.query.pages)[0];
            if (page?.thumbnail) {
                photoEl.outerHTML = `<img class="panel-photo" src="${page.thumbnail.source}" alt="${name}" onerror="this.style.display='none'">`;
            } else {
                photoEl.outerHTML = `<div class="panel-photo-placeholder">${cityEmoji[day.city] || '📍'}</div>`;
            }
        });

    const overpassQ = `[out:json][timeout:10];(node(around:100,${lat},${lng});way(around:100,${lat},${lng}););out tags 1;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQ)}`)
        .then(r => r.json()).catch(() => null)
        .then(ovData => {
            if (`${placePanel.dataset.lat},${placePanel.dataset.lng}` !== panelKey) return;
            const detailsEl = document.getElementById('panelDetails');
            if (!detailsEl) return;
            detailsEl.querySelectorAll('.skeleton-box').forEach(el => el.remove());
            const t = (ovData?.elements?.[0]?.tags) || {};
            const rows = [
                t.opening_hours && `<div class="panel-row"><span class="panel-row-icon">🕐</span><span class="panel-row-val">${t.opening_hours}</span></div>`,
                t.fee === 'yes' && `<div class="panel-row"><span class="panel-row-icon">💰</span><span class="panel-row-val">${t.charge || 'בתשלום'}</span></div>`,
                t.phone && `<div class="panel-row"><span class="panel-row-icon">📞</span><span class="panel-row-val"><a href="tel:${t.phone}">${t.phone}</a></span></div>`,
                (t.website || t['contact:website']) && `<div class="panel-row"><span class="panel-row-icon">🌐</span><span class="panel-row-val"><a href="${t.website || t['contact:website']}" target="_blank" rel="noopener">פתח אתר</a></span></div>`,
            ].filter(Boolean);
            if (rows.length) detailsEl.insertAdjacentHTML('beforeend', rows.join(''));
        });
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export async function calcTransitOptions(fromLat, fromLng, toLat, toLng) {
    const container = document.getElementById('transitOptions');
    if (!container) return;
    container.innerHTML = '<div class="transit-loading">⏳ מחשב מסלולים...</div>';
    const km = haversineKm(fromLat, fromLng, toLat, toLng);

    let walkMin = Math.round(km / 0.08);
    try {
        const r = await fetch(`https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=false`);
        const d = await r.json();
        if (d.routes?.[0]) walkMin = Math.round(d.routes[0].duration / 60);
    } catch(e) {}

    const options = [
        { icon: '🚶', mode: 'הליכה',     time: walkMin,                           price: 'חינם',                          tmode: 'walking' },
        { icon: '🚇', mode: 'BTS / MRT', time: Math.round(km / 0.5 + 10),        price: km < 2 ? '฿16' : km < 8 ? '฿26' : '฿59', tmode: 'transit' },
        { icon: '🛵', mode: 'מוטו-סיי',  time: Math.round(km / 0.4 + 5),         price: `฿${Math.round(km*15+40)}`,      tmode: 'driving' },
        { icon: '🚗', mode: 'Grab Car',  time: Math.round(km / 0.55 + 8),        price: `฿${Math.round(50 + km * 20)}`,  tmode: 'driving' },
    ].sort((a, b) => a.time - b.time);

    container.innerHTML = options.map((o, i) => {
        const gmUrl = `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}/data=!4m2!4m1!3e${o.tmode === 'walking' ? 2 : o.tmode === 'transit' ? 3 : 0}`;
        return `<a class="transit-option${i === 0 ? ' fastest' : ''}" href="${gmUrl}" target="_blank" rel="noopener">
            <div class="transit-icon">${o.icon}</div>
            <div class="transit-info">
                <div class="transit-mode">${i === 0 ? '<span class="fastest-badge">הכי מהיר</span>' : ''}${o.mode}</div>
                <div class="transit-time">~${o.time} דקות · ${km.toFixed(1)} ק"מ</div>
            </div>
            <div class="transit-price">${o.price}</div>
        </a>`;
    }).join('');
}

export function initMap() {
    days.forEach(day => {
        dayMarkers[day.day] = [];
        day.activities.forEach(act => {
            const icon = buildMarkerIcon(day, act, 1);
            const marker = L.marker([act.lat, act.lng], { icon }).addTo(map);
            marker.on('click', () => fetchPlaceDetails(act, day));
            dayMarkers[day.day].push(marker);
            allMarkersList.push({ marker, dayNum: day.day, day, act });
        });
    });

    document.getElementById('panelClose').addEventListener('click', () => document.getElementById('placePanel').classList.remove('open'));
    document.querySelector('.panel-handle').addEventListener('click', () => document.getElementById('placePanel').classList.remove('open'));

    document.addEventListener('change', e => {
        if (e.target.id !== 'transitFrom') return;
        const val = e.target.value;
        const panel = document.getElementById('placePanel');
        const toLat = parseFloat(panel.dataset.lat), toLng = parseFloat(panel.dataset.lng);
        if (!val) {
            navigator.geolocation.getCurrentPosition(
                pos => calcTransitOptions(pos.coords.latitude, pos.coords.longitude, toLat, toLng),
                ()  => { document.getElementById('transitOptions').innerHTML = '<div class="transit-loading">לא ניתן לגשת למיקום.</div>'; }
            );
        } else {
            const [lat, lng] = val.split(',').map(Number);
            calcTransitOptions(lat, lng, toLat, toLng);
        }
    });
}
