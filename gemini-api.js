/** Direct Gemini generateContent calls from the browser (CORS-safe). */

import { GEMINI_API_BASE, GEMINI_MODEL, GEMINI_MODEL_FALLBACKS } from './sidekick-config.js';

/** AI Studio keys: legacy AIza… or new Auth AQ.… */
export function looksLikeGeminiKey(key) {
  const k = String(key || '').trim();
  return /^AIza/i.test(k) || /^AQ\./i.test(k);
}

function modelsToTry() {
  const list = [GEMINI_MODEL, ...(GEMINI_MODEL_FALLBACKS || [])];
  return [...new Set(list.filter(Boolean))];
}

function endpoint(apiKey, model) {
  // Query-only — do NOT also send x-goog-api-key (AQ. keys can 401 with dual auth).
  const q = new URLSearchParams({ key: apiKey });
  return `${GEMINI_API_BASE}/models/${model}:generateContent?${q}`;
}

async function generateContentOnce(apiKey, body, model) {
  const res = await fetch(endpoint(apiKey, model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { res, data, model };
}

function authErrorMessage(data, status) {
  const reason = data?.error?.details?.find?.(d => d.reason)?.reason || '';
  const raw = data?.error?.message || `Gemini HTTP ${status}`;
  if (reason === 'ACCESS_TOKEN_TYPE_UNSUPPORTED' || /oauth|authentication|unauthenticated/i.test(raw)) {
    return [
      'Gemini דחה את המפתח (401 ACCESS_TOKEN_TYPE_UNSUPPORTED).',
      'זה בדרך כלל מפתח AQ. קטוע / לא תקין, או מודל שלא מקבל את המפתח.',
      '• צרי מפתח חדש ב-AI Studio → Copy (הכל, מתחיל ב-AQ. או AIza)',
      '• בדקי שהמפתח עובד ב-AI Studio Playground לפני ההדבקה כאן',
      '• נתק → הדביקי מפתח חדש → שמור וחבר',
    ].join('\n');
  }
  return raw;
}

async function generateContent(apiKey, body) {
  const key = String(apiKey || '').trim();
  if (!key) throw new Error('חסר Gemini API key');
  if (/^AQ\./i.test(key) && key.length < 40) {
    throw new Error('מפתח AQ. נראה קצר מדי — כנראה לא הועתק במלואו מ-AI Studio');
  }

  let last = null;
  for (const model of modelsToTry()) {
    const result = await generateContentOnce(key, body, model);
    last = result;
    if (result.res.ok) return result.data;

    const msg = result.data?.error?.message || '';
    const notFound = result.res.status === 404 || /not found|no longer available|is not supported/i.test(msg);
    if (notFound) continue;
    break;
  }

  const err = new Error(authErrorMessage(last?.data, last?.res?.status || 0));
  err.status = last?.res?.status;
  err.data = last?.data;
  throw err;
}

export function extractText(response) {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map(p => p.text || '').join('').trim();
}

/** Lightweight ping before saving the key */
export async function verifyGeminiKey(apiKey) {
  const data = await generateContent(apiKey, {
    contents: [{ role: 'user', parts: [{ text: 'Reply with OK only.' }] }],
    generationConfig: { maxOutputTokens: 16, temperature: 0 },
  });
  const text = extractText(data);
  if (!text) throw new Error('Gemini לא החזיר תשובה — בדקי את המפתח');
  return { ok: true, text };
}

/**
 * Chat turn with system instruction + prior contents.
 * @param {string} apiKey
 * @param {{ systemInstruction: string, contents: Array<{role:string,parts:Array<{text:string}>}> }} opts
 */
export async function geminiChat(apiKey, { systemInstruction, contents }) {
  const data = await generateContent(apiKey, {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });
  const text = extractText(data);
  if (!text) {
    const block = data?.candidates?.[0]?.finishReason;
    throw new Error(block ? `Gemini blocked (${block})` : 'Gemini לא החזיר תשובה');
  }
  return { text, raw: data };
}
