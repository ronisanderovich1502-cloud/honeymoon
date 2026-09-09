/** Sidekick AI config — prefer free-tier Gemini Flash-Lite */

// Free on Google AI Studio (~500 req/day). Avoid Pro / paid-only models.
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';
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
  gemini: { id: 'gemini', label: 'Gemini', keyHint: 'AIza...', inputId: 'geminiKeyInput', free: true },
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
