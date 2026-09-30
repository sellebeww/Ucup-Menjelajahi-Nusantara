// Selection and continue use the same progression rules as the world.
const loadingScreen = document.getElementById('loading-screen');
const stageLogin = document.getElementById('stage-login');
const stageSelect = document.getElementById('stage-select');
const nameInput = document.getElementById('player-name');
const nameError = document.getElementById('name-error');
const enterBtn = document.getElementById('enter-btn');
const grid = document.getElementById('character-grid');
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');
const saved = GameStorage.read();
const progress = new ExpeditionProgress(saved?.progress);
const isUnlocked = id => progress.unlocked.includes(id);
let selectedId = GameStorage.get('characterId') || 'ucup';
if (!getCharacter(selectedId) || !isUnlocked(selectedId)) selectedId = 'ucup';
let previewSprites = null;
let previewFrame = 0;
let previewTick = 0;
let entering = false;

function playSound(id) {
  const sound = document.getElementById(id);
  if (GameStorage.get('musicMuted') === '1') return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function selectCharacter(id) {
  const ch = getCharacter(id);
  if (!ch) return;
  selectedId = id;
  const unlocked = isUnlocked(id);
  [...grid.children].forEach(card => {
    card.classList.toggle('selected', card.dataset.id === id);
    card.setAttribute('aria-pressed', String(card.dataset.id === id));
  });
  document.getElementById('preview-name').textContent = ch.name;
  document.getElementById('preview-title').textContent = ch.title;
  document.getElementById('preview-bio').textContent = ch.bio;
  document.getElementById('preview-status').textContent = `✧ ${ch.perk}`;
  document.getElementById('preview-unlock').textContent = unlocked ? 'Siap menemani langkahmu.' : ch.unlock;
  enterBtn.disabled = !unlocked;
  enterBtn.innerHTML = unlocked ? 'Ayo menjelajah <span>↗</span>' : 'Teman ini masih terkunci';
  previewSprites = null;
  loadCharacterSprites(ch, ({ images, frames }) => {
    if (selectedId !== id) return;
    previewSprites = { image: images.down, frames };
    previewFrame = 0;
  });
}

function buildGrid() {
  grid.innerHTML = '';
  CHARACTERS.forEach(ch => {
    const unlocked = isUnlocked(ch.id);
    const card = document.createElement('button');
    card.className = `char-card${unlocked ? '' : ' unavailable'}`;
    card.dataset.id = ch.id;
    card.title = unlocked ? ch.perk : ch.unlock;
    card.setAttribute('aria-label', `${ch.name}. ${unlocked ? ch.perk : ch.unlock}`);
    card.innerHTML = `<div class="char-portrait"><img src="${ch.avatar}" alt="">${unlocked ? '' : '<span class="lock">TERKUNCI</span>'}</div><span class="char-name">${ch.name}</span><span class="char-state">${unlocked ? 'SIAP MENJELAJAH' : 'TEMUKAN DI PERJALANAN'}</span>`;
    card.onclick = () => { playSound('choose-sound'); selectCharacter(ch.id); };
    grid.appendChild(card);
  });
  document.getElementById('unlocked-count').textContent = `${progress.unlocked.length} / 6 teman terbuka`;
}

function showSelection() {
  const name = nameInput.value.trim().slice(0, 14);
  if (!name) {
    nameError.textContent = 'Tulis namamu dulu, ya.';
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus();
    return;
  }
  nameError.textContent = '';
  nameInput.removeAttribute('aria-invalid');
  GameStorage.set('playerName', name);
  stageLogin.classList.remove('active');
  stageSelect.classList.add('active');
  grid.querySelector(`[data-id="${selectedId}"]`).focus();
  window.scrollTo(0, 0);
}
document.getElementById('welcome-form').onsubmit = e => { e.preventDefault(); showSelection(); };
document.getElementById('back-btn').onclick = () => {
  stageSelect.classList.remove('active');
  stageLogin.classList.add('active');
  nameInput.focus();
};
function enterWorld() {
  if (entering || !isUnlocked(selectedId) || !getCharacter(selectedId)) return;
  entering = true;
  GameStorage.set('characterId', selectedId);
  playSound('start-sound');
  enterBtn.disabled = true;
  document.body.classList.add('leaving');
  setTimeout(() => { window.location.href = 'index.html'; }, 400);
}
enterBtn.onclick = enterWorld;
nameInput.value = GameStorage.get('playerName', '').slice(0, 14);
if (saved) {
  document.getElementById('continue-btn').hidden = false;
  document.getElementById('continue-detail').textContent = `Hari ${progress.day} · ${progress.visited.length}/7 wilayah · Level ${progress.level}`;
  document.querySelector('#login-btn>span').textContent = 'Pilih teman perjalanan';
  document.getElementById('continue-btn').onclick = () => {
    const savedId = GameStorage.get('characterId');
    selectedId = getCharacter(savedId) && isUnlocked(savedId) ? savedId : 'ucup';
    enterWorld();
  };
}
function animatePreview(now) {
  requestAnimationFrame(animatePreview);
  if (!stageSelect.classList.contains('active') || !previewSprites || document.hidden) return;
  const { image, frames } = previewSprites;
  const fw = image.width / frames, fh = image.height;
  const scale = Math.min(previewCanvas.width * .8 / fw, previewCanvas.height * .9 / fh);
  if (now - previewTick > 180 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    previewTick = now; previewFrame = (previewFrame + 1) % frames;
  }
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(image, previewFrame * fw, 0, fw, fh, (previewCanvas.width - fw * scale) / 2, (previewCanvas.height - fh * scale) / 2, fw * scale, fh * scale);
}
requestAnimationFrame(animatePreview);

const preloadList = [...new Set(['img/nusantara.png', 'img/foreground.png', 'img/foreground2.png', ...CHARACTERS.map(ch => ch.sprite.src)])];
let loaded = 0;
const preload = src => new Promise(resolve => {
  const img = new Image(); let done = false;
  const timer = setTimeout(finish, 12000);
  function finish() {
    if (done) return; done = true; clearTimeout(timer); loaded++;
    const percent = Math.round(loaded / preloadList.length * 100);
    document.getElementById('progress-bar').style.width = `${percent}%`;
    document.getElementById('percent-text').textContent = `${percent}%`;
    resolve();
  }
  img.onload = finish; img.onerror = finish; img.src = src;
});
Promise.all([Promise.all(preloadList.map(preload)), window.characterPortraitsReady]).then(() => {
  buildGrid(); selectCharacter(selectedId);
  loadingScreen.style.opacity = '0';
  setTimeout(() => {
    loadingScreen.hidden = true; stageLogin.classList.add('active');
    if (!matchMedia('(pointer: coarse)').matches) nameInput.focus({ preventScroll: true });
  }, 400);
});
