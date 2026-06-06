import { days } from './data.js';

const GH_REPO = 'ronisanderovich1502-cloud/honeymoon';
const GH_FILE = 'data.js';
export let ghToken = localStorage.getItem('ghToken') || '';

export function setSyncDot(state) {
    const dot = document.getElementById('syncDot');
    dot.className = 'sync-dot' + (state ? ' ' + state : '');
}

export async function syncSave(commitMsg) {
    if (!ghToken) { setSyncDot(''); return; }
    setSyncDot('syncing');
    const headers = { 'Authorization': `Bearer ${ghToken}`, 'Accept': 'application/vnd.github+json' };
    try {
        const fileRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, { headers });
        if (!fileRes.ok) throw new Error(`GitHub ${fileRes.status}`);
        const fileData = await fileRes.json();
        const currentContent = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
        const sha = fileData.sha;

        const newDays = JSON.stringify(days, null, 4);
        const newContent = currentContent.replace(
            /\/\/ __ITINERARY_DATA_START__[\s\S]*?\/\/ __ITINERARY_DATA_END__/,
            `// __ITINERARY_DATA_START__\nexport const days = ${newDays};\n// __ITINERARY_DATA_END__`
        );

        const commitRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: commitMsg || 'Update itinerary via website',
                content: btoa(unescape(encodeURIComponent(newContent))),
                sha,
                branch: 'master'
            })
        });
        if (!commitRes.ok) {
            const err = await commitRes.json();
            throw new Error(err.message || commitRes.status);
        }
        setSyncDot('synced');
    } catch(e) {
        console.error('GitHub sync:', e.message);
        setSyncDot('error');
    }
}

export function initSync() {
    const syncModalOverlay = document.getElementById('syncModalOverlay');

    document.getElementById('syncSettingsBtn').addEventListener('click', () => {
        document.getElementById('ghTokenInput').value = ghToken;
        document.getElementById('syncStatusBox').className = 'sync-status-box';
        syncModalOverlay.classList.add('open');
    });
    document.getElementById('syncModalCancel').addEventListener('click', () => syncModalOverlay.classList.remove('open'));
    syncModalOverlay.addEventListener('click', e => {
        if (e.target === syncModalOverlay) syncModalOverlay.classList.remove('open');
    });

    document.getElementById('syncDisconnect').addEventListener('click', () => {
        localStorage.removeItem('ghToken');
        ghToken = '';
        setSyncDot('');
        syncModalOverlay.classList.remove('open');
    });

    document.getElementById('syncConnect').addEventListener('click', async () => {
        const token = document.getElementById('ghTokenInput').value.trim();
        const box = document.getElementById('syncStatusBox');
        if (!token) { box.className = 'sync-status-box err'; box.textContent = '❌ נא להזין Token'; return; }
        box.className = 'sync-status-box'; box.textContent = '⏳ מאמת...'; box.style.display = 'block';
        try {
            const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
            });
            if (!res.ok) throw new Error(`GitHub ${res.status} — בדוק שה-token נכון ויש לו הרשאות Contents: write`);
            ghToken = token;
            localStorage.setItem('ghToken', token);
            setSyncDot('synced');
            box.className = 'sync-status-box ok';
            box.textContent = '✅ מחובר! שינויים יעלו אוטומטית ל-GitHub Pages תוך ~30 שניות.';
        } catch(e) {
            box.className = 'sync-status-box err'; box.textContent = `❌ ${e.message}`;
        }
    });

    setSyncDot(ghToken ? 'synced' : '');
}
