// Menu pengaturan / jeda. Dibuka lewat tombol gerigi atau tombol Esc.
// Saat terbuka, permainan benar-benar berhenti (gerak, waktu, status, event).

const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const resumeBtn = document.getElementById('resumeBtn');
const settingsRestartBtn = document.getElementById('settingsRestartBtn');
const settingsCharBtn = document.getElementById('settingsCharBtn');
const settingsTutorBtn = document.getElementById('settingsTutorBtn');
const musicToggle = document.getElementById('musicToggle');



function setPaused(paused) {
  Pause.set('settings', paused);
  settingsPanel.classList.toggle('open', paused);

  if (paused && typeof keys !== 'undefined') {
    Object.keys(keys).forEach(k => { keys[k].pressed = false; });
    if (typeof lastKey !== 'undefined') lastKey = '';
  }
}

function openSettings() {
  if (typeof gameOver !== 'undefined' && gameOver) return;
  if (window.Expedition?.panelOpen || window.Minigames?.active || Pause.reasons.has('tutorial')) return;
  if (window.Dialogue && Dialogue.active) Dialogue.close();
  if (typeof showInventoryPanel === 'function') showInventoryPanel(false);
  setPaused(true);
}

function closeSettings() {
  setPaused(false);
}

settingsBtn.addEventListener('click', openSettings);
resumeBtn.addEventListener('click', closeSettings);
settingsRestartBtn.addEventListener('click', () => { closeSettings(); Expedition.returnHome(); });
settingsCharBtn.addEventListener('click', () => { closeSettings(); Expedition.open('friends'); });

if (settingsTutorBtn) {
  settingsTutorBtn.addEventListener('click', () => {
    closeSettings();
    if (typeof startTutorial === 'function') startTutorial(true);
  });
}

// Musik bisa dimatikan dari sini
if (musicToggle) {
  const savedMuted = GameStorage.get('musicMuted') === '1';
  const applyMute = (muted) => {
    if (typeof audio !== 'undefined' && audio.Map) audio.Map.muted = muted;
    musicToggle.textContent = muted ? 'MUSIK: MATI' : 'MUSIK: NYALA';
    musicToggle.classList.toggle('off', muted);
    GameStorage.set('musicMuted', muted ? '1' : '0');
  };
  applyMute(savedMuted);
  musicToggle.addEventListener('click', () => {
    const muted = !(typeof audio !== 'undefined' && audio.Map && audio.Map.muted);
    applyMute(muted);
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (window.Dialogue?.active || window.Expedition?.panelOpen || window.Minigames?.active || Pause.reasons.has('tutorial')) return;
  if (isInventoryOpen()) { showInventoryPanel(false); return; }
  e.preventDefault();
  if (window.gamePaused) closeSettings();
  else openSettings();
});

window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.setPaused = setPaused;
