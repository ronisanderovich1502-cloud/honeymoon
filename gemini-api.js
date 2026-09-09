/** Direct Gemini generateContent calls from the browser (CORS-safe). */

import { GEMINI_API_BASE, GEMINI_MODEL } from './sidekick-config.js';

/** AI Studio keys: legacy AIza… or new Auth AQ.… */
export function looksLikeGeminiKey(key) {
  const k = String(key || '').trim();
  return /^AIza/i.test(k) || /^AQ\./i.test(k);
}

function endpoint(apiKey, model = GEMINI_MODEL) {
  const q = new URLSearchParams({ key: apiKey });
  return `${GEMINI_API_BASE}/models/${model}:generateContent?${q}`;
}

async function generateContent(apiKey, body, { model = GEMINI_MODEL } = {}) {
  const key = String(apiKey || '').trim();
  if (!key) throw new Error('חסר Gemini API key');

  // Send key both ways — some browsers / AQ. auth keys are picky.
  const res = await fetch(endpoint(key, model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const reason = data?.error?.details?.find?.(d => d.reason)?.reason || '';
    let msg = data?.error?.message || `Gemini HTTP ${res.status}`;
    if (reason === 'ACCESS_TOKEN_TYPE_UNSUPPORTED' || /oauth|authentication|unauthenticated/i.test(msg)) {
      msg = [
        'Gemini דחה את המפתח (401).',
        '1) צרי מפתח חדש ב-AI Studio והעתיקי אותו במלואו (מתחיל ב-AIza או AQ.).',
        '2) אל תשתמשי ב-OAuth / Cloud access token.',
        '3) עשי Hard Refresh ואז שמור וחבר שוב.',
      ].join('\n');
    }
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
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
