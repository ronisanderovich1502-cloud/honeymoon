/** Direct OpenAI chat.completions calls from the browser. */

import { OPENAI_API_BASE, OPENAI_MODEL } from './sidekick-config.js';

async function chatCompletions(apiKey, body) {
  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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
    const msg = data?.error?.message || `OpenAI HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function extractOpenAIText(response) {
  return (response?.choices?.[0]?.message?.content || '').trim();
}

export async function verifyOpenAIKey(apiKey) {
  const data = await chatCompletions(apiKey, {
    model: OPENAI_MODEL,
    messages: [{ role: 'user', content: 'Reply with OK only.' }],
    max_tokens: 8,
    temperature: 0,
  });
  const text = extractOpenAIText(data);
  if (!text) throw new Error('ChatGPT לא החזיר תשובה — בדקי את המפתח');
  return { ok: true, text };
}

/**
 * @param {string} apiKey
 * @param {{ systemInstruction: string, messages: Array<{role:'user'|'assistant'|'system', content: string}> }} opts
 */
export async function openaiChat(apiKey, { systemInstruction, messages }) {
  const data = await chatCompletions(apiKey, {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemInstruction },
      ...messages,
    ],
    temperature: 0.4,
    max_tokens: 2048,
  });
  const text = extractOpenAIText(data);
  if (!text) throw new Error('ChatGPT לא החזיר תשובה');
  return { text, raw: data };
}
