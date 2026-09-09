/** Direct Anthropic Messages API calls from the browser. */

import { CLAUDE_API_BASE, CLAUDE_MODEL } from './sidekick-config.js';

async function messagesCreate(apiKey, body) {
  const res = await fetch(`${CLAUDE_API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Required for browser CORS to Anthropic
      'anthropic-dangerous-direct-browser-access': 'true',
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
    const msg = data?.error?.message || `Claude HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function extractClaudeText(response) {
  const parts = response?.content;
  if (!Array.isArray(parts)) return '';
  return parts.map(p => (p.type === 'text' ? p.text : '')).join('').trim();
}

export async function verifyClaudeKey(apiKey) {
  const data = await messagesCreate(apiKey, {
    model: CLAUDE_MODEL,
    max_tokens: 16,
    messages: [{ role: 'user', content: 'Reply with OK only.' }],
  });
  const text = extractClaudeText(data);
  if (!text) throw new Error('Claude לא החזיר תשובה — בדקי את המפתח');
  return { ok: true, text };
}

/**
 * @param {string} apiKey
 * @param {{ systemInstruction: string, messages: Array<{role:'user'|'assistant', content: string}> }} opts
 */
export async function claudeChat(apiKey, { systemInstruction, messages }) {
  const data = await messagesCreate(apiKey, {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    temperature: 0.4,
    system: systemInstruction,
    messages,
  });
  const text = extractClaudeText(data);
  if (!text) throw new Error('Claude לא החזיר תשובה');
  return { text, raw: data };
}
