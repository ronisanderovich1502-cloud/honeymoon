import { MONDAY_BOARD } from './monday-config.js';
import { connectMonday, disconnectMonday, isConnected, loadMondayData, clearMondayCache } from './sync.js';
import { inlineChipSkeleton } from './skeleton.js';

const loginCard = document.getElementById('loginCard');
const destPanel = document.getElementById('destinationsPanel');
const statusBox = document.getElementById('loginStatusBox');
const keyInput = document.getElementById('loginKeyInput');

function showLogin() {
  loginCard.style.display = '';
  destPanel.style.display = 'none';
}

function showDestinations() {
  loginCard.style.display = 'none';
  destPanel.style.display = '';
}

async function prefetchBoards() {
  document.getElementById('japanDaysCount').innerHTML = inlineChipSkeleton();
  document.getElementById('thailandDaysCount').innerHTML = inlineChipSkeleton();
  try {
    const [jp, th] = await Promise.all([
      loadMondayData('japan', { force: true }),
      loadMondayData('thailand', { force: true }),
    ]);
    const jpDays = jp?.days?.length || 0;
    const jpActs = jp?.days?.reduce((s, d) => s + d.activities.length, 0) || 0;
    const thDays = th?.days?.length || 0;
    const thActs = th?.days?.reduce((s, d) => s + d.activities.length, 0) || 0;
    document.getElementById('japanDaysCount').textContent = `${jpDays} ימים · ${jpActs} פעילויות`;
    document.getElementById('thailandDaysCount').textContent = `${thDays} ימים · ${thActs} פעילויות`;
    document.getElementById('loginReadyLabel').textContent =
      `✅ מחובר · נטען מלוח ${MONDAY_BOARD.boardId}`;
  } catch (e) {
    document.getElementById('japanDaysCount').textContent = 'שגיאה בטעינה';
    document.getElementById('thailandDaysCount').textContent = 'שגיאה בטעינה';
    statusBox.className = 'sync-status-box err';
    statusBox.textContent = `❌ ${e.message}`;
    statusBox.style.display = 'block';
    showLogin();
  }
}

document.getElementById('loginSubmit').addEventListener('click', async () => {
  const key = keyInput.value.trim();
  if (!key) {
    statusBox.className = 'sync-status-box err';
    statusBox.textContent = '❌ נא להזין API key';
    return;
  }
  statusBox.className = 'sync-status-box';
  statusBox.textContent = '⏳ מאמת וטוען לו״ז מ-Monday...';
  statusBox.style.display = 'block';
  try {
    await connectMonday(key);
    clearMondayCache();
    showDestinations();
    await prefetchBoards();
  } catch (e) {
    statusBox.className = 'sync-status-box err';
    statusBox.textContent = `❌ ${e.message}`;
  }
});

keyInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginSubmit').click();
});

document.getElementById('loginDisconnect').addEventListener('click', () => {
  disconnectMonday();
  keyInput.value = '';
  statusBox.className = 'sync-status-box';
  statusBox.textContent = '';
  showLogin();
});

document.getElementById('gotoJapan').addEventListener('click', () => {
  localStorage.setItem('honeymoon-country', 'japan');
});
document.getElementById('gotoThailand').addEventListener('click', () => {
  localStorage.setItem('honeymoon-country', 'thailand');
});

if (isConnected()) {
  showDestinations();
  prefetchBoards();
} else {
  showLogin();
}
