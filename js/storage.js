/* Storage failures never prevent playing. */
const GameStorage = {
  key: 'ucup.expedition.v2', available: true,
  get(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch { this.available = false; return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { this.available = false; return false; } },
  read() {
    try { const s = JSON.parse(this.get(this.key, 'null')); return s && s.version === 2 && s.progress && typeof s.progress === 'object' ? s : null; } catch { return null; }
  },
  write(snapshot) { return this.set(this.key, JSON.stringify({ ...snapshot, version: 2, savedAt: Date.now() })); }
};
window.GameStorage = GameStorage;
