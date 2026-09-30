// NPC memakai atlas karakter baru, dengan PNG lama sebagai cadangan saat memuat.
// Posisi disimpan dalam koordinat peta dan sudah dicocokkan dengan isi peta:
// tiap NPC berdiri di tempat yang sesuai pekerjaannya (lapak, dermaga, gua rempah,
// alun-alun, depan rumah), tidak tertutup kanopi, dan tidak di dalam tile tabrakan.

const NPC_SCALE = 0.5;
// Animasi idle NPC sengaja dibuat pelan (ganti gambar tiap 48 frame, ~0.8 detik)
// supaya terlihat bernapas, bukan bergetar cepat.
const NPC_ANIM_HOLD = 48;

const NPC_DATA = [
  {
    id: 'atok',
    name: 'Atok',
    role: 'Sesepuh Kampung',
    activity: 'sedang menjaga kampung di depan rumah panggung',
    src: 'characters/atok.png',
    map: { x: 1745, y: 1435 },          // depan rumah panggung, Kampung Home
    lines: {
      first: [
        'Halo, cu! Aku Atok, yang paling tua di kampung ini.',
        'Atok menitipkan buku perjalanan. Buka Jurnal untuk melihat tujuan pertamamu: siapkan bekal dan temukan kompas di timur rumah.',
        'Kalau mau menjelajah jauh, bawa bekal dulu. Nih dari Atok.'
      ],
      repeat: [
        'Kebun warga di timur boleh kamu panen, asal ikut bantu.',
        'Capek? Duduk saja di bangku dekat sumur itu.'
      ],
      night: [
        'Sudah malam, cu. Kampung sudah sepi.',
        'Kalau mau ke pekuburan, sebaiknya tunggu pagi.'
      ],
      bloodmoon: [
        'Bulan merah... Atok baru dua kali lihat seumur hidup.',
        'Jangan jauh-jauh dari kampung malam ini.'
      ]
    },
    reward: { type: 'item', item: 'Potion Hunger', text: 'Atok memberimu bekal: Potion Hunger!' },
    actions: [
      { label: 'IRAMA BAMBU', minigame: 'rhythm', effect: { happiness: 12, sleep: -4 }, cooldown: 18000,
        msg: 'Atok bercerita soal masa mudanya menyeberangi laut. Seru juga!' }
    ]
  },
  {
    id: 'chinese_woman',
    name: 'Mei',
    role: 'Penjual Mie',
    activity: 'sedang menunggui lapak mie di pasar Kota Tua',
    src: 'characters/chinese_woman.png',
    map: { x: 2975, y: 2600 },          // tepat di samping lapak pasar Kota Tua
    lines: {
      first: [
        'Ni hao! Aku Mei, jualan mie di lapak ini tiap hari.',
        'Balai kota ada di timur, bengkel pandai besi di sebelahnya. Pak Lurah pindah ke kampung pesisir.',
        'Kamu suka menjelajah? Kutandai satu tempat menarik di petamu.'
      ],
      repeat: [
        'Mie-nya masih panas kalau mau.',
        'Kalau capek keliling, ada bangku di seberang jalan.'
      ],
      night: [
        'Sebentar lagi aku tutup lapak.',
        'Jangan ke pekuburan malam-malam, banyak yang cerita aneh-aneh.'
      ],
      bloodmoon: [
        'Langitnya merah, pasar jadi sepi begini.',
        'Aku bungkus cepat-cepat, kamu hati-hati di jalan.'
      ]
    },
    reward: { type: 'reveal', location: 'Kerangka Raksasa', at: { x: 3600, y: 1990 },
              text: 'Mei menandai lokasi Kerangka Raksasa di petamu!' },
    actions: [
      { label: 'BELI MIE', effect: { money: -15, meal: 25, happiness: 5 }, cooldown: 12000,
        msg: 'Semangkuk mie panas buatan Mei. Mantap!' }
    ]
  },
  {
    id: 'village_head',
    name: 'Pak Lurah',
    role: 'Kepala Kampung Pesisir',
    activity: 'sedang mengawasi kampung nelayan di dekat tungku masak',
    src: 'characters/village_head.png',
    map: { x: 1620, y: 3330 },          // kampung pesisir barat daya, dekat tungku & rumah adat
    lines: {
      first: [
        'Selamat datang di kampung pesisir, anak muda.',
        'Saya kepala kampung di sini. Rumah adat di selatan boleh kamu masuki.',
        'Ini sedikit uang saku untuk perjalananmu.'
      ],
      repeat: [
        'Tungku di sebelah sana masih menyala, silakan masak sendiri.',
        'Tengkorak raksasa di barat itu sudah ada sejak kakek saya kecil.'
      ],
      night: [
        'Malam begini warga sudah masuk rumah semua.',
        'Jangan dekat-dekat tengkorak besar itu kalau gelap.'
      ],
      bloodmoon: [
        'Saya suruh warga tidak keluar malam ini.',
        'Bulan merah biasanya membawa hal aneh dari arah tenggara.'
      ]
    },
    reward: { type: 'money', amount: 30, text: 'Pak Lurah memberimu uang saku!' },
    actions: [
      { label: 'KERJA BAKTI', effect: { money: 30, sleep: -12, hygiene: -10 }, cooldown: 22000,
        msg: 'Kamu ikut kerja bakti membersihkan kampung. Lelah tapi dibayar.' }
    ]
  },
  {
    id: 'uncle_fisherman',
    name: 'Paman Nelayan',
    role: 'Nelayan Sungai',
    activity: 'sedang memancing di tepi sungai dekat dermaga kayu',
    src: 'characters/uncle_fisherman.png',
    map: { x: 4100, y: 1845 },          // tepi sungai, sebelah dermaga kayu
    lines: {
      first: [
        'Halo! Tiap hari aku memancing di sungai ini.',
        'Airnya bersih, boleh kamu minum atau pakai cuci muka di hulu sana.',
        'Bawa ini, buat bekal di jalan.'
      ],
      repeat: [
        'Ikannya lagi malas menggigit hari ini.',
        'Kalau mau coba memancing, dermaga di pantai barat lebih ramai ikannya.'
      ],
      night: [
        'Malam begini ikannya justru banyak.',
        'Tapi jangan dekat-dekat nisan di belakang itu, ya.'
      ],
      bloodmoon: [
        'Ikan-ikan kabur semua sejak bulan berubah merah.',
        'Sungainya pun kelihatan merah. Aneh sekali.'
      ]
    },
    reward: { type: 'item', item: 'Semangka', text: 'Paman Nelayan memberimu Semangka!' },
    actions: [
      { label: 'KAIL & OMBAK', minigame: 'fishing', effect: { sleep: -10 }, cooldown: 20000,
        msg: 'Kamu ikut melempar kail bersama Paman...',
        reward: { chance: 0.6, items: ['Potion Hunger', 'Semangka', 'Apel'],
                  text: 'Kailmu disambar!', failText: 'Tidak ada yang menyangkut hari ini.' } }
    ]
  },
  {
    id: 'indian_woman',
    name: 'Anjali',
    role: 'Pedagang Rempah',
    activity: 'sedang menjemur rempah di depan Gua Rempah',
    src: 'characters/indian_woman.png',
    map: { x: 4560, y: 1620 },          // depan gua penyimpanan rempah, Krakatau
    lines: {
      first: [
        'Namaste! Aku Anjali, pedagang rempah dari timur.',
        'Gua di sebelah sana tempatku menyimpan pala dan cengkih biar kering.',
        'Ambil ini, berguna menjaga kebersihanmu di perjalanan.'
      ],
      repeat: [
        'Tanah dekat Krakatau ini hangat, rempahnya jadi wangi sekali.',
        'Batu belerang di barat bisa kamu tambang kalau butuh uang.'
      ],
      night: [
        'Malam di lereng ini dingin sekali.',
        'Tanah hangat dekat kawah itu bagus buat menghangatkan badan.'
      ],
      bloodmoon: [
        'Di kampung halamanku, bulan merah tanda perubahan besar.',
        'Entah baik atau buruk, sebaiknya kamu tidak ke tenggara malam ini.'
      ]
    },
    reward: { type: 'item', item: 'Potion Hygiene', text: 'Anjali memberimu Potion Hygiene!' },
    actions: [
      { label: 'BELI JAMU', effect: { money: -20, sleep: 25, hygiene: 5 }, cooldown: 15000,
        msg: 'Jamu rempah buatan Anjali. Badanmu langsung enteng.' }
    ]
  },
  {
    id: 'malay_woman',
    name: 'Kak Ros',
    role: 'Penjaga Pasar Pantai',
    activity: 'sedang menjaga kios di depan pasar pantai',
    src: 'characters/malay_woman.png',
    map: { x: 3020, y: 3430 },          // depan kios pasar pantai selatan
    lines: {
      first: [
        'Eh, ada pendatang! Aku Kak Ros, jaga kios di pasar pantai ini.',
        'Kalau badanmu gerah, berenang saja di pantai sebelah timur.',
        'Sini kutandai satu tempat menarik di petamu.'
      ],
      repeat: [
        'Ikan bakarku paling laris di pasar ini, mau coba?',
        'Keranjang nelayan di sebelah barat kadang masih ada isinya.'
      ],
      night: [
        'Pantai malam hari indah, bintangnya banyak.',
        'Tapi jangan berenang sendirian, ya.'
      ],
      bloodmoon: [
        'Air lautnya kelihatan merah semua...',
        'Aku tutup kios lebih awal malam ini.'
      ]
    },
    reward: { type: 'reveal', location: 'Batu Pemujaan', at: { x: 4020, y: 2030 },
              text: 'Kak Ros menandai lokasi Batu Pemujaan di petamu!' },
    actions: [
      { label: 'BELI IKAN BAKAR', effect: { money: -18, meal: 28, happiness: 4 }, cooldown: 12000,
        msg: 'Ikan bakar sambal matah. Pedas-pedas enak!' }
    ]
  }
];

const NPC_CHARACTER = { atok: 'atok', chinese_woman: 'sari', village_head: 'gori', uncle_fisherman: 'ucup', indian_woman: 'kirana', malay_woman: 'sari' };
const npcs = NPC_DATA.map(data => {
  const img = new Image(); img.src = data.src;
  const sprite = new Sprite({ position: { x: 0, y: 0 }, image: img, frames: { max: 2, hold: 48 }, scale: .5 });
  Object.assign(sprite, { isNpc: true, id: data.id, name: data.name, type: 'npc', map: data.map, data, actions: data.actions || [], moving: true });
  const character = getCharacter(NPC_CHARACTER[data.id]);
  loadCharacterSprites(character, ({ images, frames }) => {
    sprite.image = images.down; sprite.frames = { max: frames, val: 0, elapsed: 0, hold: 40 }; sprite.scale = .95;
    sprite.width = 64 * .95; sprite.height = 80 * .95; sprite.portraitUrl = character.avatar;
  });
  return sprite;
});

function drawNpcs() {
  npcs.forEach(npc => {
    const s = { x: npc.map.x + background.position.x, y: npc.map.y + background.position.y };
    const w = npc.width || 50;
    const h = npc.height || 65;
    npc.position.x = s.x - w / 2;
    npc.position.y = s.y - h;

    if (npc.position.x < -160 || npc.position.y < -160 ||
        npc.position.x > canvas.width + 160 || npc.position.y > canvas.height + 160) return;
    if (!npc.image.complete || !npc.image.naturalWidth) return;

    c.save();
    c.globalAlpha = 0.28;
    c.beginPath();
    c.ellipse(s.x, s.y - 2, w / 2.6, w / 7, 0, 0, Math.PI * 2);
    c.fillStyle = '#000';
    c.fill();
    c.restore();

    npc.draw();
  });
}

function findNearestNpc(playerMapPos) {
  let best = null;
  let bestDist = Infinity;
  npcs.forEach(npc => {
    const d = Math.hypot(npc.map.x - playerMapPos.x, npc.map.y - playerMapPos.y);
    if (d <= INTERACT_RADIUS && d < bestDist) {
      best = npc;
      bestDist = d;
    }
  });
  return best ? { npc: best, dist: bestDist } : null;
}

function pickNpcLines(data) {
  const st = GameState.npc(data.id);
  if (GameState.event === 'bloodmoon' && data.lines.bloodmoon) return data.lines.bloodmoon;
  if (GameState.period === 'Night' && data.lines.night) return data.lines.night;
  if (st.talked === 0) return data.lines.first;
  return data.lines.repeat;
}

function giveNpcReward(data) {
  const reward = data.reward;
  if (!reward) return;

  if (reward.type === 'item') {
    const def = (window.ITEM_LIBRARY || []).find(i => i.name === reward.item);
    if (def && addItemToInventory({ ...def })) { showToast(reward.text); return true; }
    return false;
  }
  if (reward.type === 'money') {
    const parts = applyStatusEffect({ money: reward.amount });
    showToast(`${reward.text}<br><span class="toast-stat">${parts.join(', ')}</span>`);
    return;
  }
  if (reward.type === 'reveal') {
    GameState.discovered[reward.location] = reward.at;
    showToast(reward.text);
    if (typeof renderDiscovered === 'function') renderDiscovered();
  }
}

// Potret dialog dibuat dari frame pertama sprite NPC (tanpa asset tambahan)
function npcPortrait(npc) {
  if (npc.portraitUrl) return npc.portraitUrl;
  const img = npc.image;
  if (!img.complete || !img.naturalWidth) return null;

  const fw = img.width / 2;
  const fh = img.height;
  const cv = document.createElement('canvas');
  cv.width = fw;
  cv.height = fh;
  const cx = cv.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.drawImage(img, 0, 0, fw, fh, 0, 0, fw, fh);
  npc.portraitUrl = cv.toDataURL();
  return npc.portraitUrl;
}

function talkToNpc(npc) {
  if (window.inputLocked || gameOver) return;
  const data = npc.data;
  const st = GameState.npc(data.id);
  const lines = pickNpcLines(data);


  Dialogue.open(`${data.name} — ${data.role}`, lines, {
    portrait: npcPortrait(npc),
    onDone: () => {
      if (!st.rewarded) st.rewarded = giveNpcReward(data) !== false;
      st.talked++;
      window.Expedition?.record('talk', data.id);
    }
  });
}

// Aksi khas tiap NPC (beli makanan, kerja bakti, memancing, dengar cerita)
function runNpcAction(npc, index) {
  if (window.inputLocked || gameOver) return;
  const action = npc.actions && npc.actions[index];
  if (!action) return;
  if (action.minigame) { Minigames.start(action.minigame); return; }

  const now = Date.now();
  if (action.nextAt && now < action.nextAt) {
    showToast('Tunggu sebentar sebelum mengulang.');
    return;
  }

  if (action.effect && action.effect.money < 0 &&
      window.playerStatus && playerStatus.money + action.effect.money < 0) {
    showToast('Uangmu tidak cukup.');
    return;
  }

  action.nextAt = now + (action.cooldown || 10000);
  const parts = applyStatusEffect(action.effect);
  const stat = parts.length ? `<br><span class="toast-stat">${parts.join(', ')}</span>` : '';
  const reward = typeof grantReward === 'function' ? grantReward(action.reward) : '';
  showToast(`${action.msg}${stat}${reward}`);
  window.Expedition?.save();
}

window.npcs = npcs;
window.drawNpcs = drawNpcs;
window.findNearestNpc = findNearestNpc;
window.talkToNpc = talkToNpc;
window.runNpcAction = runNpcAction;
