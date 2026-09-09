/** Sidekick AI config — prefer free-tier Gemini models */

// Free on Google AI Studio. Try stable Flash first (best AQ. key compatibility).
export const GEMINI_MODEL = 'gemini-2.5-flash';
export const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
];
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// OpenAI / Anthropic have no free API tier — cheapest paid models.
export const OPENAI_MODEL = 'gpt-4o-mini';
export const OPENAI_API_BASE = 'https://api.openai.com/v1';

export const CLAUDE_MODEL = 'claude-haiku-4-5';
export const CLAUDE_API_BASE = 'https://api.anthropic.com/v1';

export const STORAGE_GEMINI_KEY = 'geminiApiKey';
export const STORAGE_OPENAI_KEY = 'openaiApiKey';
export const STORAGE_CLAUDE_KEY = 'claudeApiKey';
export const STORAGE_PROVIDER = 'sidekickProvider'; // 'gemini' | 'openai' | 'claude'

export const PROVIDERS = {
  gemini: { id: 'gemini', label: 'Gemini', keyHint: 'AQ.... or AIza...', inputId: 'geminiKeyInput', free: true },
  openai: { id: 'openai', label: 'ChatGPT', keyHint: 'sk-...', inputId: 'openaiKeyInput', free: false },
  claude: { id: 'claude', label: 'Claude', keyHint: 'sk-ant-...', inputId: 'claudeKeyInput', free: false },
};

export function chatStorageKey(country) {
  return `sidekickChat_${country}`;
}

export function pendingStorageKey(country) {
  return `sidekickPending_${country}`;
}

/** Approve phrases (English / Hebrew). Whole-message match after trim. */
export const APPROVE_RE = /^(approve[d]?|אשר|מאשרת?|אני\s*מאשרת?)\s*[.!׃:]*$/i;
