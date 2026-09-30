// Objek dunia yang bisa diinteraksi.
// Semua posisi memakai KOORDINAT PETA (piksel di dalam img/nusantara.png).
// Tiap titik sudah dicek: tidak di laut, tidak di dalam tile tabrakan, dan
// tidak tertutup lapisan pepohonan.
//
// Jenis efek yang sengaja dicampur supaya eksplorasi terasa punya konsekuensi:
//   - menambah status  (istirahat, makan, minum, berteduh)
//   - mengurangi status (kerja berat, menggali, tempat angker)
//   - memberi item / uang (panen, memancing, menambang, harta karun)

const INTERACT_RADIUS = 130;

function isSpooky() {
  return GameState.period === 'Night' || GameState.event === 'bloodmoon';
}

const INTERACTABLES = [
  /* ================= KAMPUNG HOME (pulau barat laut) ================= */
  {
    id: 'house_home', type: 'building', name: 'Rumah Panggung', area: 'Kampung',
    map: { x: 1615, y: 1350 },
    desc: 'Rumah panggung beratap biru. Ini rumahmu sendiri.',
    actions: [{ label: 'ISTIRAHAT / HARI BARU', camp: true, effect: { sleep: 20, hygiene: 12 }, cooldown: 15000,
                msg: 'Kamu pulang sebentar, mandi lalu rebahan.' }]
  },
  {
    id: 'well_home', type: 'water', name: 'Sumur Kampung', area: 'Kampung',
    map: { x: 1857, y: 1240 },
    desc: 'Sumur batu tua, airnya masih jernih dan dingin.',
    actions: [
      { label: 'MINUM', effect: { meal: 8 }, cooldown: 7000, msg: 'Air sumurnya segar sekali.' },
      { label: 'CUCI MUKA', effect: { hygiene: 10 }, cooldown: 7000, msg: 'Wajahmu terasa bersih.' }
    ]
  },
  {
    id: 'bench_home', type: 'rest', name: 'Bangku Kampung', area: 'Kampung',
    map: { x: 1862, y: 1372 },
    desc: 'Bangku kayu menghadap kebun warga.',
    actions: [{ label: 'ISTIRAHAT', effect: { sleep: 15, happiness: 4 }, cooldown: 10000,
                msg: 'Kamu duduk sebentar menikmati angin kampung.' }]
  },
  {
    id: 'tree_home', type: 'tree', name: 'Pohon Rindang', area: 'Kampung',
    map: { x: 2010, y: 1210 },
    desc: 'Pohon besar yang sudah ada sebelum kampung ini berdiri.',
    actions: [{ label: 'BERTEDUH', effect: { happiness: 5, sleep: 4 }, cooldown: 9000,
                msg: 'Teduh sekali di bawah pohon ini.' }]
  },
  {
    id: 'kebun_home', type: 'farm', name: 'Kebun Warga', area: 'Kampung',
    map: { x: 2150, y: 1540 },
    desc: 'Petak sayur dan buah milik warga kampung.',
    actions: [{ label: 'PANEN', effect: { sleep: -8, hygiene: -4 }, cooldown: 20000,
                msg: 'Kamu ikut memanen kebun warga.',
                reward: { chance: 0.75, items: ['Nanas', 'Apel', 'Pir', 'Stroberi'],
                          text: 'Warga memberimu hasil panen!', failText: 'Hari ini belum ada yang siap dipanen.' } }]
  },

  /* ================= KOTA TUA ================= */
  {
    id: 'hall_town', type: 'building', name: 'Balai Kota Tua', area: 'Kota Tua',
    map: { x: 3330, y: 2545 },
    desc: 'Bangunan terbesar di kota, tempat warga berkumpul.',
    actions: [{ label: 'MASUK', effect: { happiness: 10, sleep: 5 }, cooldown: 15000,
                msg: 'Di dalam ramai warga bertukar kabar.' }]
  },
  {
    id: 'bench_town', type: 'rest', name: 'Bangku Kota', area: 'Kota Tua',
    map: { x: 3230, y: 2650 },
    desc: 'Bangku kayu di tepi jalan kota tua.',
    actions: [{ label: 'ISTIRAHAT', effect: { sleep: 15, happiness: 4 }, cooldown: 10000,
                msg: 'Kamu istirahat sambil melihat orang lalu-lalang.' }]
  },
  {
    id: 'anvil_town', type: 'work', name: 'Bengkel Pandai Besi', area: 'Kota Tua',
    map: { x: 3420, y: 2660 },
    desc: 'Landasan besi dan palu tukang kota. Pemiliknya menerima tenaga tambahan.',
    actions: [{ label: 'MENEMPA', effect: { money: 28, sleep: -14, hygiene: -10 }, cooldown: 20000,
                msg: 'Kamu membantu menempa seharian. Badan pegal, dompet terisi.' }]
  },
  {
    id: 'sumur_kota', type: 'water', name: 'Sumur Kota', area: 'Kota Tua',
    map: { x: 2815, y: 2125 },
    desc: 'Sumur umum di ujung utara kota tua.',
    actions: [
      { label: 'MINUM', effect: { meal: 8 }, cooldown: 7000, msg: 'Airnya dingin dan menyegarkan.' },
      { label: 'CUCI MUKA', effect: { hygiene: 10 }, cooldown: 7000, msg: 'Debu jalanan hilang dari wajahmu.' }
    ]
  },

  /* ================= PEKUBURAN SENTOSA & SUNGAI ================= */
  {
    id: 'sungai_air', type: 'water', name: 'Tepi Sungai', area: 'Pekuburan Sentosa',
    map: { x: 4020, y: 1660 },
    desc: 'Air sungai mengalir jernih di antara batu-batu.',
    actions: [
      { label: 'MINUM', effect: { meal: 7 }, cooldown: 7000, msg: 'Air sungainya sejuk.' },
      { label: 'CUCI MUKA', effect: { hygiene: 12 }, cooldown: 7000, msg: 'Segar! Lelah perjalanan berkurang.' }
    ]
  },
  {
    id: 'tombstones', type: 'landmark', name: 'Nisan Tua', area: 'Pekuburan Sentosa',
    map: { x: 3700, y: 1350 },
    desc: 'Deretan nisan tanpa nama, ditumbuhi lumut.',
    actions: [{ label: 'PERIKSA', effect: { happiness: 3 }, cooldown: 9000,
                msg: 'Kamu membaca ukiran yang hampir hilang.',
                nightEffect: { happiness: -8 }, nightMsg: 'Gelap begini nisannya terasa mengawasimu. Bulu kudukmu berdiri.' }]
  },
  {
    id: 'bones_grave', type: 'landmark', name: 'Kerangka Raksasa', area: 'Pekuburan Sentosa',
    map: { x: 3600, y: 1990 },
    desc: 'Tulang belulang raksasa tertanam di tanah pekuburan.',
    actions: [{ label: 'PERIKSA', effect: { happiness: 6 }, cooldown: 9000,
                msg: 'Penemuan hebat! Kamu mencatat bentuk tulangnya.',
                nightEffect: { happiness: -10, sleep: -5 }, nightMsg: 'Malam hari tulang ini seperti bergerak... kamu mundur pelan-pelan.' }]
  },
  {
    id: 'sumur_kering', type: 'secret', name: 'Sumur Kering', area: 'Pekuburan Sentosa',
    map: { x: 3830, y: 1800 },
    desc: 'Sumur tanpa air. Dari dalam terdengar gema aneh.',
    actions: [{ label: 'TURUNI', effect: { sleep: -12, hygiene: -8 }, cooldown: 25000,
                msg: 'Kamu turun meraba-raba dasar sumur.',
                reward: { chance: 0.3, items: ['Potion Emas'], money: 20,
                          text: 'Ada yang berkilau di dasar sumur!', failText: 'Hanya lumpur dan daun kering.' } }]
  },
  {
    id: 'shrine', type: 'landmark', name: 'Batu Pemujaan', area: 'Pekuburan Sentosa',
    map: { x: 4020, y: 2030 },
    desc: 'Batu berukir yang masih diberi sesajen oleh warga.',
    actions: [
      { label: 'BERDOA', effect: { happiness: 8 }, cooldown: 12000, msg: 'Kamu memberi hormat. Hatimu jadi tenang.' },
      { label: 'SESAJEN', effect: { money: -10, happiness: 15 }, cooldown: 18000, msg: 'Kamu meletakkan sesajen kecil di atas batu.' }
    ]
  },

  /* ================= REMPAH KRAKATAU (timur laut) ================= */
  {
    id: 'cave_ne', type: 'building', name: 'Gua Rempah', area: 'Rempah Krakatau',
    map: { x: 4735, y: 1600 },
    desc: 'Gua tempat warga menyimpan rempah agar tetap kering.',
    actions: [{ label: 'MASUK', effect: { happiness: 8, sleep: -6 }, cooldown: 15000,
                msg: 'Bau pala dan cengkih memenuhi gua.' }]
  },
  {
    id: 'ore_rock', type: 'work', name: 'Batu Belerang', area: 'Rempah Krakatau',
    map: { x: 4470, y: 1405 },
    desc: 'Bongkahan batu dengan urat belerang oranye yang menyala.',
    actions: [{ label: 'TAMBANG', effect: { money: 22, sleep: -12, hygiene: -8 }, cooldown: 20000,
                msg: 'Kamu mengumpulkan belerang untuk dijual di kota.' }]
  },
  {
    id: 'volcano', type: 'landmark', name: 'Kaki Krakatau', area: 'Rempah Krakatau',
    map: { x: 4500, y: 1170 },
    desc: 'Tanah di sini hangat, asap tipis keluar dari celah batu.',
    actions: [
      { label: 'PERIKSA', effect: { happiness: 7 }, cooldown: 9000, msg: 'Tanah vulkanik, pantas rempah di sini subur.' },
      { label: 'BERDIANG', effect: { sleep: 8, hygiene: -3 }, cooldown: 12000, msg: 'Hangat tanahnya mengusir kantukmu.' }
    ]
  },
  {
    id: 'tree_ne', type: 'tree', name: 'Hutan Timur', area: 'Rempah Krakatau',
    map: { x: 4850, y: 1400 },
    desc: 'Hutan lebat di lereng timur, penuh suara burung.',
    actions: [{ label: 'BERTEDUH', effect: { happiness: 5, sleep: 4 }, cooldown: 9000,
                msg: 'Udara hutan membuat pikiranmu jernih.' }]
  },
  {
    id: 'bunga_matahari', type: 'nature', name: 'Bunga Matahari', area: 'Rempah Krakatau',
    map: { x: 4635, y: 1310 },
    desc: 'Sekuntum bunga matahari besar menghadap ke timur.',
    actions: [{ label: 'PETIK', effect: { happiness: 8 }, cooldown: 20000,
                msg: 'Kamu memetik satu kelopak sebagai kenang-kenangan.' }]
  },

  /* ================= PANTAI SELATAN ================= */
  {
    id: 'beach_shore', type: 'water', name: 'Bibir Pantai', area: 'Pantai Selatan',
    map: { x: 3300, y: 3480 },
    desc: 'Ombak kecil menyapu pasir, angin laut terasa asin.',
    actions: [{ label: 'BERENANG', effect: { hygiene: 15, happiness: 7, sleep: -6 }, cooldown: 12000,
                msg: 'Byur! Badan bersih, hati senang, tapi tenaga terkuras.' }]
  },
  {
    id: 'bintang_laut', type: 'nature', name: 'Bintang Laut', area: 'Pantai Selatan',
    map: { x: 3165, y: 3160 },
    desc: 'Bintang laut oranye terdampar di atas pasir.',
    actions: [{ label: 'PERIKSA', effect: { happiness: 5 }, cooldown: 9000,
                msg: 'Kamu kembalikan bintang laut itu ke air. Rasanya menyenangkan.' }]
  },
  {
    id: 'keranjang_pantai', type: 'secret', name: 'Keranjang Nelayan', area: 'Pantai Selatan',
    map: { x: 2850, y: 3300 },
    desc: 'Keranjang anyaman berisi jaring dan entah apa lagi.',
    actions: [{ label: 'GELEDAH', effect: { hygiene: -3 }, cooldown: 18000,
                msg: 'Kamu mengaduk isi keranjang.',
                reward: { chance: 0.5, items: ['Semangka', 'Jeruk', 'Lemon'],
                          text: 'Ada bekal yang masih layak di dalamnya!', failText: 'Isinya cuma jaring basah.' } }]
  },
  {
    id: 'kendi_pantai', type: 'water', name: 'Kendi Tanah', area: 'Pantai Selatan',
    map: { x: 2720, y: 3415 },
    desc: 'Kendi tanah liat berisi air minum untuk pelaut yang lewat.',
    actions: [{ label: 'MINUM', effect: { meal: 7 }, cooldown: 8000, msg: 'Airnya sejuk meski cuaca panas.' }]
  },

  /* ================= PANTAI BARAT / PULAU TENGKORAK ================= */
  {
    id: 'tengkorak_raja', type: 'landmark', name: 'Tengkorak Raja', area: 'Bali',
    map: { x: 1265, y: 3420 },
    desc: 'Tengkorak raksasa bermahkota, separuh terkubur pasir.',
    actions: [{ label: 'PERIKSA', effect: { happiness: 8 }, cooldown: 10000,
                msg: 'Mahkotanya masih utuh. Kamu mencatat ukirannya.',
                nightEffect: { happiness: -12, sleep: -6 }, nightMsg: 'Rongga matanya seperti menyala. Kamu menjauh cepat-cepat.' }]
  },
  {
    id: 'tumpukan_tulang', type: 'secret', name: 'Tumpukan Tulang', area: 'Bali',
    map: { x: 1210, y: 3120 },
    desc: 'Tulang belulang menumpuk, sebagian tertutup pasir.',
    actions: [{ label: 'GELEDAH', effect: { happiness: -5, hygiene: -6 }, cooldown: 20000,
                msg: 'Kamu mengaduk tumpukan tulang. Tidak enak, tapi penasaran.',
                reward: { chance: 0.45, money: 25, text: 'Ada keping uang lama terselip di sela tulang!',
                          failText: 'Tidak ada apa-apa selain pasir.' } }]
  },
  {
    id: 'tungku_masak', type: 'work', name: 'Tungku Masak', area: 'Bali',
    map: { x: 1780, y: 3385 },
    desc: 'Tungku batu dengan panci besar, masih hangat.',
    actions: [{ label: 'DAPUR REMPAH', minigame: 'cooking', effect: { money: -10, meal: 32, happiness: 5 }, cooldown: 18000,
                msg: 'Kamu memasak bekal sendiri. Nikmat!' }]
  },
  {
    id: 'lapak_ikan', type: 'shop', name: 'Lapak Ikan Asin', area: 'Bali',
    map: { x: 1825, y: 3135 },
    desc: 'Lapak beratap kain dengan ikan asin tergantung rapi.',
    actions: [{ label: 'BELI IKAN', effect: { money: -14, meal: 20 }, cooldown: 12000,
                msg: 'Ikan asinnya gurih sekali.' }]
  },
  {
    id: 'dermaga_barat', type: 'water', name: 'Dermaga Kayu', area: 'Bali',
    map: { x: 1700, y: 2960 },
    desc: 'Dermaga kayu menjorok ke laut, tempat perahu bersandar.',
    actions: [{ label: 'KAIL & OMBAK', minigame: 'fishing', effect: { sleep: -10 }, cooldown: 20000,
                msg: 'Kamu melempar kail dan menunggu...',
                reward: { chance: 0.55, items: ['Potion Hunger', 'Semangka'],
                          text: 'Dapat! Hasil lautnya lumayan.', failText: 'Kailnya kosong. Sabar dulu.' } }]
  },
  {
    id: 'rumah_besar', type: 'building', name: 'Rumah Adat', area: 'Bali',
    map: { x: 1690, y: 3560 },
    desc: 'Rumah adat beratap hijau, terbuka untuk pendatang.',
    actions: [{ label: 'MASUK', effect: { sleep: 18, happiness: 6 }, cooldown: 15000,
                msg: 'Pemilik rumah mempersilakanmu beristirahat.' }]
  },

  /* ================= TANAH TERKUTUK (tenggara) ================= */
  {
    id: 'bangku_tebing', type: 'rest', name: 'Bangku Tebing', area: 'Lawang Sewu',
    map: { x: 4575, y: 2730 },
    desc: 'Bangku kayu di tepi tebing, pemandangannya lepas ke laut.',
    actions: [{ label: 'ISTIRAHAT', effect: { sleep: 16, happiness: 6 }, cooldown: 10000,
                msg: 'Angin tebing menyapu lelahmu.' }]
  },
  {
    id: 'kepala_monster', type: 'landmark', name: 'Kepala Raksasa', area: 'Candi Borobudur',
    map: { x: 4470, y: 3260 },
    desc: 'Kepala batu bertaring sebesar rumah, mulutnya menganga.',
    actions: [{ label: 'INGATAN NUSANTARA', minigame: 'memory', effect: { happiness: -7, sleep: -5 }, cooldown: 12000,
                msg: 'Dari dalam mulutnya berembus angin dingin. Kamu merinding.' }]
  },
  {
    id: 'patung_lich', type: 'landmark', name: 'Patung Penjaga', area: 'Candi Borobudur',
    map: { x: 5080, y: 2830 },
    desc: 'Patung tengkorak bermata hijau, berdiri mengawasi tanah mati.',
    actions: [{ label: 'PERIKSA', effect: { happiness: -8 }, cooldown: 15000,
                msg: 'Matanya seolah mengikuti langkahmu.',
                reward: { chance: 0.4, money: 30, text: 'Di kakinya ada persembahan uang lama.',
                          failText: 'Tidak ada apa pun di kakinya.' } }]
  },
  {
    id: 'nisan_terkutuk', type: 'secret', name: 'Nisan Terkutuk', area: 'Candi Borobudur',
    map: { x: 5040, y: 3190 },
    desc: 'Nisan retak dengan tulisan yang tidak terbaca.',
    actions: [{ label: 'GALI', effect: { hygiene: -12, sleep: -10, happiness: -5 }, cooldown: 25000,
                msg: 'Kamu menggali tanah di depan nisan.',
                reward: { chance: 0.5, items: ['Potion Hygiene', 'Potion Energy'], money: 15,
                          text: 'Ada bungkusan tua berisi ramuan!', failText: 'Hanya akar dan batu.' } }]
  },
  {
    id: 'altar_tengkorak', type: 'secret', name: 'Altar Tengkorak', area: 'Candi Borobudur',
    map: { x: 4900, y: 3270 },
    desc: 'Altar tengkorak raksasa dengan api hijau yang tidak pernah padam.',
    actions: [{ label: 'SENTUH', effect: { happiness: -18, sleep: -12 }, cooldown: 30000,
                msg: 'Api hijaunya membakar nyalimu...',
                reward: { chance: 0.35, items: ['Potion Emas'], money: 40,
                          text: 'Altar itu menjatuhkan hadiah untuk yang berani!',
                          failText: 'Tidak terjadi apa-apa. Hanya rasa takut yang tersisa.' } }]
  },

  /* ================= ITEM YANG BISA DIPUNGUT ================= */
  { id: 'it_nanas',    type: 'item', name: 'Nanas',    area: 'Kampung',          map: { x: 2257, y: 1315 }, item: 'Nanas' },
  { id: 'it_berry',    type: 'item', name: 'Berry',    area: 'Kampung',          map: { x: 2357, y: 1164 }, item: 'Berry' },
  { id: 'it_apel',     type: 'item', name: 'Apel',     area: 'Kota Tua',         map: { x: 2500, y: 2700 }, item: 'Apel' },
  { id: 'it_pisang',   type: 'item', name: 'Pisang',   area: 'Kota Tua',         map: { x: 3700, y: 2382 }, item: 'Pisang' },
  { id: 'it_jeruk',    type: 'item', name: 'Jeruk',    area: 'Rempah Krakatau',  map: { x: 4340, y: 1290 }, item: 'Jeruk' },
  { id: 'it_semangka', type: 'item', name: 'Semangka', area: 'Pantai Selatan',   map: { x: 2960, y: 3050 }, item: 'Semangka' },
  { id: 'it_lemon',    type: 'item', name: 'Lemon',    area: 'Bali',             map: { x: 1500, y: 3200 }, item: 'Lemon' },
  { id: 'it_cherry',   type: 'item', name: 'Cherry',   area: 'Candi Borobudur',  map: { x: 4738, y: 3060 }, item: 'Cherry' }
];

// Item di tanah memakai gambar buah yang sudah ada di folder img/
const worldItemImages = {};
INTERACTABLES.filter(o => o.type === 'item').forEach(o => {
  const def = (window.ITEM_LIBRARY || []).find(i => i.name === o.item);
  const img = new Image();
  img.src = def ? def.img : 'img/placeholder.jpg';
  worldItemImages[o.id] = img;
  o.taken = false;
  o.respawnAt = 0;
});

function getPlayerMapPos() {
  const w = player.width || 40;
  const h = player.height || 60;
  return {
    x: player.position.x - background.position.x + w / 2,
    y: player.position.y - background.position.y + h / 2
  };
}

function mapToScreen(mapPos) {
  return { x: mapPos.x + background.position.x, y: mapPos.y + background.position.y };
}

function findNearestInteractable() {
  const p = getPlayerMapPos();
  let best = null;
  let bestDist = Infinity;

  for (const obj of INTERACTABLES) {
    if (obj.type === 'item' && obj.taken) continue;
    if (obj.type === 'relic' && window.Expedition?.progress.relics.includes(obj.relic)) continue;
    const dist = Math.hypot(obj.map.x - p.x, obj.map.y - p.y);
    if (dist <= INTERACT_RADIUS && dist < bestDist) {
      best = obj;
      bestDist = dist;
    }
  }

  if (typeof findNearestNpc === 'function') {
    const npcHit = findNearestNpc(p);
    if (npcHit && npcHit.dist < bestDist) best = npcHit.npc;
  }
  return best;
}

function respawnWorldItems() {
  // Harvests refresh when Expedition advances to a new day.
}

// Item di tanah dibuat mencolok: ada cahaya berdenyut, lingkaran di tanah,
// kilau kecil yang berputar, dan gambarnya naik-turun.
function drawWorldItems() {
  respawnWorldItems();
  const t = Date.now();
  const bob = Math.sin(t / 380) * 4.5;
  const pulse = 0.5 + Math.sin(t / 420) * 0.5;       // 0..1

  INTERACTABLES.forEach(obj => {
    if (obj.type !== 'item' || obj.taken) return;
    const img = worldItemImages[obj.id];
    if (!img || !img.complete || !img.naturalWidth) return;

    const s = mapToScreen(obj.map);
    if (s.x < -90 || s.y < -90 || s.x > canvas.width + 90 || s.y > canvas.height + 90) return;

    const size = 46;
    const cy = s.y - size / 2 + bob;

    c.save();

    // lingkaran gelap tipis dulu supaya item tetap menonjol di atas rumput terang
    const dark = c.createRadialGradient(s.x, cy, 6, s.x, cy, 40);
    dark.addColorStop(0, 'rgba(40, 24, 8, 0.38)');
    dark.addColorStop(1, 'rgba(40, 24, 8, 0)');
    c.fillStyle = dark;
    c.beginPath();
    c.arc(s.x, cy, 40, 0, Math.PI * 2);
    c.fill();

    // cahaya keemasan berdenyut di belakang item
    const glow = c.createRadialGradient(s.x, cy, 2, s.x, cy, 38 + pulse * 9);
    glow.addColorStop(0, `rgba(255, 250, 220, ${0.55 + pulse * 0.30})`);
    glow.addColorStop(0.4, `rgba(255, 216, 110, ${0.34 + pulse * 0.20})`);
    glow.addColorStop(1, 'rgba(255, 205, 96, 0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(s.x, cy, 38 + pulse * 9, 0, Math.PI * 2);
    c.fill();

    // bayangan + lingkaran penanda di tanah
    c.globalAlpha = 0.28;
    c.fillStyle = '#000';
    c.beginPath();
    c.ellipse(s.x, s.y + 12, 13, 5, 0, 0, Math.PI * 2);
    c.fill();

    c.globalAlpha = 0.55 + pulse * 0.35;
    c.strokeStyle = '#ffd76a';
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(s.x, s.y + 12, 15 + pulse * 4, 6 + pulse * 1.6, 0, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;

    // gambar itemnya
    c.drawImage(img, s.x - size / 2, cy - size / 2, size, size);

    // panah kecil melayang di atas item supaya terlihat dari jauh
    const ay = cy - size / 2 - 12 - pulse * 3;
    c.globalAlpha = 0.85;
    c.fillStyle = '#ffd76a';
    c.strokeStyle = 'rgba(60,35,10,.85)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(s.x, ay + 9);
    c.lineTo(s.x - 7, ay);
    c.lineTo(s.x + 7, ay);
    c.closePath();
    c.stroke();
    c.fill();
    c.globalAlpha = 1;

    // kilau kecil berputar mengelilingi item
    for (let i = 0; i < 3; i++) {
      const a = t / 900 + (i * Math.PI * 2) / 3;
      const sx = s.x + Math.cos(a) * 24;
      const sy = cy + Math.sin(a) * 11;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t / 300 + i));
      c.globalAlpha = tw;
      c.fillStyle = '#fff6cf';
      c.beginPath();
      c.arc(sx, sy, 1.8, 0, Math.PI * 2);
      c.fill();
    }

    c.restore();
  });
}

// Penanda untuk SEMUA yang bisa diinteraksi di sekitar player, supaya terlihat
// jelas mana orang/benda yang bisa didekati. Yang paling dekat diberi tanda penuh.
const NEARBY_RADIUS = 340;

function markerAlpha(dist) {
  if (dist > NEARBY_RADIUS) return 0;
  return 0.25 + 0.55 * (1 - dist / NEARBY_RADIUS);
}

function drawObjectMarker(s, alpha, active) {
  const t = Date.now() / 500;
  const y = s.y - 46 + Math.sin(t) * 2.5;
  const r = active ? 9 : 6;

  c.save();
  c.globalAlpha = alpha;
  c.translate(s.x, y);
  c.rotate(Math.PI / 4);
  c.fillStyle = active ? '#ffd76a' : '#ffe9b0';
  c.strokeStyle = 'rgba(48,28,8,.9)';
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(-r / 2, -r / 2, r, r, 2);
  c.fill();
  c.stroke();
  c.restore();
}

function drawNpcMarker(s, alpha, active) {
  const t = Date.now() / 500;
  const y = s.y - 78 + Math.sin(t) * 2.5;
  const w = active ? 22 : 17;
  const h = w * 0.72;

  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = active ? '#ffd76a' : '#ffe9b0';
  c.strokeStyle = 'rgba(48,28,8,.9)';
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(s.x - w / 2, y - h / 2, w, h, 4);
  c.fill();
  c.stroke();
  // ekor balon bicara
  c.beginPath();
  c.moveTo(s.x - 3, y + h / 2 - 1);
  c.lineTo(s.x + 1, y + h / 2 + 6);
  c.lineTo(s.x + 5, y + h / 2 - 1);
  c.closePath();
  c.fill();
  // tiga titik
  c.fillStyle = 'rgba(48,28,8,.9)';
  for (let i = -1; i <= 1; i++) {
    c.beginPath();
    c.arc(s.x + i * (w * 0.24), y, 1.5, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function drawNearbyMarkers(active) {
  const p = getPlayerMapPos();

  INTERACTABLES.forEach(obj => {
    if (obj.type === 'item') return;                 // item sudah punya cahaya sendiri
    if (obj.type === 'relic' && window.Expedition?.progress.relics.includes(obj.relic)) return;
    const dist = Math.hypot(obj.map.x - p.x, obj.map.y - p.y);
    const a = markerAlpha(dist);
    if (a <= 0) return;
    const s = mapToScreen(obj.map);
    if (s.x < -60 || s.y < -60 || s.x > canvas.width + 60 || s.y > canvas.height + 60) return;
    drawObjectMarker(s, a, active === obj);
  });

  if (typeof npcs !== 'undefined') {
    npcs.forEach(npc => {
      const dist = Math.hypot(npc.map.x - p.x, npc.map.y - p.y);
      const a = markerAlpha(dist);
      if (a <= 0) return;
      const s = mapToScreen(npc.map);
      if (s.x < -60 || s.y < -60 || s.x > canvas.width + 60 || s.y > canvas.height + 60) return;
      drawNpcMarker(s, a, active === npc);
    });
  }
}

function drawInteractHighlight(target) {
  if (!target) return;
  const map = target.map;
  if (!map) return;
  const s = mapToScreen(map);
  const t = Date.now() / 400;
  const pulse = 1 + Math.sin(t) * 0.12;
  const r = 16 * pulse;

  c.save();
  c.globalAlpha = 0.85;
  c.strokeStyle = '#ffe08a';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(s.x, s.y + 26, r, r * 0.4, 0, 0, Math.PI * 2);
  c.stroke();

  const ay = s.y - 40 + Math.sin(t * 1.6) * 3;
  c.fillStyle = '#ffe08a';
  c.beginPath();
  c.moveTo(s.x, ay + 10);
  c.lineTo(s.x - 7, ay);
  c.lineTo(s.x + 7, ay);
  c.closePath();
  c.fill();
  c.restore();
}

// Hadiah berpeluang: bisa berupa item, uang, atau gagal
function grantReward(reward) {
  if (!reward) return '';
  if (Math.random() > (reward.chance ?? 1)) return `<br><span class="toast-fail">${reward.failText || 'Tidak dapat apa-apa.'}</span>`;

  const lines = [];
  if (reward.items && reward.items.length) {
    const pick = reward.items[Math.floor(Math.random() * reward.items.length)];
    const def = (window.ITEM_LIBRARY || []).find(i => i.name === pick);
    if (def && addItemToInventory({ ...def })) { lines.push(`${pick} masuk tas`); if (!pick.startsWith('Potion')) window.Expedition?.record('collect', pick); }
  }
  if (reward.money) {
    applyStatusEffect({ money: reward.money });
    lines.push(`+${reward.money} Koin`);
  }
  if (!lines.length) return `<br><span class="toast-fail">Tasmu penuh, hadiahnya terlewat.</span>`;
  return `<br><span class="toast-reward">${reward.text} (${lines.join(', ')})</span>`;
}

function pickUpItem(obj) {
  const def = (window.ITEM_LIBRARY || []).find(i => i.name === obj.item);
  if (!def) return;
  if (addItemToInventory({ ...def }) === false) return;
  obj.taken = true;
  obj.respawnAt = Infinity;
  window.Expedition?.record('collect', obj.item);
  showToast(`${obj.item} masuk ke tas!`);
}

function runInteractableAction(obj, index) {
  if (!obj || window.inputLocked || gameOver) return;

  if (obj.type === 'item') {
    pickUpItem(obj);
    return;
  }

  const action = obj.actions && obj.actions[index];
  if (!action) return;
  if (action.relic) { Adventure.discover(action.relic); return; }
  if (action.camp) { Expedition.open('camp'); return; }
  if (action.minigame) { Minigames.start(action.minigame); return; }
  if (action.effect?.money < 0 && playerStatus.money + action.effect.money < 0) { showToast('Koinmu belum cukup.'); return; }

  const now = Date.now();
  if (action.nextAt && now < action.nextAt) {
    showToast('Belum bisa diulang, tunggu sebentar.');
    return;
  }
  action.nextAt = now + (action.cooldown || 6000);

  // sebagian tempat berubah efeknya saat malam / blood moon
  const spooky = isSpooky() && action.nightEffect;
  const effect = spooky ? action.nightEffect : action.effect;
  const msg = spooky ? (action.nightMsg || action.msg) : action.msg;

  const parts = applyStatusEffect(effect);
  window.Expedition?.record('inspect', obj.id);
  const stat = parts.length ? `<br><span class="toast-stat">${parts.join(', ')}</span>` : '';
  const reward = grantReward(action.reward);
  showToast(`${msg}${stat}${reward}`);
  window.Expedition?.save();
}

window.INTERACTABLES = INTERACTABLES;
window.INTERACT_RADIUS = INTERACT_RADIUS;
window.getPlayerMapPos = getPlayerMapPos;
window.mapToScreen = mapToScreen;
window.findNearestInteractable = findNearestInteractable;
window.drawWorldItems = drawWorldItems;
window.drawInteractHighlight = drawInteractHighlight;
window.drawNearbyMarkers = drawNearbyMarkers;
window.runInteractableAction = runInteractableAction;
window.grantReward = grantReward;
