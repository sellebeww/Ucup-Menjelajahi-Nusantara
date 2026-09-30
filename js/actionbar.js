// HUD kontekstual: tombol aksi di bawah layar berubah mengikuti apa yang ada
// di dekat player, bukan menampilkan semua aksi sekaligus.

const actionBar = document.getElementById('actionBar');
const actionContext = document.getElementById('actionContext');
const actionButtons = document.getElementById('actionButtons');
const discoveredList = document.getElementById('discoveredList');

let currentTarget = null;
let currentSignature = '';

function targetSignature(target) {
  if (!target) return 'none';
  if (target.type === 'npc') return `npc:${target.id}`;
  if (target.type === 'item') return `item:${target.id}`;
  return `obj:${target.id}`;
}

const ACTION_KEYS = ['E', 'Q', 'R'];

function buildActions(target) {
  const actions = [];

  if (target) {
    if (target.type === 'npc') {
      actions.push({ key: 'E', label: 'BICARA', run: () => talkToNpc(target) });
      // tiap NPC punya satu aksi sesuai pekerjaannya (beli makanan, kerja, memancing, ...)
      (target.actions || []).forEach((a, i) => {
        actions.push({ key: ACTION_KEYS[i + 1] || 'R', label: a.label, run: () => runNpcAction(target, i) });
      });
    } else if (target.type === 'item') {
      actions.push({ key: 'E', label: 'AMBIL', run: () => runInteractableAction(target, 0) });
    } else if (target.actions) {
      target.actions.forEach((a, i) => {
        actions.push({ key: ACTION_KEYS[i] || 'R', label: a.label, run: () => runInteractableAction(target, i) });
      });
    }
  }

  return actions;
}

function describe(target) {
  if (!target) return 'Tidak ada apa-apa di dekatmu';
  if (target.type === 'npc') {
    const d = target.data;
    return `${d.name} (${d.role}) ${d.activity}`;
  }
  if (target.type === 'item') return `${target.name} tergeletak di tanah — bisa dipungut`;
  return target.desc ? `${target.name} — ${target.desc}` : target.name;
}

function renderActionBar(target) {
  const sig = targetSignature(target);
  if (sig === currentSignature) return;      // hanya render ulang saat target berubah
  currentSignature = sig;
  currentTarget = target;

  actionBar.classList.toggle('hidden', !target);
  actionBar.classList.toggle('has-target', !!target);
  if (!target) {
    actionButtons.innerHTML = '';
    return;
  }
  actionContext.textContent = describe(target);

  actionButtons.innerHTML = '';
  buildActions(target).forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    btn.innerHTML = `<span class="action-key">${action.key}</span><span class="action-label">${action.label}</span>`;
    btn.addEventListener('click', () => {
      if (window.inputLocked || gameOver) return;
      action.run();
      refreshActionBar(true);
    });
    actionButtons.appendChild(btn);
  });
}

function refreshActionBar(force) {
  if (force) currentSignature = '';
  const target = typeof findNearestInteractable === 'function' ? findNearestInteractable() : null;
  renderActionBar(target);
  return target;
}

function triggerActionByKey(key) {
  const actions = buildActions(currentTarget);
  const action = actions.find(a => a.key === key);
  if (!action) return;
  action.run();
  refreshActionBar(true);
}

window.addEventListener('keydown', (e) => {
  if (window.Dialogue && Dialogue.active) return;
  const k = e.key.toLowerCase();
  if (e.target.matches('input, textarea') || e.repeat) return;
  if (k === 'b') { e.preventDefault(); toggleInventory(); return; }
  if (window.gamePaused || window.inputLocked || gameOver || e.repeat) return;
  if (k === 'e') triggerActionByKey('E');
  else if (k === 'q') triggerActionByKey('Q');
  else if (k === 'r') triggerActionByKey('R');
});

// Lokasi yang dibuka lewat obrolan NPC
function renderDiscovered() {
  if (!discoveredList) return;
  const names = Object.keys(GameState.discovered);
  discoveredList.innerHTML = '';
  if (!names.length) {
    discoveredList.classList.remove('show');
    return;
  }
  discoveredList.classList.add('show');
  names.forEach(n => {
    const chip = document.createElement('span');
    chip.className = 'discovered-chip';
    chip.textContent = n;
    discoveredList.appendChild(chip);
  });
}

// Penunjuk arah ke lokasi yang sudah ditandai NPC
function drawDiscoveredMarkers() {
  const names = Object.keys(GameState.discovered);
  if (!names.length) return;

  names.forEach(name => {
    const at = GameState.discovered[name];
    const s = { x: at.x + background.position.x, y: at.y + background.position.y };
    const onScreen = s.x > 0 && s.y > 0 && s.x < canvas.width && s.y < canvas.height;

    c.save();
    if (onScreen) {
      const t = Date.now() / 500;
      c.globalAlpha = 0.6 + Math.sin(t) * 0.2;
      c.fillStyle = '#ffd76a';
      c.beginPath();
      c.moveTo(s.x, s.y - 52);
      c.lineTo(s.x - 8, s.y - 68);
      c.lineTo(s.x + 8, s.y - 68);
      c.closePath();
      c.fill();
      c.font = 'bold 12px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(name, s.x, s.y - 74);
    } else {
      // tanda di tepi layar menunjuk ke arah lokasi
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const ang = Math.atan2(s.y - cy, s.x - cx);
      const rx = Math.min(cx - 40, Math.abs(Math.cos(ang)) ? (cx - 40) : 9999);
      const ry = Math.min(cy - 40, Math.abs(Math.sin(ang)) ? (cy - 40) : 9999);
      const r = Math.min(rx / Math.max(Math.abs(Math.cos(ang)), 0.0001), ry / Math.max(Math.abs(Math.sin(ang)), 0.0001));
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r;

      c.globalAlpha = 0.55;
      c.translate(px, py);
      c.rotate(ang);
      c.fillStyle = '#ffd76a';
      c.beginPath();
      c.moveTo(10, 0);
      c.lineTo(-8, -7);
      c.lineTo(-8, 7);
      c.closePath();
      c.fill();
    }
    c.restore();
  });
}

window.refreshActionBar = refreshActionBar;
window.renderDiscovered = renderDiscovered;
window.drawDiscoveredMarkers = drawDiscoveredMarkers;
