/** Day notes UI: Monday updates + local hide */

import { isConnected, requireMonday, syncNoteCreate, syncNoteUpdate, syncNoteDelete } from './sync.js';

const HIDDEN_KEY = 'hiddenMondayNotes';

export function getHiddenNoteIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveHiddenNoteIds(set) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set]));
}

export function hideNoteLocal(noteId) {
  const set = getHiddenNoteIds();
  set.add(String(noteId));
  saveHiddenNoteIds(set);
}

export function unhideNoteLocal(noteId) {
  const set = getHiddenNoteIds();
  set.delete(String(noteId));
  saveHiddenNoteIds(set);
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNoteTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('he-IL', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function noteCardHtml(n, { connected, showHidden }) {
  const id = String(n.id || '');
  const hidden = getHiddenNoteIds().has(id);
  if (hidden && !showHidden) return '';
  const actions = connected
    ? `<div class="day-note-actions">
        <button type="button" class="day-note-btn day-note-edit" title="ערוך">✏️</button>
        <button type="button" class="day-note-btn day-note-hide" title="${hidden ? 'הצג מקומית' : 'הסתר מקומית'}">${hidden ? '👁️' : '🙈'}</button>
        <button type="button" class="day-note-btn day-note-delete" title="מחק">🗑️</button>
      </div>`
    : `<div class="day-note-actions">
        <button type="button" class="day-note-btn day-note-hide" title="${hidden ? 'הצג מקומית' : 'הסתר מקומית'}">${hidden ? '👁️' : '🙈'}</button>
      </div>`;
  return `
    <div class="day-note${hidden ? ' is-hidden-local' : ''}" data-note-id="${escapeHtml(id)}">
      <div class="day-note-top">
        <div class="day-note-meta">${escapeHtml(n.author || 'הערה')}${n.createdAt ? ` · ${formatNoteTime(n.createdAt)}` : ''}${hidden ? ' · מוסתר' : ''}</div>
        ${actions}
      </div>
      <div class="day-note-text">${escapeHtml(n.text)}</div>
      <div class="day-note-edit-form" hidden>
        <textarea class="day-note-edit-input" rows="2">${escapeHtml(n.text)}</textarea>
        <div class="day-note-edit-actions">
          <button type="button" class="day-note-save">שמור</button>
          <button type="button" class="day-note-cancel">ביטול</button>
        </div>
      </div>
    </div>`;
}

export function notesListHtml(day, { showHidden = false } = {}) {
  const notes = day.notes || [];
  const hidden = getHiddenNoteIds();
  const visible = notes.filter(n => showHidden || !hidden.has(String(n.id)));
  const hiddenCount = notes.filter(n => hidden.has(String(n.id))).length;

  let html = '';
  if (!visible.length) {
    html += `<div class="day-notes-empty">${
      notes.length && hiddenCount
        ? 'כל ההערות מוסתרות במכשיר זה'
        : (isConnected() ? 'אין הערות עדיין' : 'חברי Monday כדי לראות הערות')
    }</div>`;
  } else {
    html += visible.map(n => noteCardHtml(n, { connected: isConnected(), showHidden })).join('');
  }

  if (hiddenCount > 0) {
    html += `<button type="button" class="day-notes-toggle-hidden" data-day="${day.day}" data-show="${showHidden ? '1' : '0'}">
      ${showHidden ? `הסתר מוסתרות (${hiddenCount})` : `הצג הערות מוסתרות (${hiddenCount})`}
    </button>`;
  }
  return html;
}

export function dayNotesBlockHtml(day) {
  const connected = isConnected();
  return `
    <div class="day-notes-wrap" data-day="${day.day}" data-show-hidden="0">
      <div class="day-notes-label">📝 הערות ליום ${day.day}</div>
      <div class="day-notes-list">${notesListHtml(day, { showHidden: false })}</div>
      ${connected ? `
        <div class="day-notes-composer">
          <textarea class="day-notes-input" data-day="${day.day}" rows="2" placeholder="הוסף הערה, טיפ, מספר הזמנה..."></textarea>
          <button type="button" class="day-notes-add" data-day="${day.day}">הוסף הערה</button>
        </div>
      ` : `<div class="day-notes-empty">חברי Monday כדי להוסיף הערות</div>`}
    </div>`;
}

function refreshDayNotesList(wrap, day) {
  if (!wrap || !day) return;
  const showHidden = wrap.dataset.showHidden === '1';
  const list = wrap.querySelector('.day-notes-list');
  if (list) list.innerHTML = notesListHtml(day, { showHidden });
}

/**
 * @param {{ getDays: () => Array, showToast: (msg: string, ms?: number) => void }} opts
 */
export function bindDayNotesHandlers({ getDays, showToast }) {
  if (document.body.dataset.dayNotesBound === '1') return;
  document.body.dataset.dayNotesBound = '1';

  document.addEventListener('click', async (e) => {
    const addBtn = e.target.closest('.day-notes-add');
    if (addBtn) {
      if (!requireMonday()) return;
      const dayNum = parseInt(addBtn.dataset.day, 10);
      const day = getDays().find(d => d.day === dayNum);
      if (!day?.mondayId) { showToast('חסר מזהה Monday ליום', 2500); return; }
      const wrap = addBtn.closest('.day-notes-wrap');
      const input = wrap?.querySelector('.day-notes-input');
      const text = input?.value.trim() || '';
      if (text.length < 2) { showToast('כתבי הערה קצרה לפחות', 2000); return; }
      addBtn.disabled = true;
      const result = await syncNoteCreate(dayNum, text, day.mondayId);
      addBtn.disabled = false;
      if (!result.ok) return;
      day.notes = day.notes || [];
      day.notes.push(result.note);
      refreshDayNotesList(wrap, day);
      if (input) input.value = '';
      return;
    }

    const toggle = e.target.closest('.day-notes-toggle-hidden');
    if (toggle) {
      const wrap = toggle.closest('.day-notes-wrap');
      const dayNum = parseInt(toggle.dataset.day, 10);
      const day = getDays().find(d => d.day === dayNum);
      if (!wrap || !day) return;
      wrap.dataset.showHidden = wrap.dataset.showHidden === '1' ? '0' : '1';
      refreshDayNotesList(wrap, day);
      return;
    }

    const noteEl = e.target.closest('.day-note');
    if (!noteEl) return;
    const noteId = noteEl.dataset.noteId;
    const wrap = noteEl.closest('.day-notes-wrap');
    const dayNum = parseInt(wrap?.dataset.day, 10);
    const day = getDays().find(d => d.day === dayNum);
    if (!day || !noteId) return;
    const note = (day.notes || []).find(n => String(n.id) === String(noteId));
    if (!note) return;

    if (e.target.closest('.day-note-hide')) {
      const hidden = getHiddenNoteIds().has(String(noteId));
      if (hidden) unhideNoteLocal(noteId);
      else hideNoteLocal(noteId);
      refreshDayNotesList(wrap, day);
      return;
    }

    if (e.target.closest('.day-note-edit')) {
      if (!requireMonday()) return;
      noteEl.querySelector('.day-note-text')?.setAttribute('hidden', '');
      noteEl.querySelector('.day-note-actions')?.setAttribute('hidden', '');
      const form = noteEl.querySelector('.day-note-edit-form');
      if (form) {
        form.hidden = false;
        const ta = form.querySelector('.day-note-edit-input');
        if (ta) { ta.value = note.text || ''; ta.focus(); }
      }
      return;
    }

    if (e.target.closest('.day-note-cancel')) {
      noteEl.querySelector('.day-note-text')?.removeAttribute('hidden');
      noteEl.querySelector('.day-note-actions')?.removeAttribute('hidden');
      const form = noteEl.querySelector('.day-note-edit-form');
      if (form) form.hidden = true;
      return;
    }

    if (e.target.closest('.day-note-save')) {
      if (!requireMonday()) return;
      const ta = noteEl.querySelector('.day-note-edit-input');
      const text = ta?.value.trim() || '';
      if (text.length < 2) { showToast('כתבי הערה קצרה לפחות', 2000); return; }
      const saveBtn = e.target.closest('.day-note-save');
      saveBtn.disabled = true;
      const result = await syncNoteUpdate(dayNum, noteId, text);
      saveBtn.disabled = false;
      if (!result.ok) return;
      Object.assign(note, result.note);
      refreshDayNotesList(wrap, day);
      return;
    }

    if (e.target.closest('.day-note-delete')) {
      if (!requireMonday()) return;
      if (!confirm('למחוק את ההערה מ-Monday?')) return;
      const result = await syncNoteDelete(dayNum, noteId);
      if (!result.ok) return;
      day.notes = (day.notes || []).filter(n => String(n.id) !== String(noteId));
      unhideNoteLocal(noteId);
      refreshDayNotesList(wrap, day);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || (!e.metaKey && !e.ctrlKey)) return;
    if (e.target.classList.contains('day-notes-input')) {
      e.preventDefault();
      e.target.closest('.day-notes-wrap')?.querySelector('.day-notes-add')?.click();
      return;
    }
    if (e.target.classList.contains('day-note-edit-input')) {
      e.preventDefault();
      e.target.closest('.day-note')?.querySelector('.day-note-save')?.click();
    }
  });
}
