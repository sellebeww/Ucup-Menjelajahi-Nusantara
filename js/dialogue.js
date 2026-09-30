// Sistem dialog yang bisa dipakai ulang oleh NPC mana pun, plus notifikasi kecil (toast).

const dialogueBox = document.getElementById('dialogueBox');
const dialogueName = document.getElementById('dialogueName');
const dialogueText = document.getElementById('dialogueText');
const dialoguePortrait = document.getElementById('dialoguePortrait');
const dialogueNextBtn = document.getElementById('dialogueNextBtn');
const dialogueCloseBtn = document.getElementById('dialogueCloseBtn');
const toastEl = document.getElementById('toast');

const Dialogue = {
  active: false,
  lines: [],
  index: 0,
  typing: false,
  typeTimer: null,
  onDone: null,

  open(speaker, lines, options = {}) {
    this.lines = Array.isArray(lines) ? lines.slice() : [lines];
    this.index = 0;
    this.active = true;
    this.onDone = options.onDone || null;

    dialogueName.textContent = speaker || '';
    if (options.portrait) {
      dialoguePortrait.src = options.portrait;
      dialoguePortrait.style.display = 'block';
    } else {
      dialoguePortrait.style.display = 'none';
    }

    dialogueBox.classList.add('open');
    document.body.classList.add('dialogue-open');
    Pause.set('dialogue', true);
    if (typeof keys !== 'undefined') {
      Object.keys(keys).forEach(k => { keys[k].pressed = false; });
    }
    this.render();
  },

  render() {
    const line = this.lines[this.index] || '';
    dialogueNextBtn.textContent = this.index >= this.lines.length - 1 ? 'TUTUP' : 'LANJUT';

    clearInterval(this.typeTimer);
    this.typing = true;
    dialogueText.textContent = '';
    let i = 0;
    this.typeTimer = setInterval(() => {
      dialogueText.textContent = line.slice(0, ++i);
      if (i >= line.length) {
        clearInterval(this.typeTimer);
        this.typing = false;
      }
    }, 18);
  },

  next() {
    if (!this.active) return;
    if (this.typing) {              // klik saat teks masih berjalan -> tampilkan penuh
      clearInterval(this.typeTimer);
      dialogueText.textContent = this.lines[this.index];
      this.typing = false;
      return;
    }
    if (this.index < this.lines.length - 1) {
      this.index++;
      this.render();
    } else {
      this.close(true);
    }
  },

  close(completed = false) {
    if (!this.active) return;
    clearInterval(this.typeTimer);
    this.active = false;
    this.typing = false;
    dialogueBox.classList.remove('open');
    document.body.classList.remove('dialogue-open');
    Pause.set('dialogue', false);
    const cb = this.onDone;
    this.onDone = null;
    if (completed && cb) cb();
    window.Expedition?.save();
  }
};

dialogueNextBtn.addEventListener('click', () => Dialogue.next());
dialogueCloseBtn.addEventListener('click', () => Dialogue.close());

window.addEventListener('keydown', (e) => {
  if (!Dialogue.active) return;
  if (e.key === 'Escape') {
    e.stopImmediatePropagation();
    Dialogue.close();
    return;
  }
  if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    // tanpa ini, listener action bar ikut jalan dan dialog langsung terbuka lagi
    e.stopImmediatePropagation();
    Dialogue.next();
  }
});

// ---- Toast ----
let toastTimer = null;
function showToast(html) {
  if (!toastEl) return;
  toastEl.innerHTML = html;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

window.Dialogue = Dialogue;
window.showToast = showToast;
Pause.set('dialogue', false);
