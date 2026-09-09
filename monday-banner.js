/** Monday save status banner — saving until success, error on failure */

let pending = 0;
let hideTimer = null;

function ensureBanner() {
  let el = document.getElementById('mondaySaveBanner');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'mondaySaveBanner';
  el.className = 'monday-save-banner';
  el.setAttribute('role', 'status');
  el.innerHTML = `<span class="monday-save-banner-text"></span><button type="button" class="monday-save-banner-close" aria-label="סגור">✕</button>`;
  document.body.appendChild(el);
  el.querySelector('.monday-save-banner-close').addEventListener('click', () => {
    el.classList.remove('show');
  });
  return el;
}

function paint(state, message) {
  const el = ensureBanner();
  clearTimeout(hideTimer);
  el.className = `monday-save-banner show ${state}`;
  el.querySelector('.monday-save-banner-text').textContent = message;
  if (state === 'ok') {
    hideTimer = setTimeout(() => el.classList.remove('show'), 2000);
  }
}

export function beginMondaySave(message = 'שומר ב-Monday.com...') {
  pending += 1;
  paint('saving', pending > 1 ? `${message} (${pending})` : message);
}

export function endMondaySaveOk(message = 'נשמר ב-Monday.com ✓') {
  pending = Math.max(0, pending - 1);
  if (pending === 0) paint('ok', message);
  else paint('saving', `שומר ב-Monday.com... (${pending})`);
}

export function endMondaySaveError(error) {
  pending = Math.max(0, pending - 1);
  const msg = (error && error.message) ? error.message : (error || 'שגיאה בשמירה ל-Monday.com');
  paint('error', `שגיאה בשמירה ל-Monday.com — ${msg}`);
}

export function getMondayPendingCount() {
  return pending;
}
