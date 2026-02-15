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
    initialPrompt: `Mulai petualangan fantasi baru. Pemain adalah seorang petualang pemula yang baru terbangun di hutan kuno misterius tanpa ingatan. Cerita dimulai dengan penemuan sesuatu yang tidak biasa. Quest awal: "Temukan siapa dirimu dan bagaimana kamu bisa sampai di hutan ini."`,
  },
  {
    id: 'horror',
    name: 'Horor',
    description: 'Teror, misteri gelap, dan ketakutan',
    initialPrompt: `Mulai petualangan horor baru. Pemain terbangun di sebuah rumah sakit tua yang ditinggalkan. Lampu berkedip-kedip. Ada suara langkah kaki di koridor kosong. Pintu keluar terkunci dari luar. Quest awal: "Temukan jalan keluar dari rumah sakit terkutuk ini."`,
  },
  {
    id: 'adventure',
    name: 'Petualangan',
    description: 'Eksplorasi, harta karun, dan bahaya',
    initialPrompt: `Mulai petualangan epik baru. Pemain adalah seorang pemburu harta karun yang menemukan peta kuno menuju harta legendaris di pulau misterius. Kapal baru saja mendarat di pantai yang belum terjamah. Quest awal: "Ikuti petunjuk peta dan temukan harta karun legendaris."`,
  },
  {
    id: 'scifi',
    name: 'Sci-Fi',
    description: 'Luar angkasa, teknologi, dan masa depan',
    initialPrompt: `Mulai petualangan fiksi ilmiah baru. Pemain adalah awak pesawat luar angkasa yang terbangun dari cryo-sleep. Sistem alarm berbunyi — kapal sedang terombang-ambing di orbit planet asing. Kru lainnya masih tertidur. Quest awal: "Selamatkan kapal dan kru dari bahaya yang mengancam."`,
  },
  {
    id: 'mystery',
    name: 'Misteri',
    description: 'Teka-teki, investigasi, dan rahasia',
    initialPrompt: `Mulai petualangan misteri baru. Pemain adalah seorang detektif yang dipanggil ke sebuah mansion megah. Pemiliknya ditemukan tewas di ruang kerjanya yang terkunci dari dalam. Semua tamu masih ada di rumah. Quest awal: "Ungkap kebenaran di balik kematian misterius sang pemilik mansion."`,
  },
  {
    id: 'romance',
    name: 'Romansa',
    description: 'Cinta, drama, dan hubungan',
    initialPrompt: `Mulai petualangan romansa baru. Pemain baru saja pindah ke kota kecil yang indah di pinggir pantai untuk memulai hidup baru. Di hari pertama, nasib mempertemukannya dengan seseorang yang misterius di toko buku tua. Quest awal: "Temukan kebahagiaan di kota baru ini."`,
  },
  {
    id: 'pirate',
    name: 'Bajak Laut',
    description: 'Lautan, kapal, dan perampok laut',
    initialPrompt: `Mulai petualangan bajak laut baru. Pemain adalah seorang pelaut muda yang diselamatkan oleh kru bajak laut setelah kapalnya tenggelam. Kapten menawarkan pilihan: bergabung atau ditinggal di pulau terpencil. Quest awal: "Buktikan dirimu layak menjadi bagian dari kru."`,
  },
  {
    id: 'postapocalyptic',
    name: 'Pasca-Apokaliptik',
    description: 'Dunia hancur, bertahan hidup',
    initialPrompt: `Mulai petualangan pasca-apokaliptik baru. Pemain keluar dari bunker bawah tanah setelah 10 tahun bersembunyi. Dunia di atas sudah berubah total — reruntuhan kota, tanaman raksasa yang aneh, dan makhluk bermutasi. Persediaan makanan habis. Quest awal: "Temukan sumber makanan dan tempat berlindung yang aman."`,
  },
  {
    id: 'mythology',
    name: 'Mitologi',
    description: 'Dewa-dewa, legenda, dan kekuatan kuno',
    initialPrompt: `Mulai petualangan mitologi baru. Pemain adalah seorang manusia biasa yang tiba-tiba ditarik ke dunia para dewa. Ternyata ia adalah keturunan terakhir dari pahlawan legendaris. Para dewa sedang berperang dan pemain harus memilih pihak. Quest awal: "Temui dewan para dewa dan tentukan takdirmu."`,
  },
  {
    id: 'survival',
    name: 'Survival',
    description: 'Bertahan hidup di alam liar',
    initialPrompt: `Mulai petualangan survival baru. Pemain adalah satu-satunya yang selamat dari kecelakaan pesawat di gunung terpencil. Cuaca semakin dingin, malam hampir tiba, dan tidak ada sinyal. Hanya ada puing-puing pesawat dan hutan lebat di sekitar. Quest awal: "Bertahan hidup sampai tim penyelamat datang."`,
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    description: 'Mesin uap, tembaga, dan penemuan',
    initialPrompt: `Mulai petualangan steampunk baru. Pemain adalah seorang penemu muda di kota penuh mesin uap dan balon udara. Penemuannya yang terbaru — mesin waktu portabel — baru saja dicuri oleh organisasi misterius. Quest awal: "Lacak organisasi pencuri dan rebut kembali mesin waktumu."`,
  },
  {
    id: 'samurai',
    name: 'Samurai',
    description: 'Bushido, kehormatan, dan pertempuran',
    initialPrompt: `Mulai petualangan samurai baru. Pemain adalah ronin — samurai tanpa tuan — yang mengembara di Jepang era Edo. Di sebuah desa kecil, penduduk memohon pertolongan: sekelompok bandit mengancam akan menghancurkan desa. Quest awal: "Lindungi desa dari ancaman bandit."`,
  },
  {
    id: 'underwater',
    name: 'Dunia Bawah Laut',
    description: 'Samudra dalam, keajaiban laut',
    initialPrompt: `Mulai petualangan bawah laut baru. Pemain adalah seorang penyelam yang menemukan gerbang kuno di dasar laut. Gerbang itu membawa ke kota bawah laut yang tersembunyi, dihuni makhluk cerdas yang belum pernah dikenal manusia. Quest awal: "Jelajahi kota bawah laut dan temui penduduknya."`,
  },
  {
    id: 'detective',
    name: 'Detektif Noir',
    description: 'Kriminal, penyelidikan, dunia gelap',
    initialPrompt: `Mulai petualangan detektif noir baru. Pemain adalah detektif swasta di kota besar yang korup. Seorang wanita misterius datang ke kantor malam-malam, meminta bantuan mencari suaminya yang hilang. Tapi ada yang tidak beres — semua petunjuk mengarah ke bos mafia terbesar di kota. Quest awal: "Temukan keberadaan suami yang hilang."`,
  },
  {
    id: 'comedy',
    name: 'Komedi',
    description: 'Lucu, absurd, dan menghibur',
    initialPrompt: `Mulai petualangan komedi baru. Pemain adalah pegawai kantor biasa yang tidak sengaja membuka portal dimensi lain lewat microwave kantor. Sekarang ada naga mini yang bersarang di ruang meeting, dan bos besar datang inspeksi besok. Quest awal: "Sembunyikan naga dan perbaiki portal sebelum bos datang."`,
  },
  {
    id: 'zombie',
    name: 'Zombie',
    description: 'Wabah zombie, bertahan hidup',
    initialPrompt: `Mulai petualangan zombie baru. Pemain terbangun di apartemennya mendengar suara teriakan dan kaca pecah dari luar. TV masih menyala — siaran darurat mengumumkan wabah yang mengubah orang menjadi zombie. Jalanan sudah kacau. Quest awal: "Keluar dari kota dan cari tempat aman."`,
  },
];

export const INITIAL_PROMPT = `Mulai petualangan fantasi baru untuk pemain. PENTING: Semua teks cerita, pilihan, quest, dan item inventory HARUS dalam Bahasa Indonesia.

Pemain adalah seorang petualang pemula yang baru saja terbangun di hutan kuno yang misterius tanpa ingatan bagaimana ia bisa sampai di sana. Cerita harus dimulai dengan penemuan sesuatu yang tidak biasa yang membawanya ke sebuah jalan.

Quest awal: "Temukan siapa dirimu dan bagaimana kamu bisa sampai di hutan ini."`;
