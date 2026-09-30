// Minimap kanan atas: peta kecil berisi posisi player, NPC, item, dan
// lokasi yang sudah ditandai NPC.

const miniCanvas = document.getElementById('minimap');
const mx = miniCanvas.getContext('2d');

const MAP_W = 6400;
const MAP_H = 4480;

let miniBase = null;          // peta versi kecil, digambar sekali saja
let miniReady = false;

function buildMinimapBase() {
  if (!image.complete || !image.naturalWidth) return;
  miniBase = document.createElement('canvas');
  miniBase.width = miniCanvas.width;
  miniBase.height = miniCanvas.height;
  const bc = miniBase.getContext('2d');
  bc.drawImage(image, 0, 0, miniCanvas.width, miniCanvas.height);
  miniReady = true;
}

image.addEventListener('load', buildMinimapBase);
buildMinimapBase();

function mapToMini(p) {
  return {
    x: (p.x / MAP_W) * miniCanvas.width,
    y: (p.y / MAP_H) * miniCanvas.height
  };
}

function dot(p, color, r, ring) {
  mx.beginPath();
  mx.arc(p.x, p.y, r, 0, Math.PI * 2);
  mx.fillStyle = color;
  mx.fill();
  if (ring) {
    mx.strokeStyle = 'rgba(20,12,4,.85)';
    mx.lineWidth = 1;
    mx.stroke();
  }
}

function drawMinimap() {
  if (!miniReady) { buildMinimapBase(); return; }

  mx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
  mx.drawImage(miniBase, 0, 0);

  // malam / cuaca ikut menggelapkan minimap
  const dark = (GameState.modifiers.darkness || 0) * 0.55;
  if (dark > 0.02) {
    mx.fillStyle = GameState.event === 'bloodmoon'
      ? `rgba(80,10,14,${dark})`
      : `rgba(8,14,46,${dark})`;
    mx.fillRect(0, 0, miniCanvas.width, miniCanvas.height);
  }

  // item yang masih tergeletak
  INTERACTABLES.forEach(o => {
    if (o.type !== 'item' || o.taken) return;
    dot(mapToMini(o.map), '#ffd76a', 1.8);
  });

  // lokasi yang ditandai NPC
  Object.values(GameState.discovered).forEach(at => {
    const p = mapToMini(at);
    mx.save();
    mx.globalAlpha = 0.5 + Math.sin(Date.now() / 400) * 0.35;
    dot(p, '#fff0b8', 3.4);
    mx.restore();
  });

  // NPC
  if (typeof npcs !== 'undefined') {
    npcs.forEach(n => dot(mapToMini(n.map), '#7ee7ff', 2.4, true));
  }

  // player
  const me = mapToMini(getPlayerMapPos());
  mx.save();
  mx.globalAlpha = 0.35 + Math.sin(Date.now() / 300) * 0.2;
  dot(me, '#ff5f6d', 6);
  mx.restore();
  dot(me, '#ff2d3f', 3, true);
}

window.drawMinimap = drawMinimap;
