const locations = [
    {
        name: 'Kampung',
        area: {
            xMin: 0,
            xMax: 2000,
            yMin: 0,
            yMax: 2000
        }
    },
    {
        name: 'Bali',
        area: {
            xMin: 1200,   
            xMax: 3500,  
            yMin: 3000,   
            yMax: 4000    
        }
    },
    {
        name: 'Lawang Sewu',
        area: {
            xMin: 4150,
            xMax: 6000,
            yMin: 2000, 
            yMax: 2700   
        }
    },
    {
        name: 'Pekuburan Sentosa',
        area: {
            xMin: 2700,
            xMax: 4050,
            yMin: 1200,
            yMax: 2150
        }
    },
    {
        name: 'Rempah Krakatau',
        area: {
            xMin: 4350,
            xMax: 4800,
            yMin: 1000,
            yMax: 1800
        }
    },
    {
        name: 'Kota Tua',
        area: {
            xMin: 2300,
            xMax: 4000,
            yMin: 2200,
            yMax: 3000
        }
    },
    {
        name: 'Candi Borobudur',
        area: {
            xMin: 4150,
            xMax: 6000,
            yMin: 2800,   
            yMax: 4400  
        }
    }

];

function getCurrentLocation(player, background) {
    const absoluteX = player.position.x - background.position.x + (player.width || 48) / 2;
    const absoluteY = player.position.y - background.position.y + (player.height || 68) / 2;

    for (let loc of locations) {
        if (
            absoluteX >= loc.area.xMin &&
            absoluteX <= loc.area.xMax &&
            absoluteY >= loc.area.yMin &&
            absoluteY <= loc.area.yMax
        ) {
            return loc.name;
        }
    }

    return '';
}

const playerStatus = {
  meal: 85,
  sleep: 90,
  hygiene: 85,
  happiness: 90,
  money: 100
};

let gameOver = false;

function updateStatusUI() {
  const setBar = (key) => {
    const value = playerStatus[key];
    const bar = document.getElementById(`${key}Bar`);
    const label = document.getElementById(`${key}Value`);

    bar.style.width = `${value}%`;
    label.textContent = `${Math.floor(value)}%`;

    if (value < 30) {
      bar.style.background = '#d77d65';
    } else if (value < 70) {
      bar.style.background = '#d9b064';
    } else {
      bar.style.background = '#a5c385';
    }

    const row = bar.closest('.status');
    if (row) row.classList.toggle('low', value < 30);
  };

  setBar('meal');
  setBar('sleep');
  setBar('hygiene');
  setBar('happiness');

  document.getElementById('moneyAmount').textContent = Math.floor(playerStatus.money);
}

const GAME_OVER_REASON = {
  meal: 'kehabisan tenaga karena kelaparan.',
  sleep: 'tumbang kelelahan di tengah perjalanan.',
  hygiene: 'jatuh sakit karena tidak menjaga kebersihan.',
  happiness: 'kehilangan semangat untuk menjelajah.'
};
let gameOverReason = '';

function checkGameOver() {
  const habis = ['meal', 'sleep', 'hygiene', 'happiness'].find(k => playerStatus[k] === 0);
  if (habis) {
    const nama = (window.GameState && GameState.playerName) || 'Ucup';
    gameOverReason = `${nama} ${GAME_OVER_REASON[habis]}`;

    keys.w.pressed = false;
    keys.a.pressed = false;
    keys.s.pressed = false;
    keys.d.pressed = false;
    lastKey = '';
    
    if (audio.Map && typeof audio.Map.pause === 'function') {
      audio.Map.pause();
    }
    
    return true;
  }
  return false;
}

function showGameOverOverlay() {
  const overlay = document.getElementById('gameOverOverlay');
  const reason = document.getElementById('gameOverReason');
  if (reason) reason.textContent = gameOverReason;
  overlay.classList.add('show');

  // pastikan panel lain tidak menghalangi tombol
  if (typeof showInventoryPanel === 'function') showInventoryPanel(false);
  if (window.Dialogue && Dialogue.active) Dialogue.close();
}

// Tombol di layar game over
const restartBtn = document.getElementById('restartBtn');
const changeCharBtn = document.getElementById('changeCharBtn');
if (restartBtn) restartBtn.addEventListener('click', () => Expedition.recover());
if (changeCharBtn) changeCharBtn.addEventListener('click', () => { Expedition.recover(); Expedition.open('friends'); });

function playGameOverSound() {
  const gameOverSound = document.getElementById('gameover-sound');
  if (gameOverSound) {
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch((err) => {
      console.warn("Gagal memutar audio game over:", err);
    });
  }
}

const statusInterval = setInterval(() => {
  if (gameOver || window.gamePaused) return;

  const drain = (GameState.modifiers.drain || 1) * (GameState.character?.drain || 1);

  playerStatus.meal = Math.max(0, playerStatus.meal - 0.014 * drain);
  playerStatus.sleep = Math.max(0, playerStatus.sleep - 0.010 * drain);
  playerStatus.hygiene = Math.max(0, playerStatus.hygiene - 0.009 * drain);
  playerStatus.happiness = Math.max(0, playerStatus.happiness - 0.006 * drain);

  // efek pasif dari cuaca yang sedang berlangsung (hujan membersihkan badan, dll)
  const passive = window.GameState && GameState.modifiers.passive;
  if (passive) {
    for (const key in passive) {
      if (!(key in playerStatus)) continue;
      playerStatus[key] = Math.max(0, Math.min(100, playerStatus[key] + passive[key]));
    }
  }

  updateStatusUI();

  if (checkGameOver()) {
    gameOver = true;
    Pause.set('exhaustion', true);
    window.Expedition?.save();

    if (audio.Map && typeof audio.Map.pause === 'function') {
      audio.Map.pause();
    }

    showGameOverOverlay();
    playGameOverSound();
  }
}, 100);

let musicStarted = false;
audio.Map.loop = true;

// Musik map baru diputar setelah ada interaksi pertama dari user
// (browser memblokir autoplay bersuara sebelum itu).
function startMapMusic() {
  if (!musicStarted) {
    musicStarted = true;
    audio.Map.play().catch((err) => {
      console.warn('Gagal play musik:', err);
    });
  }
}
window.addEventListener('keydown', startMapMusic);
window.addEventListener('pointerdown', startMapMusic);
updateStatusUI();

window.updateStatusUI = updateStatusUI;
window.resetGameOver = () => { gameOver = false; };
window.playerStatus = playerStatus;
