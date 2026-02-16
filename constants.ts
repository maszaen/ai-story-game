export const ART_STYLE_PROMPT = "in a vibrant, detailed digital painting style with a hint of Ghibli-inspired fantasy, maintaining consistent character designs throughout.";

export interface Genre {
  id: string;
  name: string;
  description: string;
  initialPrompt: string;
}

export const GENRES: Genre[] = [
  {
    id: 'fantasy',
    name: 'Fantasi',
    description: 'Kerajaan, sihir, dan makhluk legendaris',
    initialPrompt: `Genre: FANTASI (kerajaan, sihir, makhluk legendaris, dunia magis).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "terbangun di hutan tanpa ingatan" atau "desa diserang monster". Ciptakan premis yang belum pernah ada — lokasi unik, karakter dengan latar belakang tak terduga, dan konflik pembuka yang mengejutkan. Buat pemain langsung penasaran dari kalimat pertama.`,
  },
  {
    id: 'horror',
    name: 'Horor',
    description: 'Teror, misteri gelap, dan ketakutan',
    initialPrompt: `Genre: HOROR (teror psikologis, misteri gelap, ketakutan, supernatural).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "rumah sakit tua", "rumah berhantu", atau "terbangun di tempat gelap". Ciptakan premis horor yang segar dan tak terduga — setting yang tidak biasa untuk horor, ancaman yang unik, dan atmosfer mencekam dari awal. Buat pemain merinding tapi penasaran.`,
  },
  {
    id: 'adventure',
    name: 'Petualangan',
    description: 'Eksplorasi, harta karun, dan bahaya',
    initialPrompt: `Genre: PETUALANGAN (eksplorasi, harta karun, bahaya, dunia yang luas).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "menemukan peta harta karun" atau "mendarat di pulau misterius". Ciptakan premis petualangan yang segar — alasan unik untuk berpetualang, lokasi awal yang tak terduga, dan hook yang membuat pemain ingin menjelajah lebih jauh.`,
  },
  {
    id: 'scifi',
    name: 'Sci-Fi',
    description: 'Luar angkasa, teknologi, dan masa depan',
    initialPrompt: `Genre: SCI-FI (luar angkasa, teknologi canggih, masa depan, alien).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "terbangun dari cryo-sleep" atau "alarm kapal berbunyi". Ciptakan premis sci-fi yang segar — bisa di planet, stasiun luar angkasa, koloni, cyberpunk city, atau dimensi lain. Karakter utama bisa siapa saja, bukan hanya astronot. Buat pemain kagum dengan dunia yang kamu ciptakan.`,
  },
  {
    id: 'mystery',
    name: 'Misteri',
    description: 'Teka-teki, investigasi, dan rahasia',
    initialPrompt: `Genre: MISTERI (teka-teki, investigasi, rahasia tersembunyi, plot twist).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "pembunuhan di mansion" atau "mayat di ruangan terkunci". Ciptakan misteri yang segar — bisa tentang hilangnya sesuatu yang aneh, konspirasi kecil yang berkembang besar, atau kejanggalan sehari-hari yang ternyata menyimpan rahasia besar.`,
  },
  {
    id: 'romance',
    name: 'Romansa',
    description: 'Cinta, drama, dan hubungan',
    initialPrompt: `Genre: ROMANSA (cinta, drama emosional, hubungan, perasaan mendalam).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "pindah ke kota kecil" atau "bertemu di toko buku/kafe". Ciptakan premis romansa yang segar dan tak terduga — situasi unik yang mempertemukan karakter, setting yang tidak biasa untuk kisah cinta, dan chemistry yang terasa dari awal.`,
  },
  {
    id: 'pirate',
    name: 'Bajak Laut',
    description: 'Lautan, kapal, dan perampok laut',
    initialPrompt: `Genre: BAJAK LAUT (lautan luas, kapal layar, perampok laut, harta karun, pelabuhan eksotis).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "diselamatkan oleh bajak laut" atau "bergabung dengan kru kapal". Ciptakan premis bajak laut yang segar — bisa dari sudut pandang tak terduga, di lautan yang berbeda, dengan motivasi yang unik untuk berlayar.`,
  },
  {
    id: 'postapocalyptic',
    name: 'Pasca-Apokaliptik',
    description: 'Dunia hancur, bertahan hidup',
    initialPrompt: `Genre: PASCA-APOKALIPTIK (dunia setelah kehancuran, bertahan hidup, reruntuhan peradaban).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "keluar dari bunker" atau "terbangun setelah bencana". Ciptakan apokalips yang unik — penyebab kehancuran yang tak biasa, masyarakat baru yang terbentuk, dan situasi awal yang segar. Bisa sudah bertahun-tahun setelah kehancuran dengan peradaban baru yang aneh.`,
  },
  {
    id: 'mythology',
    name: 'Mitologi',
    description: 'Dewa-dewa, legenda, dan kekuatan kuno',
    initialPrompt: `Genre: MITOLOGI (dewa-dewa, legenda kuno, kekuatan supernatural, dunia mitos).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "keturunan dewa yang baru sadar" atau "ditarik ke dunia dewa". Ciptakan premis mitologi yang segar — bisa dari mitologi manapun (Yunani, Nordik, Asia, Afrika, dll), dengan twist modern atau perspektif unik. Campur berbagai mitologi jika mau.`,
  },
  {
    id: 'survival',
    name: 'Survival',
    description: 'Bertahan hidup di alam liar',
    initialPrompt: `Genre: SURVIVAL (bertahan hidup, alam liar, tantangan fisik dan mental, isolasi).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "kecelakaan pesawat di gunung" atau "tersesat di hutan". Ciptakan situasi survival yang segar — bisa di bioma apapun (gurun, tundra, lautan, gua bawah tanah, kota yang ditinggalkan), dengan penyebab situasi yang unik.`,
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    description: 'Mesin uap, tembaga, dan penemuan',
    initialPrompt: `Genre: STEAMPUNK (mesin uap, teknologi Victoria, penemuan, balon udara, roda gigi tembaga).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "penemu yang penemuannya dicuri". Ciptakan dunia steampunk yang kaya dan segar — kota unik, profesi tak biasa, konflik yang melibatkan teknologi uap dengan cara kreatif.`,
  },
  {
    id: 'samurai',
    name: 'Samurai',
    description: 'Bushido, kehormatan, dan pertempuran',
    initialPrompt: `Genre: SAMURAI (bushido, kehormatan, pedang katana, Jepang feodal, pertempuran).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "ronin yang melindungi desa" atau "balas dendam atas klan yang dibantai". Ciptakan premis samurai yang segar — bisa dari sudut pandang tak biasa, dengan konflik moral yang kompleks, di setting Jepang yang detail dan otentik.`,
  },
  {
    id: 'underwater',
    name: 'Dunia Bawah Laut',
    description: 'Samudra dalam, keajaiban laut',
    initialPrompt: `Genre: DUNIA BAWAH LAUT (samudra dalam, keajaiban laut, peradaban bawah air, makhluk laut).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "penyelam menemukan kota bawah laut". Ciptakan premis bawah laut yang segar — bisa dari perspektif penduduk bawah laut, ekspedisi ilmiah yang menemukan sesuatu aneh, atau dunia di mana laut dan darat punya hubungan unik.`,
  },
  {
    id: 'detective',
    name: 'Detektif Noir',
    description: 'Kriminal, penyelidikan, dunia gelap',
    initialPrompt: `Genre: DETEKTIF NOIR (kriminal, penyelidikan, dunia gelap, moral abu-abu, kota korup).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "wanita misterius datang ke kantor detektif" atau "kasus orang hilang". Ciptakan kasus noir yang segar — bisa dimulai dari situasi yang tampak biasa tapi berkembang menjadi gelap, dengan karakter yang penuh lapisan.`,
  },
  {
    id: 'comedy',
    name: 'Komedi',
    description: 'Lucu, absurd, dan menghibur',
    initialPrompt: `Genre: KOMEDI (lucu, absurd, menghibur, situasi konyol, humor cerdas).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "portal dimensi dari microwave". Ciptakan premis komedi yang segar dan benar-benar lucu — situasi absurd yang escalate dengan cepat, karakter eksentrik, dan humor yang membuat pemain tertawa dari awal.`,
  },
  {
    id: 'zombie',
    name: 'Zombie',
    description: 'Wabah zombie, bertahan hidup',
    initialPrompt: `Genre: ZOMBIE (wabah zombie, bertahan hidup, kelompok survivor, dunia yang runtuh).
Buat cerita pembuka yang 100% UNIK dan ORIGINAL. DILARANG menggunakan skenario klise seperti "terbangun dan melihat zombie di luar jendela" atau "siaran darurat di TV". Ciptakan premis zombie yang segar — mungkin sudah lama setelah wabah dengan komunitas baru, atau perspektif unik tentang awal wabah, atau twist pada konsep zombie itu sendiri.`,
  },
];

export const INITIAL_PROMPT = `Mulai petualangan fantasi baru untuk pemain. PENTING: Semua teks cerita, pilihan, quest, dan item inventory HARUS dalam Bahasa Indonesia.

Pemain adalah seorang petualang pemula yang baru saja terbangun di hutan kuno yang misterius tanpa ingatan bagaimana ia bisa sampai di sana. Cerita harus dimulai dengan penemuan sesuatu yang tidak biasa yang membawanya ke sebuah jalan.

Quest awal: "Temukan siapa dirimu dan bagaimana kamu bisa sampai di hutan ini."`;
