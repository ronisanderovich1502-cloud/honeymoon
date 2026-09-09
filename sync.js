import { MONDAY_BOARD } from './monday-config.js';
import { saveToken, loadToken, clearToken, hasStoredToken } from './monday-crypto.js';
import {
  verifyToken,
  fetchAllItems,
  buildDataFromItems,
  createActivityItem,
  updateActivityItem,
  deleteItem,
  createFoodItem,
} from './monday-api.js';

export let mondayToken = null;
let currentCountry = 'japan';

export function setCountry(country) { currentCountry = country; }

export function setSyncDot(state) {
  const dot = document.getElementById('syncDot');
  if (dot) dot.className = 'sync-dot' + (state ? ' ' + state : '');
}

export function isConnected() { return !!mondayToken; }

export async function unlockWithPin(pin) {
  const token = await loadToken(pin);
  if (!token) throw new Error('PIN שגוי או token פגום');
  await verifyToken(token);
  mondayToken = token;
  setSyncDot('synced');
  return token;
}

export async function connectMonday(apiKey, pin) {
  await verifyToken(apiKey);
  await saveToken(apiKey, pin);
  mondayToken = apiKey;
  setSyncDot('synced');
}

export function disconnectMonday() {
  clearToken();
  mondayToken = null;
  setSyncDot('');
}

export async function loadMondayData(country) {
  if (!mondayToken) return null;
  setSyncDot('syncing');
  try {
    const items = await fetchAllItems(mondayToken);
    const data = buildDataFromItems(items, country);
    setSyncDot('synced');
    return data;
  } catch (e) {
    console.error('Monday load:', e);
    setSyncDot('error');
    throw e;
  }
}

export async function syncActivityCreate(dayNum, city, activity, sortOrder) {
  if (!mondayToken) return null;
  setSyncDot('syncing');
  try {
    const id = await createActivityItem(mondayToken, currentCountry, dayNum, city, activity, sortOrder);
    setSyncDot('synced');
    return id;
  } catch (e) {
    console.error('Monday create:', e);
    setSyncDot('error');
    return null;
  }
}

export async function syncActivityUpdate(activity) {
  if (!mondayToken || !activity.mondayId) return;
  setSyncDot('syncing');
  try {
    await updateActivityItem(mondayToken, activity.mondayId, activity);
    setSyncDot('synced');
  } catch (e) {
    console.error('Monday update:', e);
    setSyncDot('error');
  }
}

export async function syncActivityDelete(itemId) {
  if (!mondayToken || !itemId) return;
  setSyncDot('syncing');
  try {
    await deleteItem(mondayToken, itemId);
    setSyncDot('synced');
  } catch (e) {
    console.error('Monday delete:', e);
    setSyncDot('error');
  }
}

export async function syncFoodCreate(entry) {
  if (!mondayToken) return null;
  setSyncDot('syncing');
  try {
    const id = await createFoodItem(mondayToken, currentCountry, entry);
    setSyncDot('synced');
    return id;
  } catch (e) {
    console.error('Monday food create:', e);
    setSyncDot('error');
    return null;
  }
}

export function initSync(country = 'japan') {
  currentCountry = country;
  const overlay = document.getElementById('syncModalOverlay');
  if (!overlay) return;

  document.getElementById('syncSettingsBtn')?.addEventListener('click', () => {
    document.getElementById('mondayPinInput').value = '';
    document.getElementById('mondayKeyInput').value = '';
    document.getElementById('syncStatusBox').className = 'sync-status-box';
    document.getElementById('syncStatusBox').textContent = '';
    overlay.classList.add('open');
  });

  document.getElementById('syncModalCancel')?.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  document.getElementById('syncDisconnect')?.addEventListener('click', () => {
    disconnectMonday();
    overlay.classList.remove('open');
    showSyncToast('נותק מ-Monday');
  });

  document.getElementById('syncUnlock')?.addEventListener('click', async () => {
    const pin = document.getElementById('mondayPinInput').value.trim();
    const box = document.getElementById('syncStatusBox');
    if (!pin) { box.className = 'sync-status-box err'; box.textContent = '❌ נא להזין PIN'; return; }
    box.className = 'sync-status-box'; box.textContent = '⏳ פותח...';
    try {
      await unlockWithPin(pin);
      box.className = 'sync-status-box ok';
      box.textContent = '✅ מחובר! טוען נתונים מ-Monday...';
      overlay.classList.remove('open');
      window.dispatchEvent(new CustomEvent('monday-connected'));
    } catch (e) {
      box.className = 'sync-status-box err';
      box.textContent = `❌ ${e.message}`;
    }
  });

  document.getElementById('syncConnect')?.addEventListener('click', async () => {
    const key = document.getElementById('mondayKeyInput').value.trim();
    const pin = document.getElementById('mondayPinInput').value.trim();
    const box = document.getElementById('syncStatusBox');
    if (!key || !pin) { box.className = 'sync-status-box err'; box.textContent = '❌ נא למלא API key ו-PIN'; return; }
    box.className = 'sync-status-box'; box.textContent = '⏳ מאמת...';
    try {
      await connectMonday(key, pin);
      box.className = 'sync-status-box ok';
      box.textContent = '✅ נשמר! טוען נתונים מ-Monday...';
      overlay.classList.remove('open');
      window.dispatchEvent(new CustomEvent('monday-connected'));
    } catch (e) {
      box.className = 'sync-status-box err';
      box.textContent = `❌ ${e.message}`;
    }
  });

  if (hasStoredToken()) {
    setSyncDot('');
  } else {
    setSyncDot('');
  }
}

function showSyncToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

export { MONDAY_BOARD };
