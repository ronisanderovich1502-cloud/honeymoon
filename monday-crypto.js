const STORAGE_KEY = 'mondayTokenEnc';
const SALT_KEY = 'mondayTokenSalt';
const IV_KEY = 'mondayTokenIv';

function enc(s) { return new TextEncoder().encode(s); }
function dec(b) { return new TextDecoder().decode(b); }

async function deriveKey(pin, salt) {
  const base = await crypto.subtle.importKey('raw', enc(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function saveToken(token, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc(token));
  localStorage.setItem(STORAGE_KEY, btoa(String.fromCharCode(...new Uint8Array(cipher))));
  localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
  localStorage.setItem(IV_KEY, btoa(String.fromCharCode(...iv)));
}

export async function loadToken(pin) {
  const cipherB64 = localStorage.getItem(STORAGE_KEY);
  const saltB64 = localStorage.getItem(SALT_KEY);
  const ivB64 = localStorage.getItem(IV_KEY);
  if (!cipherB64 || !saltB64 || !ivB64) return null;
  try {
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const cipher = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
    const key = await deriveKey(pin, salt);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return dec(plain);
  } catch {
    return null;
  }
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SALT_KEY);
  localStorage.removeItem(IV_KEY);
  localStorage.removeItem('ghToken');
}

export function hasStoredToken() {
  return !!localStorage.getItem(STORAGE_KEY);
}
