/**
 * Place search for the add/edit modal.
 * Uses Nominatim for landmarks; resolves Tabelog / Google Maps / OSM / geo: URLs to coordinates.
 * (The UI historically said "Google Places" but there is no Places API key — OSM cannot find most restaurants.)
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const JINA = 'https://r.jina.ai/';

function looksLikeUrl(q) {
  return /^(https?:\/\/|geo:|maps:)/i.test(q.trim())
    || /\b(tabelog\.com|google\.[^/\s]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|openstreetmap\.org|maps\.apple\.com)\b/i.test(q);
}

/** Parse lat/lng embedded in common map share URLs (no network). */
export function parseCoordsFromUrl(raw) {
  const q = (raw || '').trim();
  if (!q) return null;

  // geo:35.67,139.76
  let m = q.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2], name: '', source: 'geo' };

  // bare "35.67148, 139.76090"
  m = q.match(/^(-?\d{1,3}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})$/);
  if (m) {
    const lat = +m[1];
    const lng = +m[2];
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng, name: '', source: 'coords' };
  }

  // Google / Apple / OSM: @lat,lng or !3dLAT!4dLNG or q=lat,lng or mlat/mlon
  m = q.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: +m[1], lng: +m[2], name: '', source: 'maps-at' };

  m = q.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: +m[1], lng: +m[2], name: '', source: 'maps-3d' };

  m = q.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (m) return { lat: +m[1], lng: +m[2], name: '', source: 'maps-q' };

  m = q.match(/[?&]mlat=(-?\d+(?:\.\d+)?).*?[?&]mlon=(-?\d+(?:\.\d+)?)/i)
    || q.match(/[?&]mlon=(-?\d+(?:\.\d+)?).*?[?&]mlat=(-?\d+(?:\.\d+)?)/i);
  if (m) {
    if (/mlat=/.test(q) && q.indexOf('mlat') < q.indexOf('mlon')) {
      return { lat: +m[1], lng: +m[2], name: '', source: 'osm' };
    }
    return { lat: +m[2], lng: +m[1], name: '', source: 'osm' };
  }

  return null;
}

function cleanPlaceName(name) {
  return (name || '')
    .replace(/\s*[|｜].*$/, '')
    .replace(/\s*[-–—]\s*(Reservation|Tabelog|Google Maps|マップ).*$/i, '')
    .replace(/\s+Reservation\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Fetch page HTML via Jina (CORS-friendly) and pull lat/lng + title. */
async function resolveViaJina(pageUrl) {
  const res = await fetch(JINA + pageUrl, {
    headers: { 'X-Return-Format': 'html', Accept: 'text/html' },
  });
  if (!res.ok) throw new Error(`Jina ${res.status}`);
  const html = await res.text();

  const latM = html.match(/latitude["\s:=]+([0-9.]+)/i);
  const lngM = html.match(/longitude["\s:=]+([0-9.]+)/i);
  let lat = latM ? +latM[1] : NaN;
  let lng = lngM ? +lngM[1] : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const at = html.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (at) { lat = +at[1]; lng = +at[2]; }
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const d = html.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (d) { lat = +d[1]; lng = +d[2]; }
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('לא נמצאו קואורדינטות בקישור');
  }

  const titleM = html.match(/<title>([^<]+)/i);
  const addrM = html.match(/rstinfo-table__address[^>]*>([\s\S]*?)</i);
  const name = cleanPlaceName(titleM?.[1] || '') || cleanPlaceName(addrM?.[1] || '') || 'מקום מהקישור';

  return { lat, lng, name, source: 'url' };
}

async function searchNominatim(query, countrySuffix) {
  const q = countrySuffix ? `${query} ${countrySuffix}` : query;
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=0`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Accept-Language': 'he,en' },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const rows = await res.json();
  return (rows || []).map(p => ({
    lat: +p.lat,
    lng: +p.lon,
    name: (p.display_name || '').split(',')[0].trim(),
    address: (p.display_name || '').split(',').slice(1, 3).join(',').trim(),
    source: 'nominatim',
  }));
}

/**
 * @param {string} query
 * @param {{ countrySuffix?: string }} [opts]
 * @returns {Promise<{ results: Array<{lat:number,lng:number,name:string,address?:string,source:string}>, hint?: string }>}
 */
export async function searchPlaces(query, { countrySuffix = '' } = {}) {
  const q = (query || '').trim();
  if (q.length < 2) return { results: [] };

  // Direct coords / map URL with coords in the string
  const embedded = parseCoordsFromUrl(q);
  if (embedded) {
    return {
      results: [{
        ...embedded,
        name: embedded.name || 'מיקום מהקישור',
        address: `${embedded.lat.toFixed(5)}, ${embedded.lng.toFixed(5)}`,
      }],
    };
  }

  // Tabelog / Maps / other page URL — resolve via Jina
  if (looksLikeUrl(q)) {
    const pageUrl = /^https?:\/\//i.test(q) ? q.split(/\s/)[0] : `https://${q.split(/\s/)[0]}`;
    try {
      const place = await resolveViaJina(pageUrl);
      return {
        results: [{
          lat: place.lat,
          lng: place.lng,
          name: place.name,
          address: `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`,
          source: place.source,
        }],
      };
    } catch (e) {
      console.warn('URL resolve failed:', e);
      return {
        results: [],
        hint: 'לא הצלחתי לקרוא את הקישור. נסי קישור Google Maps עם מיקום, או לחצי על המפה.',
      };
    }
  }

  // Text search — OpenStreetMap (landmarks / stations; many restaurants are missing)
  try {
    let results = await searchNominatim(q, countrySuffix);
    if (!results.length && countrySuffix) {
      results = await searchNominatim(q, '');
    }
    if (!results.length) {
      return {
        results: [],
        hint: 'OpenStreetMap לא מכיר את רוב המסעדות. הדביקי קישור מ-Tabelog או Google Maps (או קואורדינטות), ואז בחרי מהתוצאה.',
      };
    }
    return { results };
  } catch (e) {
    console.warn('Nominatim failed:', e);
    return { results: [], hint: 'שגיאה בחיפוש — נסי שוב או הדביקי קישור למקום.' };
  }
}

export function placeSearchEmptyHtml(hint) {
  const tip = hint || 'לא נמצאו תוצאות';
  return `<div class="place-result place-result-empty">${tip}</div>`;
}
