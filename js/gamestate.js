// Pusat state game. Modul lain membaca/menulis ke sini supaya tidak saling
// bergantung langsung satu sama lain.

const GameState = {
  playerName: GameStorage.get('playerName') || 'Ucup',
  characterId: GameStorage.get('characterId') || 'ucup',
  character: null,          // diisi saat game start

  hour: 7,
  minute: 0,
  period: 'Morning',          // Fajar | Morning | Noon | Evening | Night

  event: 'clear',           // clear | windy | bloodmoon
  eventSince: Date.now(),

  // Pengali efek lingkungan terhadap player
  modifiers: {
    speed: 1,               // pengali kecepatan jalan
    drain: 1,               // pengali penurunan status
    darkness: 0             // 0..1, dipakai untuk vignette/visibility
  },

  nearby: null,             // interactable terdekat saat ini
  npcState: {},             // { npcId: { talked: n, rewarded: bool } }
  flags: {},                // penanda umum (lokasi ditemukan, dll)

  discovered: {},           // lokasi yang sudah dibuka lewat hint NPC

  setEvent(name) {
    if (this.event === name) return;
    this.event = name;
    this.eventSince = Date.now();
    window.dispatchEvent(new CustomEvent('gamestate:event', { detail: { event: name } }));
  },

  setPeriod(period) {
    if (this.period === period) return;
    this.period = period;
    window.dispatchEvent(new CustomEvent('gamestate:period', { detail: { period } }));
  },

  npc(id) {
    if (!this.npcState[id]) this.npcState[id] = { talked: 0, rewarded: false };
    return this.npcState[id];
  }
};

window.GameState = GameState;

// Helper bersama: menerapkan efek ke status player yang sudah ada (meal/sleep/hygiene/happiness/money)
const STAT_LABELS = {
  meal: 'Kenyang',
  sleep: 'Energi',
  hygiene: 'Kebersihan',
  happiness: 'Semangat',
  money: 'Koin'
};

function applyStatusEffect(effect) {
  const st = window.playerStatus;
  if (!st || !effect) return [];
  const parts = [];
  for (const key in effect) {
    if (!(key in st)) continue;
    st[key] += effect[key];
    if (key !== 'money') st[key] = Math.max(0, Math.min(100, st[key]));
    else st[key] = Math.max(0, st[key]);
    const sign = effect[key] > 0 ? '+' : '';
    parts.push(`${sign}${effect[key]} ${STAT_LABELS[key] || key}`);
  }
  if (typeof window.updateStatusUI === 'function') window.updateStatusUI();
  return parts;
}

window.STAT_LABELS = STAT_LABELS;
window.applyStatusEffect = applyStatusEffect;
