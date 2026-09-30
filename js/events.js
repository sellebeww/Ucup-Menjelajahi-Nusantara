// Atmosfer dunia: siang/sore/malam + cuaca & kejadian acak.
// Semua transisi dibuat bertahap, tidak pernah berganti mendadak.

const atmosphere = document.getElementById('atmosphere');
const vignetteEl = document.getElementById('vignette');
const moonEl = document.getElementById('moon');
const starsEl = document.getElementById('stars');
const eventIndicator = document.getElementById('eventIndicator');
const eventIcon = document.getElementById('eventIcon');
const eventName = document.getElementById('eventName');
const eventDesc = document.getElementById('eventDesc');

// speed  : pengali kecepatan jalan
// drain  : pengali penurunan status
// passive: perubahan status kecil tiap detak selama event berlangsung
const EVENTS = {
  clear: {
    label: 'CERAH', desc: 'Cuaca tenang, perjalanan lancar.',
    speed: 1, drain: 1, body: '', nightOnly: false, weight: 30
  },
  windy: {
    label: 'ANGIN KENCANG', desc: 'Debu beterbangan, langkahmu tertahan.',
    speed: 0.88, drain: 1.15, body: 'event-windy', weight: 18
  },
  rain: {
    label: 'HUJAN', desc: 'Basah kuyup, tapi badanmu jadi bersih.',
    speed: 0.92, drain: 1.08, body: 'event-rain',
    passive: { hygiene: 0.05, happiness: -0.01 }, weight: 18
  },
  fog: {
    label: 'KABUT TEBAL', desc: 'Jarak pandang menyempit drastis.',
    speed: 0.9, drain: 1.05, body: 'event-fog', weight: 12
  },
  heat: {
    label: 'PANAS TERIK', desc: 'Matahari membakar, cepat lapar dan haus.',
    speed: 0.95, drain: 1.3, body: 'event-heat',
    passive: { hygiene: -0.03 }, dayOnly: true, weight: 12
  },
  fullmoon: {
    label: 'BULAN PURNAMA', desc: 'Malam terang benderang, hati jadi tenang.',
    speed: 1.05, drain: 0.85, body: 'event-fullmoon',
    passive: { happiness: 0.05 }, nightOnly: true, weight: 10
  },
  bloodmoon: {
    label: 'BLOOD MOON', desc: 'Langit memerah. Sesuatu yang lain ikut bangun.',
    speed: 0.95, drain: 1.35, body: 'event-bloodmoon',
    passive: { happiness: -0.06 }, nightOnly: true, weight: 6
  }
};

// Intensitas dianimasikan pelan supaya efek muncul & hilang secara halus
let windI = 0, bloodI = 0, nightI = 0, rainI = 0, fogI = 0, heatI = 0, moonI = 0;

const windParticles = [];
const ambientParticles = [];
const rainDrops = [];
const fogBlobs = [];
let fogSprite = null;

function buildFogSprite() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 220;
  const cx = cv.getContext('2d');
  const g = cx.createRadialGradient(110, 110, 10, 110, 110, 110);
  g.addColorStop(0, 'rgba(226,232,244,0.55)');
  g.addColorStop(1, 'rgba(226,232,244,0)');
  cx.fillStyle = g;
  cx.fillRect(0, 0, 220, 220);
  return cv;
}

function initParticles() {
  const W = window.innerWidth, H = window.innerHeight;
  for (let i = 0; i < 70; i++) {
    windParticles.push({ x: Math.random() * W, y: Math.random() * H,
      len: 18 + Math.random() * 46, speed: 4 + Math.random() * 7, alpha: 0.1 + Math.random() * 0.22 });
  }
  for (let i = 0; i < 45; i++) {
    ambientParticles.push({ x: Math.random() * W, y: Math.random() * H,
      r: 0.8 + Math.random() * 1.8, drift: 0.2 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2, speed: 0.25 + Math.random() * 0.5 });
  }
  for (let i = 0; i < 160; i++) {
    rainDrops.push({ x: Math.random() * W, y: Math.random() * H,
      len: 12 + Math.random() * 16, speed: 11 + Math.random() * 9, alpha: 0.15 + Math.random() * 0.3 });
  }
  fogSprite = buildFogSprite();
  for (let i = 0; i < 9; i++) {
    fogBlobs.push({ x: Math.random() * W, y: Math.random() * H,
      s: 1.4 + Math.random() * 2.2, sp: 0.15 + Math.random() * 0.45, a: 0.3 + Math.random() * 0.4 });
  }
}
initParticles();

function buildStars() {
  if (!starsEl) return;
  let html = '';
  for (let i = 0; i < 90; i++) {
    html += `<i style="left:${(Math.random()*100).toFixed(2)}%;top:${(Math.random()*65).toFixed(2)}%;` +
            `width:${(Math.random()*1.4+0.8).toFixed(2)}px;height:${(Math.random()*1.4+0.8).toFixed(2)}px;` +
            `animation-delay:${(Math.random()*3).toFixed(2)}s"></i>`;
  }
  starsEl.innerHTML = html;
}
buildStars();

// ---------- Periode hari ----------
function onTimeChanged(decimalHour, period) {
  GameState.setPeriod(period);

  let target = 0;
  if (decimalHour >= 19 || decimalHour < 4.5) target = 1;
  else if (decimalHour >= 17) target = (decimalHour - 17) / 2;
  else if (decimalHour < 6) target = (6 - decimalHour) / 1.5;
  GameState.nightTarget = Math.max(0, Math.min(1, target));

  const dayClass = period === 'Night' ? 'time-night'
    : (period === 'Evening' || period === 'Fajar') ? 'time-evening'
    : 'time-day';
  document.body.classList.remove('time-day', 'time-evening', 'time-night');
  document.body.classList.add(dayClass);
}

function updateAtmosphereLayer() {
  if (!atmosphere) return;
  // bulan purnama membuat malam tidak segelap biasanya
  const n = Math.max(0, nightI - moonI * 0.3);
  const layers = [
    `rgba(8, 14, 46, ${(0.40 * n).toFixed(3)})`,
    `rgba(120, 12, 18, ${(0.26 * bloodI).toFixed(3)})`,
    `rgba(90, 120, 165, ${(0.22 * rainI).toFixed(3)})`,
    `rgba(220, 226, 238, ${(0.30 * fogI).toFixed(3)})`,
    `rgba(255, 150, 60, ${(0.16 * heatI).toFixed(3)})`,
    `rgba(190, 205, 255, ${(0.12 * moonI).toFixed(3)})`
  ];
  atmosphere.style.background = layers.map(c => `linear-gradient(${c}, ${c})`).join(', ');

  if (starsEl) starsEl.style.opacity = (nightI * (1 - bloodI * 0.35) * (1 - fogI * 0.7)).toFixed(3);
  if (moonEl) {
    moonEl.style.opacity = (nightI * (1 - fogI * 0.6)).toFixed(3);
    moonEl.classList.toggle('blood', bloodI > 0.35);
    moonEl.classList.toggle('full', moonI > 0.35);
  }
  if (vignetteEl) vignetteEl.style.opacity = (0.25 * nightI + 0.35 * bloodI + 0.3 * fogI).toFixed(3);
}

// ---------- Event acak ----------
let eventUntil = 0;
let nextRoll = Date.now() + 18000;

function setEvent(name, durationMs) {
  const def = EVENTS[name];
  if (!def) return;

  Object.values(EVENTS).forEach(e => e.body && document.body.classList.remove(e.body));
  if (def.body) document.body.classList.add(def.body);

  GameState.setEvent(name);
  GameState.modifiers.speed = def.speed;
  GameState.modifiers.drain = def.drain;
  GameState.modifiers.passive = def.passive || null;
  eventUntil = durationMs ? Date.now() + durationMs : 0;

  if (name !== 'clear') showEventIndicator(name, def);
}

function showEventIndicator(name, def) {
  if (!eventIndicator) return;
  eventIcon.className = 'event-icon ' + name;
  eventName.textContent = def.label;
  if (eventDesc) eventDesc.textContent = def.desc;
  eventIndicator.classList.add('show');
  clearTimeout(showEventIndicator._t);
  showEventIndicator._t = setTimeout(() => eventIndicator.classList.remove('show'), 4600);
}

function rollEvent() {
  const isNight = GameState.nightTarget > 0.75;
  const pool = Object.entries(EVENTS).filter(([name, e]) => {
    if (name === 'clear') return false;
    if (e.nightOnly && !isNight) return false;
    if (e.dayOnly && isNight) return false;
    return true;
  });

  const total = pool.reduce((sum, [, e]) => sum + e.weight, 0) + EVENTS.clear.weight;
  let r = Math.random() * total;
  for (const [name, e] of pool) {
    r -= e.weight;
    if (r <= 0) {
      setEvent(name, 32000 + Math.random() * 38000);
      return;
    }
  }
  setEvent('clear', 0);
}

function updateEvents() {
  if (window.gamePaused) return;
  const now = Date.now();
  if (eventUntil && now > eventUntil) {
    setEvent('clear', 0);
    nextRoll = now + 12000 + Math.random() * 18000;
  } else if (!eventUntil && now > nextRoll) {
    rollEvent();
    nextRoll = now + 22000 + Math.random() * 26000;
  }

  const ev = GameState.event;
  const lerp = (cur, target, k) => cur + (target - cur) * k;
  windI  = lerp(windI,  ev === 'windy' ? 1 : 0, 0.02);
  bloodI = lerp(bloodI, ev === 'bloodmoon' ? 1 : 0, 0.015);
  rainI  = lerp(rainI,  ev === 'rain' ? 1 : 0, 0.03);
  fogI   = lerp(fogI,   ev === 'fog' ? 1 : 0, 0.015);
  heatI  = lerp(heatI,  ev === 'heat' ? 1 : 0, 0.02);
  moonI  = lerp(moonI,  ev === 'fullmoon' ? 1 : 0, 0.02);
  nightI = lerp(nightI, GameState.nightTarget || 0, 0.01);

  GameState.modifiers.darkness = Math.min(1,
    Math.max(0, nightI * 0.72 - moonI * 0.30) + bloodI * 0.22 + fogI * 0.42);
  updateAtmosphereLayer();
}

// ---------- Efek di atas canvas ----------
function drawWeatherEffects() {
  const W = canvas.width, H = canvas.height;
  const t = Date.now();

  // Gelap / jarak pandang, dengan "lubang" cahaya di sekitar player
  const dark = GameState.modifiers.darkness;
  if (dark > 0.02) {
    const px = player.position.x + (player.width || 40) / 2;
    const py = player.position.y + (player.height || 60) / 2;
    const inner = 60 + 40 * (1 - dark);
    const outer = 210 + 300 * (1 - dark);
    const g = c.createRadialGradient(px, py, inner, px, py, outer);
    const tint = bloodI > 0.3 ? '60,8,14' : (fogI > 0.3 ? '150,160,180' : '6,10,35');
    g.addColorStop(0, `rgba(${tint},0)`);
    g.addColorStop(0.55, `rgba(${tint},${(dark * 0.55).toFixed(3)})`);
    g.addColorStop(1, `rgba(${tint},${(dark * 0.92).toFixed(3)})`);
    c.save(); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
  }

  // Kabut: gumpalan lembut melayang
  if (fogI > 0.02 && fogSprite) {
    c.save();
    fogBlobs.forEach(b => {
      b.x += b.sp;
      if (b.x - 220 * b.s > W) { b.x = -220 * b.s; b.y = Math.random() * H; }
      c.globalAlpha = b.a * fogI * 0.75;
      c.drawImage(fogSprite, b.x, b.y, 220 * b.s, 220 * b.s);
    });
    c.restore();
  }

  // Hujan
  if (rainI > 0.02) {
    c.save();
    c.strokeStyle = '#cfe4ff';
    c.lineWidth = 1.3;
    rainDrops.forEach(d => {
      c.globalAlpha = d.alpha * rainI;
      c.beginPath();
      c.moveTo(d.x, d.y);
      c.lineTo(d.x - 4, d.y + d.len);
      c.stroke();
      d.y += d.speed;
      d.x -= 1.6;
      if (d.y > H + 20) { d.y = -20; d.x = Math.random() * (W + 120); }
    });
    c.restore();
  }

  // Angin
  if (windI > 0.02) {
    c.save();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.4;
    windParticles.forEach(p => {
      c.globalAlpha = p.alpha * windI;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + p.len, p.y + 2);
      c.stroke();
      p.x += p.speed * (0.4 + windI);
      if (p.x > W + 60) { p.x = -80; p.y = Math.random() * H; }
    });
    c.restore();
  }

  // Panas terik: getaran udara naik
  if (heatI > 0.02) {
    c.save();
    for (let i = 0; i < 26; i++) {
      const x = ((i * 137 + t / 26) % (W + 80)) - 40;
      const y = H - ((t / 6 + i * 90) % (H + 120));
      c.globalAlpha = 0.10 * heatI;
      c.strokeStyle = '#ffd9a0';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + 6, y - 14, x, y - 28);
      c.stroke();
    }
    c.restore();
  }

  // Partikel malam / bara blood moon / kunang-kunang purnama
  const ambient = Math.max(nightI * 0.8, bloodI, moonI * 0.9);
  if (ambient > 0.05) {
    c.save();
    ambientParticles.forEach(p => {
      p.phase += 0.02;
      p.y -= p.speed * (0.4 + bloodI);
      p.x += Math.sin(p.phase) * p.drift + windI * 2.2;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x > W + 10) p.x = -10;
      const tw = 0.4 + Math.sin(p.phase * 1.7) * 0.3;
      c.globalAlpha = Math.max(0, tw * ambient * 0.8);
      c.fillStyle = bloodI > 0.35 ? '#ff6b5e' : (moonI > 0.35 ? '#dfe9ff' : '#ffe9a8');
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
    });
    c.restore();
  }
}

function foregroundSway() {
  const shake = windI + rainI * 0.4;
  if (shake < 0.02) return 0;
  return Math.sin(Date.now() / 260) * 2.6 * shake;
}

window.addEventListener('resize', () => {
  const W = window.innerWidth, H = window.innerHeight;
  [...windParticles, ...rainDrops, ...fogBlobs].forEach(p => { p.x = Math.random() * W; p.y = Math.random() * H; });
});

// Untuk mencoba event tanpa menunggu acak: forceEvent('rain')
function forceEvent(name, seconds = 60) {
  setEvent(name, name === 'clear' ? 0 : seconds * 1000);
}

setEvent('clear', 0);

window.EVENTS = EVENTS;
window.onTimeChanged = onTimeChanged;
window.updateEvents = updateEvents;
window.drawWeatherEffects = drawWeatherEffects;
window.foregroundSway = foregroundSway;
window.forceEvent = forceEvent;
