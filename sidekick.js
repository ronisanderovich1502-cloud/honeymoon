/**
 * Trip Planner Sidekick — floating chat + Gemini/ChatGPT + approval-gated Monday edits.
 */

import {
  STORAGE_GEMINI_KEY,
  STORAGE_OPENAI_KEY,
  STORAGE_PROVIDER,
  PROVIDERS,
  chatStorageKey,
  pendingStorageKey,
  APPROVE_RE,
} from './sidekick-config.js';
import { verifyGeminiKey, geminiChat } from './gemini-api.js';
import { verifyOpenAIKey, openaiChat } from './openai-api.js';
import { buildItinerarySnapshot, buildSystemPrompt, parseProposalFromText } from './sidekick-prompt.js';
import {
  validateApiKey, bindClearOnInput, shakeModal, clearOneField, clearFieldErrors,
} from './validate.js';
import {
  isConnected, requireMonday,
  syncActivityCreate, syncActivityUpdate, syncActivityDelete,
} from './sync.js';

let geminiToken = localStorage.getItem(STORAGE_GEMINI_KEY) || '';
let openaiToken = localStorage.getItem(STORAGE_OPENAI_KEY) || '';
let provider = normalizeProvider(localStorage.getItem(STORAGE_PROVIDER));
let opts = null;
let busy = false;
let initialized = false;

function normalizeProvider(raw) {
  return raw === 'openai' ? 'openai' : 'gemini';
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(chatStorageKey(opts.country));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveHistory(messages) {
  localStorage.setItem(chatStorageKey(opts.country), JSON.stringify(messages));
}

function loadPending() {
  try {
    const raw = localStorage.getItem(pendingStorageKey(opts.country));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePending(proposal) {
  if (!proposal) {
    localStorage.removeItem(pendingStorageKey(opts.country));
    return;
  }
  localStorage.setItem(pendingStorageKey(opts.country), JSON.stringify(proposal));
}

function activeToken() {
  return provider === 'openai' ? openaiToken : geminiToken;
}

function hasAnyKey() {
  return !!(geminiToken || openaiToken);
}

function hasActiveKey() {
  return !!activeToken();
}

export function isAiConnected() {
  return hasActiveKey();
}

export function openSidekickKeyModal() {
  const overlay = document.getElementById('sidekickKeyModalOverlay')
    || document.getElementById('geminiModalOverlay');
  if (!overlay) return;
  clearFieldErrors(overlay);
  syncProviderTabs();
  fillKeyInputs();
  updateModalStatus();
  overlay.classList.add('open');
  const inputId = provider === 'openai' ? 'openaiKeyInput' : 'geminiKeyInput';
  document.getElementById(inputId)?.focus();
}

/** @deprecated use openSidekickKeyModal */
export function openGeminiModal() {
  openSidekickKeyModal();
}

function closeSidekickKeyModal() {
  document.getElementById('sidekickKeyModalOverlay')?.classList.remove('open');
  document.getElementById('geminiModalOverlay')?.classList.remove('open');
}

function setProvider(next) {
  provider = normalizeProvider(next);
  localStorage.setItem(STORAGE_PROVIDER, provider);
  // Prefer a provider that already has a key
  if (!activeToken() && hasAnyKey()) {
    provider = geminiToken ? 'gemini' : 'openai';
    localStorage.setItem(STORAGE_PROVIDER, provider);
  }
  syncProviderTabs();
  fillKeyInputs();
  updateModalStatus();
  updateLauncherState();
  updateComposerState();
  updateProviderBadge();
}

function fillKeyInputs() {
  const g = document.getElementById('geminiKeyInput');
  const o = document.getElementById('openaiKeyInput');
  if (g) g.value = geminiToken;
  if (o) o.value = openaiToken;
}

function syncProviderTabs() {
  document.querySelectorAll('[data-sidekick-provider]').forEach(btn => {
    const on = btn.dataset.sidekickProvider === provider;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  document.querySelectorAll('[data-provider-panel]').forEach(panel => {
    panel.hidden = panel.dataset.providerPanel !== provider;
  });
}

function updateModalStatus() {
  const status = document.getElementById('sidekickKeyStatusBox')
    || document.getElementById('geminiStatusBox');
  if (!status) return;
  if (hasActiveKey()) {
    status.className = 'sync-status-box ok';
    status.textContent = provider === 'openai'
      ? '✓ ChatGPT מחובר (מפתח שמור בדפדפן)'
      : '✓ Gemini מחובר (מפתח שמור בדפדפן)';
  } else if (hasAnyKey()) {
    status.className = 'sync-status-box pending';
    status.textContent = 'יש מפתח לספק אחר — בחרי אותו למעלה או הזיני מפתח כאן';
  } else {
    status.className = 'sync-status-box';
    status.textContent = '';
  }
}

async function connectActiveProvider(apiKey) {
  if (provider === 'openai') {
    await verifyOpenAIKey(apiKey);
    localStorage.setItem(STORAGE_OPENAI_KEY, apiKey);
    openaiToken = apiKey;
  } else {
    await verifyGeminiKey(apiKey);
    localStorage.setItem(STORAGE_GEMINI_KEY, apiKey);
    geminiToken = apiKey;
  }
  localStorage.setItem(STORAGE_PROVIDER, provider);
  updateLauncherState();
  updateComposerState();
  updateProviderBadge();
}

function disconnectActiveProvider() {
  if (provider === 'openai') {
    localStorage.removeItem(STORAGE_OPENAI_KEY);
    openaiToken = '';
  } else {
    localStorage.removeItem(STORAGE_GEMINI_KEY);
    geminiToken = '';
  }
  if (!hasActiveKey() && hasAnyKey()) {
    setProvider(geminiToken ? 'gemini' : 'openai');
  } else {
    updateLauncherState();
    updateComposerState();
    updateProviderBadge();
  }
}

function updateLauncherState() {
  const btn = document.getElementById('sidekickLauncher');
  if (!btn) return;
  const ready = hasActiveKey();
  btn.classList.toggle('needs-key', !ready);
  btn.classList.toggle('is-disabled', !ready);
  btn.setAttribute('aria-disabled', ready ? 'false' : 'true');
  btn.title = ready
    ? `Trip Planner (${PROVIDERS[provider].label})`
    : 'Sidekick כבוי — חברי Gemini או ChatGPT API key';
}

function updateComposerState() {
  const input = document.getElementById('sidekickInput');
  const send = document.getElementById('sidekickSend');
  const ready = hasActiveKey();
  if (input) {
    input.disabled = !ready;
    input.placeholder = ready
      ? 'שאלי על הלו״ז או בקשי שינוי…'
      : 'חברי API key בהגדרות כדי להתחיל…';
  }
  if (send) send.disabled = !ready || busy;
}

function updateProviderBadge() {
  const el = document.getElementById('sidekickProviderBadge');
  if (!el) return;
  el.textContent = hasActiveKey() ? PROVIDERS[provider].label : 'לא מחובר';
  el.classList.toggle('offline', !hasActiveKey());
}

function isApproveMessage(text) {
  return APPROVE_RE.test((text || '').trim());
}

function proposalSummary(p) {
  if (!p?.action) return 'שינוי בלוח';
  if (p.action === 'create') {
    return `יצירת פעילות "${p.activity?.name || '?'}" ביום ${p.dayNum} (${p.city || ''})`;
  }
  if (p.action === 'update') {
    const move = p.dayNum != null ? ` → יום ${p.dayNum}` : '';
    return `עדכון "${p.activity?.name || p.name || p.mondayId}"${move}`;
  }
  if (p.action === 'delete') {
    return `מחיקת "${p.name || p.mondayId}"`;
  }
  return `פעולה: ${p.action}`;
}

function validateProposal(p, days) {
  if (!p || typeof p !== 'object') return 'הצעה לא תקינה';
  const action = p.action;
  if (!['create', 'update', 'delete'].includes(action)) return `פעולה לא נתמכת: ${action}`;

  if (action === 'create') {
    if (!p.dayNum || !days.some(d => d.day === Number(p.dayNum))) return 'יום לא קיים בלו״ז';
    if (!p.city) return 'חסרה עיר';
    if (!p.activity?.name?.trim()) return 'חסר שם פעילות';
  }
  if (action === 'update' || action === 'delete') {
    if (!p.mondayId) return 'חסר mondayId';
    const found = days.some(d => (d.activities || []).some(a => String(a.mondayId) === String(p.mondayId)));
    if (!found) return 'הפעילות לא נמצאה בלו״ז הנוכחי';
  }
  if (action === 'update' && p.dayNum != null && !days.some(d => d.day === Number(p.dayNum))) {
    return 'יום היעד לא קיים בלו״ז';
  }
  return null;
}

async function executeProposal(p) {
  if (!isConnected()) {
    requireMonday('⚠️ חברי Monday כדי לערוך דרך ה-Sidekick');
    throw new Error('לא מחובר ל-Monday');
  }
  const days = opts.getDays?.() || [];
  const err = validateProposal(p, days);
  if (err) throw new Error(err);

  if (p.action === 'create') {
    const dayNum = Number(p.dayNum);
    const day = days.find(d => d.day === dayNum);
    const city = p.city || day?.city;
    const activity = {
      name: String(p.activity.name).trim(),
      time: p.activity.time || '?',
      timeEnd: p.activity.timeEnd || '',
      desc: p.activity.desc || '',
      type: p.activity.type || 'attraction',
      lat: p.activity.lat ?? null,
      lng: p.activity.lng ?? null,
    };
    const sortOrder = (day?.activities?.length || 0) + 1;
    const result = await syncActivityCreate(dayNum, city, activity, sortOrder);
    if (!result.ok) throw result.error || new Error('יצירה נכשלה');
    return `נוצרה הפעילות "${activity.name}" ביום ${dayNum}`;
  }

  if (p.action === 'update') {
    let existing = null;
    let fromDay = null;
    for (const d of days) {
      const a = (d.activities || []).find(x => String(x.mondayId) === String(p.mondayId));
      if (a) { existing = a; fromDay = d; break; }
    }
    const patch = p.activity || {};
    const activity = {
      mondayId: p.mondayId,
      name: patch.name ?? existing.name,
      time: patch.time ?? existing.time,
      timeEnd: patch.timeEnd ?? existing.timeEnd,
      desc: patch.desc ?? existing.desc,
      type: patch.type ?? existing.type,
      lat: patch.lat !== undefined ? patch.lat : existing.lat,
      lng: patch.lng !== undefined ? patch.lng : existing.lng,
      sortOrder: patch.sortOrder ?? existing.sortOrder,
    };
    const dayNum = p.dayNum != null ? Number(p.dayNum) : fromDay?.day;
    const city = p.city || days.find(d => d.day === dayNum)?.city || fromDay?.city;
    const result = await syncActivityUpdate(activity, { dayNum, city });
    if (!result.ok) throw result.error || new Error('עדכון נכשל');
    return `עודכנה הפעילות "${activity.name}"`;
  }

  if (p.action === 'delete') {
    const result = await syncActivityDelete(p.mondayId);
    if (!result.ok) throw result.error || new Error('מחיקה נכשלה');
    return `נמחקה הפעילות "${p.name || p.mondayId}"`;
  }

  throw new Error('פעולה לא ידועה');
}

function modalMarkup() {
  return `
    <div class="sync-modal sidekick-key-modal">
      <h3>✨ Trip Planner Sidekick</h3>
      <p>חברי Gemini או ChatGPT. השינויים ל-Monday רצים רק אחרי approve / אשר.</p>
      <div class="sidekick-provider-tabs" role="tablist">
        <button type="button" class="sidekick-provider-tab" data-sidekick-provider="gemini" role="tab">Gemini</button>
        <button type="button" class="sidekick-provider-tab" data-sidekick-provider="openai" role="tab">ChatGPT</button>
      </div>
      <div data-provider-panel="gemini">
        <div class="sidekick-key-hint">
          1. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener"><strong>צרי Gemini API key ←</strong></a><br>
          2. הדביקי ולחצי שמור — נשמר בדפדפן
        </div>
        <label>🔑 Gemini API Key</label>
        <input type="password" id="geminiKeyInput" placeholder="AIza..." autocomplete="off" />
      </div>
      <div data-provider-panel="openai" hidden>
        <div class="sidekick-key-hint">
          1. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener"><strong>צרי OpenAI API key ←</strong></a><br>
          2. הדביקי ולחצי שמור — נשמר בדפדפן
        </div>
        <label>🔑 ChatGPT (OpenAI) API Key</label>
        <input type="password" id="openaiKeyInput" placeholder="sk-..." autocomplete="off" />
      </div>
      <div class="sync-status-box" id="sidekickKeyStatusBox"></div>
      <div class="modal-actions">
        <button class="btn-secondary" id="sidekickKeyCancel" type="button">סגור</button>
        <button class="btn-secondary" id="sidekickKeyDisconnect" type="button" style="color:#f44336;border-color:#f44336">נתק</button>
        <button class="btn-primary" id="sidekickKeyConnect" type="button">שמור וחבר</button>
      </div>
    </div>
  `;
}

function ensureDom() {
  if (!document.getElementById('sidekickRoot')) {
    const root = document.createElement('div');
    root.id = 'sidekickRoot';
    root.innerHTML = `
      <div class="sidekick-panel" id="sidekickPanel" hidden>
        <div class="sidekick-header">
          <div class="sidekick-title-wrap">
            <div class="sidekick-title">Trip Planner</div>
            <span class="sidekick-provider-badge" id="sidekickProviderBadge">—</span>
          </div>
          <div class="sidekick-header-actions">
            <button type="button" class="sidekick-icon-btn" id="sidekickSettings" title="API keys">⚙️</button>
            <button type="button" class="sidekick-icon-btn" id="sidekickClear" title="נקה היסטוריה">🗑️</button>
            <button type="button" class="sidekick-icon-btn" id="sidekickClose" title="סגור">✕</button>
          </div>
        </div>
        <div class="sidekick-messages" id="sidekickMessages"></div>
        <div class="sidekick-pending" id="sidekickPendingBanner" hidden></div>
        <form class="sidekick-composer" id="sidekickForm">
          <textarea id="sidekickInput" rows="2" placeholder="שאלי על הלו״ז או בקשי שינוי…" dir="auto"></textarea>
          <button type="submit" class="sidekick-send" id="sidekickSend">שלח</button>
        </form>
      </div>
      <button type="button" class="sidekick-launcher is-disabled" id="sidekickLauncher" aria-label="Sidekick" aria-disabled="true">✨</button>
    `;
    document.body.appendChild(root);
  }

  // Keep launcher on the map (not over the RTL sidebar)
  const mapBox = document.querySelector('.map-container');
  const rootEl = document.getElementById('sidekickRoot');
  if (mapBox && rootEl && rootEl.parentElement !== mapBox) {
    mapBox.appendChild(rootEl);
  }

  let overlay = document.getElementById('sidekickKeyModalOverlay')
    || document.getElementById('geminiModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'sidekickKeyModalOverlay';
    overlay.innerHTML = modalMarkup();
    document.body.appendChild(overlay);
  } else if (!document.getElementById('openaiKeyInput')) {
    // Upgrade legacy Gemini-only modal markup
    overlay.id = 'sidekickKeyModalOverlay';
    overlay.innerHTML = modalMarkup();
  }
}

function renderMessages() {
  const box = document.getElementById('sidekickMessages');
  if (!box) return;
  const messages = loadHistory();
  if (!messages.length) {
    box.innerHTML = `<div class="sidekick-msg sidekick-msg-assistant">
      <div class="sidekick-bubble">היי! אני ה-Trip Planner. Monday הוא מסד הנתונים והמסך הזה משקף את הלוח.
לפני כל שינוי אבקש אישור (approve / אשר). איך אפשר לעזור?</div>
    </div>`;
  } else {
    box.innerHTML = messages.map(m => {
      const role = m.role === 'user' ? 'user' : 'assistant';
      const extra = m.kind === 'system' ? ' sidekick-msg-system' : '';
      return `<div class="sidekick-msg sidekick-msg-${role}${extra}">
        <div class="sidekick-bubble">${escapeHtml(m.text).replace(/\n/g, '<br>')}</div>
      </div>`;
    }).join('');
  }
  box.scrollTop = box.scrollHeight;
  renderPendingBanner();
}

function renderPendingBanner() {
  const el = document.getElementById('sidekickPendingBanner');
  if (!el) return;
  const pending = loadPending();
  if (!pending) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.hidden = false;
  el.innerHTML = `
    <strong>ממתין לאישור:</strong> ${escapeHtml(proposalSummary(pending))}
    <div class="sidekick-pending-hint">כתבי <code>approve</code> או <code>אשר</code> כדי לבצע</div>
  `;
}

function setOpen(open) {
  const panel = document.getElementById('sidekickPanel');
  const launcher = document.getElementById('sidekickLauncher');
  if (!panel || !launcher) return;
  panel.hidden = !open;
  launcher.classList.toggle('open', open);
  if (open) {
    renderMessages();
    updateComposerState();
    updateProviderBadge();
    if (hasActiveKey()) document.getElementById('sidekickInput')?.focus();
  }
}

function appendMessage(role, text, { kind } = {}) {
  const messages = loadHistory();
  messages.push({ role, text, kind, at: Date.now() });
  while (messages.length > 60) messages.shift();
  saveHistory(messages);
  renderMessages();
}

function toGeminiContents(messages) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));
}

function toOpenAIMessages(messages) {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text,
    }));
}

async function runModelChat(systemInstruction, historyMessages) {
  const token = activeToken();
  if (!token) throw new Error('אין API key פעיל');

  if (provider === 'openai') {
    const messages = toOpenAIMessages(historyMessages);
    return openaiChat(token, { systemInstruction, messages });
  }

  const contents = toGeminiContents(historyMessages);
  return geminiChat(token, { systemInstruction, contents });
}

async function handleSend(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || busy) return;

  if (!hasActiveKey()) {
    openSidekickKeyModal();
    return;
  }

  busy = true;
  updateComposerState();
  const input = document.getElementById('sidekickInput');
  if (input) input.value = '';

  appendMessage('user', trimmed);

  try {
    if (isApproveMessage(trimmed)) {
      const pending = loadPending();
      if (!pending) {
        appendMessage('assistant', 'אין הצעה ממתינה לאישור. בקשי שינוי ואאשר אותו לפני הביצוע.', { kind: 'system' });
        return;
      }
      const days = opts.getDays?.() || [];
      const vErr = validateProposal(pending, days);
      if (vErr) {
        savePending(null);
        appendMessage('assistant', `לא ניתן לבצע את ההצעה: ${vErr}`, { kind: 'system' });
        return;
      }
      try {
        const doneMsg = await executeProposal(pending);
        savePending(null);
        if (opts.onBoardChanged) await opts.onBoardChanged();
        appendMessage('assistant', `✅ בוצע: ${doneMsg}`, { kind: 'system' });
      } catch (e) {
        appendMessage('assistant', `❌ הביצוע נכשל: ${e.message || e}`, { kind: 'system' });
      }
      return;
    }

    const days = opts.getDays?.() || [];
    const food = opts.getFoodGuide?.() || [];
    const snapshot = buildItinerarySnapshot(days, food, opts.country);
    const systemInstruction = buildSystemPrompt(snapshot);
    const history = loadHistory();
    const { text: reply } = await runModelChat(systemInstruction, history);
    const { visibleText, proposal } = parseProposalFromText(reply);

    if (proposal) {
      const vErr = validateProposal(proposal, days);
      if (vErr) {
        savePending(null);
        appendMessage('assistant', `${visibleText || reply}\n\n(ההצעה לא נשמרה: ${vErr})`);
      } else {
        savePending(proposal);
        const note = `\n\n—\n📋 ממתין לאישור: ${proposalSummary(proposal)}\nכתבי approve או אשר כדי לבצע.`;
        appendMessage('assistant', (visibleText || 'הנה מה שאני מציע:') + note);
      }
    } else {
      savePending(null);
      appendMessage('assistant', visibleText || reply);
    }
  } catch (e) {
    appendMessage('assistant', `שגיאה: ${e.message || e}`, { kind: 'system' });
  } finally {
    busy = false;
    updateComposerState();
    renderPendingBanner();
  }
}

function activeKeyInput() {
  return document.getElementById(provider === 'openai' ? 'openaiKeyInput' : 'geminiKeyInput');
}

function bindEvents() {
  document.getElementById('sidekickLauncher')?.addEventListener('click', () => {
    if (!hasActiveKey()) {
      openSidekickKeyModal();
      return;
    }
    const panel = document.getElementById('sidekickPanel');
    setOpen(!!panel?.hidden);
  });

  document.getElementById('sidekickHeaderBtn')?.addEventListener('click', () => {
    if (!hasActiveKey()) {
      openSidekickKeyModal();
      return;
    }
    const panel = document.getElementById('sidekickPanel');
    setOpen(!!panel?.hidden);
  });

  document.getElementById('sidekickClose')?.addEventListener('click', () => setOpen(false));
  document.getElementById('sidekickSettings')?.addEventListener('click', () => openSidekickKeyModal());
  document.getElementById('sidekickClear')?.addEventListener('click', () => {
    if (!confirm('לנקות את היסטוריית הצ׳אט?')) return;
    saveHistory([]);
    savePending(null);
    renderMessages();
  });

  document.getElementById('sidekickForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSend(document.getElementById('sidekickInput')?.value);
  });

  document.getElementById('sidekickInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e.target.value);
    }
  });

  const overlay = document.getElementById('sidekickKeyModalOverlay')
    || document.getElementById('geminiModalOverlay');
  document.getElementById('sidekickKeyCancel')?.addEventListener('click', closeSidekickKeyModal);
  document.getElementById('geminiModalCancel')?.addEventListener('click', closeSidekickKeyModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeSidekickKeyModal();
  });

  document.querySelectorAll('[data-sidekick-provider]').forEach(btn => {
    btn.addEventListener('click', () => setProvider(btn.dataset.sidekickProvider));
  });

  bindClearOnInput(['geminiKeyInput', 'openaiKeyInput']);

  const connectBtn = document.getElementById('sidekickKeyConnect')
    || document.getElementById('geminiConnect');
  connectBtn?.addEventListener('click', async () => {
    const keyInput = activeKeyInput();
    const status = document.getElementById('sidekickKeyStatusBox')
      || document.getElementById('geminiStatusBox');
    const checked = validateApiKey(keyInput);
    if (!checked.ok) {
      shakeModal(overlay?.id || 'sidekickKeyModalOverlay');
      return;
    }
    if (status) {
      status.className = 'sync-status-box pending';
      status.textContent = provider === 'openai' ? '⏳ מאמת מול ChatGPT…' : '⏳ מאמת מול Gemini…';
    }
    try {
      await connectActiveProvider(checked.value);
      clearOneField(keyInput);
      if (status) {
        status.className = 'sync-status-box ok';
        status.textContent = provider === 'openai' ? '✓ מחובר ל-ChatGPT' : '✓ מחובר ל-Gemini';
      }
      setTimeout(closeSidekickKeyModal, 450);
    } catch (e) {
      if (status) {
        status.className = 'sync-status-box err';
        status.textContent = `❌ ${e.message || e}`;
      }
      shakeModal(overlay?.id || 'sidekickKeyModalOverlay');
    }
  });

  const disconnectBtn = document.getElementById('sidekickKeyDisconnect')
    || document.getElementById('geminiDisconnect');
  disconnectBtn?.addEventListener('click', () => {
    disconnectActiveProvider();
    fillKeyInputs();
    updateModalStatus();
    const status = document.getElementById('sidekickKeyStatusBox')
      || document.getElementById('geminiStatusBox');
    if (status) {
      status.className = 'sync-status-box pending';
      status.textContent = 'נותק הספק הנוכחי';
    }
    if (!hasActiveKey()) setOpen(false);
  });

  ['geminiKeyInput', 'openaiKeyInput'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        connectBtn?.click();
      }
    });
  });
}

/**
 * @param {{
 *   country: 'japan'|'thailand',
 *   getDays: () => Array,
 *   getFoodGuide?: () => Array,
 *   onBoardChanged?: () => Promise<void>|void,
 * }} options
 */
export function initSidekick(options) {
  opts = options;
  // Prefer provider that already has a key
  if (!hasActiveKey() && hasAnyKey()) {
    provider = geminiToken ? 'gemini' : 'openai';
    localStorage.setItem(STORAGE_PROVIDER, provider);
  }
  ensureDom();
  if (!initialized) {
    bindEvents();
    initialized = true;
  }
  syncProviderTabs();
  updateLauncherState();
  updateComposerState();
  updateProviderBadge();
  renderMessages();
}
