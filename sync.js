import { MONDAY_BOARD } from './monday-config.js';
import {
  verifyToken,
  fetchAllItems,
  fetchBoardFingerprint,
  buildDataFromItems,
  fetchUpdatesForItems,
  createItemUpdate,
  createActivityItem,
  updateActivityItem,
  deleteItem,
  createFoodItem,
} from './monday-api.js';
import { beginMondaySave, endMondaySaveOk, endMondaySaveError } from './monday-banner.js';
import { validateApiKey, bindClearOnInput, shakeModal, clearOneField } from './validate.js';

const STORAGE_KEY = 'mondayApiKey';
const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000; // soft TTL for status label
const CACHE_SCHEMA = 3; // day.notes from Monday updates
const cacheKey = (country) => `mondayCache_${country}_v${CACHE_SCHEMA}`;

export let mondayToken = localStorage.getItem(STORAGE_KEY) || '';
let currentCountry = 'japan';
const revalidating = new Set();

export function setCountry(country) { currentCountry = country; }

export function setSyncDot(state) {
  const dot = document.getElementById('syncDot');
  if (dot) dot.className = 'sync-dot' + (state ? ' ' + state : '');
}

export function isConnected() { return !!mondayToken; }

export function openSyncModal() {
  const overlay = document.getElementById('syncModalOverlay');
  const keyInput = document.getElementById('mondayKeyInput');
  if (keyInput) {
    keyInput.value = mondayToken || '';
    clearOneField(keyInput);
  }
  const box = document.getElementById('syncStatusBox');
  if (box) { box.className = 'sync-status-box'; box.textContent = ''; }
  updateCacheStatusLabel();
  overlay?.classList.add('open');
}

export function requireMonday(message = '⚠️ חברי Monday API key כדי לערוך') {
  if (mondayToken) return true;
  showSyncToast(message);
  openSyncModal();
  return false;
}

/** Cache is used for instant paint even if soft TTL expired */
function readCache(country) {
  try {
    const raw = localStorage.getItem(cacheKey(country));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed.days)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function isCacheFresh(cached) {
  return cached && (Date.now() - cached.savedAt <= CACHE_TTL_MS);
}

function writeCache(country, data, fingerprint = null) {
  const prev = readCache(country);
  localStorage.setItem(cacheKey(country), JSON.stringify({
    savedAt: Date.now(),
    fingerprint: fingerprint ?? prev?.fingerprint ?? null,
    days: data.days,
    foodGuide: data.foodGuide || [],
  }));
  updateCacheStatusLabel();
}

async function rememberFingerprint(country, fingerprint) {
  const cached = readCache(country);
  if (!cached) return;
  cached.fingerprint = fingerprint;
  localStorage.setItem(cacheKey(country), JSON.stringify(cached));
  updateCacheStatusLabel();
}

export function clearMondayCache(country) {
  if (country) localStorage.removeItem(cacheKey(country));
  else {
    localStorage.removeItem(cacheKey('japan'));
    localStorage.removeItem(cacheKey('thailand'));
  }
  updateCacheStatusLabel();
}

function updateCacheStatusLabel() {
  const el = document.getElementById('mondayCacheStatus');
  if (!el) return;
  const cached = readCache(currentCountry);
  if (!cached) {
    el.textContent = 'אין מטמון — הטעינה הבאה תמשוך מ-Monday';
    return;
  }
  const ageH = Math.round((Date.now() - cached.savedAt) / 3600000);
  el.textContent = isCacheFresh(cached)
    ? `מטמון פעיל · נשמר לפני ~${ageH} שע׳ · בדיקת שינויים ברקע`
    : `מטמון ישן (~${ageH} שע׳) · מוצג מיד ואז נבדק מול Monday`;
}

export async function connectMonday(apiKey) {
  await verifyToken(apiKey);
  localStorage.setItem(STORAGE_KEY, apiKey);
  localStorage.removeItem('mondayTokenEnc');
  localStorage.removeItem('mondayTokenSalt');
  localStorage.removeItem('mondayTokenIv');
  localStorage.removeItem('ghToken');
  mondayToken = apiKey;
  setSyncDot('synced');
}

export function disconnectMonday() {
  localStorage.removeItem(STORAGE_KEY);
  clearMondayCache();
  mondayToken = '';
  setSyncDot('');
  window.dispatchEvent(new CustomEvent('monday-disconnected'));
  if (/japan\.html|thailand\.html/.test(location.pathname)) {
    location.replace('index.html');
  }
}

async function fetchAndCache(country) {
  const [items, fingerprint] = await Promise.all([
    fetchAllItems(mondayToken),
    fetchBoardFingerprint(mondayToken),
  ]);
  const data = buildDataFromItems(items, country);
  const dayIds = data.days.map(d => d.mondayId).filter(Boolean);
  try {
    const byItem = await fetchUpdatesForItems(mondayToken, dayIds);
    for (const day of data.days) {
      day.notes = byItem[String(day.mondayId)] || [];
    }
  } catch (e) {
    console.warn('Monday updates fetch failed:', e);
    for (const day of data.days) day.notes = day.notes || [];
  }
  writeCache(country, data, fingerprint);
  return { ...data, fingerprint, fromCache: false };
}

/**
 * Cache-first:
 * - force → always pull Monday
 * - else return cache immediately when present
 * Then call revalidateMondayData() to check Monday for changes.
 */
export async function loadMondayData(country, opts = {}) {
  if (!mondayToken) return null;
  const force = !!opts.force;

  if (!force) {
    const cached = readCache(country);
    if (cached?.days?.length) {
      setSyncDot('synced');
      return {
        days: cached.days,
        foodGuide: cached.foodGuide || [],
        fromCache: true,
        fingerprint: cached.fingerprint || null,
        stale: !isCacheFresh(cached),
      };
    }
  }

  setSyncDot('syncing');
  try {
    const data = await fetchAndCache(country);
    setSyncDot('synced');
    return data;
  } catch (e) {
    console.error('Monday load:', e);
    const stale = readCache(country);
    if (stale?.days?.length) {
      setSyncDot('error');
      return { days: stale.days, foodGuide: stale.foodGuide || [], fromCache: true, stale: true };
    }
    setSyncDot('error');
    throw e;
  }
}

/**
 * Lightweight board fingerprint check.
 * Returns fresh data if Monday changed, otherwise null.
 */
export async function revalidateMondayData(country) {
  if (!mondayToken) return null;
  if (revalidating.has(country)) return null;
  revalidating.add(country);
  setSyncDot('syncing');
  try {
    const cached = readCache(country);
    const fingerprint = await fetchBoardFingerprint(mondayToken);

    if (cached?.fingerprint && cached.fingerprint === fingerprint) {
      cached.savedAt = Date.now();
      localStorage.setItem(cacheKey(country), JSON.stringify(cached));
      setSyncDot('synced');
      updateCacheStatusLabel();
      return null;
    }

    const data = await fetchAndCache(country);
    setSyncDot('synced');
    return { ...data, changed: true };
  } catch (e) {
    console.error('Monday revalidate:', e);
    setSyncDot('error');
    return null;
  } finally {
    revalidating.delete(country);
  }
}

function patchCachedActivity(country, mutator) {
  const cached = (() => {
    try { return JSON.parse(localStorage.getItem(cacheKey(country)) || 'null'); } catch { return null; }
  })();
  if (!cached?.days) return;
  mutator(cached);
  cached.savedAt = Date.now();
  cached.fingerprint = null; // local edit changed Monday — re-check next time
  localStorage.setItem(cacheKey(country), JSON.stringify(cached));
  if (mondayToken) {
    fetchBoardFingerprint(mondayToken)
      .then(fp => rememberFingerprint(country, fp))
      .catch(() => {});
  }
}

export async function syncActivityCreate(dayNum, city, activity, sortOrder) {
  if (!mondayToken) return { ok: false, error: new Error('לא מחובר ל-Monday') };
  setSyncDot('syncing');
  beginMondaySave('שומר ב-Monday.com...');
  try {
    const id = await createActivityItem(mondayToken, currentCountry, dayNum, city, activity, sortOrder);
    activity.mondayId = id;
    patchCachedActivity(currentCountry, (cached) => {
      const day = cached.days.find(d => d.day === dayNum);
      if (day) day.activities.push({ ...activity, mondayId: id });
    });
    setSyncDot('synced');
    endMondaySaveOk('נשמר ב-Monday.com ✓');
    return { ok: true, id };
  } catch (e) {
    console.error('Monday create:', e);
    setSyncDot('error');
    endMondaySaveError(e);
    return { ok: false, error: e };
  }
}

export async function syncActivityUpdate(activity) {
  if (!mondayToken || !activity.mondayId) {
    return { ok: false, error: new Error('חסר מזהה Monday לפריט') };
  }
  setSyncDot('syncing');
  beginMondaySave('שומר ב-Monday.com...');
  try {
    await updateActivityItem(mondayToken, activity.mondayId, activity);
    patchCachedActivity(currentCountry, (cached) => {
      for (const day of cached.days) {
        const idx = day.activities.findIndex(a => a.mondayId === activity.mondayId);
        if (idx >= 0) { day.activities[idx] = { ...day.activities[idx], ...activity }; break; }
      }
    });
    setSyncDot('synced');
    endMondaySaveOk('נשמר ב-Monday.com ✓');
    return { ok: true };
  } catch (e) {
    console.error('Monday update:', e);
    setSyncDot('error');
    endMondaySaveError(e);
    return { ok: false, error: e };
  }
}

export async function syncActivityDelete(itemId) {
  if (!mondayToken || !itemId) {
    return { ok: false, error: new Error('חסר מזהה Monday לפריט') };
  }
  setSyncDot('syncing');
  beginMondaySave('מוחק ב-Monday.com...');
  try {
    await deleteItem(mondayToken, itemId);
    patchCachedActivity(currentCountry, (cached) => {
      for (const day of cached.days) {
        day.activities = day.activities.filter(a => a.mondayId !== itemId);
      }
    });
    setSyncDot('synced');
    endMondaySaveOk('נמחק מ-Monday.com ✓');
    return { ok: true };
  } catch (e) {
    console.error('Monday delete:', e);
    setSyncDot('error');
    endMondaySaveError(e);
    return { ok: false, error: e };
  }
}

export async function syncFoodCreate(entry) {
  if (!mondayToken) return { ok: false, error: new Error('לא מחובר ל-Monday') };
  setSyncDot('syncing');
  beginMondaySave('שומר ב-Monday.com...');
  try {
    const id = await createFoodItem(mondayToken, currentCountry, entry);
    entry.mondayId = id;
    patchCachedActivity(currentCountry, (cached) => {
      cached.foodGuide = cached.foodGuide || [];
      cached.foodGuide.push({ ...entry, mondayId: id });
    });
    setSyncDot('synced');
    endMondaySaveOk('נשמר ב-Monday.com ✓');
    return { ok: true, id };
  } catch (e) {
    console.error('Monday food create:', e);
    setSyncDot('error');
    endMondaySaveError(e);
    return { ok: false, error: e };
  }
}

/** Post a day note as a Monday item update */
export async function syncNoteCreate(dayNum, text, mondayId) {
  if (!mondayToken) return { ok: false, error: new Error('לא מחובר ל-Monday') };
  const id = mondayId || readCache(currentCountry)?.days?.find(d => d.day === dayNum)?.mondayId;
  if (!id) {
    return { ok: false, error: new Error('חסר מזהה Monday ליום') };
  }
  setSyncDot('syncing');
  beginMondaySave('שומר הערה ב-Monday.com...');
  try {
    const note = await createItemUpdate(mondayToken, id, text);
    patchCachedActivity(currentCountry, (c) => {
      const d = c.days.find(x => x.day === dayNum);
      if (!d) return;
      d.notes = d.notes || [];
      d.notes.push(note);
    });
    setSyncDot('synced');
    endMondaySaveOk('הערה נשמרה ב-Monday.com ✓');
    return { ok: true, note };
  } catch (e) {
    console.error('Monday note create:', e);
    setSyncDot('error');
    endMondaySaveError(e);
    return { ok: false, error: e };
  }
}

export function initSync(country = 'japan', { autoLoad = true } = {}) {
  currentCountry = country;
  const overlay = document.getElementById('syncModalOverlay');
  if (!overlay) return;

  document.getElementById('syncSettingsBtn')?.addEventListener('click', () => openSyncModal());
  document.getElementById('syncModalCancel')?.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  document.getElementById('syncDisconnect')?.addEventListener('click', () => {
    disconnectMonday();
    overlay.classList.remove('open');
    showSyncToast('נותק מ-Monday');
  });

  bindClearOnInput(['mondayKeyInput']);

  document.getElementById('syncConnect')?.addEventListener('click', async () => {
    const keyInput = document.getElementById('mondayKeyInput');
    const box = document.getElementById('syncStatusBox');
    const checked = validateApiKey(keyInput);
    if (!checked.ok) {
      box.className = 'sync-status-box err';
      box.textContent = '❌ בדקי את ה-API key';
      shakeModal('syncModalOverlay');
      return;
    }
    box.className = 'sync-status-box'; box.textContent = '⏳ מאמת...';
    try {
      await connectMonday(checked.value);
      clearMondayCache(currentCountry);
      box.className = 'sync-status-box ok';
      box.textContent = '✅ מחובר! טוען נתונים מ-Monday...';
      overlay.classList.remove('open');
      window.dispatchEvent(new CustomEvent('monday-connected', { detail: { force: true } }));
    } catch (e) {
      box.className = 'sync-status-box err';
      box.textContent = `❌ ${e.message}`;
    }
  });

  document.getElementById('syncHardRefresh')?.addEventListener('click', async () => {
    if (!requireMonday('⚠️ חברי Monday כדי לרענן')) return;
    const box = document.getElementById('syncStatusBox');
    box.className = 'sync-status-box';
    box.textContent = '⏳ מרענן מ-Monday...';
    clearMondayCache(currentCountry);
    window.dispatchEvent(new CustomEvent('monday-connected', { detail: { force: true } }));
    overlay.classList.remove('open');
  });

  setSyncDot(mondayToken ? 'synced' : '');
  updateCacheStatusLabel();
  if (autoLoad && mondayToken) {
    window.dispatchEvent(new CustomEvent('monday-connected', { detail: { force: false } }));
  }
}

function showSyncToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

export { MONDAY_BOARD, CACHE_TTL_MS };
