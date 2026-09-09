/** Sidekick AI config — Gemini + ChatGPT */

export const GEMINI_MODEL = 'gemini-2.0-flash';
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const OPENAI_MODEL = 'gpt-4o-mini';
export const OPENAI_API_BASE = 'https://api.openai.com/v1';

export const STORAGE_GEMINI_KEY = 'geminiApiKey';
export const STORAGE_OPENAI_KEY = 'openaiApiKey';
export const STORAGE_PROVIDER = 'sidekickProvider'; // 'gemini' | 'openai'

export const PROVIDERS = {
  gemini: { id: 'gemini', label: 'Gemini', keyHint: 'AIza...' },
  openai: { id: 'openai', label: 'ChatGPT', keyHint: 'sk-...' },
};

export function chatStorageKey(country) {
  return `sidekickChat_${country}`;
}

export function pendingStorageKey(country) {
  return `sidekickPending_${country}`;
}

/** Approve phrases (English / Hebrew). Whole-message match after trim. */
export const APPROVE_RE = /^(approve[d]?|אשר|מאשרת?|אני\s*מאשרת?)\s*[.!׃:]*$/i;
