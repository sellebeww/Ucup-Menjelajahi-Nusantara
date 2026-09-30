# Ucup — Menjelajah Nusantara

Game petualangan browser berbahasa Indonesia: tujuh wilayah, enam karakter, lima bab cerita, tujuh peninggalan, sistem hari, dan empat minigame. Progres disimpan di browser yang sama menggunakan localStorage. Semua aset dan permainan berjalan lokal tanpa API.

Pratinjau: [layar awal](docs/previews/welcome-desktop.png), [karakter](docs/previews/characters-desktop.png), [tantangan](docs/previews/challenges-desktop.png), [Irama Bambu](docs/previews/rhythm-mobile.png), [game di HP](docs/previews/world-mobile.png), dan [jurnal di HP](docs/previews/journal-mobile.png).

## Menjalankan

```sh
npm install
npm run dev
```

Buka **http://localhost:5501/login.html**. Jika server sudah berjalan, cukup muat ulang halaman. Untuk membuka dari perangkat lain di jaringan yang sama, gunakan alamat IP komputer dengan port 5501. Penyimpanan `localhost`, `127.0.0.1`, dan alamat IP terpisah karena merupakan origin yang berbeda.

## Bermain

- **WASD / panah**: bergerak; **E / Q**: aksi terdekat; **B**: tas.
- **J**: jurnal; **M**: peta dan perjalanan cepat; **G**: tantangan.
- **C**: teman; **T**: istirahat; **Esc**: tutup panel atau jeda.
- Tombol arah dan seluruh aksi tersedia lewat sentuhan pada layar kecil.
- Sari terbuka dengan kemenangan memancing; Bang Gori lewat memasak; Kirana lewat mencocokkan kartu. Atok terbuka lewat Irama Bambu, atau empat wilayah mulai hari kedua. Rimba terbuka lewat enam jenis buah atau lima peninggalan.
- Ikuti lima bab di jurnal. Klik tujuan yang belum selesai untuk menandai arah, membuka tantangan, atau beristirahat. Hadiah setiap bab hanya dapat diambil sekali.
- Catat tujuh peninggalan yang berkilau di dunia. Setiap penemuan memiliki cerita, memberi 20 koin dan 35 XP, serta tetap tercatat pada hari berikutnya.
- Berbicara dengan dua warga berbeda, mengumpulkan tiga buah, dan menyelesaikan satu tantangan memenuhi misi harian. Hadiah hanya dapat diambil sekali per hari.
- Ajakan harian memiliki tujuan wilayah yang berganti setiap hari. Kunjungi tujuannya dan periksa sebuah tempat atau temukan peninggalan pada hari itu untuk mendapat bonus.
- Tidur/berkemah memulihkan tenaga dan memulai hari berikutnya. Buah tumbuh lagi; misi harian direset. Ringkasan hari sebelumnya tersimpan di jurnal.
- Irama Bambu: tekan **1–4** atau sentuh nada yang ditandai saat penunjuk berada di zona emas. Lima dari delapan nada tepat membuka Atok. Isyarat visual tetap tersedia jika suara dimatikan.
- Pulih di rumah mempertahankan progres. Pilihan karakter di layar awal juga tidak menghapus simpanan.

## Perubahan pada kelanjutan ini

- Layar awal bernuansa buku perjalanan, kartu peta, pilihan teman dengan syarat buka, dan tombol lanjut dari simpanan.
- Enam atlas karakter baru, masing-masing 16 pose berjalan; potret dan sprite NPC memakai gaya yang sama. Potret dibuat dari atlas saat runtime dengan avatar lama sebagai cadangan.
- Ilustrasi perjalanan baru pada layar awal, sampul bab, dan kemah; atlas delapan objek untuk peninggalan; indikator kedatangan wilayah dan koleksi penemuan.
- Lima bab dengan hadiah, penanda tujuan, ajakan harian, ringkasan hari, dan progres pembukaan karakter. Aturan progres dimigrasikan otomatis dari simpanan v2 lama.
- Empat minigame beserta hasilnya, peta, teman, kemah, dan HUD responsif. Irama Bambu memiliki suara sintetis ringan dan dapat dimainkan tanpa suara.
- Tombol interaksi dekat objek sekarang tampil. Tombol B bisa menutup tas. Membatalkan dialog tidak lagi menyelesaikan percakapan atau memberi hadiah. Penanda peninggalan yang sudah dicatat disembunyikan.
- Perbaikan posisi awal saat gambar dimuat, koordinat lokasi, jam simpanan saat tengah malam, pemulihan kondisi kehabisan tenaga, dan pengembalian fokus setelah minigame.
- Render dunia dihentikan selama jeda. Timer minigame memakai waktu nyata saat frame rate rendah dan berhenti saat tab tersembunyi.
- Ukuran canvas mengikuti viewport, termasuk ketika beralih dari desktop ke ukuran HP, sehingga antarmuka tidak mengecil otomatis.
- Akses keyboard untuk minimap, label tombol ikon, dukungan pengurangan animasi, dan kontras label di atas awan pada peta.

## Verifikasi

```sh
npm test
```

Tiga belas tes unit menggunakan test runner bawaan Node.js, tanpa dependensi tambahan. Mencakup seluruh bab, syarat buka karakter, klaim hadiah satu kali, migrasi simpanan, penemuan, ajakan harian, simpanan rusak, penyimpanan browser yang diblokir, pergantian hari, serta timer minigame pada frame rate rendah dan tab tersembunyi.

Tes browser membutuhkan Chrome dengan DevTools port 9223 dan server pada 5501. Contoh di macOS:

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9223 --user-data-dir=/tmp/ucup-browser-check
npm run test:browser
```

Tes membuat konteks browser terpisah dan menghapus konteks itu setelah selesai. Simpanan pemain tidak disentuh. Pengujian mencakup masuk game, gerakan, panel, empat kemenangan minigame, animasi semua karakter, aksi bab pertama, pembatalan percakapan, pendekatan yang dapat dipijak untuk setiap peninggalan, simpan/muat, pergantian hari, serta viewport 390 × 844 dan 320 × 640. Posisi pemain diatur sebagai fixture untuk menguji interaksi; input minigame memakai tombol/keyboard pada waktu nyata. Screenshot default berada di `/private/tmp/ucup-checks`; ubah dengan `UCUP_TEST_OUTPUT`. URL dapat diatur melalui `UCUP_TEST_URL` dan `UCUP_DEBUG_URL`.

## Aset

Atlas yang dipakai: `assets/characters/{ucup,sari,gori,kirana,atok,rimba}-walk.png`, masing-masing 4 kolom × 4 baris dengan latar transparan. Baris menunjukkan bawah, kiri, kanan, atas; kolom memuat empat pose langkah. Potret dan strip animasi disiapkan oleh `js/spritesheet.js` dan di-cache.

Ilustrasi: `assets/world/journey.png`. Atlas peninggalan: `assets/world/relics.png`. 
Peta merupakan kepulauan rekaan yang terinspirasi Nusantara.
