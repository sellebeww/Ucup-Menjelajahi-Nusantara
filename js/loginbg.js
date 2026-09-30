// Latar belakang halaman login: pemandangan Nusantara yang digambar sendiri di
// canvas (langit bersiklus, bintang, bulan, awan, siluet pulau berlapis, laut
// berkilau, dan bara yang melayang). Tidak memakai file video sama sekali.

const bgCanvas = document.getElementById('bg-canvas');
const bx = bgCanvas.getContext('2d');

let W = 0, H = 0, HORIZON = 0;
let stars = [], clouds = [], embers = [], shimmer = [];
let ridgeFar = [], ridgeMid = [], ridgeNear = [];

// Satu siklus langit penuh (senja -> malam -> fajar) dalam 90 detik
const CYCLE = 90000;

const SKY_STOPS = [
  { t: 0.00, top: [12, 20, 48],  mid: [40, 42, 86],  low: [120, 66, 84] },   // senja
  { t: 0.28, top: [6, 10, 28],   mid: [14, 20, 52],  low: [30, 34, 74] },    // malam
  { t: 0.62, top: [8, 14, 36],   mid: [26, 34, 74],  low: [78, 60, 104] },   // menjelang fajar
  { t: 0.82, top: [26, 44, 92],  mid: [96, 86, 132], low: [226, 138, 106] }, // fajar
  { t: 1.00, top: [12, 20, 48],  mid: [40, 42, 86],  low: [120, 66, 84] }
];

function lerp(a, b, t) { return a + (b - a) * t; }
function mixRgb(c1, c2, t) {
  return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))];
}
function skyNow(p) {
  let a = SKY_STOPS[0], b = SKY_STOPS[SKY_STOPS.length - 1];
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    if (p >= SKY_STOPS[i].t && p <= SKY_STOPS[i + 1].t) { a = SKY_STOPS[i]; b = SKY_STOPS[i + 1]; break; }
  }
  const t = (p - a.t) / (b.t - a.t || 1);
  return { top: mixRgb(a.top, b.top, t), mid: mixRgb(a.mid, b.mid, t), low: mixRgb(a.low, b.low, t) };
}
const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;

// Garis punggung bukit dibuat sekali, bukan tiap frame
function makeRidge(seed, amp, base, steps) {
  const pts = [];
  let r = seed;
  const rand = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  let h = base;
  for (let i = 0; i <= steps; i++) {
    h += (rand() - 0.5) * amp;
    h = Math.max(base - amp, Math.min(base + amp, h));
    pts.push(h);
  }
  return pts;
}

function build() {
  W = bgCanvas.width = window.innerWidth;
  H = bgCanvas.height = window.innerHeight;
  HORIZON = H * 0.62;

  stars = Array.from({ length: 190 }, () => ({
    x: Math.random() * W,
    y: Math.random() * HORIZON * 0.95,
    r: Math.random() * 1.3 + 0.35,
    ph: Math.random() * Math.PI * 2,
    sp: 0.6 + Math.random() * 1.6
  }));

  // Awan digambar SEKALI ke canvas kecil (termasuk blur-nya), lalu tiap frame
  // tinggal ditempel. Kalau blur dijalankan tiap frame, FPS-nya jatuh drastis.
  clouds = Array.from({ length: 7 }, () => {
    const w = 150 + Math.random() * 230;
    const h = 14 + Math.random() * 18;
    const pad = 26;
    const cv = document.createElement('canvas');
    cv.width = w + pad * 2;
    cv.height = h * 2 + pad * 2;
    const cc = cv.getContext('2d');
    cc.filter = 'blur(11px)';
    cc.fillStyle = '#e6ecff';
    const puffs = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < puffs; i++) {
      const dx = (Math.random() - 0.5) * w * 0.8;
      const dy = (Math.random() - 0.5) * 16;
      const r = 0.35 + Math.random() * 0.5;
      cc.beginPath();
      cc.ellipse(cv.width / 2 + dx, cv.height / 2 + dy, w * 0.22 * r, h * r, 0, 0, Math.PI * 2);
      cc.fill();
    }
    return {
      sprite: cv,
      x: Math.random() * W,
      y: HORIZON * (0.10 + Math.random() * 0.55),
      w: cv.width,
      sp: 0.05 + Math.random() * 0.18,
      a: 0.035 + Math.random() * 0.065
    };
  });

  embers = Array.from({ length: 46 }, () => ({
    x: Math.random() * W,
    y: HORIZON + Math.random() * (H - HORIZON),
    r: 0.7 + Math.random() * 1.7,
    sp: 0.15 + Math.random() * 0.45,
    dr: 0.2 + Math.random() * 0.6,
    ph: Math.random() * Math.PI * 2
  }));

  shimmer = Array.from({ length: 34 }, (_, i) => ({
    y: HORIZON + 8 + i * ((H - HORIZON) / 34),
    off: Math.random() * Math.PI * 2,
    len: 0.25 + Math.random() * 0.6
  }));

  ridgeFar = makeRidge(1337, 26, HORIZON - 96, 46);
  ridgeMid = makeRidge(7331, 40, HORIZON - 54, 34);
  ridgeNear = makeRidge(4242, 30, HORIZON - 16, 26);
}

function drawRidge(pts, color, volcanoAt) {
  const step = W / (pts.length - 1);
  bx.beginPath();
  bx.moveTo(0, H);
  bx.lineTo(0, pts[0]);
  for (let i = 1; i < pts.length; i++) bx.lineTo(i * step, pts[i]);
  bx.lineTo(W, H);
  bx.closePath();
  bx.fillStyle = color;
  bx.fill();

  if (volcanoAt !== undefined) {
    const vx = W * volcanoAt;
    const base = pts[Math.round(volcanoAt * (pts.length - 1))];
    const peak = base - H * 0.14;
    bx.beginPath();
    bx.moveTo(vx - W * 0.13, base + 6);
    bx.lineTo(vx - W * 0.018, peak);
    bx.lineTo(vx + W * 0.018, peak);
    bx.lineTo(vx + W * 0.13, base + 6);
    bx.closePath();
    bx.fillStyle = color;
    bx.fill();
    return { x: vx, y: peak };
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const p = (now % CYCLE) / CYCLE;
  const sky = skyNow(p);
  const night = Math.max(0, Math.min(1, 1 - Math.abs(p - 0.45) * 2.6));  // paling gelap di tengah siklus

  // ---- langit ----
  const g = bx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, rgb(sky.top));
  g.addColorStop(0.55, rgb(sky.mid));
  g.addColorStop(1, rgb(sky.low));
  bx.fillStyle = g;
  bx.fillRect(0, 0, W, HORIZON);

  // ---- bintang ----
  bx.save();
  stars.forEach(s => {
    const tw = 0.35 + Math.sin(now / 700 * s.sp + s.ph) * 0.35;
    bx.globalAlpha = Math.max(0, tw * night);
    bx.fillStyle = '#fff';
    bx.beginPath();
    bx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bx.fill();
  });
  bx.restore();

  // ---- bulan ----
  const moonX = W * (0.10 + p * 0.80);
  const moonY = HORIZON * (0.40 - Math.sin(p * Math.PI) * 0.26);
  const moonR = Math.max(38, W * 0.036);
  const halo = bx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 5);
  halo.addColorStop(0, `rgba(255,243,205,${0.26 + 0.30 * night})`);
  halo.addColorStop(1, 'rgba(255,246,214,0)');
  bx.fillStyle = halo;
  bx.fillRect(moonX - moonR * 5, moonY - moonR * 5, moonR * 10, moonR * 10);
  const mg = bx.createRadialGradient(
    moonX - moonR * 0.28, moonY - moonR * 0.28, moonR * 0.08,
    moonX, moonY, moonR
  );
  mg.addColorStop(0, '#fffef8');
  mg.addColorStop(0.65, '#f8f2dc');
  mg.addColorStop(1, '#ddd2b4');
  bx.save();
  bx.globalAlpha = 1;
  bx.beginPath();
  bx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  bx.fillStyle = mg;
  bx.fill();
  bx.restore();

  // ---- awan ----
  bx.save();
  clouds.forEach(cl => {
    cl.x += cl.sp;
    if (cl.x - cl.w > W) cl.x = -cl.w;
    bx.globalAlpha = cl.a + 0.04 * (1 - night);
    bx.drawImage(cl.sprite, cl.x - cl.w / 2, cl.y - cl.sprite.height / 2);
  });
  bx.restore();

  // ---- laut ----
  const sea = bx.createLinearGradient(0, HORIZON, 0, H);
  sea.addColorStop(0, `rgba(${sky.low[0]},${sky.low[1]},${sky.low[2]},1)`);
  sea.addColorStop(0.35, `rgb(${Math.round(sky.mid[0] * 0.5)},${Math.round(sky.mid[1] * 0.55)},${Math.round(sky.mid[2] * 0.8)})`);
  sea.addColorStop(1, `rgb(${Math.round(sky.top[0] * 0.45)},${Math.round(sky.top[1] * 0.5)},${Math.round(sky.top[2] * 0.75)})`);
  bx.fillStyle = sea;
  bx.fillRect(0, HORIZON, W, H - HORIZON);

  bx.save();
  bx.globalAlpha = 0.35 + 0.25 * night;
  const hl = bx.createLinearGradient(0, HORIZON - 2, 0, HORIZON + 3);
  hl.addColorStop(0, 'rgba(255,238,200,0)');
  hl.addColorStop(0.5, 'rgba(255,238,200,0.55)');
  hl.addColorStop(1, 'rgba(255,238,200,0)');
  bx.fillStyle = hl;
  bx.fillRect(0, HORIZON - 2, W, 5);
  bx.restore();

  // pantulan bulan
  bx.save();
  bx.globalAlpha = 0.16 + 0.18 * night;
  const refl = bx.createLinearGradient(0, HORIZON, 0, H);
  refl.addColorStop(0, 'rgba(255,246,214,0.85)');
  refl.addColorStop(1, 'rgba(255,246,214,0)');
  bx.fillStyle = refl;
  bx.beginPath();
  bx.moveTo(moonX - 14, HORIZON);
  bx.lineTo(moonX + 14, HORIZON);
  bx.lineTo(moonX + W * 0.07, H);
  bx.lineTo(moonX - W * 0.07, H);
  bx.closePath();
  bx.fill();
  bx.restore();

  // kilau ombak
  bx.save();
  bx.strokeStyle = '#ffffff';
  bx.lineWidth = 1;
  shimmer.forEach((s, i) => {
    const depth = (s.y - HORIZON) / (H - HORIZON);
    bx.globalAlpha = (0.09 + 0.16 * night) * (1 - depth * 0.5);
    const w = W * s.len;
    const x = ((Math.sin(now / 2600 + s.off) + 1) / 2) * (W - w);
    bx.beginPath();
    bx.moveTo(x, s.y + Math.sin(now / 900 + i) * 1.5);
    bx.lineTo(x + w, s.y + Math.cos(now / 1100 + i) * 1.5);
    bx.stroke();
  });
  bx.restore();

  // ---- siluet pulau berlapis ----
  drawRidge(ridgeFar, `rgba(${Math.round(sky.top[0] * 0.7)},${Math.round(sky.top[1] * 0.75)},${Math.round(sky.top[2] * 0.95)},0.85)`);
  const volcano = drawRidge(ridgeMid, 'rgba(14,20,40,0.92)', 0.74);
  drawRidge(ridgeNear, 'rgba(6,10,22,0.97)');

  // bara di puncak gunung
  if (volcano) {
    const glow = bx.createRadialGradient(volcano.x, volcano.y, 1, volcano.x, volcano.y, 46);
    glow.addColorStop(0, `rgba(255,132,64,${0.5 + 0.25 * Math.sin(now / 900)})`);
    glow.addColorStop(1, 'rgba(255,132,64,0)');
    bx.fillStyle = glow;
    bx.beginPath();
    bx.arc(volcano.x, volcano.y, 46, 0, Math.PI * 2);
    bx.fill();
  }

  // ---- bara melayang ----
  embers.forEach(e => {
    e.y -= e.sp;
    e.x += Math.sin(now / 1400 + e.ph) * e.dr * 0.5;
    if (e.y < HORIZON - 40) { e.y = H + 8; e.x = Math.random() * W; }
    bx.globalAlpha = 0.20 + 0.35 * Math.abs(Math.sin(now / 1000 + e.ph));
    bx.fillStyle = '#ffd08a';
    bx.beginPath();
    bx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    bx.fill();
  });
  bx.globalAlpha = 1;
}

build();
window.addEventListener('resize', build);
requestAnimationFrame(frame);
