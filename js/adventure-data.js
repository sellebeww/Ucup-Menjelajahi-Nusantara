/* Shared, serializable definitions for the journal, world and progress rules. */
(function(root) {
  const regions = [
    {id:'Kampung',name:'Kampung Halaman',subtitle:'Di sinilah cerita dimulai',map:{x:1745,y:1435},color:'#96bf89',icon:'⌂',story:'Sumur tua, kebun warga, dan cerita Atok. Tempat pulang setelah perjalanan panjang.'},
    {id:'Kota Tua',name:'Kota Tua',subtitle:'Lorong penuh cerita',map:{x:2975,y:2600},color:'#daa36a',icon:'▥',story:'Dengarkan cerita Mei, bantu pandai besi, dan temukan kain yang menyimpan peta lama.'},
    {id:'Pekuburan Sentosa',name:'Lembah Sentosa',subtitle:'Jejak yang terlupakan',map:{x:3700,y:1990},color:'#a99ac8',icon:'✧',story:'Baca jejak tulang purba dan cari fosil kecil di antara bebatuan. Datang saat terang.'},
    {id:'Rempah Krakatau',name:'Rempah Krakatau',subtitle:'Hangat dari tanah timur',map:{x:4560,y:1620},color:'#d88466',icon:'♨',story:'Anjali merawat rempah di lereng hangat. Gua dan bunga matahari menyimpan cerita.'},
    {id:'Bali',name:'Pesisir Bali',subtitle:'Cerita di ujung ombak',map:{x:1700,y:3030},color:'#76bfc1',icon:'≈',story:'Coba kail di dermaga, racik makanan di tungku, dan dengarkan cerita kampung pesisir.'},
    {id:'Lawang Sewu',name:'Tebing Lawang',subtitle:'Angin membawa kabar',map:{x:4575,y:2670},color:'#acbba0',icon:'⌁',story:'Angin tebing membunyikan bambu tua. Ikuti jalurnya menuju reruntuhan di tenggara.'},
    {id:'Candi Borobudur',name:'Reruntuhan Candi',subtitle:'Misteri di balik batu',map:{x:4738,y:3060},color:'#afad84',icon:'▴',story:'Ukiran batu dan patung penjaga menunggu penjelajah. Siapkan bekal sebelum berangkat.'}
  ];
  const relics = [
    {id:'compass',name:'Kompas Sang Perintis',region:'Kampung',map:{x:1940,y:1530},icon:0,lore:'Jarumnya sedikit berkarat, tetapi selalu menunjuk jalan pulang. Di baliknya terukir: rasa ingin tahu adalah arah terbaik.'},
    {id:'cloth',name:'Peta dalam Tenunan',region:'Kota Tua',map:{x:3090,y:2690},icon:1,lore:'Motif pada kain ini mengikuti garis pulau dan aliran sungai. Seseorang pernah menyimpan perjalanannya lewat sehelai tenunan.'},
    {id:'fossil',name:'Ingatan Laut Purba',region:'Pekuburan Sentosa',map:{x:3680,y:1990},icon:2,lore:'Cangkang yang terjebak dalam batu mengingatkanmu: bahkan tempat yang sunyi pernah menyimpan kehidupan.'},
    {id:'spices',name:'Wangi Tujuh Musim',region:'Rempah Krakatau',map:{x:4610,y:1680},icon:3,lore:'Guci kecil ini menyimpan aroma cengkih dan kayu manis. Penjaganya dulu bertukar resep dengan setiap orang yang singgah.'},
    {id:'shell',name:'Bisikan Samudra',region:'Bali',map:{x:1850,y:3150},icon:4,lore:'Di dekat telinga, cangkang ini seperti menyimpan ombak. Kamu teringat kisah nelayan yang menemukan arah dari suara laut.'},
    {id:'bamboo',name:'Nada dari Tebing',region:'Lawang Sewu',map:{x:4630,y:2640},icon:5,lore:'Bilah bambu bergerak ketika angin lewat. Nada yang sederhana membuat perjalanan panjang terasa lebih ringan.'},
    {id:'lotus',name:'Teratai Penjaga Cerita',region:'Candi Borobudur',map:{x:4820,y:3090},icon:6,lore:'Ukiran teratai sudah dipeluk lumut. Kamu mencatatnya di jurnal dan membiarkannya tetap di tempatnya, untuk penjelajah berikutnya.'}
  ];
  const goal = (type,value,total,label,target) => ({type,value,total,label,target});
  const chapters = [
    {id:'first-steps',title:'Bekal dari rumah',subtitle:'BAB 01 · SEBUAH AWAL',description:'Atok menitipkan sebuah buku kosong. Isi lembar pertamanya dengan percakapan, bekal, dan satu penemuan.',coins:50,xp:25,goals:[goal('talk','atok',1,'Selesaikan percakapan dengan Atok','npc:atok'),goal('harvest',null,3,'Kumpulkan 3 buah','item:it_nanas'),goal('relic','compass',1,'Catat Kompas Sang Perintis','relic:compass')]},
    {id:'sea-calls',title:'Di ujung ombak',subtitle:'BAB 02 · PESISIR',description:'Jalan kayu membawamu ke kampung nelayan. Kenali laut, lalu biarkan Sari mengajarimu menunggu saat yang tepat.',coins:75,xp:40,goals:[goal('visit','Bali',1,'Temukan Pesisir Bali','region:Bali'),goal('win','fishing',1,'Menangkan Kail & Ombak','game:fishing'),goal('relic','shell',1,'Catat Bisikan Samudra','relic:shell')]},
    {id:'spice-route',title:'Rasa yang mempertemukan',subtitle:'BAB 03 · TANAH REMPAH',description:'Ikuti wangi rempah ke timur. Bantu Bang Gori di dapur dan periksa tempat-tempat yang menarik perhatianmu.',coins:100,xp:50,goals:[goal('visit','Rempah Krakatau',1,'Jelajahi Rempah Krakatau','region:Rempah Krakatau'),goal('win','cooking',1,'Menangkan Dapur Rempah','game:cooking'),goal('inspect',null,3,'Periksa 3 tempat berbeda','site:volcano')]},
    {id:'old-stories',title:'Yang disimpan waktu',subtitle:'BAB 04 · JEJAK LAMA',description:'Tidak semua cerita ditulis di kertas. Kirana mengajakmu membaca benda-benda kecil yang tertinggal.',coins:140,xp:75,goals:[goal('relics',null,4,'Catat 4 peninggalan berbeda','next-relic'),goal('win','memory',1,'Menangkan Ingatan Nusantara','game:memory'),goal('day',null,2,'Sambut hari kedua','camp')]},
    {id:'island-friends',title:'Sahabat Nusantara',subtitle:'BAB 05 · PULANG MEMBAWA CERITA',description:'Lengkapi buku Atok. Tujuh wilayah, tujuh jejak, dan irama bambu menjadi kisah yang akhirnya bisa kamu bawa pulang.',coins:250,xp:150,goals:[goal('regions',null,7,'Jelajahi ketujuh wilayah','next-region'),goal('relics',null,7,'Lengkapi 7 catatan peninggalan','next-relic'),goal('win','rhythm',1,'Menangkan Irama Bambu','game:rhythm'),goal('day',null,3,'Capai hari ketiga','camp')]}
  ];
  const fruits=['Cherry','Lemon','Jeruk','Apel','Nanas','Stroberi','Pir','Berry','Semangka','Pisang'];
  const games=['fishing','cooking','memory','rhythm'];
  const route=['Kampung','Bali','Kota Tua','Rempah Krakatau','Pekuburan Sentosa','Lawang Sewu','Candi Borobudur'];
  const data={regions,relics,chapters,fruits,games,route};
  root.AdventureData=data;
  if(typeof module!=='undefined')module.exports=data;
})(typeof window!=='undefined'?window:globalThis);
