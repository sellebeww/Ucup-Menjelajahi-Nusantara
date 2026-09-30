// Tutorial singkat di awal permainan. Bisa dilewati kapan saja, dan bisa
// diputar ulang lewat menu pengaturan.

const tutorialOverlay = document.getElementById('tutorialOverlay');
const tutorialStepEl = document.getElementById('tutorialStep');
const tutorialTitle = document.getElementById('tutorialTitle');
const tutorialText = document.getElementById('tutorialText');
const tutorialNext = document.getElementById('tutorialNext');
const tutorialSkip = document.getElementById('tutorialSkip');
const tutorialDots = document.getElementById('tutorialDots');

const TUTORIAL_STEPS = [
  {
    title: 'SELAMAT DATANG',
    text: 'Kamu bebas menjelajahi seluruh Nusantara. Gunakan <b>W A S D</b> atau <b>tombol panah</b> untuk berjalan. Di layar sentuh, pakai tombol arah di kiri bawah.'
  },
  {
    title: 'BERINTERAKSI',
    text: 'Dekati orang atau benda yang bertanda. Panel aksi akan muncul di bawah layar. Tekan <b>E</b> untuk aksi utama, <b>Q</b> untuk aksi kedua.'
  },
  {
    title: 'JAGA STATUS',
    text: 'Empat batang di kiri atas adalah <b>Kenyang, Energi, Kebersihan, dan Semangat</b>. Kalau kehabisan tenaga, pulihkan diri di rumah. Temuan dan temanmu tetap tersimpan. Makan, mandi, dan istirahat di tempat yang tepat.'
  },
  {
    title: 'TAS & BARANG',
    text: 'Barang bercahaya di tanah bisa dipungut. Buka tas dengan tombol <b>B</b> atau ikon tas di kanan bawah untuk memakainya.'
  },
  {
    title: 'HARI BARU, CERITA BARU',
    text: 'Tidur di rumah atau berkemah untuk menyambut hari baru. Tugas harian dan buah tersedia lagi. Ikuti <b>5 bab di Jurnal (J)</b>, tandai tujuan, dan catat <b>7 peninggalan</b> yang berkilau di dunia.'
  },
  {
    title: 'TEMAN & TANTANGAN',
    text: 'Buka <b>Tantangan (G)</b>: pancing ikan, racik rempah, cocokkan kartu, dan mainkan irama bambu. Menang untuk membuka teman baru dengan keahlian unik! Progres tersimpan otomatis di browser ini.'
  }
];

let tutorialIndex = 0;
let tutorialActive = false;

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialIndex];
  tutorialStepEl.textContent = `${tutorialIndex + 1}/${TUTORIAL_STEPS.length}`;
  tutorialTitle.textContent = step.title;
  tutorialText.innerHTML = step.text;
  tutorialNext.textContent = tutorialIndex === TUTORIAL_STEPS.length - 1 ? 'MULAI MAIN' : 'LANJUT';

  tutorialDots.innerHTML = '';
  TUTORIAL_STEPS.forEach((_, i) => {
    const d = document.createElement('i');
    if (i === tutorialIndex) d.className = 'active';
    tutorialDots.appendChild(d);
  });
}

function startTutorial(force) {
  if (!force && GameStorage.get('tutorialDone') === '1') return;
  tutorialIndex = 0;
  tutorialActive = true;
  tutorialOverlay.classList.add('open');
  Pause.set('tutorial', true);
  renderTutorialStep();
}

function endTutorial() {
  tutorialActive = false;
  tutorialOverlay.classList.remove('open');
  GameStorage.set('tutorialDone', '1');
  Pause.set('tutorial', false);
}

function nextTutorialStep() {
  if (tutorialIndex < TUTORIAL_STEPS.length - 1) {
    tutorialIndex++;
    renderTutorialStep();
  } else {
    endTutorial();
  }
}

tutorialNext.addEventListener('click', nextTutorialStep);
tutorialSkip.addEventListener('click', endTutorial);

window.addEventListener('keydown', (e) => {
  if (!tutorialActive) return;
  e.stopImmediatePropagation();
  if (e.key === 'Escape') endTutorial();
  else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
    nextTutorialStep();
  }
}, true);

startTutorial(false);

window.startTutorial = startTutorial;
