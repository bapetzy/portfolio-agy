export type StudioAccent = 'vermilion' | 'cobalt' | 'charcoal' | 'mint'

export interface CuratedProject {
  id: string
  index: string
  accent: StudioAccent
  title: string
  year: string
  status: string
  category: string
  role: string
  summary: string
  narrative: string
  architecturePoints: readonly string[]
  engineeringHighlight: string
  stack: readonly string[]
  maquetteIdea: string
  sourceFolder: string
  sourceLabel: string
}

export interface CapabilityPillar {
  id: string
  accent: Exclude<StudioAccent, 'charcoal'>
  title: string
  description: string
  tools: readonly string[]
}

export const PORTFOLIO_CONTENT = {
  brand: {
    name: 'Portfolio_Agy',
    atelierTitle: 'Atelier Kertas & Cahaya',
    subtitle: 'Software Engineering & Creative Frontend',
  },
  intro: {
    kicker: '01 · Intro',
    title: 'Rekayasa sistem presisi, disajikan dengan cahaya dan bentuk yang hidup.',
    titleLead: 'Rekayasa sistem presisi, disajikan dengan',
    titleAccent: 'cahaya & bentuk',
    titleTail: 'yang hidup.',
    lead: 'Portofolio eksperimental ini merangkum karya simulasi, arsitektur frontend, dan grafika WebGL pilihan di atas panggung maket interaktif yang terang, responsif, dan ringkas.',
    studioMeta: ['Atelier Sunlit 3D', '4 Studi Interaktif', 'Zero-Alloc WebGL'] as const,
    ctaLabel: 'Telusuri Karya Terkurasi',
  },
  works: {
    kicker: '02 · Karya & Eksperimen',
    title: 'Empat Studi Pilihan dari Laboratorium Eksperimen',
    lead: 'Setiap karya dipilih karena kedalaman rekayasanya—dari simulasi cellular automata nol-alokasi hingga koreografi shader berbasis scroll.',
    interactionHint3D:
      'Arahkan kursor atau klik langsung maket di panggung 3D, atau gunakan daftar & tombol panah.',
    interactionHint2D:
      'Mode 2D aktif — telusuri keempat studi pilihan menggunakan daftar atau tombol panah keyboard.',
    keyboardHint: 'Panah kiri/kanan berpindah karya · Esc menutup dossier',
    items: [
      {
        id: 'salt-and-ember',
        index: '01',
        accent: 'vermilion',
        title: 'Salt & Ember',
        year: '2026',
        status: 'Teruji · 47 unit + 13 E2E',
        category: 'Emergent Physics & Creative Simulation',
        role: 'Creator & Simulation Engineer',
        summary:
          'Sandbox toples kaca tertutup berbasis cellular automata (172 × 230 sel) di mana 30 material dan 25 fenomena cuaca—penguapan, awan, hujan, pelangi, embun beku, hingga petir—muncul organik dari aturan suhu, gravitasi, dan cahaya tanpa skrip.',
        narrative:
          'Tantangan utamanya adalah menjaga 30 jenis material saling bereaksi dalam frame-time di bawah 2 ms tanpa jeda garbage collection, sekaligus memastikan konservasi air di dalam toples tertutup tetap presisi.',
        architecturePoints: [
          'Grid 172 × 230 sel dengan loop per-sel zero-allocation (~1,2 ms/tick) dan budget adaptif 2–7 ms/frame.',
          'Raycast cahaya lampu nyata dan difusi panas antar sel yang memicu kondensasi, awan, serta embun beku.',
          'Renderer Canvas 2D 4 lapis terpisah (butiran tajam, densitas uap kabur, pendar api, dan lintasan hujan/petir).',
        ],
        engineeringHighlight:
          'Terverifikasi 47 unit test (termasuk skenario otomatis untuk seluruh 25 fenomena) + 13 Playwright E2E test.',
        stack: ['TypeScript', 'Vite', 'Canvas 2D', 'Vitest', 'Playwright'],
        maquetteIdea:
          'Silinder porselen-kertas bertingkat dengan cincin aksen marigold dan tudung lampu coral miring yang memutar.',
        sourceFolder: 'salt-and-ember',
        sourceLabel: 'Arsip Lokal · Projects-Experiments/salt-and-ember',
      },
      {
        id: 'queuecraft',
        index: '02',
        accent: 'cobalt',
        title: 'Queuecraft',
        year: '2026',
        status: 'Teruji · 35 unit + 14 E2E',
        category: 'Systems Simulation & Interactive Visualization',
        role: 'Systems & Frontend Engineer',
        summary:
          'Simulator discrete-event deterministik untuk arsitektur job queue (producer, worker pool, retry backoff + jitter, timeout, dead-letter queue, dan ghost comparison) yang divisualisasikan sebagai papan sinyal rel mosaik interaktif.',
        narrative:
          'Agar perbandingan antara kebijakan retry bermasalah dan perbaikannya jujur, simulasi dipisahkan ke stream RNG independen sehingga traffic dan gangguan tetap identik terlepas dari frame rate.',
        architecturePoints: [
          'Mesin discrete-event deterministik di src/engine tanpa ketergantungan DOM (seed & URL shareable).',
          'Ghost comparison run paralel yang menguji kebijakan perbaikan di atas pola traffic dan fault yang sama persis.',
          'Panel rel mosaik & strip chart digambar langsung di Canvas 2D tanpa library grafik eksternal.',
        ],
        engineeringHighlight:
          'Terverifikasi 35 unit test (25 engine + 7 klaim kuantitatif skenario + 3 share link) serta 14 Playwright E2E test.',
        stack: ['Svelte 5', 'TypeScript', 'Vite', 'Canvas 2D', 'Vitest', 'Playwright'],
        maquetteIdea:
          'Papan jalur rel modular dengan balok job cobalt-marigold yang meluncur ritmis di bawah gantry worker.',
        sourceFolder: 'queuecraft',
        sourceLabel: 'Arsip Lokal · Projects-Experiments/queuecraft',
      },
      {
        id: 'kamar-gelap',
        index: '03',
        accent: 'charcoal',
        title: 'Kamar Gelap',
        year: '2026',
        status: 'Teruji · WebGL + Fallback 2D',
        category: 'WebGL Storytelling & Scroll Choreography',
        role: 'Creative Frontend & Shader Engineer',
        summary:
          'Esai foto interaktif berlatar ruang gelap pencetakan film 35mm (satu malam hujan di Jakarta dalam 6 frame) di mana scroll mengendalikan waktu pencucian film hingga lampu dinyalakan menuju arsip siang hari.',
        narrative:
          'Setiap elemen visual wajib menjawab metafora kamar gelap—scroll bertindak sebagai waktu di baki developer, sementara tipografi tetap hidup di DOM dan tersinkron satu frame penuh dengan shader GLSL.',
        architecturePoints: [
          'Satu orthographic WebGL stage dengan gsap.ticker tunggal (Lenis → ScrollTrigger → fisika pendulum → render).',
          'Simulasi gelombang cairan 2D berbasis dua half-float render target dan vertex-bend pada cetakan gantung.',
          'Sinkronisasi token CSS–shader real-time saat tombol lampu dinyalakan, lengkap dengan fallback non-WebGL & reduced-motion.',
        ],
        engineeringHighlight:
          'Grain prosedural langsung di fragment shader (tanpa post-processing pass berat) dan dukungan aksesibilitas keyboard/inert modal.',
        stack: ['Three.js', 'GLSL Shaders', 'GSAP', 'Lenis', 'TypeScript', 'Vite'],
        maquetteIdea:
          'Baki pencuci hangat dengan palang gantung arang dan tiga lembar cetakan berayun terjepit klip coral.',
        sourceFolder: 'DarkRoom',
        sourceLabel: 'Arsip Lokal · Projects-Experiments/DarkRoom',
      },
      {
        id: 'atlas-unfinished-places',
        index: '04',
        accent: 'mint',
        title: 'The Atlas of Unfinished Places',
        year: '2026',
        status: 'Teruji · 40 unit integritas',
        category: 'Generative Cartography & Editorial Frontend',
        role: 'Frontend Architect & Cartographic UI',
        summary:
          'Peta interaktif muara fiktif (Sheet 19) dalam empat edisi survei (1871–1962) yang saling bertentangan, dibangkitkan dari seeded height field dan kontur prosedural dengan lensa baca lintas edisi serta edisi kelima hasil temuan pengguna.',
        narrative:
          'Alih-alih menggambar gambar statis, topografi dibangkitkan secara deterministik per edisi dan dirender sebagai SVG aksesibel agar tiap lokasi tetap bisa difokuskan lewat keyboard dan dibaca oleh pembaca layar.',
        architecturePoints: [
          'Pembangkitan medan tinggi ber-seed dan kontur d3-contour per edisi survei di atas layer SVG ter-memoize.',
          'Lensa baca (clip-path) diperbarui langsung pada atribut klip tanpa memicu re-render ulang seluruh peta.',
          'Arsitektur static zero-backend dengan hash routing (#/place/...) dan penyimpanan temuan lokal.',
        ],
        engineeringHighlight:
          'Terverifikasi 40 unit test yang menjaga integritas kutipan arsip, referensi silang tempat, dan geometri kontur.',
        stack: ['React 19', 'TypeScript', 'Vite', 'd3-contour', 'SVG', 'Vitest'],
        maquetteIdea:
          'Teras kontur topografi bertingkat nuansa mint & porselen dengan cincin lensa baca yang mengorbit halus.',
        sourceFolder: 'Atlas-of-Unfinished-Places',
        sourceLabel: 'Arsip Lokal · Projects-Experiments/Atlas-of-Unfinished-Places',
      },
    ] satisfies readonly CuratedProject[],
  },
  profile: {
    kicker: '03 · Profil & Kemampuan',
    title: 'Disiplin Rekayasa di Balik Estetika',
    lead: 'Fokus utama adalah membangun pengalaman interaktif yang tidak hanya hidup secara visual, tetapi juga hemat memori, deterministik, aksesibel, dan siap diuji.',
    pillars: [
      {
        id: 'creative-frontend',
        accent: 'vermilion',
        title: 'Creative Frontend & 3D Web',
        description:
          'Merancang antarmuka editorial yang menyatu dengan Three.js, React Three Fiber, GLSL shader, serta koreografi scroll tanpa mengorbankan keterbacaan tipografi.',
        tools: ['React 19', 'TypeScript', 'Three.js / R3F', 'GLSL', 'Lenis'],
      },
      {
        id: 'systems-simulation',
        accent: 'cobalt',
        title: 'Systems & Simulation Engineering',
        description:
          'Membangun mesin simulasi deterministik, cellular automata, dan visualisasi sistem terdistribusi dengan perhatian ketat pada latensi frame dan zero-allocation loop.',
        tools: ['Discrete-Event Sim', 'Canvas 2D', 'Deterministic RNG', 'State Architecture'],
      },
      {
        id: 'quality-a11y',
        accent: 'mint',
        title: 'Quality, Performance & Accessibility',
        description:
          'Mengawal budget draw call, disposal resource GPU, fallback non-WebGL, dukungan keyboard, prefers-reduced-motion, serta pengujian otomatis unit hingga E2E.',
        tools: ['Vitest', 'Playwright', 'Performance Profiling', 'WCAG & Reduced Motion'],
      },
    ] satisfies readonly CapabilityPillar[],
  },
  contact: {
    kicker: '04 · Kontak',
    title: 'Mari Berkolaborasi pada Proyek Berikutnya',
    lead: 'Terbuka untuk diskusi seputar peran Software Engineering, Creative Frontend, eksperimen WebGL, maupun arsitektur UI interaktif.',
    email: 'bryan2306paulo@gmail.com',
    githubUrl: 'https://github.com/bapetzy',
  },
} as const
