/** Direct Gemini generateContent calls from the browser (CORS-safe). */

import { GEMINI_API_BASE, GEMINI_MODEL } from './sidekick-config.js';

function endpoint(apiKey, model = GEMINI_MODEL) {
  // API key in query string — most reliable for browser + AI Studio keys
  // (avoids OAuth errors when custom auth headers are dropped).
  const q = new URLSearchParams({ key: apiKey });
  return `${GEMINI_API_BASE}/models/${model}:generateContent?${q}`;
}

async function generateContent(apiKey, body, { model = GEMINI_MODEL } = {}) {
  const key = String(apiKey || '').trim();
  if (!key) {
    throw new Error('חסר Gemini API key');
  }

  const res = await fetch(endpoint(key, model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    let msg = data?.error?.message || `Gemini HTTP ${res.status}`;
    if (/oauth|authentication|invalid.*credential|api.?key/i.test(msg)) {
      msg = `${msg}\n\nטיפ: צרי מפתח חדש ב-AI Studio (AIza...) והדביקי אותו מחדש — לא OAuth / Cloud token.`;
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
