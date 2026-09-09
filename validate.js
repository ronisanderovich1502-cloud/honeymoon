/** Shared form validation for honeymoon app */

import { isValidTimeSlot, normalizeTimeToSlot, parseTimeToMinutes } from './time-options.js';
import { MONDAY_BOARD } from './monday-config.js';

const NAME_MAX = 120;
const DESC_MAX = 400;
const AREA_MAX = 80;
const API_KEY_MIN = 20;

export const PLACE_TYPE_VALUES = Object.keys(MONDAY_BOARD.placeTypes);

export function normalizePlaceType(raw, fallback = 'attraction') {
  const s = String(raw || '').trim().toLowerCase();
  if (PLACE_TYPE_VALUES.includes(s)) return s;
  // Monday status text sometimes mirrors the English label
  if (s.includes('cafe') || s.includes('קפה')) return 'cafe';
  if (s.includes('restaurant') || s.includes('מסעד')) return 'restaurant';
  if (s.includes('attraction') || s.includes('אטרק')) return 'attraction';
  return PLACE_TYPE_VALUES.includes(fallback) ? fallback : 'attraction';
}

export function clearFieldErrors(root = document) {
  root.querySelectorAll('.field-error').forEach(el => el.remove());
  root.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

export function setFieldError(inputEl, message) {
  if (!inputEl) return;
  inputEl.classList.add('is-invalid');
  inputEl.setAttribute('aria-invalid', 'true');
  const existing = inputEl.parentElement?.querySelector(`.field-error[data-for="${inputEl.id}"]`);
  if (existing) {
    existing.textContent = message;
    return;
  }
  const err = document.createElement('div');
  err.className = 'field-error';
  err.dataset.for = inputEl.id || '';
  err.setAttribute('role', 'alert');
  err.textContent = message;
  inputEl.insertAdjacentElement('afterend', err);
}

export function clearOneField(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('is-invalid');
  inputEl.removeAttribute('aria-invalid');
  const id = inputEl.id;
  if (id) {
    inputEl.parentElement?.querySelectorAll(`.field-error[data-for="${id}"]`).forEach(el => el.remove());
  }
  const next = inputEl.nextElementSibling;
  if (next?.classList.contains('field-error')) next.remove();
}

/** Bind live clear-on-input for a list of field ids */
export function bindClearOnInput(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.validationBound) return;
    el.dataset.validationBound = '1';
    el.addEventListener('input', () => clearOneField(el));
    el.addEventListener('change', () => clearOneField(el));
  });
}

function reqName(value, label = 'שם') {
  const v = (value || '').trim();
  if (!v) return `${label} הוא שדה חובה`;
  if (v.length < 2) return `${label} קצר מדי (לפחות 2 תווים)`;
  if (v.length > NAME_MAX) return `${label} ארוך מדי (עד ${NAME_MAX} תווים)`;
  return null;
}

function optDesc(value) {
  const v = (value || '').trim();
  if (v.length > DESC_MAX) return `תיאור ארוך מדי (עד ${DESC_MAX} תווים)`;
  return null;
}

function reqCoords(place, { allowMissing = false } = {}) {
  if (allowMissing && !place) return null;
  if (!place) return 'נא לחפש ולבחור מקום מהרשימה';
  const lat = Number(place.lat);
  const lng = Number(place.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'מיקום לא תקין — בחרי שוב מהרשימה';
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return 'קואורדינטות מחוץ לטווח';
  return null;
}

function reqDay(dayNum, daysList) {
  if (!Number.isFinite(dayNum) || dayNum < 1) return 'נא לבחור יום בתוכנית';
  if (daysList?.length && !daysList.some(d => d.day === dayNum)) return 'היום שנבחר לא קיים בלו״ז';
  return null;
}

/**
 * Validate add/edit place modal.
 * @returns {{ ok: boolean, values?: object }}
 */
export function validatePlaceForm({ isEdit = false, daysList = [], selectedPlace = null, existingAct = null } = {}) {
  const root = document.getElementById('modalOverlay') || document;
  clearFieldErrors(root);

  const nameEl = document.getElementById('newPlaceName');
  const descEl = document.getElementById('newPlaceDesc');
  const typeEl = document.getElementById('newPlaceType');
  const timeEl = document.getElementById('newPlaceTime');
  const timeEndEl = document.getElementById('newPlaceTimeEnd');
  const dayEl = document.getElementById('newPlaceDay');
  const searchEl = document.getElementById('placesSearchInput');

  const name = nameEl?.value.trim() || '';
  const desc = descEl?.value.trim() || '';
  const type = normalizePlaceType(
    typeEl?.value || (isEdit ? existingAct?.type : 'attraction'),
    'attraction',
  );
  const timeRaw = timeEl?.value.trim() || '';
  const timeEndRaw = timeEndEl?.value.trim() || '';
  const time = timeRaw || (isEdit ? normalizeTimeToSlot(existingAct?.time, { emptyAs: '' }) : '');
  const timeEnd = timeEndRaw || (isEdit ? normalizeTimeToSlot(existingAct?.timeEnd, { emptyAs: '' }) : '');
  const dayNum = parseInt(dayEl?.value, 10);

  let ok = true;
  const nameErr = reqName(name, 'שם המקום');
  if (nameErr) { setFieldError(nameEl, nameErr); ok = false; }

  const descErr = optDesc(desc);
  if (descErr) { setFieldError(descEl, descErr); ok = false; }

  if (typeEl && !PLACE_TYPE_VALUES.includes(typeEl.value)) {
    setFieldError(typeEl, 'נא לבחור סוג מקום');
    ok = false;
  }

  if (!timeRaw) {
    setFieldError(timeEl, 'נא לבחור שעת התחלה');
    ok = false;
  } else if (!isValidTimeSlot(timeRaw)) {
    setFieldError(timeEl, 'נא לבחור שעה מהרשימה (כל 30 דקות)');
    ok = false;
  }

  if (!timeEndRaw) {
    setFieldError(timeEndEl, 'נא לבחור שעת סיום');
    ok = false;
  } else if (!isValidTimeSlot(timeEndRaw)) {
    setFieldError(timeEndEl, 'נא לבחור שעה מהרשימה (כל 30 דקות)');
    ok = false;
  } else if (timeRaw && timeEndRaw) {
    const startM = parseTimeToMinutes(timeRaw);
    const endM = parseTimeToMinutes(timeEndRaw);
    if (startM != null && endM != null && endM <= startM) {
      setFieldError(timeEndEl, 'שעת סיום חייבת להיות אחרי שעת התחלה');
      ok = false;
    }
  }

  const dayErr = reqDay(dayNum, daysList);
  if (dayErr) { setFieldError(dayEl, dayErr); ok = false; }

  if (!isEdit) {
    const coordErr = reqCoords(selectedPlace);
    if (coordErr) {
      setFieldError(searchEl, coordErr);
      ok = false;
    }
  } else if (selectedPlace) {
    const coordErr = reqCoords(selectedPlace);
    if (coordErr) { setFieldError(searchEl, coordErr); ok = false; }
  } else if (!Number.isFinite(Number(existingAct?.lat)) || !Number.isFinite(Number(existingAct?.lng))) {
    setFieldError(searchEl, 'חסר מיקום — חפשי ולבחרי מקום מהרשימה');
    ok = false;
  }

  if (!ok) return { ok: false };

  const lat = selectedPlace ? Number(selectedPlace.lat) : Number(existingAct?.lat);
  const lng = selectedPlace ? Number(selectedPlace.lng) : Number(existingAct?.lng);

  return {
    ok: true,
    values: {
      name,
      desc,
      type,
      time: timeRaw || time,
      timeEnd: timeEndRaw || timeEnd,
      dayNum,
      lat,
      lng,
      selectedPlace,
    },
  };
}

/** Validate food guide modal */
export function validateFoodForm({ maxDay = 31 } = {}) {
  const root = document.getElementById('foodModalOverlay') || document;
  clearFieldErrors(root);

  const nameEl = document.getElementById('foodItemName');
  const areaEl = document.getElementById('foodItemArea');
  const cityEl = document.getElementById('foodItemCity');
  const catEl = document.getElementById('foodItemCategory');
  const descEl = document.getElementById('foodItemDesc');
  const dayEl = document.getElementById('foodItemDay');

  let ok = true;
  const nameErr = reqName(nameEl?.value, 'שם המקום');
  if (nameErr) { setFieldError(nameEl, nameErr); ok = false; }

  const area = (areaEl?.value || '').trim();
  if (!area) { setFieldError(areaEl, 'איזור הוא שדה חובה'); ok = false; }
  else if (area.length < 2) { setFieldError(areaEl, 'איזור קצר מדי'); ok = false; }
  else if (area.length > AREA_MAX) { setFieldError(areaEl, `איזור ארוך מדי (עד ${AREA_MAX})`); ok = false; }

  if (!cityEl?.value) { setFieldError(cityEl, 'נא לבחור עיר'); ok = false; }
  if (!catEl?.value) { setFieldError(catEl, 'נא לבחור קטגוריה'); ok = false; }

  const descErr = optDesc(descEl?.value);
  if (descErr) { setFieldError(descEl, descErr); ok = false; }

  const dayRaw = (dayEl?.value || '').trim();
  let day = null;
  if (dayRaw !== '') {
    day = parseInt(dayRaw, 10);
    if (!Number.isFinite(day) || day < 1 || day > maxDay) {
      setFieldError(dayEl, `יום חייב להיות בין 1 ל-${maxDay}`);
      ok = false;
    }
  }

  if (!ok) return { ok: false };

  return {
    ok: true,
    values: {
      name: nameEl.value.trim(),
      area,
      city: cityEl.value,
      category: catEl.value,
      desc: (descEl?.value || '').trim(),
      day,
    },
  };
}

/** Validate Monday API key (login + sync modal) */
export function validateApiKey(inputEl) {
  clearOneField(inputEl);
  const key = (inputEl?.value || '').trim();
  if (!key) {
    setFieldError(inputEl, 'נא להזין Monday API key');
    return { ok: false };
  }
  if (key.length < API_KEY_MIN) {
    setFieldError(inputEl, 'המפתח קצר מדי — הדביקי API key מלא מ-Monday');
    return { ok: false };
  }
  if (/\s/.test(key)) {
    setFieldError(inputEl, 'המפתח לא יכול להכיל רווחים');
    return { ok: false };
  }
  return { ok: true, value: key };
}

export function shakeModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (!overlay) return;
  const modal = overlay.matches('.modal, .sync-modal, .login-card')
    ? overlay
    : overlay.querySelector('.modal, .sync-modal, .login-card');
  if (!modal) return;
  modal.classList.remove('shake');
  void modal.offsetWidth;
  modal.classList.add('shake');
}
