import { days, cityColors } from './data.js';

export const map = L.map('map', { zoomControl: false }).setView([35.6762, 139.6503], 11);
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
    if (/ראמן|סושי|burger|ramen|sushi|yakitori|yakiniku|wagyu|pancake|gyoza|tonkatsu|takoyaki|okonomiyaki|maguro|nobu|mensho|flipper|restaurant|מסעדה|ארוחה|אוכל|food|eat/i.test(t)) return '🍽️';
    if (/מקדש|shrine|temple|torii|kinkaku|kiyomizu|senso|meiji|inari|fushimi|todai/i.test(t)) return '⛩️';
    if (/יער|במבוק|forest|bamboo|park|garden|nature|monkey|arashiyama|minoh/i.test(t)) return '🌿';
    if (/מלון|hotel|roynet|check.in|check-in/i.test(t)) return '🏨';
    if (/שוק|market|nishiki|tsukiji|donki|shopping|שופינג/i.test(t)) return '🛍️';
    if (/shinkansen|שינקנסן|רכבת קליע|airport|שדה תעופה|kix|kansai/i.test(t)) return '✈️';
    if (/disney|disneysea/i.test(t)) return '🏰';
    if (/universal|studio/i.test(t)) return '🎡';
    if (/teamlab/i.test(t)) return '🎨';
    if (/מפל|waterfall|lake|אגם|onsen|sea/i.test(t)) return '💧';
    if (/טירה|castle/i.test(t)) return '🏯';
    if (/hakone|fuji|רכבל|volcano|הר/i.test(t)) return '🗻';
    if (/sky|observation|תצפית/i.test(t)) return '🌆';
    if (/akihabara|anime|gaming/i.test(t)) return '🎮';
    if (/nara|deer|צבאים/i.test(t)) return '🦌';
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
        const latlngs = markers.map(m => m.getLatLng());
        const day = days.find(d => d.day === dayNum);
        currentPolyline = L.polyline(latlngs, {
            color: cityColors[day.city], weight: 3, opacity: 0.8,
            dashArray: '8, 6', lineJoin: 'round'
        }).addTo(map);
    }

    const mks = dayMarkers[dayNum];
    if (mks && mks.length === 1) { map.setView(mks[0].getLatLng(), 14, { animate: true }); mks[0].openPopup(); }
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

    // Scroll sidebar to this activity and highlight it
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
    const cityEmoji = { tokyo: '🗼', kyoto: '⛩️', osaka: '🎡' };

    // Compute transit default
    const actIndex = day.activities.indexOf(act);
    let defaultFrom = null;
    if (actIndex > 0) {
        defaultFrom = day.activities[actIndex - 1];
    } else {
        const hotelRe = /מלון|hotel|inn|hostel|check.?in|roynet/i;
        for (const d of days) {
            for (const a of d.activities) {
                if (hotelRe.test(a.name + ' ' + (a.desc || '')) && (a.lat !== lat || a.lng !== lng)) { defaultFrom = a; break; }
            }
            if (defaultFrom) break;
        }
    }

    const hotelFlightRe = /מלון|hotel|inn|hostel|check.?in|roynet|נמל|טיסה|flight|airport|narita|haneda|kix|itami/i;
    const sameCityOpts = days.filter(d => d.city === day.city).flatMap(d => d.activities).filter(a => a.lat !== lat || a.lng !== lng);
    const extraOpts = days.filter(d => d.city !== day.city).flatMap(d => d.activities).filter(a => hotelFlightRe.test(a.name + ' ' + (a.desc || '')) && (a.lat !== lat || a.lng !== lng));
    const allOpts = [...sameCityOpts];
    extraOpts.forEach(a => { if (!allOpts.find(o => o.lat === a.lat && o.lng === a.lng)) allOpts.push(a); });
    const optionsHtml = allOpts.map(a => `<option value="${a.lat},${a.lng}">${a.name}</option>`).join('');

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
                   style="flex:1;text-align:center;padding:9px 6px;background:#4285F4;color:white;border-radius:10px;text-decoration:none;font-size:0.78rem;font-weight:600;">
                    🗺️ Google Maps
                </a>
                <a href="https://waze.com/ul?ll=${lat},${lng}&navigate=yes" target="_blank" rel="noopener"
                   style="flex:1;text-align:center;padding:9px 6px;background:#05C3DE;color:white;border-radius:10px;text-decoration:none;font-size:0.78rem;font-weight:600;">
                    🚗 Waze
                </a>
                <a href="https://www.google.com/search?q=${encodeURIComponent(name + ' Japan')}" target="_blank" rel="noopener"
                   style="flex:1;text-align:center;padding:9px 6px;background:#34A853;color:white;border-radius:10px;text-decoration:none;font-size:0.78rem;font-weight:600;">
                    🔍 Google
                </a>
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
        if (sel) {
            sel.value = `${defaultFrom.lat},${defaultFrom.lng}`;
            calcTransitOptions(defaultFrom.lat, defaultFrom.lng, lat, lng, day.city);
        }
    }

    const panelKey = `${lat},${lng}`;

    fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name.split('–')[0].trim())}&prop=pageimages&format=json&pithumbsize=600&origin=*`)
        .then(r => r.json())
        .catch(() => null)
        .then(data => {
            if (`${placePanel.dataset.lat},${placePanel.dataset.lng}` !== panelKey) return;
            const photoEl = document.getElementById('panelPhotoArea');
            if (!photoEl) return;
            const pages = data && data.query && data.query.pages;
            const page = pages && Object.values(pages)[0];
            if (page && page.thumbnail) {
                photoEl.outerHTML = `<img class="panel-photo" src="${page.thumbnail.source}" alt="${name}" onerror="this.style.display='none'">`;
            } else {
                photoEl.outerHTML = `<div class="panel-photo-placeholder">${cityEmoji[day.city] || '📍'}</div>`;
            }
        });

    const overpassQ = `[out:json][timeout:10];(node(around:100,${lat},${lng});way(around:100,${lat},${lng}););out tags 1;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQ)}`)
        .then(r => r.json())
        .catch(() => null)
        .then(ovData => {
            if (`${placePanel.dataset.lat},${placePanel.dataset.lng}` !== panelKey) return;
            const detailsEl = document.getElementById('panelDetails');
            if (!detailsEl) return;
            detailsEl.querySelectorAll('.skeleton-box').forEach(el => el.remove());
            const el = ovData && ovData.elements && ovData.elements[0];
            const t = (el && el.tags) || {};
            const hours   = t.opening_hours || null;
            const website = t.website || t['contact:website'] || null;
            const phone   = t.phone || t['contact:phone'] || null;
            const addr    = [t['addr:street'], t['addr:housenumber'], t['addr:city']].filter(Boolean).join(' ') || null;
            const fee     = t.fee === 'yes' ? (t.charge || 'בתשלום') : (t.fee === 'no' ? 'כניסה חופשית' : null);
            const cuisine = t.cuisine ? t.cuisine.replace(/_/g, ' ') : null;
            const rows = [
                hours   && `<div class="panel-row"><span class="panel-row-icon">🕐</span><span class="panel-row-val">${hours}</span></div>`,
                cuisine && `<div class="panel-row"><span class="panel-row-icon">🍽️</span><span class="panel-row-val">${cuisine}</span></div>`,
                fee     && `<div class="panel-row"><span class="panel-row-icon">💴</span><span class="panel-row-val">${fee}</span></div>`,
                addr    && `<div class="panel-row"><span class="panel-row-icon">📍</span><span class="panel-row-val">${addr}</span></div>`,
                phone   && `<div class="panel-row"><span class="panel-row-icon">📞</span><span class="panel-row-val"><a href="tel:${phone}">${phone}</a></span></div>`,
                website && `<div class="panel-row"><span class="panel-row-icon">🌐</span><span class="panel-row-val"><a href="${website}" target="_blank" rel="noopener">פתח אתר</a></span></div>`,
            ].filter(Boolean);
            if (rows.length) detailsEl.insertAdjacentHTML('beforeend', rows.join(''));
        });
}

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function japanTransitPrice(km, city) {
    if (km < 1) return { train: 'חינם', bus: 'חינם' };
    const trainFare = city === 'kyoto' || city === 'osaka'
        ? Math.min(Math.round((180 + km * 30) / 10) * 10, 400)
        : Math.min(Math.round((170 + km * 28) / 10) * 10, 320);
    const busFare = city === 'kyoto' ? 230 : 210;
    return { train: `¥${trainFare}`, bus: `¥${busFare}` };
}

function taxiPrice(km) {
    const base = 730, perMeter = 90 / 280;
    return `¥${Math.round(base + km * 1000 * perMeter / 10) * 10}`;
}

export async function calcTransitOptions(fromLat, fromLng, toLat, toLng, city) {
    const container = document.getElementById('transitOptions');
    if (!container) return;
    container.innerHTML = '<div class="transit-loading">⏳ מחשב מסלולים...</div>';

    const km = haversineKm(fromLat, fromLng, toLat, toLng);
    const prices = japanTransitPrice(km, city);

    let walkMin = Math.round(km / 0.08);
    let walkDist = km;
    try {
        const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=false`);
        const osrmData = await osrmRes.json();
        if (osrmData.routes && osrmData.routes[0]) {
            walkMin = Math.round(osrmData.routes[0].duration / 60);
            walkDist = (osrmData.routes[0].distance / 1000).toFixed(1);
        }
    } catch(e) {}

    const trainMin = Math.round(km < 1 ? 5 : km / 0.55 + 8);
    const busMin   = Math.round(km < 1 ? 6 : km / 0.35 + 10);
    const taxiMin  = Math.round(km / 0.55 + 5);

    const options = [
        { icon: '🚶', mode: 'הליכה',       time: walkMin,  price: 'חינם',          tmode: 'walking' },
        { icon: '🚃', mode: 'רכבת / מטרו', time: trainMin, price: prices.train,    tmode: 'transit' },
        { icon: '🚌', mode: 'אוטובוס',      time: busMin,   price: prices.bus,      tmode: 'transit' },
        { icon: '🚕', mode: 'מונית',         time: taxiMin,  price: taxiPrice(km),   tmode: 'driving' },
    ].sort((a, b) => a.time - b.time);

    container.innerHTML = options.map((o, i) => {
        const gmUrl = `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}/data=!4m2!4m1!3e${o.tmode === 'walking' ? 2 : o.tmode === 'transit' ? 3 : 0}`;
        return `
        <a class="transit-option${i === 0 ? ' fastest' : ''}" href="${gmUrl}" target="_blank" rel="noopener">
            <div class="transit-icon">${o.icon}</div>
            <div class="transit-info">
                <div class="transit-mode">${i === 0 ? '<span class="fastest-badge">הכי מהיר</span>' : ''}${o.mode}</div>
                <div class="transit-time">~${o.time} דקות · ${o.mode === 'הליכה' ? walkDist + ' ק"מ' : km.toFixed(1) + ' ק"מ'}</div>
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

    document.getElementById('panelClose').addEventListener('click', () => {
        document.getElementById('placePanel').classList.remove('open');
    });
    document.querySelector('.panel-handle').addEventListener('click', () => {
        document.getElementById('placePanel').classList.remove('open');
    });

    document.addEventListener('change', e => {
        if (e.target.id !== 'transitFrom') return;
        const val = e.target.value;
        const panel = document.getElementById('placePanel');
        const toLat = parseFloat(panel.dataset.lat);
        const toLng = parseFloat(panel.dataset.lng);
        const city  = panel.dataset.city;
        if (!val) {
            navigator.geolocation.getCurrentPosition(
                pos => calcTransitOptions(pos.coords.latitude, pos.coords.longitude, toLat, toLng, city),
                ()  => { document.getElementById('transitOptions').innerHTML = '<div class="transit-loading">לא ניתן לגשת למיקום. בחר נקודת מוצא.</div>'; }
            );
        } else {
            const [lat, lng] = val.split(',').map(Number);
            calcTransitOptions(lat, lng, toLat, toLng, city);
        }
    });
}
