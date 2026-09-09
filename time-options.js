/** Half-hour time slots for place add/edit (06:00–23:30). */

export const TIME_SLOT_STEP_MIN = 30;
export const TIME_SLOT_START_MIN = 6 * 60;  // 06:00
export const TIME_SLOT_END_MIN = 23 * 60 + 30; // 23:30

/** Defaults for free-text labels that used to live on the board */
export const DEFAULT_NIGHT_START = '21:00';
export const DEFAULT_NIGHT_END = '23:00';
export const DEFAULT_FULL_DAY_START = '09:00';
export const DEFAULT_FULL_DAY_END = '18:00';
export const DEFAULT_DURATION_MIN = 90;

export function buildTimeSlots() {
  const slots = [];
  for (let m = TIME_SLOT_START_MIN; m <= TIME_SLOT_END_MIN; m += TIME_SLOT_STEP_MIN) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export const TIME_SLOTS = buildTimeSlots();

const SLOT_SET = new Set(TIME_SLOTS);

export function minutesToSlot(mins) {
  const clamped = Math.min(TIME_SLOT_END_MIN, Math.max(TIME_SLOT_START_MIN, mins));
  const stepped = Math.round(clamped / TIME_SLOT_STEP_MIN) * TIME_SLOT_STEP_MIN;
  const final = Math.min(TIME_SLOT_END_MIN, Math.max(TIME_SLOT_START_MIN, stepped));
  const hh = String(Math.floor(final / 60)).padStart(2, '0');
  const mm = String(final % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Parse loose time strings → minutes from midnight, or null */
export function parseTimeToMinutes(raw) {
  let v = String(raw || '').trim();
  if (!v || v === '?' || v === '-') return null;
  v = v.replace(/^[~≈]\s*/, '');
  const m = v.match(/^(\d{1,2})[:.](\d{2})\s*(am|pm)?$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    let min = parseInt(m[2], 10);
    const ap = (m[3] || '').toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }
  const onlyHour = v.match(/^(\d{1,2})\s*(am|pm)?$/i);
  if (onlyHour) {
    let h = parseInt(onlyHour[1], 10);
    const ap = (onlyHour[2] || '').toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    if (h > 23) return null;
    return h * 60;
  }
  return null;
}

/** Snap to nearest 30-min slot inside the day window; returns HH:MM or '' */
export function normalizeTimeToSlot(raw, { emptyAs = '' } = {}) {
  const mins = parseTimeToMinutes(raw);
  if (mins == null) return emptyAs;
  return minutesToSlot(mins);
}

export function isValidTimeSlot(value) {
  const v = String(value || '').trim();
  return !v || SLOT_SET.has(v);
}

/** Suggest end time = start + default duration, clamped to day window */
export function suggestEndTime(startRaw, durationMin = DEFAULT_DURATION_MIN) {
  const start = parseTimeToMinutes(startRaw);
  if (start == null) return '';
  return minutesToSlot(start + durationMin);
}

export function formatTimeRange(start, end) {
  const s = normalizeTimeToSlot(start, { emptyAs: '' });
  const e = normalizeTimeToSlot(end, { emptyAs: '' }) || (s ? suggestEndTime(s) : '');
  if (s && e) return `${s}–${e}`;
  if (s) return s;
  if (e) return `עד ${e}`;
  return '?';
}

/** Sort activities by start time ascending; reassigns sortOrder 0..n-1 in place */
export function sortActivitiesByTime(activities) {
  if (!Array.isArray(activities)) return activities;
  activities.sort((a, b) => {
    const ta = parseTimeToMinutes(a.time);
    const tb = parseTimeToMinutes(b.time);
    const sa = ta == null ? Number.POSITIVE_INFINITY : ta;
    const sb = tb == null ? Number.POSITIVE_INFINITY : tb;
    if (sa !== sb) return sa - sb;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
  activities.forEach((a, i) => { a.sortOrder = i; });
  return activities;
}

/** HTML for left-pane / badges — start and end both visible */
export function timeRangeHtml(start, end) {
  const s = normalizeTimeToSlot(start, { emptyAs: '' });
  const e = normalizeTimeToSlot(end, { emptyAs: '' }) || (s ? suggestEndTime(s) : '');
  if (s && e) {
    return `<span class="activity-time"><span class="activity-time-start">${s}</span><span class="activity-time-sep">→</span><span class="activity-time-end">${e}</span></span>`;
  }
  if (s) return `<span class="activity-time">${s}</span>`;
  return `<span class="activity-time">?</span>`;
}

/** Fill a time <select>; safe to call repeatedly */
export function fillTimeSelect(selectEl, { includeEmpty = true, emptyLabel = '— ללא שעה —' } = {}) {
  if (!selectEl || selectEl.dataset.timeSlotsFilled === '1') return;
  selectEl.innerHTML = '';
  if (includeEmpty) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = emptyLabel;
    selectEl.appendChild(opt);
  }
  TIME_SLOTS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    selectEl.appendChild(opt);
  });
  selectEl.dataset.timeSlotsFilled = '1';
}

export function setTimeSelectValue(selectEl, raw) {
  if (!selectEl) return;
  fillTimeSelect(selectEl);
  const slot = normalizeTimeToSlot(raw, { emptyAs: '' });
  if (slot && !SLOT_SET.has(slot)) {
    const opt = document.createElement('option');
    opt.value = slot;
    opt.textContent = slot;
    selectEl.appendChild(opt);
  }
  selectEl.value = slot;
}
