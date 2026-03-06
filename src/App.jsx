import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Brain,
  Clock,
  Flame,
  Play,
  ShieldQuestion,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Zap,
  ChevronRight,
  Layers3,
  Orbit,
  Wand2,
} from "lucide-react";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const PHASES = {
  LOBBY: "lobby",
  VOTING: "voting",
  LOADING_QUESTION: "loading_question",
  QUESTION: "question",
  REVEAL: "reveal",
  SCOREBOARD: "scoreboard",
  END: "end",
};

const TIMES = {
  VOTING: 10,
  REVEAL: 5,
  SCOREBOARD: 5,
};

const CATEGORIES = [
  "Bilim",
  "Sanat",
  "Tarih",
  "Coğrafya",
  "Spor",
  "Teknoloji",
  "Edebiyat",
  "Genel Kültür",
  "Karışık",
];

const AGE_BRACKETS = ["0-10", "11-20", "21-30", "31-40", "41-50", "51-60", "60+"];
const ROUND_OPTIONS = [10, 20];

const SOUNDS = {
  click: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
  correct: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  wrong: "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3",
  tick: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  reveal: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  win: "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
};

const playSound = (type) => {
  try {
    const src = SOUNDS[type];
    if (!src) return;
    const audio = new Audio(src);
    audio.volume = 0.35;
    audio.play().catch(() => {});
  } catch {}
};

// KENDİ BÜYÜK SORU HAVUZUNU BURAYA YAPIŞTIR.
// Senin tüm listeyi buraya aynen koyman gerekiyor.
const initialSeedQuestions = [
  
  {
    "category": "Bilim",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Bitkiler büyümek için neye ihtiyaç duyar?",
    "options": [
      "Güneş ışığı, su ve toprak",
      "Şeker ve çikolata",
      "Oyuncak ve kitap",
      "Ayakkabı ve elbise"
    ],
    "correctIndex": 0,
    "explanationShort": "Bitkiler güneş ışığı, su ve topraktan beslenerek büyür.",
    "tags": [
      "bitkiler",
      "doğa",
      "büyüme"
    ],
    "id": "Q_1772739837800_lk3b7"
  },
  {
    "category": "Bilim",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Su çok soğuk olunca neye dönüşür?",
    "options": [
      "Buz",
      "Buhar",
      "Çorba",
      "Balon"
    ],
    "correctIndex": 0,
    "explanationShort": "Su donarak buza dönüşür.",
    "tags": [
      "su",
      "buz",
      "fizik",
      "donma"
    ],
    "id": "Q_1772739837800_f6yx7"
  },
  {
    "category": "Bilim",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Bize ışık ve sıcaklık veren gökyüzündeki büyük yıldızın adı nedir?",
    "options": [
      "Ay",
      "Güneş",
      "Mars",
      "Jüpiter"
    ],
    "correctIndex": 1,
    "explanationShort": "Güneş, dünyamızın ışık ve ısı kaynağıdır.",
    "tags": [
      "güneş",
      "yıldız",
      "uzay",
      "ısı",
      "ışık"
    ],
    "id": "Q_1772739837800_p0h73"
  },
  {
    "category": "Bilim",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Vücudumuzun hangi bölümü etrafımızı görmemizi sağlar?",
    "options": [
      "Kulaklarımız",
      "Burnumuz",
      "Gözlerimiz",
      "Ellerimiz"
    ],
    "correctIndex": 2,
    "explanationShort": "Gözlerimizle görürüz.",
    "tags": [
      "insan vücudu",
      "duyular",
      "görme",
      "göz"
    ],
    "id": "Q_1772739837800_xe1eo"
  },
  {
    "category": "Bilim",
    "ageBracket": "0-10",
    "difficulty": 3,
    "text": "Şekeri suya koyup karıştırırsak ne olur?",
    "options": [
      "Şeker suda çözünür ve görünmez olur.",
      "Su donar.",
      "Şeker büyür.",
      "Su yeşil olur."
    ],
    "correctIndex": 0,
    "explanationShort": "Şeker suda çözünerek kaybolur (görünmez olur) ve suyu tatlı yapar.",
    "tags": [
      "çözünme",
      "karışım",
      "kimya",
      "şeker",
      "su"
    ],
    "id": "Q_1772739837800_wlwd2"
  },
  {
    "category": "Bilim",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Bitkilerin Güneş ışığını kullanarak kendi besinlerini üretme sürecine ne ad verilir?",
    "options": [
      "Fotosentez",
      "Solunum",
      "Terleme",
      "Mayalanma"
    ],
    "correctIndex": 0,
    "explanationShort": "Fotosentez, bitkilerin karbondioksit ve suyu Güneş enerjisiyle besine dönüştürdüğü yaşamsal bir süreçtir.",
    "tags": [
      "Biyoloji",
      "Bitkiler",
      "Fotosentez"
    ],
    "id": "Q_1772739851687_uf98x"
  },
  {
    "category": "Bilim",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Dünya üzerindeki cisimlerin yere düşmesini ve gezegenlerin Güneş etrafında dönmesini sağlayan temel kuvvet hangisidir?",
    "options": [
      "Elektromanyetik kuvvet",
      "Nükleer kuvvet",
      "Kütle çekim kuvveti",
      "Sürtünme kuvveti"
    ],
    "correctIndex": 2,
    "explanationShort": "Kütle çekim kuvveti (yerçekimi), kütleli cisimlerin birbirini çekmesini sağlayan evrensel bir kuvvettir.",
    "tags": [
      "Fizik",
      "Yerçekimi",
      "Kütle çekimi",
      "Kuvvet"
    ],
    "id": "Q_1772739851687_ytjca"
  },
  {
    "category": "Bilim",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Su molekülü (H₂O) hangi atomların birleşiminden oluşur?",
    "options": [
      "İki hidrojen, bir oksijen",
      "Bir hidrojen, iki oksijen",
      "İki helyum, bir oksijen",
      "Bir klor, iki oksijen"
    ],
    "correctIndex": 0,
    "explanationShort": "Su molekülü, iki hidrojen (H) atomu ve bir oksijen (O) atomunun kovalent bağlarla birleşmesiyle oluşur.",
    "tags": [
      "Kimya",
      "Su",
      "Molekül",
      "Atom"
    ],
    "id": "Q_1772739851687_u709p"
  },
  {
    "category": "Bilim",
    "ageBracket": "11-20",
    "difficulty": 3,
    "text": "Güneş Sistemi'mizdeki gezegenlerden hangisi Güneş'e en yakın konumdadır?",
    "options": [
      "Dünya",
      "Mars",
      "Merkür",
      "Venüs"
    ],
    "correctIndex": 2,
    "explanationShort": "Merkür, Güneş Sistemi'mizdeki en küçük ve Güneş'e en yakın gezegendir.",
    "tags": [
      "Astronomi",
      "Gezegenler",
      "Güneş Sistemi",
      "Uzay"
    ],
    "id": "Q_1772739851687_pvav1"
  },
  {
    "category": "Bilim",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "İnsan vücudunda düşünme, öğrenme, hafıza ve irade gibi karmaşık işlevlerden sorumlu ana organ hangisidir?",
    "options": [
      "Kalp",
      "Akciğerler",
      "Beyin",
      "Mide"
    ],
    "correctIndex": 2,
    "explanationShort": "Beyin, insan vücudunun merkezi sinir sistemi organı olup tüm karmaşık zihinsel işlevlerden sorumludur.",
    "tags": [
      "Biyoloji",
      "İnsan Vücudu",
      "Beyin",
      "Organ"
    ],
    "id": "Q_1772739851687_bpfcg"
  },
  {
    "category": "Bilim",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "Hücrelerde amino asitlerin belirli bir sıraya göre birleşerek oluşturduğu, genetik bilginin ifadesinde ve biyolojik fonksiyonların yerine getirilmesinde kritik rol oynayan büyük organik molekül sınıfı aşağıdakilerden hangisidir?",
    "options": [
      "Karbonhidratlar",
      "Proteinler",
      "Lipitler",
      "Nükleik asitler"
    ],
    "correctIndex": 1,
    "explanationShort": "Proteinler, amino asitlerin polimerleridir ve hücrelerin yapısal ve işlevsel birçok görevini üstlenirler.",
    "tags": [
      "Biyoloji",
      "Kimya",
      "Makromoleküller",
      "Hücre"
    ],
    "id": "Q_1772739867335_tew6u"
  },
  {
    "category": "Bilim",
    "ageBracket": "21-30",
    "difficulty": 3,
    "text": "Kuantum mekaniğinde, bir parçacığın aynı anda hem konumu hem de momentumu tam bir kesinlikle belirlenemeyeceğini ifade eden ilke aşağıdakilerden hangisidir?",
    "options": [
      "Görelilik İlkesi",
      "Pauli Dışlama İlkesi",
      "Heisenberg Belirsizlik İlkesi",
      "Kütleçekim Kanunu"
    ],
    "correctIndex": 2,
    "explanationShort": "Heisenberg Belirsizlik İlkesi, kuantum seviyesinde belirli fiziksel özellik çiftlerinin aynı anda ne kadar doğru bilinebileceğine dair temel bir sınırlamayı açıklar.",
    "tags": [
      "Fizik",
      "Kuantum Mekaniği",
      "Heisenberg",
      "Temel İlkeler"
    ],
    "id": "Q_1772739867335_flh7p"
  },
  {
    "category": "Bilim",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "Güneş Sistemi'ndeki en büyük gezegen olup, yoğun atmosferi ve Büyük Kırmızı Lekesiyle bilinen gaz devi aşağıdakilerden hangisidir?",
    "options": [
      "Satürn",
      "Mars",
      "Jüpiter",
      "Neptün"
    ],
    "correctIndex": 2,
    "explanationShort": "Jüpiter, Güneş Sistemi'ndeki en büyük gezegendir ve yüzeyindeki Büyük Kırmızı Leke adında devasa bir fırtına ile karakterizedir.",
    "tags": [
      "Astronomi",
      "Gezegenler",
      "Güneş Sistemi",
      "Jüpiter"
    ],
    "id": "Q_1772739867335_0eppn"
  },
  {
    "category": "Bilim",
    "ageBracket": "21-30",
    "difficulty": 3,
    "text": "İnsan beyninde, öğrenme, hafıza, duygular ve karar verme gibi yüksek seviyeli bilişsel fonksiyonlardan sorumlu olan ana yapısal bölüm aşağıdakilerden hangisidir?",
    "options": [
      "Beyincik (Cerebellum)",
      "Beyin Sapı (Brainstem)",
      "Omurilik (Spinal Cord)",
      "Serebrum (Cerebrum)"
    ],
    "correctIndex": 3,
    "explanationShort": "Serebrum, beynin en büyük bölümüdür ve karmaşık düşünme, dil, hafıza ve istemli hareketlerden sorumludur.",
    "tags": [
      "Biyoloji",
      "Tıp",
      "Nöroloji",
      "Beyin"
    ],
    "id": "Q_1772739867335_o69au"
  },
  {
    "category": "Bilim",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "Atmosferde birikerek Dünya'nın yüzeyinden yayılan ısıyı tutarak gezegenin ısınmasına neden olan gazlara genel olarak ne ad verilir?",
    "options": [
      "Soy gazlar",
      "Asit yağmuru gazları",
      "Sera gazları",
      "Ozon tabakası gazları"
    ],
    "correctIndex": 2,
    "explanationShort": "Sera gazları, atmosferde birikerek Dünya'dan yansıyan ısıyı emen ve gezegenin ortalama sıcaklığını artıran gazlardır.",
    "tags": [
      "Kimya",
      "Ekoloji",
      "İklim Değişikliği",
      "Sera Gazları"
    ],
    "id": "Q_1772739867335_npalo"
  },
  {
    "category": "Bilim",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "Güneş Sistemi'ndeki gezegenler arasında en büyük kütleye sahip olan gezegen aşağıdakilerden hangisidir?",
    "options": [
      "Dünya",
      "Mars",
      "Jüpiter",
      "Satürn"
    ],
    "correctIndex": 2,
    "explanationShort": "Jüpiter, Güneş Sistemi'ndeki en büyük gezegen olup, diğer tüm gezegenlerin toplam kütlesinin iki buçuk katından fazladır.",
    "tags": [
      "Astronomi",
      "Gezegenler",
      "Güneş Sistemi",
      "Fizik"
    ],
    "id": "Q_1772739883422_skuc8"
  },
  {
    "category": "Bilim",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "İnsan vücudunda besinlerin emiliminin büyük ölçüde gerçekleştiği sindirim organı aşağıdakilerden hangisidir?",
    "options": [
      "Mide",
      "İnce bağırsak",
      "Kalın bağırsak",
      "Yemek borusu"
    ],
    "correctIndex": 1,
    "explanationShort": "Besin maddelerinin büyük çoğunluğunun emilimi, ince bağırsaktaki villus adı verilen yapılar sayesinde gerçekleşir.",
    "tags": [
      "Biyoloji",
      "İnsan Vücudu",
      "Sindirim Sistemi",
      "Anatomi"
    ],
    "id": "Q_1772739883422_c5ez8"
  },
  {
    "category": "Bilim",
    "ageBracket": "31-40",
    "difficulty": 3,
    "text": "Maddenin hangi hali, belirli bir hacme ve belirli bir şekle sahip değildir, ancak kabını tamamen doldurur?",
    "options": [
      "Katı",
      "Sıvı",
      "Gaz",
      "Plazma"
    ],
    "correctIndex": 2,
    "explanationShort": "Gazlar, taneciklerinin serbest hareket etmesi nedeniyle belirli bir hacme veya şekle sahip değildir ve bulundukları kabı tamamen doldururlar.",
    "tags": [
      "Kimya",
      "Maddenin Halleri",
      "Fizik",
      "Termodinamik"
    ],
    "id": "Q_1772739883422_kdu8o"
  },
  {
    "category": "Bilim",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "Yenilenebilir enerji kaynaklarından biri olan jeotermal enerji, temel olarak hangi doğal süreçten faydalanır?",
    "options": [
      "Güneş'ten gelen ultraviyole ışınlar",
      "Rüzgarın kinetik enerjisi",
      "Yerkabuğunun altındaki ısı",
      "Okyanuslardaki gelgit hareketleri"
    ],
    "correctIndex": 2,
    "explanationShort": "Jeotermal enerji, Dünya'nın iç kısmındaki magmatik tabakaların ürettiği ısıdan elde edilen temiz bir enerji türüdür.",
    "tags": [
      "Fizik",
      "Enerji",
      "Yenilenebilir Enerji",
      "Jeotermal"
    ],
    "id": "Q_1772739883422_apo7g"
  },
  {
    "category": "Bilim",
    "ageBracket": "31-40",
    "difficulty": 3,
    "text": "Charles Darwin'in evrim teorisine göre, türlerin zamanla değişime uğramasının ve yeni türlerin ortaya çıkmasının ana mekanizması nedir?",
    "options": [
      "Kalıtsal mutasyonlar",
      "Doğal seçilim",
      "Genetik sürüklenme",
      "Yapay seçilim"
    ],
    "correctIndex": 1,
    "explanationShort": "Darwin'in doğal seçilim teorisi, çevresel koşullara en iyi uyum sağlayan bireylerin hayatta kalma ve üreme şansının daha yüksek olduğunu savunur.",
    "tags": [
      "Biyoloji",
      "Evrim",
      "Genetik",
      "Doğal Seçilim"
    ],
    "id": "Q_1772739883422_lig8w"
  },
  {
    "category": "Bilim",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "Işık yılı, astronomide neyin ölçü birimidir?",
    "options": [
      "Hız",
      "Zaman",
      "Uzaklık",
      "Kütle"
    ],
    "correctIndex": 2,
    "explanationShort": "Işık yılı, ışığın bir yılda boşlukta katettiği mesafeyi ifade eden bir uzaklık birimidir.",
    "tags": [
      "Astrofizik",
      "Uzay",
      "Fizik",
      "Astronomik Terimler"
    ],
    "id": "Q_1772739900474_wf5ww"
  },
  {
    "category": "Bilim",
    "ageBracket": "41-50",
    "difficulty": 3,
    "text": "Kanın pıhtılaşmasından sorumlu olan ve yaralanmalarda kanamayı durdurmaya yardımcı olan hücre parçacıkları hangileridir?",
    "options": [
      "Lökositler",
      "Eritrositler",
      "Trombositler",
      "Lenfositler"
    ],
    "correctIndex": 2,
    "explanationShort": "Trombositler (kan pulcukları), kanın pıhtılaşma sürecinde önemli rol oynayarak kanamayı durdurmaya yardımcı olur.",
    "tags": [
      "Biyoloji",
      "Anatomi",
      "Kan",
      "Hücre"
    ],
    "id": "Q_1772739900474_pooqz"
  },
  {
    "category": "Bilim",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "Periyodik tabloda 'Au' sembolü ile gösterilen değerli metal aşağıdakilerden hangisidir?",
    "options": [
      "Gümüş",
      "Altın",
      "Bakır",
      "Platin"
    ],
    "correctIndex": 1,
    "explanationShort": "'Au', Latince 'Aurum' kelimesinden türemiş olup, altın elementinin kimyasal sembolüdür.",
    "tags": [
      "Kimya",
      "Elementler",
      "Periyodik Tablo",
      "Değerli Metaller"
    ],
    "id": "Q_1772739900474_ytp3p"
  },
  {
    "category": "Bilim",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "Dünya atmosferindeki ozon tabakası, gezegenimizi ve üzerindeki yaşamı öncelikli olarak hangi zararlı radyasyondan korur?",
    "options": [
      "Radyo dalgaları",
      "Morötesi (Ultraviyole) ışınlar",
      "Kızılötesi ışınlar",
      "Mikrodalga ışınlar"
    ],
    "correctIndex": 1,
    "explanationShort": "Ozon tabakası, Güneş'ten gelen zararlı morötesi (UV) ışınların büyük bir kısmını emerek Dünya yüzeyine ulaşmasını engeller.",
    "tags": [
      "Jeoloji",
      "Atmosfer",
      "Çevre",
      "Radyasyon"
    ],
    "id": "Q_1772739900474_5l543"
  },
  {
    "category": "Bilim",
    "ageBracket": "41-50",
    "difficulty": 3,
    "text": "20. yüzyılın en önemli bilimsel keşiflerinden biri olan DNA'nın ikili sarmal yapısını açıklayan bilim insanları kimlerdir?",
    "options": [
      "Marie Curie ve Pierre Curie",
      "Albert Einstein ve Max Planck",
      "James Watson ve Francis Crick",
      "Rosalind Franklin ve Maurice Wilkins"
    ],
    "correctIndex": 2,
    "explanationShort": "James Watson ve Francis Crick, 1953 yılında DNA'nın ikili sarmal yapısını ortaya koyan modeli yayımlayarak Nobel Ödülü kazanmışlardır.",
    "tags": [
      "Biyoloji",
      "Genetik",
      "Bilim Tarihi",
      "DNA"
    ],
    "id": "Q_1772739900474_rxvgq"
  },
  {
    "category": "Bilim",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "Dünya atmosferinin hacimce yaklaşık %78'ini oluşturan ve yaşamın sürdürülebilirliği için önemli bir rol oynayan gaz aşağıdakilerden hangisidir?",
    "options": [
      "Oksijen",
      "Karbondioksit",
      "Azot",
      "Argon"
    ],
    "correctIndex": 2,
    "explanationShort": "Azot (nitrojen), Dünya atmosferinin ana bileşenidir ve proteinler gibi organik moleküllerin yapısında yer alır.",
    "tags": [
      "Atmosfer",
      "Kimya"
    ],
    "id": "Q_1772739918087_s36xx"
  },
  {
    "category": "Bilim",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "İnsan vücudunda kan şekerini düzenleyen insülin hormonunu üreterek diyabetle mücadelede merkezi bir role sahip olan organ aşağıdakilerden hangisidir?",
    "options": [
      "Karaciğer",
      "Pankreas",
      "Böbrekler",
      "Dalak"
    ],
    "correctIndex": 1,
    "explanationShort": "Pankreas, hem sindirim enzimleri hem de insülin ve glukagon gibi kan şekerini düzenleyen hormonlar üreten bir organdır.",
    "tags": [
      "Biyoloji",
      "Anatomi"
    ],
    "id": "Q_1772739918087_8j70v"
  },
  {
    "category": "Bilim",
    "ageBracket": "51-60",
    "difficulty": 3,
    "text": "Evrendeki en bol element olan, yıldızların ve Güneş'in temel yakıtı olarak bilinen, periyodik tabloda ilk sırada yer alan element aşağıdakilerden hangisidir?",
    "options": [
      "Helyum",
      "Oksijen",
      "Hidrojen",
      "Karbon"
    ],
    "correctIndex": 2,
    "explanationShort": "Hidrojen, evrenin yaklaşık %75'ini oluşturan en hafif ve en bol elementtir. Yıldızların nükleer füzyon süreçlerinde enerji kaynağıdır.",
    "tags": [
      "Fizik",
      "Kimya"
    ],
    "id": "Q_1772739918087_0nku9"
  },
  {
    "category": "Bilim",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "Dünya üzerinde gelgit olaylarına (deniz seviyesinin yükselip alçalması) başlıca neden olan ve Dünya'nın doğal uydusu olan gök cismi aşağıdakilerden hangisidir?",
    "options": [
      "Güneş",
      "Ay",
      "Mars",
      "Jüpiter"
    ],
    "correctIndex": 1,
    "explanationShort": "Ay'ın kütleçekim kuvveti, Dünya üzerindeki su kütlelerini çekerek gelgitlere neden olur. Güneş de etkilidir ancak Ay'ın etkisi daha fazladır.",
    "tags": [
      "Astronomi",
      "Coğrafya"
    ],
    "id": "Q_1772739918087_2hox4"
  },
  {
    "category": "Bilim",
    "ageBracket": "51-60",
    "difficulty": 3,
    "text": "20. yüzyılın en önemli tıbbi keşiflerinden biri olan penisilini, 1928 yılında tesadüfen keşfederek antibiyotik çağını başlatan İskoç bilim insanı kimdir?",
    "options": [
      "Louis Pasteur",
      "Alexander Fleming",
      "Robert Koch",
      "Jonas Salk"
    ],
    "correctIndex": 1,
    "explanationShort": "Alexander Fleming, Penicillium notatum küfünden penisilini izole ederek ilk antibiyotiği keşfetmiştir.",
    "tags": [
      "Tarih",
      "Tıp"
    ],
    "id": "Q_1772739918087_hivxg"
  },
  {
    "category": "Bilim",
    "ageBracket": "60+",
    "difficulty": 2,
    "text": "Güneş Sistemi'ndeki hangi gezegen, belirgin ve göz alıcı halkalarıyla bilinir?",
    "options": [
      "Satürn",
      "Jüpiter",
      "Mars",
      "Venüs"
    ],
    "correctIndex": 0,
    "explanationShort": "Satürn, Güneş Sistemi'nin en belirgin ve geniş halka sistemine sahip gezegenidir.",
    "tags": [
      "Astronomi",
      "Gezegenler"
    ],
    "id": "Q_1772739931246_1qq1r"
  },
  {
    "category": "Bilim",
    "ageBracket": "60+",
    "difficulty": 3,
    "text": "Kemik sağlığı için kritik öneme sahip olan ve vücudumuzun güneş ışığına maruz kalmasıyla sentezleyebildiği vitamin hangisidir?",
    "options": [
      "A Vitamini",
      "C Vitamini",
      "D Vitamini",
      "K Vitamini"
    ],
    "correctIndex": 2,
    "explanationShort": "D Vitamini, kemiklerin kalsiyumu emmesi için gereklidir ve ana kaynağı güneş ışığıdır.",
    "tags": [
      "Biyoloji",
      "Sağlık",
      "Vitaminler"
    ],
    "id": "Q_1772739931246_kbvgk"
  },
  {
    "category": "Bilim",
    "ageBracket": "60+",
    "difficulty": 2,
    "text": "Suyun deniz seviyesinde, saf halde donma noktası kaç santigrat derecedir?",
    "options": [
      "0°C",
      "10°C",
      "-10°C",
      "100°C"
    ],
    "correctIndex": 0,
    "explanationShort": "Saf su, atmosfer basıncı altında 0 santigrat derecede donar.",
    "tags": [
      "Fizik",
      "Kimya",
      "Temel Bilgiler"
    ],
    "id": "Q_1772739931246_d5g3s"
  },
  {
    "category": "Bilim",
    "ageBracket": "60+",
    "difficulty": 3,
    "text": "Küresel ısınmaya ve iklim değişikliğine en büyük katkıyı sağlayan insan kaynaklı faaliyetlerden biri hangisidir?",
    "options": [
      "Fosil yakıtların yakılması",
      "Tarım ilaçlarının kullanımı",
      "Geri dönüşüm faaliyetleri",
      "Rüzgar enerjisi üretimi"
    ],
    "correctIndex": 0,
    "explanationShort": "Kömür, petrol ve doğalgaz gibi fosil yakıtların yakılması, atmosfere büyük miktarda sera gazı salar.",
    "tags": [
      "Çevre Bilimi",
      "Ekoloji",
      "Küresel Isınma"
    ],
    "id": "Q_1772739931246_5nv36"
  },
  {
    "category": "Bilim",
    "ageBracket": "60+",
    "difficulty": 2,
    "text": "Uzun ömürlü ve ticari olarak başarılı ilk elektrik ampulünü geliştirmesiyle tanınan mucit kimdir?",
    "options": [
      "Nikola Tesla",
      "Alexander Graham Bell",
      "Thomas Edison",
      "Marie Curie"
    ],
    "correctIndex": 2,
    "explanationShort": "Thomas Edison, elektrik ampulünün gelişiminde ve yaygınlaşmasında kilit rol oynamıştır.",
    "tags": [
      "Bilim Tarihi",
      "İcatlar",
      "Fizik"
    ],
    "id": "Q_1772739931246_npnse"
  },
  {
    "category": "Sanat",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Hangi araçla kağıda rengarenk resimler yaparız?",
    "options": [
      "Boya kalemi",
      "Makas",
      "Top",
      "Kaşık"
    ],
    "correctIndex": 0,
    "explanationShort": "Boya kalemleri, resim yapmak için kullanılan renkli araçlardır.",
    "tags": [
      "çizim",
      "boyama",
      "resim",
      "araç"
    ],
    "id": "Q_1772739945999_7sjf7"
  },
  {
    "category": "Sanat",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Oyun hamuruyla ellerimizle ne gibi şeyler yaparız?",
    "options": [
      "Şarkı söyleriz",
      "Heykeller ve şekiller yaparız",
      "Kitap okuruz",
      "Koşarız"
    ],
    "correctIndex": 1,
    "explanationShort": "Oyun hamuruyla hayvanlar, çiçekler veya arabalar gibi birçok farklı şekil ve heykel yapabiliriz.",
    "tags": [
      "oyun hamuru",
      "heykel",
      "şekil",
      "el işi"
    ],
    "id": "Q_1772739945999_rs5hm"
  },
  {
    "category": "Sanat",
    "ageBracket": "0-10",
    "difficulty": 3,
    "text": "Ünlü bir tabloda hafifçe gülümseyen kadın kimdir?",
    "options": [
      "Kırmızı Başlıklı Kız",
      "Mona Lisa",
      "Pamuk Prenses",
      "Ayşe Teyze"
    ],
    "correctIndex": 1,
    "explanationShort": "Mona Lisa, Leonardo da Vinci'nin yaptığı çok ünlü bir tablodur ve kadının hafif bir gülümsemesi vardır.",
    "tags": [
      "ünlü resim",
      "tablo",
      "Mona Lisa",
      "gülümseme"
    ],
    "id": "Q_1772739945999_367k4"
  },
  {
    "category": "Sanat",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Parmaklarımızla kağıda rengarenk desenler yaptığımız eğlenceli sanat etkinliğine ne denir?",
    "options": [
      "Kitap okuma",
      "Parmak boyası",
      "Saklambaç",
      "Yemek yapma"
    ],
    "correctIndex": 1,
    "explanationShort": "Parmak boyası, boyaları parmaklarımızla sürerek resim yaptığımız bir etkinliktir.",
    "tags": [
      "parmak boyası",
      "etkinlik",
      "boyama",
      "çocuk sanatı"
    ],
    "id": "Q_1772739945999_ai0s3"
  },
  {
    "category": "Sanat",
    "ageBracket": "0-10",
    "difficulty": 3,
    "text": "Bir ressam, bir insanın yüzünü ve nasıl göründüğünü çizdiğinde veya boyadığında buna ne denir?",
    "options": [
      "Manzara",
      "Natürmort",
      "Portre",
      "Soyut resim"
    ],
    "correctIndex": 2,
    "explanationShort": "Bir kişinin yüzünü veya tüm bedenini gösteren resimlere portre denir.",
    "tags": [
      "portre",
      "resim",
      "yüz",
      "sanat terimi"
    ],
    "id": "Q_1772739945999_6zyse"
  },
  {
    "category": "Sanat",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Dünya sanat tarihinin en ünlü tablolarından biri olan \"Mona Lisa\"nın yaratıcısı, Rönesans döneminin hangi İtalyan dahisidir?",
    "options": [
      "Vincent van Gogh",
      "Pablo Picasso",
      "Leonardo da Vinci",
      "Claude Monet"
    ],
    "correctIndex": 2,
    "explanationShort": "Mona Lisa, Leonardo da Vinci'nin en tanınmış eserlerinden biridir.",
    "tags": [
      "Rönesans",
      "Ressam",
      "Mona Lisa",
      "Leonardo da Vinci"
    ],
    "id": "Q_1772739960207_dhz0d"
  },
  {
    "category": "Sanat",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Aşağıdaki müzik aletlerinden hangisi, telleri yay ile sürülerek çalınan 'yaylı çalgılar' grubuna ait değildir?",
    "options": [
      "Keman",
      "Viyolonsel",
      "Piyano",
      "Kontrabas"
    ],
    "correctIndex": 2,
    "explanationShort": "Piyano telli bir çalgı olmasına rağmen, telleri vurularak (tuşlar aracılığıyla) çalınır, yaylı çalgı değildir.",
    "tags": [
      "Müzik",
      "Enstrüman",
      "Yaylı Çalgılar",
      "Piyano"
    ],
    "id": "Q_1772739960207_e4h09"
  },
  {
    "category": "Sanat",
    "ageBracket": "11-20",
    "difficulty": 3,
    "text": "Pop Art akımının öncülerinden biri olan ve \"Campbell's Soup Cans\" ile \"Marilyn Diptych\" gibi ikonik eserleriyle tanınan sanatçı kimdir?",
    "options": [
      "Salvador Dalí",
      "Andy Warhol",
      "Frida Kahlo",
      "Jackson Pollock"
    ],
    "correctIndex": 1,
    "explanationShort": "Andy Warhol, Pop Art'ın en bilinen temsilcilerinden biridir ve bu eserleriyle çağdaş sanata damga vurmuştur.",
    "tags": [
      "Pop Art",
      "Andy Warhol",
      "Modern Sanat",
      "Campbell's Soup Cans"
    ],
    "id": "Q_1772739960207_f1vsj"
  },
  {
    "category": "Sanat",
    "ageBracket": "11-20",
    "difficulty": 3,
    "text": "Antik Yunan mimarisinde kullanılan sütun düzenlerinden hangisi, en sade ve süslemesiz başlık yapısıyla bilinir?",
    "options": [
      "Korint düzeni",
      "İyon düzeni",
      "Dor düzeni",
      "Kompozit düzeni"
    ],
    "correctIndex": 2,
    "explanationShort": "Dor düzeni, Antik Yunan mimarisindeki üç temel sütun düzeninden en eskisi ve en sade olanıdır.",
    "tags": [
      "Antik Yunan",
      "Mimari",
      "Sütun",
      "Dor Düzeni"
    ],
    "id": "Q_1772739960207_wp9r8"
  },
  {
    "category": "Sanat",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Bir tiyatro oyununda, sahnedeki oyuncuların repliklerini unuttuklarında veya karıştıklarında onlara fısıldayarak yardımcı olan kişiye ne ad verilir?",
    "options": [
      "Yönetmen",
      "Dekoratör",
      "Suflör",
      "Kostümcü"
    ],
    "correctIndex": 2,
    "explanationShort": "Suflör, tiyatroda oyunculara repliklerini hatırlatan ve oyunu kesintisiz sürdürmeye yardımcı olan kişidir.",
    "tags": [
      "Tiyatro",
      "Sahne Sanatları",
      "Suflör",
      "Oyun"
    ],
    "id": "Q_1772739960207_15zl3"
  },
  {
    "category": "Sanat",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "Pop Art akımının ikonik figürlerinden biri olan ve Marilyn Monroe, Campbell's Çorba Kutuları gibi çalışmalarıyla tanınan sanatçı kimdir?",
    "options": [
      "Andy Warhol",
      "Pablo Picasso",
      "Vincent van Gogh",
      "Salvador Dalí"
    ],
    "correctIndex": 0,
    "explanationShort": "Andy Warhol, Pop Art akımının en bilinen temsilcilerinden biridir.",
    "tags": [
      "Resim",
      "Pop Art",
      "Sanat Akımları"
    ],
    "id": "Q_1772739975818_hnr07"
  },
  {
    "category": "Sanat",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "Türkiye'den Nobel Edebiyat Ödülü kazanan ilk ve tek yazarımız kimdir?",
    "options": [
      "Orhan Pamuk",
      "Yaşar Kemal",
      "Nazım Hikmet",
      "Elif Şafak"
    ],
    "correctIndex": 0,
    "explanationShort": "Orhan Pamuk, 2006 yılında Nobel Edebiyat Ödülü'nü kazanan ilk ve tek Türk yazardır.",
    "tags": [
      "Edebiyat",
      "Nobel",
      "Türk Edebiyatı"
    ],
    "id": "Q_1772739975818_hl5dw"
  },
  {
    "category": "Sanat",
    "ageBracket": "21-30",
    "difficulty": 3,
    "text": "Gotik mimarinin en belirgin özelliklerinden biri olan, yapıların ağırlığını taşıyan ve yüksek pencerelerin açılmasına olanak tanıyan destekleyici öğe aşağıdakilerden hangisidir?",
    "options": [
      "Uçan payanda (Flying Buttress)",
      "Dor sütunu",
      "Kubbe",
      "Kemerli pencere"
    ],
    "correctIndex": 0,
    "explanationShort": "Uçan payandalar, Gotik katedrallerin yüksek ve ince duvarlarının ağırlığını dışarıdan destekleyerek büyük pencerelere olanak tanır.",
    "tags": [
      "Mimari",
      "Gotik",
      "Sanat Tarihi"
    ],
    "id": "Q_1772739975818_1icsn"
  },
  {
    "category": "Sanat",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "\"Pulp Fiction\", \"Kill Bill\" ve \"Django Unchained\" gibi ikonik filmleriyle tanınan, kendine özgü anlatım dili ve şiddet estetiğiyle öne çıkan yönetmen kimdir?",
    "options": [
      "Quentin Tarantino",
      "Martin Scorsese",
      "Christopher Nolan",
      "Steven Spielberg"
    ],
    "correctIndex": 0,
    "explanationShort": "Quentin Tarantino, sıra dışı senaryoları ve stilize şiddet anlatımıyla bilinen Amerikalı bir yönetmendir.",
    "tags": [
      "Sinema",
      "Yönetmen",
      "Modern Sinema"
    ],
    "id": "Q_1772739975818_7xxut"
  },
  {
    "category": "Sanat",
    "ageBracket": "21-30",
    "difficulty": 3,
    "text": "Uzun süreli ve fiziksel sınırları zorlayan performans sanatıyla tanınan, \"Sanatçı Mevcut\" (The Artist Is Present) adlı performansıyla izleyiciyle doğrudan etkileşime geçen Sırp asıllı sanatçı kimdir?",
    "options": [
      "Marina Abramović",
      "Yayoi Kusama",
      "Frida Kahlo",
      "Auguste Rodin"
    ],
    "correctIndex": 0,
    "explanationShort": "Marina Abramović, performans sanatının öncülerinden olup, eserlerinde dayanıklılık, acı ve izleyici-sanatçı ilişkisini keşfeder.",
    "tags": [
      "Performans Sanatı",
      "Çağdaş Sanat",
      "Heykel"
    ],
    "id": "Q_1772739975818_ltll2"
  },
  {
    "category": "Sanat",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "Hollandalı post-empresyonist ressam Vincent van Gogh'un ikonik eseri 'Yıldızlı Gece' (The Starry Night), günümüzde hangi şehrin müzesinde sergilenmektedir?",
    "options": [
      "A) Amsterdam",
      "B) New York",
      "C) Paris",
      "D) Londra"
    ],
    "correctIndex": 1,
    "explanationShort": "Van Gogh'un 'Yıldızlı Gece' adlı eseri, 1941 yılından beri New York'taki Modern Sanat Müzesi (MoMA) koleksiyonunda yer almaktadır.",
    "tags": [
      "resim",
      "Van Gogh",
      "post-empresyonizm"
    ],
    "id": "Q_1772739992973_k5gxo"
  },
  {
    "category": "Sanat",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "2006 yılında Nobel Edebiyat Ödülü'nü kazanan ve eserlerinde genellikle Doğu ile Batı arasındaki kültürel çatışmaları, kimlik arayışlarını işleyen Türk yazar kimdir?",
    "options": [
      "A) Yaşar Kemal",
      "B) Orhan Pamuk",
      "C) Nazım Hikmet",
      "D) Adalet Ağaoğlu"
    ],
    "correctIndex": 1,
    "explanationShort": "Orhan Pamuk, 2006 yılında Nobel Edebiyat Ödülü'nü kazanan ilk Türk yazar olmuştur. Eserleri dünya çapında tanınmaktadır.",
    "tags": [
      "edebiyat",
      "Nobel",
      "Türk edebiyatı"
    ],
    "id": "Q_1772739992973_pfag8"
  },
  {
    "category": "Sanat",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "Osmanlı İmparatorluğu'nun en parlak dönemlerinde yaşamış, Şehzadebaşı Camii, Süleymaniye Camii ve Selimiye Camii gibi birçok önemli esere imza atmış ünlü mimar kimdir?",
    "options": [
      "A) Davut Ağa",
      "B) Sedefkar Mehmed Ağa",
      "C) Mimar Sinan",
      "D) Hassa Mimarlar Ocağı"
    ],
    "correctIndex": 2,
    "explanationShort": "Mimar Sinan, Osmanlı İmparatorluğu'nun Kanuni Sultan Süleyman, II. Selim ve III. Murat dönemlerinde baş mimar olarak görev yapmış, klasik Osmanlı mimarisine damgasını vurmuştur.",
    "tags": [
      "mimari",
      "Osmanlı",
      "cami"
    ],
    "id": "Q_1772739992973_0gkhn"
  },
  {
    "category": "Sanat",
    "ageBracket": "31-40",
    "difficulty": 3,
    "text": "Ludwig van Beethoven'ın bestelediği tek opera olan ve tutsaklık, özgürlük temalarını işleyen eseri hangisidir?",
    "options": [
      "A) Sihirli Flüt",
      "B) Fidelio",
      "C) Figaro'nun Düğünü",
      "D) Carmen"
    ],
    "correctIndex": 1,
    "explanationShort": "Fidelio, Ludwig van Beethoven'ın 1805'te ilk kez sahnelenen ve 1814'te revize edilen tek operasıdır. Diğer şıklar farklı bestecilerin ünlü operalarıdır.",
    "tags": [
      "müzik",
      "klasik müzik",
      "opera",
      "Beethoven"
    ],
    "id": "Q_1772739992973_uf92u"
  },
  {
    "category": "Sanat",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "'2001: Bir Uzay Destanı', 'Otomatik Portakal', 'Cinnet' ve 'Full Metal Jacket' gibi çığır açan filmleriyle tanınan, sinema tarihinin en etkili yönetmenlerinden biri olarak kabul edilen isim kimdir?",
    "options": [
      "A) Alfred Hitchcock",
      "B) Steven Spielberg",
      "C) Quentin Tarantino",
      "D) Stanley Kubrick"
    ],
    "correctIndex": 3,
    "explanationShort": "Stanley Kubrick, sinema tarihine yön veren, yenilikçi anlatım tarzı ve görsel estetiğiyle tanınan efsanevi bir yönetmendir.",
    "tags": [
      "sinema",
      "yönetmen",
      "kült film"
    ],
    "id": "Q_1772739992973_hxru9"
  },
  {
    "category": "Sanat",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "Hollandalı ressam Vincent van Gogh'un en bilinen eserlerinden biri olan \"Yıldızlı Gece\" tablosu, hangi sanat akımının öne çıkan örneklerinden biridir?",
    "options": [
      "Empresyonizm",
      "Post-Empresyonizm",
      "Kübizm",
      "Romantizm"
    ],
    "correctIndex": 1,
    "explanationShort": "Vincent van Gogh, \"Yıldızlı Gece\" tablosuyla Post-Empresyonist akımın en önemli temsilcilerinden biridir.",
    "tags": [
      "Vincent van Gogh",
      "Yıldızlı Gece",
      "Resim",
      "Sanat Akımı",
      "Post-Empresyonizm"
    ],
    "id": "Q_1772740011178_jzits"
  },
  {
    "category": "Sanat",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "Türk resim sanatının önemli isimlerinden Osman Hamdi Bey'in \"Kaplumbağa Terbiyecisi\" adlı eseri, günümüzde hangi müzede sergilenmektedir?",
    "options": [
      "Sakıp Sabancı Müzesi",
      "Pera Müzesi",
      "İstanbul Modern",
      "Rezan Has Müzesi"
    ],
    "correctIndex": 1,
    "explanationShort": "Osman Hamdi Bey'in ünlü eseri \"Kaplumbağa Terbiyecisi\", İstanbul'daki Pera Müzesi'nde sergilenmektedir.",
    "tags": [
      "Osman Hamdi Bey",
      "Kaplumbağa Terbiyecisi",
      "Türk Sanatı",
      "Müze",
      "Resim"
    ],
    "id": "Q_1772740011178_moy50"
  },
  {
    "category": "Sanat",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "İngiliz edebiyatının dev ismi William Shakespeare'in en bilinen trajedilerinden biri olan ve \"Olmak ya da olmamak, işte bütün mesele bu!\" repliğiyle hafızalara kazınan eseri hangisidir?",
    "options": [
      "Romeo ve Juliet",
      "Othello",
      "Hamlet",
      "Macbeth"
    ],
    "correctIndex": 2,
    "explanationShort": "\"Olmak ya da olmamak\" repliği, William Shakespeare'in ünlü eseri Hamlet'in en ikonik bölümlerindendir.",
    "tags": [
      "William Shakespeare",
      "Edebiyat",
      "Hamlet",
      "Trajedi",
      "İngiliz Edebiyatı"
    ],
    "id": "Q_1772740011178_cuaa8"
  },
  {
    "category": "Sanat",
    "ageBracket": "41-50",
    "difficulty": 3,
    "text": "20. yüzyılın başlarında ortaya çıkan ve nesneleri parçalara ayırarak farklı açılardan aynı anda gösterme prensibine dayanan, Pablo Picasso ve Georges Braque gibi sanatçıların öncülük ettiği sanat akımı aşağıdakilerden hangisidir?",
    "options": [
      "Fovizm",
      "Sürrealizm",
      "Kübizm",
      "Dışavurumculuk (Ekspresyonizm)"
    ],
    "correctIndex": 2,
    "explanationShort": "Kübizm, nesneleri geometrik formlara ayırıp farklı bakış açılarını aynı anda sunarak algıyı değiştiren bir sanat akımıdır.",
    "tags": [
      "Kübizm",
      "Sanat Akımı",
      "Pablo Picasso",
      "Georges Braque",
      "Modern Sanat"
    ],
    "id": "Q_1772740011178_6657o"
  },
  {
    "category": "Sanat",
    "ageBracket": "41-50",
    "difficulty": 3,
    "text": "Ünlü Alman besteci Ludwig van Beethoven'ın \"Neşeye Övgü\" (Ode an die Freude) temasıyla bilinen ve koro ile solistlerin yer aldığı final bölümüyle öne çıkan senfonisi kaç numaradır?",
    "options": [
      "Beşinci Senfoni",
      "Üçüncü Senfoni (\"Eroica\")",
      "Dokuzuncu Senfoni (\"Koral\")",
      "Altıncı Senfoni (\"Pastoral\")"
    ],
    "correctIndex": 2,
    "explanationShort": "Beethoven'ın Dokuzuncu Senfonisi, koro ve solistleri içeren son bölümüyle \"Neşeye Övgü\" adıyla da bilinir.",
    "tags": [
      "Ludwig van Beethoven",
      "Müzik",
      "Senfoni",
      "Klasik Müzik",
      "Neşeye Övgü"
    ],
    "id": "Q_1772740011178_60d6c"
  },
  {
    "category": "Sanat",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "Hangi Osmanlı ressamı, 'Kaplumbağa Terbiyecisi' ve 'Mihrap' tablolarıyla tanınır?",
    "options": [
      "Osman Hamdi Bey",
      "Şeker Ahmet Paşa",
      "Halil Paşa",
      "Hoca Ali Rıza"
    ],
    "correctIndex": 0,
    "explanationShort": "'Kaplumbağa Terbiyecisi' ve 'Mihrap', Osman Hamdi Bey'in en ünlü eserlerindendir.",
    "tags": [
      "Türk Sanatı",
      "Resim",
      "Osman Hamdi Bey"
    ],
    "id": "Q_1772740029618_tf0kk"
  },
  {
    "category": "Sanat",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "İtalya'da 14. yüzyılda başlayıp 17. yüzyıla kadar süren, Antik Yunan ve Roma sanatına dönüşü simgeleyen sanat ve kültür hareketi hangi isimle anılır?",
    "options": [
      "Rönesans",
      "Barok",
      "Gotik",
      "Romantizm"
    ],
    "correctIndex": 0,
    "explanationShort": "Rönesans, Antik Çağ'ın yeniden doğuşu anlamına gelir ve sanatta bu döneme damgasını vurmuştur.",
    "tags": [
      "Batı Sanatı",
      "Sanat Akımları",
      "Rönesans"
    ],
    "id": "Q_1772740029618_sh47v"
  },
  {
    "category": "Sanat",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "Geleneksel Türk süsleme sanatlarından biri olan, özel bir kıvamdaki su üzerine boyaların serpilmesi ve desenlendirilmesiyle kağıda aktarılan sanat dalı hangisidir?",
    "options": [
      "Ebru",
      "Tezhip",
      "Çini",
      "Hat"
    ],
    "correctIndex": 0,
    "explanationShort": "Ebru, suyun yüzeyinde şekillendirilen desenlerin kağıda aktarılmasıyla yapılan özgün bir sanattır.",
    "tags": [
      "Türk Sanatları",
      "Geleneksel Sanatlar",
      "Ebru"
    ],
    "id": "Q_1772740029618_siydo"
  },
  {
    "category": "Sanat",
    "ageBracket": "51-60",
    "difficulty": 3,
    "text": "'Yıldızlı Gece', 'Ayçiçekleri' ve 'Patates Yiyenler' gibi eserleriyle tanınan Hollandalı ressam kimdir?",
    "options": [
      "Vincent van Gogh",
      "Claude Monet",
      "Pierre-Auguste Renoir",
      "Paul Cézanne"
    ],
    "correctIndex": 0,
    "explanationShort": "Vincent van Gogh, güçlü fırça darbeleri ve renk kullanımıyla tanınan önemli bir post-empresyonist ressamdır.",
    "tags": [
      "Batı Sanatı",
      "Resim",
      "Van Gogh"
    ],
    "id": "Q_1772740029618_74qjp"
  },
  {
    "category": "Sanat",
    "ageBracket": "51-60",
    "difficulty": 3,
    "text": "Osmanlı döneminin en büyük bestecilerinden biri kabul edilen, özellikle 'Nevakar' ve 'Sultaniyegah' makamlarında eserler veren, ayrıca Mevlevi ayinleri için bestelediği dini müziklerle de bilinen sanatçı kimdir?",
    "options": [
      "Itrî (Buhurizade Mustafa Efendi)",
      "Dede Efendi (Hammamizade İsmail)",
      "Hacı Arif Bey",
      "Tamburi Cemil Bey"
    ],
    "correctIndex": 0,
    "explanationShort": "Itrî, Türk klasik müziğinin temel taşlarından olup hem dini hem de din dışı besteleriyle tanınır.",
    "tags": [
      "Türk Sanatı",
      "Müzik",
      "Klasik Türk Müziği"
    ],
    "id": "Q_1772740029618_luxts"
  },
  {
    "category": "Sanat",
    "ageBracket": "60+",
    "difficulty": 3,
    "text": "Rönesans döneminin en önemli figürlerinden biri olan ve Davut heykeli ile Sistina Şapeli'nin tavan fresklerini yapan sanatçı kimdir?",
    "options": [
      "Leonardo da Vinci",
      "Raphael",
      "Michelangelo",
      "Donatello"
    ],
    "correctIndex": 2,
    "explanationShort": "Michelangelo, Davut heykeli ve Sistina Şapeli'nin tavan freskleri ile tanınan Rönesans döneminin dev sanatçılarındandır.",
    "tags": [
      "Rönesans",
      "Heykel",
      "Fresk",
      "İtalyan Sanatı"
    ],
    "id": "Q_1772740048562_rgfqt"
  },
  {
    "category": "Sanat",
    "ageBracket": "60+",
    "difficulty": 2,
    "text": "\"Kaplumbağa Terbiyecisi\" ve \"Silah Taciri\" gibi eserleriyle tanınan, aynı zamanda müzeciliğe büyük katkılar sağlamış Türk ressam ve arkeolog kimdir?",
    "options": [
      "Şeker Ahmet Paşa",
      "Osman Hamdi Bey",
      "Fikret Mualla",
      "Nazmi Ziya Güran"
    ],
    "correctIndex": 1,
    "explanationShort": "Osman Hamdi Bey, Türk resim sanatının öncülerinden olup, \"Kaplumbağa Terbiyecisi\" tablosu en bilinen eseridir.",
    "tags": [
      "Türk Sanatı",
      "Ressam",
      "Osmanlı Dönemi",
      "Müzeci"
    ],
    "id": "Q_1772740048562_5wbtg"
  },
  {
    "category": "Sanat",
    "ageBracket": "60+",
    "difficulty": 3,
    "text": "Antik Yunan heykeltıraşlığının en önemli eserlerinden biri olan, Venüs de Milo olarak da bilinen Afrodit heykelinin sergilendiği dünyaca ünlü müze hangisidir?",
    "options": [
      "British Museum (Londra)",
      "Louvre Müzesi (Paris)",
      "Uffizi Galerisi (Floransa)",
      "Metropolitan Sanat Müzesi (New York)"
    ],
    "correctIndex": 1,
    "explanationShort": "Venüs de Milo heykeli, Paris'teki Louvre Müzesi'nde sergilenmektedir ve Antik Yunan sanatının başyapıtlarından biridir.",
    "tags": [
      "Heykel",
      "Antik Sanat",
      "Müze",
      "Yunan Sanatı"
    ],
    "id": "Q_1772740048562_jpo81"
  },
  {
    "category": "Sanat",
    "ageBracket": "60+",
    "difficulty": 2,
    "text": "19. yüzyılın sonlarında Fransa'da ortaya çıkan, anlık izlenimleri yakalamayı, ışık ve rengin değişimlerini tuvale aktarmayı amaçlayan sanat akımının adı nedir?",
    "options": [
      "Kübizm",
      "Fovizm",
      "Empresyonizm (İzlenimcilik)",
      "Sürrealizm"
    ],
    "correctIndex": 2,
    "explanationShort": "Empresyonizm, anlık izlenimleri ve ışığın etkilerini yansıtmayı hedefleyen, Claude Monet gibi sanatçıların öncülük ettiği bir akımdır.",
    "tags": [
      "Sanat Akımı",
      "19. Yüzyıl",
      "Resim",
      "Fransız Sanatı"
    ],
    "id": "Q_1772740048562_jad8t"
  },
  {
    "category": "Sanat",
    "ageBracket": "60+",
    "difficulty": 3,
    "text": "İstanbul'un tarihi simgelerinden Ayasofya, ilk olarak hangi imparatorluk döneminde, büyük bir bazilika olarak inşa edilmiş ve mimarisiyle dönemine damga vurmuştur?",
    "options": [
      "Roma İmparatorluğu",
      "Bizans İmparatorluğu",
      "Gotik Dönem",
      "Osmanlı İmparatorluğu"
    ],
    "correctIndex": 1,
    "explanationShort": "Ayasofya, Bizans İmparatoru I. Justinianus döneminde, 6. yüzyılda inşa edilmiş ve Bizans mimarisinin en önemli örneklerinden biridir.",
    "tags": [
      "Mimari",
      "Tarihi Yapı",
      "Bizans",
      "İstanbul"
    ],
    "id": "Q_1772740048562_2yrjv"
  },
  {
    "category": "Tarih",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Çok eski zamanlarda yaşamış, devasa cüsseli hayvanlara ne ad verilir?",
    "options": [
      "Dinozor",
      "Fil",
      "Maymun",
      "Köpek"
    ],
    "correctIndex": 0,
    "explanationShort": "Dinozorlar, milyonlarca yıl önce dünyada yaşamış büyük canlılardı.",
    "tags": [
      "Dinozorlar",
      "Tarih Öncesi"
    ],
    "id": "Q_1772740062777_wrbsj"
  },
  {
    "category": "Tarih",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Mısır'da, çok eski zamanlarda krallar ve kraliçeler için yapılan, üçgen şekilli büyük yapılar hangisidir?",
    "options": [
      "Gökdelen",
      "Piramit",
      "Kale",
      "Köprü"
    ],
    "correctIndex": 1,
    "explanationShort": "Piramitler, eski Mısır'da firavunlar (krallar) için anıt mezarlar olarak inşa edilmiş büyük yapılardır.",
    "tags": [
      "Mısır",
      "Piramitler",
      "Antik Çağ"
    ],
    "id": "Q_1772740062777_0oaeh"
  },
  {
    "category": "Tarih",
    "ageBracket": "0-10",
    "difficulty": 3,
    "text": "İlk insanlar soğuktan korunmak ve yemeklerini pişirmek için neyi keşfettiler?",
    "options": [
      "Elektrik",
      "Ateş",
      "Tekerlek",
      "Buzdolabı"
    ],
    "correctIndex": 1,
    "explanationShort": "Ateşin keşfi, ilk insanların hayatını değiştiren en önemli buluşlardan biridir.",
    "tags": [
      "İlk İnsanlar",
      "Ateş",
      "Keşif"
    ],
    "id": "Q_1772740062777_u98v1"
  },
  {
    "category": "Tarih",
    "ageBracket": "0-10",
    "difficulty": 3,
    "text": "Geceleri evlerimizi aydınlatan, 'ampul'ü icat eden bilim insanı kimdir?",
    "options": [
      "Albert Einstein",
      "Thomas Edison",
      "Leonardo da Vinci",
      "Graham Bell"
    ],
    "correctIndex": 1,
    "explanationShort": "Thomas Edison, modern elektrik ampulünü geliştiren ünlü bir mucittir.",
    "tags": [
      "İcatlar",
      "Bilim İnsanları",
      "Aydınlanma"
    ],
    "id": "Q_1772740062777_j73ro"
  },
  {
    "category": "Tarih",
    "ageBracket": "0-10",
    "difficulty": 2,
    "text": "Eskiden kralların ve şövalyelerin yaşadığı, kalın duvarları ve kuleleri olan büyük ve korunaklı yapılara ne denir?",
    "options": [
      "Apartman",
      "Çadır",
      "Şato (Kale)",
      "Mağara"
    ],
    "correctIndex": 2,
    "explanationShort": "Şatolar (kaleler), orta çağda krallar, prensler ve soylular tarafından hem yaşam alanı hem de korunma amacıyla kullanılan büyük yapılardır.",
    "tags": [
      "Orta Çağ",
      "Yapılar",
      "Şato"
    ],
    "id": "Q_1772740062777_iirke"
  },
  {
    "category": "Tarih",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Osmanlı Devleti'nin kurucusu kimdir?",
    "options": [
      "Osman Bey",
      "Orhan Bey",
      "Fatih Sultan Mehmet",
      "Yavuz Sultan Selim"
    ],
    "correctIndex": 0,
    "explanationShort": "Osmanlı Devleti, Söğüt ve Domaniç civarında Osman Bey tarafından kurulmuştur.",
    "tags": [
      "Osmanlı",
      "Kuruluş",
      "Osman Bey"
    ],
    "id": "Q_1772740077617_r4tc7"
  },
  {
    "category": "Tarih",
    "ageBracket": "11-20",
    "difficulty": 3,
    "text": "Milli Mücadele döneminde, tüm yurdu kapsayan kararların alındığı ve Mustafa Kemal Atatürk'ün başkanlık yaptığı önemli kongre hangisidir?",
    "options": [
      "Erzurum Kongresi",
      "Sivas Kongresi",
      "Amasya Genelgesi",
      "Balıkesir Kongresi"
    ],
    "correctIndex": 1,
    "explanationShort": "Sivas Kongresi, Milli Mücadele'nin tüm yurdu kapsayan kararlarının alındığı ve temsil heyetinin kurulduğu en önemli kongrelerden biridir.",
    "tags": [
      "Milli Mücadele",
      "Sivas Kongresi",
      "Atatürk",
      "Kurtuluş Savaşı"
    ],
    "id": "Q_1772740077617_h2h7n"
  },
  {
    "category": "Tarih",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Anadolu'da yaşamış, başkenti Hattuşa olan ve tarihte bilinen ilk yazılı antlaşma olan Kadeş Antlaşması'nı Mısırlılarla imzalamış medeniyet hangisidir?",
    "options": [
      "Frigler",
      "Urartular",
      "Hititler",
      "Lidyalılar"
    ],
    "correctIndex": 2,
    "explanationShort": "Hititler, Anadolu'da büyük bir medeniyet kurmuş ve Mısırlılarla Kadeş Antlaşması'nı imzalamışlardır.",
    "tags": [
      "Anadolu Medeniyetleri",
      "Hititler",
      "Hattuşa",
      "Kadeş Antlaşması"
    ],
    "id": "Q_1772740077617_8oc8u"
  },
  {
    "category": "Tarih",
    "ageBracket": "11-20",
    "difficulty": 3,
    "text": "Anadolu'nun kapılarını Türklere açan ve bu toprakların yurt edinilmesinde önemli bir dönüm noktası olan savaş aşağıdakilerden hangisidir?",
    "options": [
      "Pasinler Savaşı",
      "Malazgirt Savaşı",
      "Miryokefalon Savaşı",
      "Dandanakan Savaşı"
    ],
    "correctIndex": 1,
    "explanationShort": "1071 Malazgirt Savaşı ile Anadolu'nun kapıları Türklere açılmış ve Anadolu'nun Türkleşme süreci hızlanmıştır.",
    "tags": [
      "Selçuklular",
      "Malazgirt",
      "Anadolu",
      "Savaşlar"
    ],
    "id": "Q_1772740077617_9wwyp"
  },
  {
    "category": "Tarih",
    "ageBracket": "11-20",
    "difficulty": 2,
    "text": "Göktürk Devleti döneminde yazılmış, Türk tarihinin ve edebiyatının ilk yazılı örnekleri arasında yer alan anıtlar hangi isimle anılır?",
    "options": [
      "Uygur Yazıtları",
      "Orhun Abideleri",
      "Yenisey Yazıtları",
      "Mani Yazıtları"
    ],
    "correctIndex": 1,
    "explanationShort": "Orhun Abideleri (Göktürk Yazıtları), Göktürkler dönemine ait Türk dilinin en eski ve önemli yazılı eserleridir.",
    "tags": [
      "Göktürkler",
      "Orhun Abideleri",
      "Türk Tarihi",
      "İlk Yazıtlar"
    ],
    "id": "Q_1772740077617_id1h9"
  },
  {
    "category": "Tarih",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "Tanzimat Fermanı'nın ilan edilmesinde etkili olan ve Osmanlı Devleti'nde yenilikçi fikirlerin savunuculuğunu yapan önemli devlet adamı kimdir?",
    "options": [
      "Mustafa Reşit Paşa",
      "Mithat Paşa",
      "Koca Yusuf Paşa",
      "Cevdet Paşa"
    ],
    "correctIndex": 0,
    "explanationShort": "Tanzimat Fermanı, 1839'da Mustafa Reşit Paşa tarafından Gülhane Hatt-ı Hümayunu olarak okunmuştur.",
    "tags": [
      "Osmanlı",
      "Tanzimat",
      "Reform"
    ],
    "id": "Q_1772740096654_m8zda"
  },
  {
    "category": "Tarih",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "Kurtuluş Savaşı döneminde, 4 Eylül 1919'da toplanan ve Temsil Heyeti'nin tüm yurdu temsil eder hale getirildiği, böylece Milli Mücadele'nin yönetim merkezi konumuna yükselen şehir hangisidir?",
    "options": [
      "Erzurum",
      "Amasya",
      "Sivas",
      "Ankara"
    ],
    "correctIndex": 2,
    "explanationShort": "Sivas Kongresi sonrası, Temsil Heyeti'nin genişletilerek ülkenin tamamını temsil etmesiyle Sivas, Milli Mücadele'nin fiili merkezi olmuştur.",
    "tags": [
      "Kurtuluş Savaşı",
      "Sivas",
      "Kongreler"
    ],
    "id": "Q_1772740096654_5j8qo"
  },
  {
    "category": "Tarih",
    "ageBracket": "21-30",
    "difficulty": 2,
    "text": "Mezopotamya uygarlıklarından hangisi, yazıyı (çivi yazısı) ilk kez kullanarak tarihin başlangıcını simgelemiş ve ilk yazılı kanunları (Ur-Nammu Kanunları) oluşturmuştur?",
    "options": [
      "Babiller",
      "Asurlular",
      "Sümerler",
      "Akadlar"
    ],
    "correctIndex": 2,
    "explanationShort": "Sümerler, çivi yazısını icat ederek yazılı tarihin başlangıcını simgelemiş ve Ur-Nammu Kanunları ile bilinen ilk yazılı hukuk kurallarını oluşturmuşlardır.",
    "tags": [
      "Mezopotamya",
      "Sümerler",
      "Yazı",
      "Antik Tarih"
    ],
    "id": "Q_1772740096654_ai45a"
  },
  {
    "category": "Tarih",
    "ageBracket": "21-30",
    "difficulty": 3,
    "text": "16. yüzyılda Avrupa'da Hristiyanlıkta yaşanan büyük ayrılığın (Reform hareketleri) öncüsü olarak kabul edilen ve 95 Tez'iyle tanınan Alman din adamı kimdir?",
    "options": [
      "Jean Calvin",
      "Erasmus",
      "Martin Luther",
      "Thomas More"
    ],
    "correctIndex": 2,
    "explanationShort": "Martin Luther, 1517'de Wittenberg Kilisesi'ne astığı 95 Tez ile Reform hareketlerinin fitilini ateşlemiştir.",
    "tags": [
      "Avrupa Tarihi",
      "Reform",
      "Martin Luther",
      "Hristiyanlık"
    ],
    "id": "Q_1772740096654_jfbme"
  },
  {
    "category": "Tarih",
    "ageBracket": "21-30",
    "difficulty": 3,
    "text": "Osmanlı tarihinde Lale Devri olarak bilinen, 1718 Pasarofça Antlaşması ile başlayıp 1730 Patrona Halil İsyanı ile sona eren dönemin padişahı kimdir?",
    "options": [
      "III. Ahmed",
      "II. Mustafa",
      "I. Mahmud",
      "III. Selim"
    ],
    "correctIndex": 0,
    "explanationShort": "Lale Devri, Padişah III. Ahmed döneminde yaşanmış, barış ve yenileşme hareketlerinin olduğu bir dönemdir.",
    "tags": [
      "Osmanlı",
      "Lale Devri",
      "Padişah",
      "III. Ahmed"
    ],
    "id": "Q_1772740096654_jupbr"
  },
  {
    "category": "Tarih",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "İstanbul'un fethi sonrası Fatih Sultan Mehmet'in Bizans'ın son dönemindeki önemli alimlerini ve sanatçılarını koruma altına alarak Osmanlı kültürüne entegre etme çabası hangi kavramla anılır?",
    "options": [
      "A) Rönesans Hamlesi",
      "B) İskan Politikası",
      "C) Devşirme Sistemi",
      "D) Millet Sistemi"
    ],
    "correctIndex": 0,
    "explanationShort": "Fatih Sultan Mehmet, fetihten sonra şehrin entelektüel birikimini korumak ve geliştirmek için önemli adımlar atmıştır.",
    "tags": [
      "Fatih Sultan Mehmet",
      "İstanbul'un Fethi",
      "Osmanlı İmparatorluğu",
      "Rönesans"
    ],
    "id": "Q_1772740111967_plpzn"
  },
  {
    "category": "Tarih",
    "ageBracket": "31-40",
    "difficulty": 3,
    "text": "Malazgirt Savaşı (1071) sonrası Anadolu'da kurulan ilk Türk beyliklerinden biri olan ve Erzincan, Kemah, Divriği civarında hüküm süren beylik hangisidir?",
    "options": [
      "A) Danişmentliler",
      "B) Saltuklular",
      "C) Mengücekliler",
      "D) Artuklular"
    ],
    "correctIndex": 2,
    "explanationShort": "Mengücekliler, Malazgirt Zaferi'nden sonra Erzincan merkezli kurulmuş ilk Türk beyliklerindendir.",
    "tags": [
      "Malazgirt Savaşı",
      "Anadolu Beylikleri",
      "Mengücekliler",
      "Selçuklu Dönemi"
    ],
    "id": "Q_1772740111967_czm1s"
  },
  {
    "category": "Tarih",
    "ageBracket": "31-40",
    "difficulty": 2,
    "text": "Milli Mücadele döneminde, \"Manda ve Himaye kabul edilemez!\" ilkesinin ilk kez dile getirildiği ve benimsendiği kongre hangisidir?",
    "options": [
      "A) Sivas Kongresi",
      "B) Erzurum Kongresi",
      "C) Amasya Genelgesi",
      "D) Balıkesir Kongresi"
    ],
    "correctIndex": 0,
    "explanationShort": "Manda ve himaye fikri Erzurum Kongresi'nde reddedilse de, tüm yurdu kapsayan ve kesinleşen karar Sivas Kongresi'nde alınmıştır.",
    "tags": [
      "Milli Mücadele",
      "Sivas Kongresi",
      "Kurtuluş Savaşı",
      "Manda ve Himaye"
    ],
    "id": "Q_1772740111967_9ho4k"
  },
  {
    "category": "Tarih",
    "ageBracket": "31-40",
    "difficulty": 3,
    "text": "Tarihte yazıyı (çivi yazısı) ilk kez kullanarak medeniyetin gelişimine büyük katkıda bulunan Mezopotamya uygarlığı hangisidir?",
    "options": [
      "A) Babilliler",
      "B) Sümerler",
      "C) Asurlular",
      "D) Akadlar"
    ],
    "correctIndex": 1,
    "explanationShort": "Çivi yazısı, MÖ 3200 civarında Sümerler tarafından geliştirilmiştir.",
    "tags": [
      "Mezopotamya",
      "Sümerler",
      "Çivi Yazısı",
      "Yazı"
    ],
    "id": "Q_1772740111967_per59"
  },
  {
    "category": "Tarih",
    "ageBracket": "31-40",
    "difficulty": 3,
    "text": "Rönesans döneminin en önemli figürlerinden biri olan, \"Son Akşam Yemeği\" ve \"Mona Lisa\" gibi eserleriyle tanınan evrensel deha kimdir?",
    "options": [
      "A) Michelangelo",
      "B) Raphael",
      "C) Leonardo da Vinci",
      "D) Donatello"
    ],
    "correctIndex": 2,
    "explanationShort": "Leonardo da Vinci, Rönesans'ın en bilinen temsilcilerinden olup \"Mona Lisa\" ve \"Son Akşam Yemeği\" gibi dünyaca ünlü eserlerin sahibidir.",
    "tags": [
      "Rönesans",
      "Sanat Tarihi",
      "Leonardo da Vinci",
      "Mona Lisa"
    ],
    "id": "Q_1772740111967_iwhjz"
  },
  {
    "category": "Tarih",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "Osmanlı İmparatorluğu'nda 1839 yılında ilan edilen ve modernleşme çabalarının önemli bir adımı olan Tanzimat Fermanı'nın ilanında büyük rol oynayan devlet adamı kimdir?",
    "options": [
      "Mustafa Reşit Paşa",
      "Mithat Paşa",
      "Mahmut Şevket Paşa",
      "Talat Paşa"
    ],
    "correctIndex": 0,
    "explanationShort": "Tanzimat Fermanı, Mustafa Reşit Paşa tarafından Gülhane Hatt-ı Hümayunu olarak okunmuştur.",
    "tags": [
      "Osmanlı",
      "Tanzimat",
      "Reform"
    ],
    "id": "Q_1772740127005_74p27"
  },
  {
    "category": "Tarih",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "Türk Kurtuluş Savaşı'nın başlangıcında, milli mücadelenin gerekçesini, amacını ve yöntemini belirten önemli belgelerden biri olan Amasya Genelgesi hangi tarihte yayımlanmıştır?",
    "options": [
      "23 Nisan 1920",
      "19 Mayıs 1919",
      "22 Haziran 1919",
      "30 Ağustos 1922"
    ],
    "correctIndex": 2,
    "explanationShort": "Amasya Genelgesi, 22 Haziran 1919'da yayımlanarak milli mücadelenin yol haritasını çizmiştir.",
    "tags": [
      "Kurtuluş Savaşı",
      "Amasya Genelgesi",
      "Cumhuriyet"
    ],
    "id": "Q_1772740127005_gxpz0"
  },
  {
    "category": "Tarih",
    "ageBracket": "41-50",
    "difficulty": 3,
    "text": "Anadolu'da kurulan ve M.Ö. 1600'lü yıllardan itibaren önemli bir güç haline gelen Hititler, bilinen ilk yazılı antlaşma olan Kadeş Antlaşması'nı hangi medeniyetle imzalamışlardır?",
    "options": [
      "Mısırlılar",
      "Sümerler",
      "Akadlar",
      "Babilliler"
    ],
    "correctIndex": 0,
    "explanationShort": "Kadeş Antlaşması, Hititler ile Mısırlılar arasında imzalanmış bilinen ilk yazılı antlaşmadır.",
    "tags": [
      "Hititler",
      "Kadeş Antlaşması",
      "Anadolu Uygarlıkları"
    ],
    "id": "Q_1772740127005_6b449"
  },
  {
    "category": "Tarih",
    "ageBracket": "41-50",
    "difficulty": 2,
    "text": "Soğuk Savaş döneminin en somut sembollerinden biri olan Berlin Duvarı, Doğu ve Batı Berlin'i ayırarak hangi yılda inşa edilmiştir?",
    "options": [
      "1949",
      "1953",
      "1961",
      "1968"
    ],
    "correctIndex": 2,
    "explanationShort": "Berlin Duvarı, 13 Ağustos 1961'de Doğu Almanya tarafından inşa edilmiştir.",
    "tags": [
      "Soğuk Savaş",
      "Berlin Duvarı",
      "Dünya Tarihi"
    ],
    "id": "Q_1772740127005_e093i"
  },
  {
    "category": "Tarih",
    "ageBracket": "41-50",
    "difficulty": 3,
    "text": "Türk tarihinde Anadolu'nun kapılarını Türklere açan ve Büyük Selçuklu Devleti için dönüm noktası olan Malazgirt Savaşı, hangi Bizans İmparatoru ile yapılmıştır?",
    "options": [
      "I. Justinianus",
      "Romen Diyojen",
      "I. Theodosius",
      "Konstantinopolis XI."
    ],
    "correctIndex": 1,
    "explanationShort": "Malazgirt Savaşı, Büyük Selçuklu Hükümdarı Alparslan ile Bizans İmparatoru Romen Diyojen arasında gerçekleşmiştir.",
    "tags": [
      "Selçuklular",
      "Malazgirt Savaşı",
      "Bizans"
    ],
    "id": "Q_1772740127005_as8y4"
  },
  {
    "category": "Tarih",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "Fatih Sultan Mehmet tarafından İstanbul'un fethi öncesinde, kentin Karadeniz ile bağlantısını kontrol altında tutmak amacıyla Boğaz'ın Avrupa yakasında inşa ettirilen stratejik kale aşağıdakilerden hangisidir?",
    "options": [
      "Rumeli Hisarı",
      "Anadolu Hisarı",
      "Yedikule Hisarı",
      "Kız Kulesi"
    ],
    "correctIndex": 0,
    "explanationShort": "Rumeli Hisarı (Boğazkesen Hisarı olarak da bilinir) İstanbul'un fethi için stratejik bir öneme sahipti.",
    "tags": [
      "Osmanlı",
      "Fatih Sultan Mehmet",
      "İstanbul Fethi",
      "Kale"
    ],
    "id": "Q_1772740147149_oll1s"
  },
  {
    "category": "Tarih",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "Mustafa Kemal Atatürk önderliğinde, Kurtuluş Savaşı döneminde alınan kararlarla ulusal egemenlik ve tam bağımsızlık ilkesinin vurgulandığı, aynı zamanda manda ve himaye fikrinin kesin olarak reddedildiği ilk kongre aşağıdakilerden hangisidir?",
    "options": [
      "Erzurum Kongresi",
      "Sivas Kongresi",
      "Pozantı Kongresi",
      "Afyon Kongresi"
    ],
    "correctIndex": 0,
    "explanationShort": "Erzurum Kongresi, manda ve himaye fikrinin reddedildiği ve ulusal bağımsızlığın vurgulandığı ilk kongredir.",
    "tags": [
      "Kurtuluş Savaşı",
      "Mustafa Kemal Atatürk",
      "Erzurum Kongresi",
      "Türkiye Cumhuriyeti"
    ],
    "id": "Q_1772740147149_lxol7"
  },
  {
    "category": "Tarih",
    "ageBracket": "51-60",
    "difficulty": 2,
    "text": "Tarihte bilinen ilk madeni parayı basarak ticarette takas sisteminin yerine para sistemini getiren ve başkenti Sard (Salihli yakınları) olan Anadolu uygarlığı aşağıdakilerden hangisidir?",
    "options": [
      "Hititler",
      "Frigler",
      "Lidyalılar",
      "Urartular"
    ],
    "correctIndex": 2,
    "explanationShort": "Lidyalılar, M.Ö. 7. yüzyılda ilk madeni parayı basarak ticarette önemli bir devrim yaratmışlardır.",
    "tags": [
      "Anadolu Uygarlıkları",
      "Lidyalılar",
      "Para",
      "Tarih Öncesi"
    ],
    "id": "Q_1772740147149_pq9e1"
  },
  {
    "category": "Tarih",
    "ageBracket": "51-60",
    "difficulty": 3,
    "text": "Osmanlı Devleti, I. Dünya Savaşı sırasında müttefiki olan devletlere yardım etmek amacıyla kendi sınırları dışında da cephelerde savaşmıştır. Aşağıdaki cephelerden hangisi, Osmanlı askerlerinin Avrupa'daki müttefiklerine destek olmak için mücadele ettiği bir 'yardım cephesi'dir?",
    "options": [
      "Çanakkale Cephesi",
      "Kanal Cephesi",
      "Galiçya Cephesi",
      "Kafkas Cephesi"
    ],
    "correctIndex": 2,
    "explanationShort": "Galiçya Cephesi, Osmanlı'nın Avusturya-Macaristan'a yardım amacıyla asker gönderdiği, kendi toprakları dışındaki cephelerden biridir.",
    "tags": [
      "I. Dünya Savaşı",
      "Osmanlı",
      "Cepheler",
      "Galiçya"
    ],
    "id": "Q_1772740147149_ck9nd"
  },
  {
    "category": "Tarih",
    "ageBracket": "51-60",
    "difficulty": 3,
    "text": "Avrupa'da bilim, kültür ve sanat alanında büyük bir dönüşüm başlatan ve modern Avrupa'nın temellerini atan, yeniden doğuş anlamına gelen tarihi dönem aşağıdakilerden hangisidir?",
    "options": [
      "Reform",
      "Aydınlanma Çağı",
      "Rönesans",
      "Sanayi Devrimi"
    ],
    "correctIndex": 2,
    "explanationShort": "Rönesans, 14. yüzyılda İtalya'da başlayıp tüm Avrupa'ya yayılan, bilim ve sanatta yeniden doğuş anlamına gelen bir dönemin adıdır.",
    "tags": [
      "Avrupa Tarihi",
      "Rönesans",
      "Sanat",
      "Kültür"
    ],
"id": "Q_1772740147149_tmlhb"
  }
];


const normalizeText = (value = "") =>
  value
    .toString()
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");

const dedupeQuestions = (questions) => {
  const seen = new Set();
  return questions.filter((q) => {
    if (!q?.text || !Array.isArray(q?.options) || q.options.length !== 4) return false;
    const textKey = normalizeText(q.text);
    if (seen.has(textKey)) return false;
    seen.add(textKey);
    return true;
  });
};

const mergeQuestionPools = (oldPool, newPool) => dedupeQuestions([...oldPool, ...newPool]);

const buildUsedSummary = (pool, usedIds = []) =>
  pool
    .filter((q) => usedIds.includes(q.id))
    .slice(-24)
    .map((q) => q.text)
    .join(" | ");

const getTargetDifficulty = (round) => {
  if (round >= 11) return 4;
  if (round >= 6) return 3;
  return 2;
};

const getQuestionTime = (maxRounds) => (maxRounds === 20 ? 12 : 15);

const pickQuestion = ({ pool, category, ageBracket, usedIds, round }) => {
  const targetDifficulty = getTargetDifficulty(round);
  const notUsed = pool.filter((q) => !usedIds.includes(q.id));

  const scoreQuestion = (q) => {
    let score = 0;
    if (q.ageBracket === ageBracket) score += 5;
    if (category === "Karışık" || q.category === category || q.category === "Karışık") score += 4;
    if (q.difficulty === targetDifficulty) score += 5;
    else if (Math.abs((q.difficulty || 2) - targetDifficulty) === 1) score += 2;
    return score;
  };

  const sorted = [...notUsed]
    .map((q) => ({ q, score: scoreQuestion(q) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (sorted.length > 0) {
    const top = sorted.filter((item) => item.score === sorted[0].score).map((item) => item.q);
    return top[Math.floor(Math.random() * top.length)];
  }

  return notUsed[Math.floor(Math.random() * notUsed.length)] || null;
};

const generateQuestionsBatch = async ({ category, ageBracket, count, usedSummary, round }) => {
  if (!GEMINI_API_KEY) return [];

  const targetDifficulty = getTargetDifficulty(round);
  const prompt = `
Sen profesyonel bir bilgi yarışması soru yazarı ve doğruluk editörüsün.

${count} adet Türkçe, 4 şıklı, çoktan seçmeli soru üret.
Kurallar:
- Kategori: ${category}
- Yaş grubu: ${ageBracket}
- Hedef zorluk: ${targetDifficulty}
- Sorular doğru, net ve kısa olsun.
- explanationShort mutlaka dolu olsun.
- correctIndex 0 ile 3 arasında olsun.
- Aynı veya benzer soruları tekrar üretme.
- Son kullanılan sorular: ${usedSummary || "Yok"}

Sadece JSON ARRAY döndür. Markdown kullanma.
Şema:
[
  {
    "category": "${category}",
    "ageBracket": "${ageBracket}",
    "difficulty": ${targetDifficulty},
    "text": "",
    "options": ["", "", "", ""],
    "correctIndex": 0,
    "explanationShort": "",
    "tags": []
  }
]`.trim();

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) return [];
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];

    return dedupeQuestions(
      parsed
        .filter((q) => q?.text && Array.isArray(q?.options) && q.options.length === 4)
        .map((q, i) => ({
          ...q,
          category: q.category || category,
          ageBracket: q.ageBracket || ageBracket,
          difficulty: Number.isFinite(q.difficulty) ? q.difficulty : targetDifficulty,
          explanationShort: q.explanationShort || "Bu soru için kısa açıklama bulunamadı.",
          tags: Array.isArray(q.tags) ? q.tags : [],
          id: `Q_API_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          source: "gemini",
        }))
    );
  } catch (err) {
    console.error("Gemini API Hatası:", err);
    return [];
  }
};

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] ${className}`}>
    {children}
  </div>
);

const SelectChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
        : "bg-white/5 text-slate-300 hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomData, setRoomData] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [jokers, setJokers] = useState({ fiftyFifty: 1 });
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [roundCount, setRoundCount] = useState(10);
  const [selectedAgeBracket, setSelectedAgeBracket] = useState("21-30");
  const [localPool, setLocalPool] = useState(dedupeQuestions(initialSeedQuestions.map((q) => ({ ...q, source: "local" }))));

  const canvasRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const lastTickRef = useRef(null);

  const myPlayer = useMemo(() => {
    if (!user || !roomData?.players) return null;
    return roomData.players[user.uid] || null;
  }, [user, roomData]);

  useEffect(() => {
    signInAnonymously(auth).catch((err) => {
      console.error(err);
      setErrorMessage("Firebase anonymous auth açılamadı.");
    });
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !roomId) return;
    const roomRef = doc(db, "rooms", roomId);
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) setRoomData(docSnap.data());
      else setRoomData(null);
    });
    return () => unsub();
  }, [user, roomId]);

  useEffect(() => {
    if (!roomData || !user) return;
    const isHost = roomData.hostId === user.uid;

    const interval = setInterval(() => {
      if (!roomData.phaseEndsAt) {
        setTimeLeft(0);
        return;
      }

      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((roomData.phaseEndsAt - now) / 1000));
      setTimeLeft(remaining);

      if (isHost && !isTransitioningRef.current) {
        if (now >= roomData.phaseEndsAt) {
          isTransitioningRef.current = true;
          handlePhaseTransition(roomData).finally(() => {
            setTimeout(() => {
              isTransitioningRef.current = false;
            }, 250);
          });
        } else if (roomData.state === PHASES.QUESTION) {
          const playerCount = Object.keys(roomData.players || {}).length;
          const answerCount = Object.keys(roomData.answers || {}).length;
          if (playerCount > 0 && answerCount >= playerCount) {
            isTransitioningRef.current = true;
            handlePhaseTransition(roomData).finally(() => {
              setTimeout(() => {
                isTransitioningRef.current = false;
              }, 250);
            });
          }
        }
      }

      if (isHost && isDemo) simulateBots(roomData, remaining);
    }, 250);

    return () => clearInterval(interval);
  }, [roomData, user, isDemo, localPool]);

  useEffect(() => {
    if (!roomData) return;
    if (roomData.state === PHASES.REVEAL) {
      const q = roomData.currentQuestion;
      const myAns = roomData.answers?.[user?.uid]?.optionIndex;
      if (typeof myAns === "number" && q) {
        if (myAns === q.correctIndex) playSound("correct");
        else playSound("wrong");
      }
    } else if (roomData.state === PHASES.END) playSound("win");
    else if (roomData.state === PHASES.QUESTION) playSound("reveal");
  }, [roomData?.state, roomData, user]);

  useEffect(() => {
    if (roomData?.state !== PHASES.QUESTION) {
      lastTickRef.current = null;
      return;
    }
    if (timeLeft <= 5 && timeLeft > 0 && lastTickRef.current !== timeLeft) {
      lastTickRef.current = timeLeft;
      playSound("tick");
    }
  }, [timeLeft, roomData?.state]);

  useEffect(() => {
    if (roomData?.state === PHASES.QUESTION) setHiddenOptions([]);
  }, [roomData?.state]);

  const createRoom = async (demoMode = false) => {
    if (!user || !userName.trim()) return;

    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = doc(db, "rooms", newRoomId);
    const timePerQuestion = getQuestionTime(roundCount);

    const initialPlayers = {
      [user.uid]: { name: userName.trim(), score: 0, streak: 0, isBot: false, avatar: "😎" },
    };

    if (demoMode) {
      ["Bot Alpha", "Bot Beta", "Bot Gamma"].forEach((name, i) => {
        initialPlayers[`bot_${i}`] = { name, score: 0, streak: 0, isBot: true, avatar: "🤖" };
      });
    }

    await setDoc(roomRef, {
      id: newRoomId,
      hostId: user.uid,
      state: PHASES.LOBBY,
      settings: {
        ageBracket: selectedAgeBracket,
        maxRounds: roundCount,
        timePerQuestion,
      },
      players: initialPlayers,
      currentRound: 0,
      phaseEndsAt: null,
      currentQuestion: null,
      currentQuestionSource: null,
      votes: {},
      answers: {},
      usedIds: [],
      createdAt: Date.now(),
    });

    setIsDemo(demoMode);
    setRoomId(newRoomId);
  };

  const joinRoom = async (idToJoin) => {
    if (!user || !userName.trim() || !idToJoin.trim()) return;
    const formattedId = idToJoin.trim().toUpperCase();
    const roomRef = doc(db, "rooms", formattedId);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      setErrorMessage("Oda bulunamadı.");
      return;
    }
    await updateDoc(roomRef, {
      [`players.${user.uid}`]: { name: userName.trim(), score: 0, streak: 0, isBot: false, avatar: "🥸" },
    });
    setRoomId(formattedId);
    setIsDemo(false);
  };

  const handlePhaseTransition = async (room) => {
    const roomRef = doc(db, "rooms", room.id);

    if (room.state === PHASES.LOBBY) {
      await updateDoc(roomRef, {
        state: PHASES.VOTING,
        phaseEndsAt: Date.now() + TIMES.VOTING * 1000,
        currentRound: 1,
        votes: {},
        answers: {},
      });
      return;
    }

    if (room.state === PHASES.VOTING) {
      const voteCounts = {};
      Object.values(room.votes || {}).forEach((v) => {
        voteCounts[v] = (voteCounts[v] || 0) + 1;
      });

      let topCategory = "Karışık";
      let maxVote = -1;
      for (const [cat, count] of Object.entries(voteCounts)) {
        if (count > maxVote) {
          maxVote = count;
          topCategory = cat;
        }
      }

      const usedSummary = buildUsedSummary(localPool, room.usedIds || []);
      let selectedQ = pickQuestion({
        pool: localPool,
        category: topCategory,
        ageBracket: room.settings.ageBracket,
        usedIds: room.usedIds || [],
        round: room.currentRound || 1,
      });

      let source = selectedQ?.source || "local";

      if ((!selectedQ || (room.currentRound || 1) > 4) && GEMINI_API_KEY && !isDemo) {
        if (!selectedQ) {
          await updateDoc(roomRef, { state: PHASES.LOADING_QUESTION, phaseEndsAt: null });
        }

        const generated = await generateQuestionsBatch({
          category: topCategory,
          ageBracket: room.settings.ageBracket,
          count: 6,
          usedSummary,
          round: room.currentRound || 1,
        });

        if (generated.length > 0) {
          const mergedPool = mergeQuestionPools(localPool, generated);
          setLocalPool(mergedPool);
          selectedQ = pickQuestion({
            pool: mergedPool,
            category: topCategory,
            ageBracket: room.settings.ageBracket,
            usedIds: room.usedIds || [],
            round: room.currentRound || 1,
          });
          source = selectedQ?.source || "gemini";
        }
      }

      if (!selectedQ) {
        selectedQ = {
          category: topCategory,
          ageBracket: room.settings.ageBracket,
          difficulty: getTargetDifficulty(room.currentRound || 1),
          text: "Dünya'nın doğal uydusu hangisidir?",
          options: ["Mars", "Ay", "Venüs", "Jüpiter"],
          correctIndex: 1,
          explanationShort: "Dünya'nın doğal uydusu Ay'dır.",
          tags: ["uzay"],
          id: `Q_FALLBACK_${Date.now()}`,
          source: "fallback",
        };
        source = "fallback";
      }

      await updateDoc(roomRef, {
        state: PHASES.QUESTION,
        answers: {},
        phaseEndsAt: Date.now() + room.settings.timePerQuestion * 1000,
        currentQuestion: selectedQ,
        currentQuestionSource: source,
        usedIds: [...(room.usedIds || []), selectedQ.id],
      });
      return;
    }

    if (room.state === PHASES.QUESTION) {
      const correctIdx = room.currentQuestion.correctIndex;
      const newPlayers = { ...(room.players || {}) };
      let firstCorrectId = null;
      let fastestTime = Infinity;

      Object.entries(room.answers || {}).forEach(([uid, ans]) => {
        if (ans.optionIndex === correctIdx && ans.timeTaken < fastestTime) {
          fastestTime = ans.timeTaken;
          firstCorrectId = uid;
        }
      });

      Object.entries(newPlayers).forEach(([uid, p]) => {
        const ans = room.answers?.[uid];
        if (!ans) {
          newPlayers[uid].streak = 0;
          return;
        }
        if (ans.optionIndex === correctIdx) {
          const nextStreak = (p.streak || 0) + 1;
          let pts = 100 + Math.floor(Math.max(0, room.settings.timePerQuestion - ans.timeTaken) * 3);
          if (uid === firstCorrectId) pts += 30;
          if (nextStreak >= 3) pts += 50;
          newPlayers[uid].score += pts;
          newPlayers[uid].streak = nextStreak;
        } else newPlayers[uid].streak = 0;
      });

      await updateDoc(roomRef, {
        state: PHASES.REVEAL,
        phaseEndsAt: Date.now() + TIMES.REVEAL * 1000,
        players: newPlayers,
      });
      return;
    }

    if (room.state === PHASES.REVEAL) {
      await updateDoc(roomRef, {
        state: PHASES.SCOREBOARD,
        phaseEndsAt: Date.now() + TIMES.SCOREBOARD * 1000,
      });
      return;
    }

    if (room.state === PHASES.SCOREBOARD) {
      if (room.currentRound >= room.settings.maxRounds) {
        await updateDoc(roomRef, { state: PHASES.END, phaseEndsAt: null });
      } else {
        await updateDoc(roomRef, {
          state: PHASES.VOTING,
          phaseEndsAt: Date.now() + TIMES.VOTING * 1000,
          currentRound: room.currentRound + 1,
          votes: {},
          answers: {},
          currentQuestion: null,
          currentQuestionSource: null,
        });
      }
    }
  };

  const simulateBots = async (room, remainingTime) => {
    const bots = Object.keys(room.players || {}).filter((id) => room.players[id].isBot);
    const roomRef = doc(db, "rooms", room.id);

    if (room.state === PHASES.VOTING) {
      for (const botId of bots) {
        if (!room.votes?.[botId] && Math.random() > 0.95) {
          await updateDoc(roomRef, {
            [`votes.${botId}`]: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
          });
        }
      }
    }

    if (room.state === PHASES.QUESTION) {
      for (const botId of bots) {
        if (!room.answers?.[botId]) {
          const elapsed = Math.max(0, room.settings.timePerQuestion - remainingTime);
          if (elapsed >= 3 && Math.random() > 0.95) {
            const ansIdx = Math.random() > 0.4 ? room.currentQuestion.correctIndex : Math.floor(Math.random() * 4);
            await updateDoc(roomRef, {
              [`answers.${botId}`]: { optionIndex: ansIdx, timeTaken: elapsed },
            });
          }
        }
      }
    }
  };

  const submitVote = async (category) => {
    if (!roomData || roomData.state !== PHASES.VOTING || roomData.votes?.[user.uid]) return;
    playSound("click");
    await updateDoc(doc(db, "rooms", roomData.id), { [`votes.${user.uid}`]: category });
  };

  const submitAnswer = async (index) => {
    if (!roomData || roomData.state !== PHASES.QUESTION || roomData.answers?.[user.uid]) return;
    playSound("click");
    await updateDoc(doc(db, "rooms", roomData.id), {
      [`answers.${user.uid}`]: {
        optionIndex: index,
        timeTaken: Math.max(0, roomData.settings.timePerQuestion - timeLeft),
      },
    });
  };

  const useJokerFiftyFifty = () => {
    if (jokers.fiftyFifty <= 0 || roomData?.state !== PHASES.QUESTION || roomData.answers?.[user.uid]) return;
    setJokers((p) => ({ ...p, fiftyFifty: 0 }));
    const hide = [0, 1, 2, 3]
      .filter((i) => i !== roomData.currentQuestion.correctIndex)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    setHiddenOptions(hide);
  };

  const drawShareCard = () => {
    if (!canvasRef.current || !roomData || !user || !roomData.players?.[user.uid]) return;
    const ctx = canvasRef.current.getContext("2d");
    const p = roomData.players[user.uid];
    ctx.fillStyle = "#07111f";
    ctx.fillRect(0, 0, 400, 250);
    const g = ctx.createLinearGradient(0, 0, 400, 250);
    g.addColorStop(0, "#10b981");
    g.addColorStop(1, "#06b6d4");
    ctx.fillStyle = g;
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("ForgeAndPlay Quiz", 20, 40);
    ctx.fillStyle = "white";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Oyuncu: ${p.name}`, 20, 90);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(`${p.score} PUAN`, 20, 140);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Seri: ${p.streak} 🔥`, 20, 180);
  };

  useEffect(() => {
    if (roomData?.state === PHASES.END) drawShareCard();
  }, [roomData?.state]);

  const AppFrame = ({ children }) => (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#14213b_0%,#090d18_35%,#05070d_100%)] text-slate-100 selection:bg-emerald-400/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-10%] top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-4 sm:px-6 lg:px-8">{children}</div>
      <footer className="relative border-t border-white/5 bg-black/10 py-4 text-center text-xs text-slate-400">
        Powered by ForgeAndPlay • ForgeAndPlay tarafından yapılmıştır
      </footer>
    </div>
  );

  const Header = () => (
    <GlassCard className="mb-6 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-mono text-sm font-bold text-emerald-300">
            Oda: {roomData.id}
          </span>
          <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-300">
            Tur: {roomData.currentRound}/{roomData.settings.maxRounds}
          </span>
          <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-300">
            Yaş: {roomData.settings.ageBracket}
          </span>
          <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-300">
            Zorluk: {getTargetDifficulty(roomData.currentRound || 1)}
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Skor</span>
          <span className="flex items-center gap-1 text-2xl font-black text-amber-300">
            {roomData.players[user.uid]?.score || 0} <Zap size={18} />
          </span>
        </div>
      </div>
    </GlassCard>
  );

  if (!user) {
    return (
      <AppFrame>
        <div className="flex min-h-[85vh] items-center justify-center">
          <GlassCard className="w-full max-w-md p-8 text-center">
            <Sparkles className="mx-auto mb-4 animate-spin text-emerald-400" size={42} />
            <div className="text-lg font-semibold">Bağlanıyor...</div>
          </GlassCard>
        </div>
      </AppFrame>
    );
  }

  if (!roomId || !roomData) {
    return (
      <AppFrame>
        <div className="flex min-h-[85vh] items-center justify-center">
          <GlassCard className="w-full max-w-2xl overflow-hidden">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="border-b border-white/10 bg-gradient-to-br from-emerald-500/15 via-cyan-400/10 to-transparent p-8 lg:border-b-0 lg:border-r">
                <div className="mb-6 inline-flex rounded-2xl border border-white/10 bg-white/5 p-3">
                  <Trophy className="text-emerald-300" size={34} />
                </div>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                  ForgeAndPlay <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">Quiz</span>
                </h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                  2026 stilinde akıcı, enerjik ve keyif veren çok oyunculu quiz deneyimi. Tablet, mobil ve masaüstünde hızlı çalışır.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Orbit, title: "Canlı oda", text: "Kod ile hızlı katılım" },
                    { icon: Wand2, title: "Akıllı soru akışı", text: "Yaşa ve tura göre" },
                    { icon: Layers3, title: "Trend arayüz", text: "Mobil uyumlu" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <item.icon size={18} className="mb-2 text-emerald-300" />
                      <div className="font-semibold">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Oyuncu adı</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Oyuncu adın"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
                    />
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium text-slate-300">Tur sayısı</div>
                    <div className="flex flex-wrap gap-2">
                      {ROUND_OPTIONS.map((round) => (
                        <SelectChip key={round} active={roundCount === round} onClick={() => setRoundCount(round)}>
                          {round} Tur
                        </SelectChip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium text-slate-300">Yaş aralığı</div>
                    <div className="flex flex-wrap gap-2">
                      {AGE_BRACKETS.map((age) => (
                        <SelectChip key={age} active={selectedAgeBracket === age} onClick={() => setSelectedAgeBracket(age)}>
                          {age}
                        </SelectChip>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    Zorluk akışı: <span className="font-semibold text-emerald-300">1-5 tur: 2</span> • <span className="font-semibold text-cyan-300">6-10 tur: 3</span> • <span className="font-semibold text-fuchsia-300">11-20 tur: 4</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => createRoom(true)}
                      disabled={!userName.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 font-bold text-white transition hover:scale-[1.01] hover:bg-indigo-400 disabled:opacity-50"
                    >
                      <Play size={18} /> Demo Modu
                    </button>
                    <button
                      onClick={() => createRoom(false)}
                      disabled={!userName.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:scale-[1.01] disabled:opacity-50"
                    >
                      <Users size={18} /> Yeni Oda Kur
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ODA KODU"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-emerald-400/50"
                    />
                    <button
                      onClick={() => joinRoom(joinCode)}
                      disabled={!userName.trim() || !joinCode.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
                    >
                      Katıl <ChevronRight size={16} />
                    </button>
                  </div>

                  {errorMessage && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{errorMessage}</div>}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </AppFrame>
    );
  }

  if (roomData.state === PHASES.LOBBY) {
    return (
      <AppFrame>
        <div className="mx-auto max-w-5xl py-6">
          <Header />
          <GlassCard className="p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black">Oyun Lobisi</h2>
                <p className="mt-2 text-slate-400">Host tur sayısını ve yaş aralığını belirledi. Her turda zorluk kademe kademe artar.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                {roomData.settings.maxRounds} tur • yaş {roomData.settings.ageBracket} • süre {roomData.settings.timePerQuestion} sn
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(roomData.players || {}).map(([id, p]) => (
                <div key={id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 transition hover:bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">{p.avatar}</div>
                    <div>
                      <div className="text-lg font-bold">{p.name}</div>
                      <div className="text-sm text-slate-400">{id === roomData.hostId ? "Host" : p.isBot ? "Bot" : "Oyuncu"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {roomData.hostId === user.uid ? (
              <button
                onClick={() => handlePhaseTransition(roomData)}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 text-lg font-black text-slate-950 transition hover:scale-[1.01]"
              >
                OYUNU BAŞLAT
              </button>
            ) : (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-slate-300 animate-pulse">Host'un başlatması bekleniyor...</div>
            )}
          </GlassCard>
        </div>
      </AppFrame>
    );
  }

  if (roomData.state === PHASES.VOTING) {
    return (
      <AppFrame>
        <div className="mx-auto max-w-5xl py-6">
          <Header />
          <div className="mb-6 flex items-center justify-center gap-3 text-center text-5xl font-black text-emerald-300 sm:text-6xl">
            <Clock size={42} /> {timeLeft}
          </div>
          <GlassCard className="p-6 sm:p-8">
            <div className="text-center">
              <h2 className="text-3xl font-black sm:text-4xl">Kategori Seçimi</h2>
              <p className="mt-3 text-slate-400">Bu tur için kategori belirleniyor. Zorluk seviyesi: {getTargetDifficulty(roomData.currentRound || 1)}</p>
            </div>
            {roomData.votes?.[user.uid] ? (
              <div className="mt-8 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-8 text-center text-2xl font-bold text-amber-300 animate-pulse">Bekleniyor...</div>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => submitVote(cat)}
                    className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-base font-bold transition hover:scale-[1.02] hover:border-emerald-400/30 hover:bg-white/5 sm:text-lg"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </AppFrame>
    );
  }

  if (roomData.state === PHASES.LOADING_QUESTION) {
    return (
      <AppFrame>
        <div className="flex min-h-[80vh] items-center justify-center">
          <GlassCard className="p-10 text-center">
            <Sparkles className="mx-auto mb-4 animate-spin text-emerald-400" size={48} />
            <h2 className="text-2xl font-black">Yapay zeka soru hazırlıyor...</h2>
          </GlassCard>
        </div>
      </AppFrame>
    );
  }

  if (roomData.state === PHASES.QUESTION) {
    const sourceLabel = roomData.currentQuestionSource?.includes("gemini") ? "Gemini" : "Yerel Havuz";

    return (
      <AppFrame>
        <div className="mx-auto max-w-5xl py-6">
          <Header />
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-2xl bg-indigo-500/20 px-4 py-2 font-bold text-indigo-200">{roomData.currentQuestion.category}</span>
              <span className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-300">Kaynak: {sourceLabel}</span>
              <span className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-300">Zorluk: {getTargetDifficulty(roomData.currentRound || 1)}</span>
            </div>
            <div className={`text-5xl font-black ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-emerald-300"}`}>{timeLeft}</div>
          </div>

          <GlassCard className="mb-6 p-6 sm:p-8">
            <h2 className="text-center text-2xl font-black leading-tight sm:text-4xl">{roomData.currentQuestion.text}</h2>
          </GlassCard>

          <div className="mb-6 flex justify-center">
            <button
              onClick={useJokerFiftyFifty}
              disabled={jokers.fiftyFifty === 0 || !!roomData.answers?.[user.uid]}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.02] disabled:opacity-50"
            >
              <ShieldQuestion size={18} /> 50/50 Joker
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {roomData.currentQuestion.options.map((opt, idx) => {
              if (hiddenOptions.includes(idx)) {
                return <div key={idx} className="h-[92px] rounded-3xl border border-white/10 bg-white/5 opacity-20" />;
              }
              const isSelected = roomData.answers?.[user.uid]?.optionIndex === idx;
              const locked = !!roomData.answers?.[user.uid];
              return (
                <button
                  key={idx}
                  onClick={() => submitAnswer(idx)}
                  disabled={locked}
                  className={`group rounded-3xl border p-5 text-left text-base font-bold transition sm:text-lg ${
                    locked
                      ? isSelected
                        ? "border-amber-300 bg-amber-400 text-slate-950"
                        : "border-white/10 bg-white/5 opacity-50"
                      : "border-white/10 bg-slate-950/40 hover:scale-[1.01] hover:border-emerald-400/30 hover:bg-white/5"
                  }`}
                >
                  <span className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-slate-300 group-hover:bg-emerald-400/20 group-hover:text-emerald-200">{["A", "B", "C", "D"][idx]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </AppFrame>
    );
  }

  if (roomData.state === PHASES.REVEAL) {
    const q = roomData.currentQuestion;
    const isCorrect = roomData.answers?.[user.uid]?.optionIndex === q.correctIndex;
    return (
      <AppFrame>
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center py-6">
          <GlassCard className="w-full p-6 sm:p-8">
            <h1 className={`mb-6 text-center text-5xl font-black ${isCorrect ? "text-emerald-300" : "text-red-400"}`}>{isCorrect ? "DOĞRU!" : "YANLIŞ!"}</h1>
            <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-center text-2xl font-black sm:text-3xl">{q.text}</h2>
            </div>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {q.options.map((opt, idx) => {
                const isThisCorrect = idx === q.correctIndex;
                return (
                  <div key={idx} className={`rounded-3xl border p-5 text-lg font-bold ${isThisCorrect ? "border-emerald-300 bg-emerald-400 text-slate-950" : "border-white/10 bg-white/5 opacity-50"}`}>
                    {opt}
                  </div>
                );
              })}
            </div>
            <div className="rounded-3xl border border-indigo-400/20 bg-indigo-400/10 p-5 text-slate-200">
              <div className="mb-2 flex items-center gap-2 font-bold text-indigo-200"><Brain size={18} /> Kısa Açıklama</div>
              <p>{q.explanationShort}</p>
            </div>
          </GlassCard>
        </div>
      </AppFrame>
    );
  }

  if (roomData.state === PHASES.SCOREBOARD) {
    return (
      <AppFrame>
        <div className="mx-auto max-w-3xl py-6">
          <Header />
          <GlassCard className="p-6 sm:p-8">
            <h2 className="mb-6 text-center text-4xl font-black">Puan Durumu</h2>
            <div className="space-y-4">
              {Object.entries(roomData.players || {})
                .map(([id, p]) => ({ id, ...p }))
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div key={p.id} className={`flex items-center justify-between rounded-3xl border p-5 ${p.id === user.uid ? "border-indigo-400/30 bg-indigo-500/10" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center text-2xl font-black text-slate-500">#{idx + 1}</div>
                      <div className="text-3xl">{p.avatar}</div>
                      <div>
                        <div className="text-xl font-bold">{p.name}</div>
                        {p.streak >= 3 && <div className="text-xs font-bold text-amber-300"><Flame size={12} className="mr-1 inline" /> {p.streak} Seri</div>}
                      </div>
                    </div>
                    <div className="text-3xl font-black text-emerald-300">{p.score}</div>
                  </div>
                ))}
            </div>
          </GlassCard>
        </div>
      </AppFrame>
    );
  }

  if (roomData.state === PHASES.END) {
    return (
      <AppFrame>
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center py-6">
          <GlassCard className="w-full p-6 text-center sm:p-8">
            <Trophy size={82} className="mx-auto mb-5 text-amber-300" />
            <h1 className="mb-3 text-5xl font-black">OYUN BİTTİ!</h1>
            <p className="mb-8 text-slate-400">Skor kartını paylaşabilir ve yeni oyuna dönebilirsin.</p>
            <div className="mx-auto mb-8 max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-4 flex justify-center gap-2 text-center font-bold text-slate-300"><Share2 size={18} /> Skor Kartın</h3>
              <canvas ref={canvasRef} width={400} height={250} className="w-full rounded-2xl" />
            </div>
            <button onClick={() => window.location.reload()} className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-8 py-4 font-black text-slate-950 transition hover:scale-[1.01]">
              Ana Menüye Dön
            </button>
          </GlassCard>
        </div>
      </AppFrame>
    );
  }

  return null;
}
