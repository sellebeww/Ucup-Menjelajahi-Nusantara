/* Persistent expedition, daily goals, field journal and a single overlay host. */
const REGIONS = AdventureData.regions;
const safeText = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const Expedition = {
  progress: new ExpeditionProgress(GameStorage.read()?.progress),
  panelOpen: false, tab: 'journal', waypoint: null, lastUpdate: 0, notices: [], noticeTimer: null,
  init() {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="expeditionBrand"><span class="brand-compass">✳</span><span>UCUP<small>MENJELAJAH NUSANTARA</small></span></div>
      <button id="questTracker" title="Buka jurnal perjalanan (J)"><span class="eyebrow">CATATAN PERJALANAN <span>↗</span></span><strong id="questTitle">Dunia menunggumu</strong><span id="questDetail"></span><span class="quest-progress"><i id="questProgress"></i></span></button>
      <nav id="expeditionNav" aria-label="Menu perjalanan"><button data-panel="journal"><span>▤</span>Jurnal<kbd>J</kbd></button><button data-panel="map"><span>⌖</span>Peta<kbd>M</kbd></button><button data-panel="challenges"><span>✦</span>Tantangan<kbd>G</kbd></button><button data-panel="friends"><span>♧</span>Teman<kbd>C</kbd></button><button id="campBtn"><span>☾</span>Istirahat<kbd>T</kbd></button></nav>
      <div id="journeyLevel"><span id="levelLabel"></span><span class="level-track"><i id="levelProgress"></i></span><small id="saveState">Tersimpan otomatis</small></div>
      <div id="travelHint"><kbd>W A S D</kbd> jalan <span>·</span> <kbd>E</kbd> interaksi</div>
      <div id="expeditionOverlay" class="expedition-overlay" role="dialog" aria-modal="true" aria-labelledby="panelTitle" hidden><section class="journal-shell"><header class="journal-header"><div><span class="eyebrow">BUKU PERJALANAN</span><h1 id="panelTitle">Jurnal penjelajah</h1></div><button id="journalClose" class="close-button" aria-label="Tutup">×</button></header><nav id="journalTabs" class="journal-tabs"><button data-tab="journal">Catatan</button><button data-tab="map">Peta dunia</button><button data-tab="challenges">Tantangan</button><button data-tab="friends">Teman</button></nav><div id="journalContent"></div><footer class="journal-footer"><span id="journalFooter"></span><span>Perjalananmu, ceritamu.</span></footer></section></div>
      <div id="unlockNotice" role="status" hidden></div>`);
    document.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => this.open(b.dataset.panel));
    document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => this.open(b.dataset.tab));
    document.getElementById('journalClose').onclick = () => this.close();
    document.getElementById('questTracker').onclick = () => this.open('journal');
    document.getElementById('campBtn').onclick = () => this.open('camp');
    document.getElementById('expeditionOverlay').onclick = e => { if (e.target.id === 'expeditionOverlay') this.close(); };
    document.getElementById('minimapPanel').onclick = () => this.open('map');
    document.getElementById('minimapPanel').onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open('map'); }
    };
    this.restore(); this.progress.checkUnlocks(); this.renderHUD();
    this.waypoint = this.progress.talked.includes('atok') ? null : { id: 'atok', name: 'Temui Atok', map: NPC_DATA[0].map };
    setInterval(() => this.save(), 8000);
    window.addEventListener('pagehide', () => this.save());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
    window.addEventListener('keydown', e => this.key(e), true);
    this.record('visit', getCurrentLocation(player, background));
  },
  restore() {
    const s = GameStorage.read(); if (!s) return;
    const bounded = (v, lo, hi, fallback) => Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : fallback;
    for (const key of Object.keys(playerStatus)) playerStatus[key] = bounded(s.status?.[key], 0, key === 'money' ? 999999 : 100, playerStatus[key]);
    if (Array.isArray(s.inventory)) inventoryItems.splice(0, inventoryItems.length, ...s.inventory.slice(0, 16).map(itemDef).filter(Boolean).map(v => ({ ...v })));
    if (s.npcState && typeof s.npcState === 'object') NPC_DATA.forEach(n => {
      const st = s.npcState[n.id]; if (st) GameState.npcState[n.id] = { talked: bounded(st.talked, 0, 9999, 0), rewarded: st.rewarded === true };
    });
    if (s.discovered && typeof s.discovered === 'object') Object.entries(s.discovered).slice(0, 20).forEach(([name, pos]) => {
      if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) GameState.discovered[name] = { x: bounded(pos.x, 0, 6400, 0), y: bounded(pos.y, 0, 4480, 0) };
    });
    if (Array.isArray(s.taken)) INTERACTABLES.forEach(o => { if (o.type === 'item') o.taken = s.taken.includes(o.id); });
    gameTime.set(bounded(s.hour, 0, 23, 7), bounded(s.minute, 0, 59, 0));
    if (s.position && Number.isFinite(s.position.x) && Number.isFinite(s.position.y)) placePlayerAtMap(bounded(s.position.x, 32, 6368, SPAWN.x), bounded(s.position.y, 32, 4448, SPAWN.y));
    if (checkGameOver()) { gameOver = true; Pause.set('exhaustion', true); showGameOverOverlay(); }
    updateStatusUI(); renderInventory(); renderDiscovered();
  },
  save() {
    const ok = GameStorage.write({ progress: this.progress, status: { ...playerStatus }, inventory: inventoryItems.map(i => i.name), npcState: GameState.npcState, discovered: GameState.discovered, position: getPlayerMapPos(), hour: GameState.hour, minute: GameState.minute, taken: INTERACTABLES.filter(o => o.type === 'item' && o.taken).map(o => o.id) });
    const label = document.getElementById('saveState'); if (label) label.textContent = ok ? 'Progres tersimpan' : 'Penyimpanan browser tidak tersedia';
    return ok;
  },
  record(type, value) {
    if (type === 'visit' && !REGIONS.some(r => r.id === value)) return { xp: 0, unlocked: [] };
    const result = this.progress.record(type, value);
    if (this.waypoint && ((['talk','relic','visit','inspect'].includes(type) && this.waypoint.id === value) || (type === 'collect' && this.waypoint.item === value))) this.waypoint = null;
    if (type === 'visit' && result.xp) this.notify('WILAYAH DITEMUKAN', REGIONS.find(r => r.id === value).name, '+30 XP · Stempel baru di jurnal');
    result.unlocked.forEach(id => this.notifyUnlock(id));
    if (result.changed || result.xp || result.unlocked.length) { this.renderHUD(); this.save(); }
    return result;
  },
  notify(title, name, description, portrait = '') {
    this.notices.push({ title, name, description, portrait });
    if (!this.noticeTimer) this.showNextNotice();
  },
  showNextNotice() {
    if (!this.notices.length) { this.noticeTimer = null; return; }
    const n = this.notices.shift(), el = document.getElementById('unlockNotice');
    el.innerHTML = `${n.portrait ? `<img src="${n.portrait}" alt="">` : '<span class="notice-symbol">✦</span>'}<div><span class="eyebrow">${safeText(n.title)}</span><strong>${safeText(n.name)}</strong><small>${safeText(n.description)}</small></div>`; el.hidden = false;
    this.noticeTimer = setTimeout(() => { el.hidden = true; this.noticeTimer = setTimeout(() => this.showNextNotice(), 300); }, 4200);
  },
  notifyUnlock(id) { const ch = getCharacter(id); if (ch) this.notify('TEMAN BARU TERBUKA', ch.name, `${ch.perk} · Pilih di menu Teman`, ch.avatar); },
  update(delta) {
    if (!window.gamePaused) {
      this.lastUpdate += delta;
      if (this.lastUpdate > .5) { this.lastUpdate = 0; const region = getCurrentLocation(player, background); this.record('visit', region); Adventure.arrive(region); this.renderHUD(); }
    }
    if (this.waypoint) this.drawWaypoint();
  },
  renderHUD() {
    const p = this.progress;
    document.getElementById('dayNumber').textContent = `HARI ${String(p.day).padStart(2, '0')}`;
    document.getElementById('levelLabel').textContent = `LV. ${p.level} · ${p.level < 3 ? 'Perintis' : p.level < 6 ? 'Pengelana' : 'Penjelajah ulung'}`;
    document.getElementById('levelProgress').style.width = `${p.xp % 100}%`;
    const chapter = p.currentChapter, next = chapter?.goals.find(g => p.goalValue(g) < g.total);
    document.getElementById('questTitle').textContent = chapter ? chapter.title : 'Sahabat Nusantara';
    document.getElementById('questDetail').textContent = this.waypoint ? `⌖ ${this.waypoint.name} · ${Math.round(Math.hypot(this.waypoint.map.x - getPlayerMapPos().x, this.waypoint.map.y - getPlayerMapPos().y) / 32)} langkah` : (chapter ? (next ? `${next.label} · Buka jurnal` : 'Semua tujuan selesai · Ambil hadiah bab') : 'Semua bab selesai · Dunia tetap menantimu');
    document.getElementById('questProgress').style.width = `${chapter ? chapter.goals.filter(g => p.goalValue(g) >= g.total).length / chapter.goals.length * 100 : 100}%`;
  },
  open(tab = 'journal') {
    if (gameOver || window.Minigames?.active || Pause.reasons.has('tutorial')) return;
    if (window.Dialogue?.active) Dialogue.close();
    showInventoryPanel(false); closeSettings();
    this.focusBefore = this.panelOpen ? this.focusBefore : document.activeElement;
    this.panelOpen = true; this.tab = tab; Pause.set('journal', true);
    document.getElementById('expeditionOverlay').hidden = false;
    const names = { journal: 'Setiap langkah, sebuah cerita.', map: 'Ke mana kita hari ini?', challenges: 'Sedikit tantangan. Banyak cerita.', friends: 'Petualangan lebih seru bersama.', camp: 'Esok, kita melangkah lagi.' };
    document.getElementById('panelTitle').textContent = names[tab] || names.journal;
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    this.renderPanel(); document.getElementById('journalContent').scrollTop = 0; document.getElementById('journalClose').focus();
  },
  close() { this.panelOpen = false; document.getElementById('expeditionOverlay').hidden = true; Pause.set('journal', false); this.focusBefore?.focus(); },
  renderPanel() {
    const el = document.getElementById('journalContent'), p = this.progress;
    document.getElementById('journalFooter').textContent = `HARI ${p.day} · ${p.xp} XP · ${Math.floor(playerStatus.money)} KOIN`;
    if (this.tab === 'journal') {
      const goals = [['Buah untuk bekal', Math.min(3, p.daily.collect), 3], ['Sapa warga yang berbeda', Math.min(2, p.daily.talk.length), 2], ['Selesaikan satu tantangan', Math.min(1, p.daily.play), 1]];
      el.innerHTML = `<div class="journal-intro"><div><span class="eyebrow">MISI HARI KE-${p.day}</span><h2>Hari yang layak dikenang.</h2><p>Petik bekal, dengarkan cerita, dan coba hal baru.</p></div><span class="day-stamp">${String(p.day).padStart(2, '0')}<small>HARI</small></span></div><div class="daily-grid">${goals.map(([name, n, total]) => `<div class="daily-goal ${n >= total ? 'done' : ''}"><span>${n >= total ? '✓' : '○'}</span><div><strong>${name}</strong><small>${n} dari ${total} selesai</small></div></div>`).join('')}</div><div class="daily-reward"><span>Hadiah harian <b>60 koin + 40 XP</b></span><button class="primary-button" id="claimDaily" ${!p.dailyComplete || p.daily.claimed ? 'disabled' : ''}>${p.daily.claimed ? 'Sudah diambil ✓' : 'Ambil hadiah'}</button></div><div class="section-line"><h2>Paspor penjelajah</h2><span>${p.visited.length} / 7 stempel</span></div><div class="passport-grid">${REGIONS.map((r, i) => `<button class="passport-card ${p.visited.includes(r.id) ? 'discovered' : ''}" data-region="${i}" style="--region:${r.color}"><span class="passport-icon">${r.icon}</span><small>${p.visited.includes(r.id) ? 'TELAH DIJELAJAHI' : 'MENUNGGU LANGKAHMU'}</small><strong>${r.name}</strong><span>${r.subtitle}</span><em>${p.visited.includes(r.id) ? 'Lihat di peta ↗' : 'Tandai tujuan ↗'}</em></button>`).join('')}</div><div class="section-line"><h2>Koleksi kebun</h2><span>${Math.min(6,p.collected.length)} / 6 untuk membuka Rimba</span></div><div class="fruit-collection">${AdventureData.fruits.map(name => `<div class="${p.collected.includes(name) ? 'found' : ''}"><img src="${itemDef(name).img}" alt="${name}"><span>${name}</span></div>`).join('')}</div>`;
      el.querySelector('#claimDaily').onclick = () => { if (p.claimDaily()) { applyStatusEffect({ money: 60 }); this.save(); this.renderHUD(); this.renderPanel(); showToast('Tugas harian selesai! +60 koin · +40 XP'); } };
      el.querySelectorAll('[data-region]').forEach(b => b.onclick = () => { this.waypoint = REGIONS[Number(b.dataset.region)]; this.close(); showToast(`Tujuan ditandai: ${this.waypoint.name}`); });
    } else if (this.tab === 'friends') {
      el.innerHTML = `<p class="panel-lead">Enam kepribadian, enam cara melihat dunia. Buka teman dengan bermain dan menjelajah.</p><div class="friends-grid">${CHARACTERS.map(ch => `<article class="friend-card ${p.unlocked.includes(ch.id) ? '' : 'locked'}" style="--character:${ch.color}"><div class="friend-art"><img src="${ch.avatar}" alt="${ch.name}"><span>${p.unlocked.includes(ch.id) ? 'TERBUKA' : 'TERKUNCI'}</span></div><div class="friend-info"><small>${ch.title}</small><h2>${ch.name}</h2><p>${ch.bio}</p><span class="perk">✧ ${ch.perk}</span><button class="${p.unlocked.includes(ch.id) ? 'primary-button' : 'locked-button'}" data-character="${ch.id}" ${!p.unlocked.includes(ch.id) || ch.id === GameState.characterId ? 'disabled' : ''}>${ch.id === GameState.characterId ? 'Sedang menemanimu ✓' : p.unlocked.includes(ch.id) ? 'Ajak menjelajah →' : ch.unlock}</button></div></article>`).join('')}</div>`;
      el.querySelectorAll('[data-character]').forEach(b => b.onclick = () => {
        if (!p.unlocked.includes(b.dataset.character)) return;
        GameState.characterId = b.dataset.character; GameStorage.set('characterId', GameState.characterId); applySelectedCharacter(); this.save(); this.renderPanel();
      });
    } else if (this.tab === 'challenges') {
      el.innerHTML = `<p class="panel-lead">Mainkan kapan saja. Empat permainan kecil untuk berkenalan dengan empat sahabat baru.</p><div class="challenge-grid">${Object.entries(Minigames.definitions).map(([id, d]) => `<article class="challenge-card ${id}"><div class="challenge-scene"><span>${d.symbol}</span><img src="${getCharacter(d.character).avatar}" alt="${getCharacter(d.character).name}"></div><div class="challenge-info"><span class="eyebrow">${d.tag}</span><h2>${d.name}</h2><p>${d.description}</p><div class="challenge-meta"><span>✦ Buka ${getCharacter(d.character).name}</span><span>${p.wins[id]} kemenangan</span></div><button class="primary-button" data-game="${id}">Mainkan tantangan <span>→</span></button></div></article>`).join('')}</div><p class="quiet-note">Tidak ada biaya bermain. Hadiah hanya diberikan setelah satu ronde selesai. Waktu dunia berhenti selama tantangan.</p>`;
      el.querySelectorAll('[data-game]').forEach(b => b.onclick = () => { this.close(); Minigames.start(b.dataset.game); });
    } else if (this.tab === 'map') {
      el.innerHTML = `<div class="world-map"><img src="img/nusantara.png" alt="Peta kepulauan permainan">${REGIONS.map((r, i) => `<button class="map-pin ${p.visited.includes(r.id) ? 'visited' : ''}" style="left:${r.map.x / 64}%;top:${r.map.y / 44.8}%" data-pin="${i}" aria-label="${r.name}">${i + 1}</button>`).join('')}<span class="map-player" style="left:${getPlayerMapPos().x / 64}%;top:${getPlayerMapPos().y / 44.8}%" title="Posisimu"></span></div><div class="map-legend"><span>● Kamu</span><span>● Wilayah ditemukan</span><span>○ Belum dijelajahi</span></div><div class="destinations">${REGIONS.map((r, i) => `<div><span class="destination-number">${i + 1}</span><div><strong>${r.name}</strong><small>${p.visited.includes(r.id) ? r.story : r.subtitle}</small></div><button data-mark="${i}" class="small-button">Tandai</button>${p.visited.includes(r.id) ? `<button data-travel="${i}" class="small-button">${i ? '15 ◈ · Pergi' : 'Pulang gratis'}</button>` : ''}</div>`).join('')}</div><p class="quiet-note">Kepulauan rekaan yang terinspirasi Nusantara. Perjalanan cepat memerlukan 1 jam waktu game.</p>`;
      el.querySelectorAll('[data-pin],[data-mark]').forEach(b => b.onclick = () => { this.waypoint = REGIONS[Number(b.dataset.pin ?? b.dataset.mark)]; this.close(); this.renderHUD(); });
      el.querySelectorAll('[data-travel]').forEach(b => b.onclick = () => this.travel(Number(b.dataset.travel)));
    } else if (this.tab === 'camp') {
      const home = getCurrentLocation(player, background) === 'Kampung';
      el.innerHTML = `<div class="camp-scene"><span>☾</span><i>✦</i><b>⌂</b></div><div class="camp-copy"><span class="eyebrow">AKHIRI HARI KE-${p.day}</span><h2>Istirahat. Dunia bisa menunggu.</h2><p>${home ? 'Pulang ke rumah panggung, rapikan ransel, dan sambut pagi.' : 'Dirikan kemah dengan bekal sederhana. Biaya kemah 10 koin.'} Energi dan kebersihan pulih, buah tumbuh lagi, tugas baru menanti.</p><div class="camp-summary"><span><b>${p.visited.length}</b> wilayah ditemukan</span><span><b>${p.unlocked.length}</b> teman perjalanan</span><span><b>${p.xp}</b> XP terkumpul</span></div><button class="primary-button" id="sleepNow">${home ? 'Tidur di rumah · Gratis' : 'Berkemah · 10 koin'} <span>→</span></button></div>`;
      el.querySelector('#sleepNow').onclick = () => {
        if (!home && playerStatus.money < 10) { showToast('Butuh 10 koin untuk berkemah. Pulang gratis melalui peta.'); return; }
        if (!home) applyStatusEffect({ money: -10 });
        this.close(); if (home) placePlayerAtMap(SPAWN.x, SPAWN.y);
        this.newDay(true); gameTime.set(7, 0); this.save();
      };
    }
    if (this.tab === 'journal') Adventure.enhanceJournal();
    if (this.tab === 'friends') Adventure.enhanceFriends();
    if (this.tab === 'camp') Adventure.enhanceCamp();
  },
  newDay(rested = false) {
    const unlocked = this.progress.nextDay();
    INTERACTABLES.forEach(o => { if (o.type === 'item') o.taken = false; o.actions?.forEach(a => a.nextAt = 0); });
    if (rested) Object.assign(playerStatus, { meal: Math.max(65, playerStatus.meal), sleep: 100, hygiene: 100, happiness: Math.max(85, playerStatus.happiness) });
    setEvent('clear', 0); updateStatusUI(); this.record('visit', getCurrentLocation(player, background)); this.renderHUD();
    this.notify('LEMBARAN BARU', `Selamat datang, hari ke-${this.progress.day}`, rested ? 'Tenaga pulih · Buah tumbuh lagi · Tugas harian baru' : 'Buah tumbuh lagi · Tugas harian baru');
    unlocked.forEach(id => this.notifyUnlock(id)); this.save();
  },
  travel(index) {
    const region = REGIONS[index]; if (!region || !this.progress.visited.includes(region.id)) return;
    const cost = index === 0 ? 0 : 15;
    if (playerStatus.money < cost) { showToast('Koin belum cukup untuk perjalanan cepat.'); return; }
    applyStatusEffect({ money: -cost });
    placePlayerAtMap(region.map.x, region.map.y); this.close(); gameTime.advance(60); this.waypoint = null; this.save();
  },
  returnHome() { placePlayerAtMap(SPAWN.x, SPAWN.y); this.save(); showToast('Kembali ke kampung. Perjalananmu tetap tersimpan.'); },
  recover() {
    gameOver = false; Pause.set('exhaustion', false); document.getElementById('gameOverOverlay').classList.remove('show');
    musicStarted = false;
    placePlayerAtMap(SPAWN.x, SPAWN.y); this.newDay(true); gameTime.set(7, 0); this.save();
  },
  drawWaypoint() {
    const s = mapToScreen(this.waypoint.map), x = player.position.x + (player.width || 64) / 2, y = player.position.y + (player.height || 80) / 2;
    const angle = Math.atan2(s.y - y, s.x - x), dist = Math.hypot(s.x - x, s.y - y);
    c.save(); c.translate(x + Math.cos(angle) * 70, y + Math.sin(angle) * 70); c.rotate(angle);
    c.fillStyle = '#fff3bf'; c.strokeStyle = '#245747'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(10, 0); c.lineTo(-6, -6); c.lineTo(-3, 0); c.lineTo(-6, 6); c.closePath(); c.fill(); c.stroke(); c.restore();
    if (dist < 80) { this.waypoint = null; this.renderHUD(); }
  },
  key(e) {
    if (e.target.matches('input,textarea') || e.repeat) return;
    if (this.panelOpen) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); this.close(); return; }
      if (e.key === 'Tab') {
        const nodes = [...document.querySelectorAll('#expeditionOverlay button:not(:disabled)')];
        const first = nodes[0], last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    if (window.Minigames?.active || Pause.reasons.has('tutorial') || gameOver || window.Dialogue?.active) return;
    const tab = { j: 'journal', m: 'map', g: 'challenges', c: 'friends', t: 'camp' }[e.key.toLowerCase()];
    if (tab) { e.preventDefault(); e.stopImmediatePropagation(); if (this.panelOpen && this.tab === tab) this.close(); else this.open(tab); }
  }
};
window.Expedition = Expedition;
Expedition.init();
