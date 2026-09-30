/* Self-contained rounds: cancelling never grants rewards; finishing pays once. */
const Minigames = {
  definitions: {
    fishing: { name: 'Kail & Ombak', tag: 'KETEPATAN · 5 LEMPARAN', symbol: '≈', character: 'sari', description: 'Tarik kail saat penunjuk berada di zona hijau. Tangkap 3 dari 5 ikan untuk mengajak Sari.' },
    cooking: { name: 'Dapur Rempah', tag: 'URUTAN · 5 RESEP', symbol: '♨', character: 'gori', description: 'Ingat urutan rempah, lalu racik kembali. Selesaikan 3 dari 5 resep untuk bertemu Bang Gori.' },
    memory: { name: 'Ingatan Nusantara', tag: 'INGATAN · 6 PASANG', symbol: '✧', character: 'kirana', description: 'Cocokkan 6 pasang kartu buah dalam 18 giliran. Kirana siap menemani penjelajah yang teliti.' }
  },
  active: false, id: null, finished: false, raf: 0, timers: new Set(), elapsed: 0,
  start(id) {
    if (!this.definitions[id] || this.active || gameOver) return;
    this.focusBefore = document.activeElement;
    document.getElementById('toast').classList.remove('show');
    this.timers.clear();
    this.playing = false;
    if (Expedition.panelOpen) Expedition.close();
    showInventoryPanel(false); this.active = true; this.finished = false; this.id = id; this.elapsed = 0; this.round = 0; this.score = 0; this.busy = false;
    Pause.set('minigame', true);
    if (!document.getElementById('minigameOverlay')) document.body.insertAdjacentHTML('beforeend', '<div id="minigameOverlay" class="expedition-overlay" role="dialog" aria-modal="true" aria-labelledby="miniTitle"><section class="minigame-shell"><header class="journal-header"><div><span class="eyebrow">PONDOK TANTANGAN</span><h1 id="miniTitle"></h1></div><button id="miniClose" class="close-button" aria-label="Keluar dari tantangan">×</button></header><div id="miniContent"></div></section></div>');
    document.getElementById('minigameOverlay').hidden = false;
    document.getElementById('miniTitle').textContent = this.definitions[id].name;
    document.getElementById('miniClose').onclick = () => this.close();
    const def = this.definitions[id];
    document.getElementById('miniContent').innerHTML = `<div class="mini-intro ${id}"><div class="mini-mentor"><img src="${getCharacter(def.character).avatar}" alt="${getCharacter(def.character).name}"><span>${def.symbol}</span></div><span class="eyebrow">${def.tag}</span><h2>${def.headline || (id === 'fishing' ? 'Sabar… lalu tarik!' : id === 'cooking' ? 'Racik rasa, ingat urutannya.' : 'Ada cerita di setiap pasangan.')}</h2><p>${def.description}</p><div class="mini-instructions">${def.instructions || (id === 'fishing' ? '<kbd>SPASI</kbd> atau tombol Tarik kail. Setiap lemparan punya waktu 7 detik.' : id === 'cooking' ? 'Amati resep selama 3 detik. Gunakan tombol rempah atau angka 1–6 untuk meracik.' : 'Pilih dua kartu dengan klik, atau Tab dan Enter. Pasangan yang benar tetap terbuka.')}</div><button class="primary-button" id="miniStart">Aku siap. Ayo mulai! →</button><small>Waktu dunia dijeda · Keluar sebelum selesai tidak mendapat hadiah</small></div>`;
    document.getElementById('miniStart').onclick = () => { this.playing = true; this[id](); };
    document.getElementById('miniStart').focus();
  },
  later(fn, ms) { const timer = { fn, remaining: ms }; this.timers.add(timer); return timer; },
  tick(now) {
    if (!this.active) return;
    const delta = Math.max(0, now - (this.lastFrame ?? now)); this.lastFrame = now;
    if (!document.hidden && this.playing && !this.finished) {
      const roundBefore = this.round, phaseBefore = this.phase;
      this.elapsed += delta;
      for (const timer of [...this.timers]) { timer.remaining -= delta; if (timer.remaining <= 0) { this.timers.delete(timer); timer.fn(); } }
      if (this.id === 'fishing' && !this.busy && this.round === roundBefore) {
        this.castTime += delta;
        this.cursor = (Math.sin(this.castTime / (570 - this.round * 28)) + 1) / 2;
        const needle = document.getElementById('fishingNeedle'); if (needle) needle.style.left = `${this.cursor * 100}%`;
        const timer = document.getElementById('castTime'); if (timer) timer.textContent = `${Math.max(0, Math.ceil((7000 - this.castTime) / 1000))} dtk`;
        if (this.castTime >= 7000) this.catchFish(true);
      }
      if (this.id === 'rhythm' && !this.busy && this.round === roundBefore) this.updateRhythm(delta);
      if (this.id === 'cooking' && this.phase === 'input' && phaseBefore === 'input' && this.round === roundBefore) {
        this.cookTime -= delta;
        const timer = document.getElementById('cookTime'); if (timer) timer.textContent = `${Math.max(0, Math.ceil(this.cookTime / 1000))} dtk`;
        if (this.cookTime <= 0) this.endRecipe(false);
      }
    }
    this.raf = requestAnimationFrame(t => this.tick(t));
  },
  loop() { cancelAnimationFrame(this.raf); this.lastFrame = performance.now(); this.raf = requestAnimationFrame(t => this.tick(t)); },
  fishing() {
    this.round = 0; this.score = 0; this.catchResults = []; this.castTime = 0; this.targetStart = .48; this.targetWidth = .24;
    document.getElementById('miniContent').innerHTML = `<div class="mini-game-top"><span id="fishingRound"></span><span id="castTime">7 dtk</span></div><div class="fishing-pond"><span class="pond-sun"></span><span class="pond-mountain"></span><div class="pond-ripples"></div><svg class="fishing-float" viewBox="0 0 80 100" aria-hidden="true"><path d="M40 0v42" stroke="#fff6db" stroke-width="2"/><ellipse cx="40" cy="63" rx="12" ry="20" fill="#fff2c9"/><path d="M28 63h24a12 20 0 0 1-24 0" fill="#ef805f"/></svg><div class="fish-silhouette">◁</div></div><div class="mini-status" id="fishingStatus" aria-live="polite">Tunggu penunjuk masuk ke zona hijau…</div><div class="fishing-track"><div id="fishingTarget"></div><div id="fishingNeedle"></div></div><div class="fishing-scale"><span>TUNGGU</span><span>HIJAU = TARIK</span><span>TUNGGU</span></div><button class="primary-button" id="catchFish">Tarik kail <kbd>SPASI</kbd></button><div id="catchResults" class="catch-results"></div>`;
    document.getElementById('catchFish').onclick = () => this.catchFish(false); this.nextCast(); this.loop(); document.getElementById('catchFish').focus();
  },
  nextCast() {
    if (this.round >= 5) return this.finish(this.score >= 3, this.score, 5);
    this.round++; this.busy = false; this.castTime = 0; this.targetStart = .25 + Math.random() * .4; this.cursor = .5;
    document.getElementById('fishingRound').textContent = `LEMPARAN ${this.round} / 5 · ${this.score} IKAN`;
    const zone = document.getElementById('fishingTarget'); zone.style.left = `${this.targetStart * 100}%`; zone.style.width = `${this.targetWidth * 100}%`;
    document.getElementById('catchFish').disabled = false;
    document.getElementById('fishingStatus').textContent = 'Tunggu penunjuk masuk ke zona hijau…';
  },
  catchFish(timeout = false) {
    if (!this.active || !this.playing || this.finished || this.busy || this.id !== 'fishing') return;
    this.busy = true;
    const success = !timeout && this.cursor >= this.targetStart && this.cursor <= this.targetStart + this.targetWidth;
    if (success) this.score++;
    this.catchResults.push(success);
    document.getElementById('fishingStatus').textContent = success ? 'Dapat! Seekor ikan berkilau menyambar kailmu.' : timeout ? 'Ikannya pergi. Coba lemparan berikutnya!' : 'Hampir! Tarik tepat di zona hijau.';
    document.getElementById('catchFish').disabled = true;
    document.getElementById('catchResults').innerHTML = this.catchResults.map(hit => `<span class="${hit ? 'hit' : ''}">${hit ? '✓' : '×'}</span>`).join('');
    this.later(() => this.nextCast(), 850);
  },
  spices: [{ name: 'Cabai', icon: '🌶' }, { name: 'Bawang', icon: '🧅' }, { name: 'Jahe', icon: '🫚' }, { name: 'Kelapa', icon: '🥥' }, { name: 'Jeruk', icon: '🍋' }, { name: 'Garam', icon: '🧂' }],
  cooking() { this.round = 0; this.score = 0; this.nextRecipe(); this.loop(); },
  nextRecipe() {
    if (this.round >= 5) return this.finish(this.score >= 3, this.score, 5);
    this.round++; this.inputIndex = 0; this.phase = 'preview'; this.cookTime = 15000;
    this.recipe = Array.from({ length: this.round < 3 ? 3 : this.round < 5 ? 4 : 5 }, () => Math.floor(Math.random() * 6));
    document.getElementById('miniContent').innerHTML = `<div class="mini-game-top"><span>RESEP ${this.round} / 5 · ${this.score} BERHASIL</span><span id="cookTime">Amati dahulu</span></div><div class="cooking-pot"><span class="steam">〰</span><span>♨</span></div><h2 id="recipeTitle">Ingat urutan rempah ini…</h2><div class="recipe-sequence">${this.recipe.map((n, i) => `<div id="ingredient-${i}" class="recipe-step"><span>${this.spices[n].icon}</span><small>${this.spices[n].name}</small></div>`).join('')}</div><div id="cookingStatus" class="mini-status" aria-live="polite">Resep akan ditutup dalam 3 detik.</div><div class="spice-grid">${this.spices.map((s, i) => `<button data-spice="${i}" disabled><span>${s.icon}</span><strong>${s.name}</strong><kbd>${i + 1}</kbd></button>`).join('')}</div>`;
    document.querySelectorAll('[data-spice]').forEach(b => b.onclick = () => this.addSpice(Number(b.dataset.spice)));
    this.later(() => {
      this.phase = 'input'; document.getElementById('recipeTitle').textContent = 'Sekarang, racik urutan yang sama.';
      this.recipe.forEach((_, i) => document.getElementById(`ingredient-${i}`).innerHTML = `<span>?</span><small>${i + 1}</small>`);
      document.querySelectorAll('[data-spice]').forEach(b => b.disabled = false);
      document.getElementById('cookingStatus').textContent = 'Pilih rempah pertama.';
      document.querySelector('[data-spice]').focus();
    }, 3000);
  },
  addSpice(index) {
    if (!this.active || this.finished || this.phase !== 'input' || this.id !== 'cooking') return;
    const cell = document.getElementById(`ingredient-${this.inputIndex}`);
    cell.innerHTML = `<span>${this.spices[index].icon}</span><small>${this.spices[index].name}</small>`;
    if (this.recipe[this.inputIndex] !== index) { cell.classList.add('wrong'); this.endRecipe(false); return; }
    cell.classList.add('correct'); this.inputIndex++;
    if (this.inputIndex === this.recipe.length) this.endRecipe(true);
    else document.getElementById('cookingStatus').textContent = `Bagus! Rempah ke-${this.inputIndex + 1} apa, ya?`;
  },
  endRecipe(success) {
    if (this.phase !== 'input') return; this.phase = 'result';
    if (success) this.score++;
    document.getElementById('cookingStatus').textContent = success ? 'Harumnya pas! Bang Gori mengacungkan jempol.' : 'Belum pas. Tenang, masih ada resep berikutnya.';
    document.querySelectorAll('[data-spice]').forEach(b => b.disabled = true);
    this.later(() => this.nextRecipe(), 1100);
  },
  memory() {
    const fruit = ['Nanas', 'Apel', 'Pisang', 'Semangka', 'Lemon', 'Cherry'];
    this.cards = [...fruit, ...fruit];
    for (let i = this.cards.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]; }
    this.flipped = []; this.matched = new Set(); this.turns = 0; this.busy = false;
    document.getElementById('miniContent').innerHTML = `<div class="mini-game-top"><span id="memoryPairs">0 / 6 PASANGAN</span><span id="memoryTurns">18 giliran tersisa</span></div><p class="memory-caption">Amati, ingat, dan temukan pasangannya.</p><div class="memory-grid">${this.cards.map((name, i) => `<button class="memory-card" data-card="${i}" aria-label="Buka kartu ${i + 1}"><span class="card-back">✳<small>NUSANTARA</small></span><span class="card-face"><img src="${itemDef(name).img}" alt=""><small>${name}</small></span></button>`).join('')}</div><p id="memoryStatus" class="mini-status" aria-live="polite">Pilih dua kartu untuk mulai.</p>`;
    document.querySelectorAll('[data-card]').forEach(b => b.onclick = () => this.flip(Number(b.dataset.card)));
    document.querySelector('[data-card]').focus(); this.loop();
  },
  flip(index) {
    if (!this.active || this.finished || this.busy || this.matched.has(index) || this.flipped.includes(index)) return;
    this.flipped.push(index); const card = document.querySelector(`[data-card="${index}"]`); card.classList.add('flipped'); card.setAttribute('aria-label', this.cards[index]);
    if (this.flipped.length < 2) return;
    this.turns++; const [a, b] = this.flipped;
    document.getElementById('memoryTurns').textContent = `${18 - this.turns} giliran tersisa`;
    if (this.cards[a] === this.cards[b]) {
      this.matched.add(a); this.matched.add(b); this.flipped = [];
      [a, b].forEach(i => { const node = document.querySelector(`[data-card="${i}"]`); node.classList.add('matched'); node.disabled = true; });
      document.getElementById('memoryPairs').textContent = `${this.matched.size / 2} / 6 PASANGAN`;
      document.getElementById('memoryStatus').textContent = 'Cocok! Ingatanmu tajam.';
      if (this.matched.size === 12) { this.busy = true; this.later(() => this.finish(true, 6, 6), 700); }
      else if (this.turns >= 18) this.finish(false, this.matched.size / 2, 6);
    } else {
      this.busy = true; document.getElementById('memoryStatus').textContent = 'Belum cocok. Ingat letaknya untuk giliran berikutnya.';
      this.later(() => {
        [a, b].forEach(i => { const node = document.querySelector(`[data-card="${i}"]`); node.classList.remove('flipped'); node.setAttribute('aria-label', `Buka kartu ${i + 1}`); });
        this.flipped = []; this.busy = false;
        if (this.turns >= 18) this.finish(false, this.matched.size / 2, 6);
      }, 950);
    }
  },
  finish(won, score, total) {
    if (!this.active || this.finished) return;
    this.finished = true; this.playing = false; this.timers.clear(); cancelAnimationFrame(this.raf);
    const def = this.definitions[this.id], coins = Math.round((won ? 35 + score * 5 : 10) * (GameState.character?.coins || 1));
    applyStatusEffect({ money: coins, happiness: won ? 10 : 3 });
    const result = Expedition.record('minigame', { id: this.id, won, score });
    Expedition.save();
    document.getElementById('miniContent').innerHTML = `<div class="mini-result"><span class="result-medal">${won ? '✦' : '✧'}</span><span class="eyebrow">${won ? 'TANTANGAN SELESAI' : 'SETIAP PERCOBAAN, PELAJARAN'}</span><h2>${won ? 'Perjalanan kecil, pencapaian besar.' : 'Sedikit lagi. Coba lagi, yuk!'}</h2><p>${score} / ${total} ${this.id === 'fishing' ? 'ikan tertangkap' : this.id === 'cooking' ? 'resep berhasil' : this.id === 'rhythm' ? 'nada tepat' : 'pasangan ditemukan'}</p><div class="result-rewards"><span>+${coins} <small>KOIN</small></span><span>+${result.xp} <small>XP</small></span></div>${result.unlocked.length ? `<div class="result-friend"><img src="${getCharacter(def.character).avatar}" alt="${getCharacter(def.character).name}"><div><small>TEMAN BARU TERBUKA</small><strong>${getCharacter(def.character).name}</strong><span>${getCharacter(def.character).perk}</span></div></div>` : ''}<div class="result-actions"><button class="primary-button" id="miniDone">${result.unlocked.length ? 'Temui teman barumu →' : 'Kembali menjelajah →'}</button><button class="secondary-button" id="miniReplay">Main lagi</button></div></div>`;
    document.getElementById('miniDone').onclick = () => { this.close(); if (result.unlocked.length) Expedition.open('friends'); };
    document.getElementById('miniReplay').onclick = () => { const id = this.id; this.close(); this.start(id); };
    document.getElementById('miniDone').focus();
  },
  close() {
    if (!this.active) return;
    const abandoned = !this.finished;
    this.active = false; this.playing = false; cancelAnimationFrame(this.raf); this.timers.clear();
    document.getElementById('minigameOverlay').hidden = true; Pause.set('minigame', false);
    if (this.focusBefore?.isConnected) this.focusBefore.focus();
    else document.querySelector('[data-panel="challenges"]').focus();
    if (abandoned) showToast('Tantangan dihentikan. Kamu bisa mencoba lagi kapan saja.');
  }
};
window.Minigames = Minigames;
// requestAnimationFrame stops in hidden tabs; discard that gap on return.
document.addEventListener('visibilitychange', () => { Minigames.lastFrame = performance.now(); });
window.addEventListener('keydown', e => {
  if (!Minigames.active) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); Minigames.close(); return; }
  if (e.repeat) { e.preventDefault(); return; }
  if (Minigames.id === 'fishing' && Minigames.playing && e.code === 'Space') { e.preventDefault(); e.stopImmediatePropagation(); Minigames.catchFish(false); }
  if (Minigames.id === 'cooking' && Minigames.playing && /^[1-6]$/.test(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); Minigames.addSpice(Number(e.key) - 1); }
  if (e.key === 'Tab') {
    const nodes = [...document.querySelectorAll('#minigameOverlay button:not(:disabled)')];
    if (e.shiftKey && document.activeElement === nodes[0]) { e.preventDefault(); nodes.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); nodes[0].focus(); }
  }
}, true);
