const CHARACTERS = [
  { id: 'ucup', name: 'Ucup', title: 'Langkah pertama', bio: 'Ransel kecil, rasa ingin tahu besar. Setiap jalan menyimpan cerita yang ingin ia temukan.', color: '#e9ad4b', perk: 'Langkah 10% lebih cepat', speed: 1.1, unlock: 'Teman pertamamu', row: 0 },
  { id: 'sari', name: 'Sari', title: 'Sahabat samudra', bio: 'Membaca ombak seperti membaca buku. Sari selalu punya cerita dari pesisir.', color: '#68beb5', perk: 'Status berkurang 20% lebih lambat', drain: .8, unlock: 'Menangkan minigame Kail & Ombak', row: 1 },
  { id: 'gori', name: 'Bang Gori', title: 'Peracik kebahagiaan', bio: 'Senyumnya sehangat dapurnya. Bagi Gori, petualangan terbaik dimulai dari sepiring makanan.', color: '#dc835e', perk: 'Makanan memulihkan 25% lebih banyak', food: 1.25, unlock: 'Menangkan minigame Dapur Rempah', row: 2 },
  { id: 'kirana', name: 'Kirana', title: 'Penjaga cerita', bio: 'Ukiran tua dan jejak terlupakan adalah petunjuk baginya. Tak ada detail yang luput.', color: '#a393d5', perk: 'Hadiah koin minigame +20%', coins: 1.2, unlock: 'Menangkan minigame Ingatan Nusantara', row: 3 },
  { id: 'atok', name: 'Atok', title: 'Seribu perjalanan', bio: 'Langkahnya tenang, ceritanya panjang. Ia tahu bahwa perjalanan tak pernah mengenal usia.', color: '#7cab83', perk: 'Status berkurang 25% lebih lambat', drain: .75, unlock: 'Menangkan Irama Bambu atau temukan 4 wilayah pada hari ke-2', row: 4 },
  { id: 'rimba', name: 'Rimba', title: 'Si kecil pemberani', bio: 'Seekor kucing dengan jubah hijau dan nyali sebesar pulau. Selalu penasaran pada benda berkilau.', color: '#e7a576', perk: 'Langkah 20% lebih cepat', speed: 1.2, unlock: 'Kumpulkan 6 jenis buah atau catat 5 peninggalan', row: 5 }
].map(ch => ({ ...ch, available: true, avatar: `avatars/avatar${ch.row + 1}.png`, sprite: { type: 'walk', src: `assets/characters/${ch.id}-walk.png`, rows: 4, cols: 4, frames: 4, scale: 1, directions: { down: 0, left: 1, right: 2, up: 3 } } }));
function getCharacter(id) { return CHARACTERS.find(ch => ch.id === id) || null; }
function characterUnlocked(id) {
  const progress = window.Expedition?.progress || new ExpeditionProgress(GameStorage.read()?.progress);
  return progress.unlocked.includes(id);
}
function getPlayableCharacters() { return CHARACTERS.filter(ch => characterUnlocked(ch.id)); }
function getDefaultCharacter() { return CHARACTERS[0]; }
Object.assign(window, { CHARACTERS, getCharacter, characterUnlocked, getPlayableCharacters, getDefaultCharacter });
