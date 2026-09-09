/**
 * Durable key/value storage for iPhone (Safari + Chrome + others).
 * localStorage is shared across tabs on the same origin, but iOS may wipe it;
 * IndexedDB is a backup. Password Autofill / Add to Home Screen help further.
 */

const DB_NAME = 'honeymoon-durable';
const DB_STORE = 'kv';
const DB_VERSION = 1;
const AUTH_STORAGE_KEY = 'mondayApiKey';
const BC_NAME = 'honeymoon-auth';

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('no indexedDB'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('idb open failed'));
  });
}

async function idbGet(key) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key, value) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore — localStorage may still work */
  }
}

async function idbRemove(key) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* ignore */
  }
}

/** Best-effort: ask the browser not to evict site data */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) {
      await navigator.storage.persist();
    }
  } catch {
    /* ignore */
  }
}

export async function durableGet(key) {
  try {
    const ls = localStorage.getItem(key);
    if (ls) return ls;
  } catch {
    /* private mode quirks */
  }
  const idb = await idbGet(key);
  if (idb != null && idb !== '') {
    try { localStorage.setItem(key, String(idb)); } catch { /* ignore */ }
    return String(idb);
  }
  return '';
}

export async function durableSet(key, value) {
  const v = String(value ?? '');
  try { localStorage.setItem(key, v); } catch { /* ignore */ }
  await idbSet(key, v);
  await requestPersistentStorage();
}

export async function durableRemove(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
  await idbRemove(key);
}

/** Any iPhone/iPad browser (Safari, Chrome, Firefox, Edge — all use WebKit on iOS) */
export function isIosDevice() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** @deprecated use isIosDevice */
export function isIosSafari() {
  return isIosDevice();
}

/** Notify other tabs (same browser app) that auth changed */
export function broadcastAuthChange(token) {
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.postMessage({ type: 'monday-auth', token: token || '' });
    bc.close();
  } catch {
    /* storage event still covers other tabs when localStorage changes */
  }
}

/**
 * Listen for auth changes from other tabs.
 * @param {(token: string) => void} onChange
 */
export function listenAuthAcrossTabs(onChange) {
  window.addEventListener('storage', (e) => {
    if (e.key !== AUTH_STORAGE_KEY) return;
    onChange(e.newValue || '');
  });
  try {
    const bc = new BroadcastChannel(BC_NAME);
    bc.onmessage = (ev) => {
      if (ev?.data?.type !== 'monday-auth') return;
      onChange(typeof ev.data.token === 'string' ? ev.data.token : '');
    };
  } catch {
    /* ignore */
  }
}
