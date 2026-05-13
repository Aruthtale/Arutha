import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

let client: any = null;

function getClient() {
  if (!client) {
    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export type Dimension = 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA';
export type RiskLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface Stats {
  JIWA: number;
  RAGA: number;
  HARTA: number;
  ILMU: number;
  KARMA: number;
}

export interface Quest {
  id: string;
  title: string;
  desc: string;
  stat: Dimension;
  xp: number;
  completed: boolean;
  quest_type?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'WORLD';
  is_global?: boolean;
  is_weekly?: boolean;
  steps?: {
    current: number;
    total: number;
    last_check_in?: string;
  };
}

export interface OnboardingAnswer {
  question: string;
  answer: string;
}

const MODELS_STABLE = [
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
  'gemini-3.1-pro-preview',
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to generate content with multiple model fallbacks and retries on 503/429 errors.
 */
async function generateWithFallback(prompt: string | any[], generationConfig?: any): Promise<string> {
  const aiClient = getClient();
  
  for (const modelName of MODELS_STABLE) {
    let retries = 3;
    let backoff = 1000;
    
    while (retries > 0) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: Array.isArray(prompt) ? prompt : prompt,
          generationConfig
        });
        
        const text = response.text;
        if (!text) {
          throw new Error("Empty response text");
        }
        return text;
      } catch (e: any) {
        console.warn(`Gemini Warning with ${modelName} (Retries left: ${retries - 1}):`, e.message || e);
        
        // Retry on Service Unavailable (503) or Rate Limit (429) or Overloaded
        const status = e.status || 0;
        const message = (e.message || "").toLowerCase();
        const isRetryable = status === 503 || status === 429 || message.includes('overloaded') || message.includes('high demand');
        
        if (isRetryable) {
          retries--;
          await delay(backoff);
          backoff *= 2; // Exponential backoff
          continue;
        }
        
        // If it's a 404 (Not Found), move to next model immediately
        if (status === 404 || message.includes('not found')) {
          break;
        }
        
        // For other errors, log and try next model
        break;
      }
    }
  }
  throw new Error("Critical: All AI models failed to respond. Please check your internet connection or API key.");
}

export async function generateOnboardingQuestions(userContext?: { usia?: number; gender?: string; username?: string; zodiac?: string }): Promise<string[]> {
  const contextText = userContext ? `\nTarget User: ${userContext.gender || 'Unknown'}, ${userContext.usia || '??'} tahun, Zodiak: ${userContext.zodiac || 'Unknown'}.` : '';
  const prompt = `Buatkan 10 pertanyaan pendek, simpel, dan cepat dijawab dalam bahasa Indonesia yang digunakan untuk menganalisis kepribadian seseorang layaknya karakter RPG. ${contextText}
Tujuan dari 10 pertanyaan ini adalah untuk memetakan orang tersebut ke dalam 5 dimensi:
- JIWA (Mental, spiritual, kedamaian batin)
- RAGA (Fisik, kesehatan, kekuatan)
- HARTA (Manajemen keuangan, karir, materi)
- ILMU (Pengetahuan, kebijaksanaan, rasa ingin tahu)
- KARMA (Hubungan sosial, empati, dampak pada orang lain)

Pertanyaan harus sangat pendek, santai (casual), dan disesuaikan dengan konteks usia/gender/zodiak user jika tersedia agar terasa lebih personal. Hindari pertanyaan filosofis yang terlalu dalam.
Kembalikan HANYA array JSON berisi 10 string pertanyaan, tanpa markdown tambahan.`;

  try {
    const text = await generateWithFallback(prompt);
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].replace(/^json/, '').replace(/```.*/, '').trim();
    }
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length >= 5) {
      return parsed;
    }
  } catch (e) {
    console.error("Critical AI Failure:", e);
  }

  return [
    "Apa hobimu saat sedang bosan?",
    "Pilih satu: Olahraga, Main Game, atau Tidur?",
    "Jika punya 10 juta, buat apa?",
    "Siapa tokoh idola atau panutanmu?",
    "Hal apa yang paling sering bikin kamu kepikiran?",
    "Apa cita-citamu waktu masih kecil?",
    "Suka keramaian atau menyendiri?",
    "Lebih pilih uang banyak atau teman banyak?",
    "Apa satu hal yang ingin kamu ubah dari dirimu?",
    "Sebutkan satu kata yang menggambarkan kamu hari ini!",
  ];
}

export async function generateSpecificQuestions(previousAnswers: OnboardingAnswer[]) {
  const context = previousAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n');
  const prompt = `Analisis jawaban user berikut ini untuk memahami profil mereka dalam 5 Dimensi (JIWA, RAGA, HARTA, ILMU, KARMA):
${context}

Berdasarkan data tersebut, buatlah 5 pertanyaan tambahan yang LEBIH SPESIFIK dan personal untuk memvalidasi atau memperdalam pemahaman tentang salah satu dimensi yang paling dominan atau paling lemah.
Pertanyaan harus tetap santai, pendek, dan menggunakan gaya bahasa 'lu/gue' jika cocok atau bahasa santai lainnya.
Kembalikan HANYA array JSON berisi 5 string pertanyaan.`;

  try {
    const text = await generateWithFallback(prompt);
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].replace(/^json/, '').replace(/```.*/, '').trim();
    }
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error("Failed to generate specific questions:", e);
  }

  return [
    "Jika harus memilih satu hal yang paling berharga, apa itu?",
    "Apa ketakutan terbesarmu dalam mencapai tujuan?",
    "Bagaimana cara lu biasanya menghadapi kegagalan?",
    "Siapa orang yang paling lu percayai saat ini?",
    "Apa satu pencapaian yang paling lu banggakan?",
  ];
}

export interface CharacterAnalysis {
  personality_type: string;
  personality_title: string;
  personality_desc: string;
  stats: Stats;
  character_summary: string;
  rationale?: string;
  newTalents?: string[];
  starter_quest: {
    title: string;
    desc: string;
    stat: string;
  };
}

export async function analyzeCharacter(answers: OnboardingAnswer[], userContext?: { usia?: number; gender?: string; username?: string; zodiac?: string }): Promise<CharacterAnalysis> {
  const qaBlock = answers.map((a, i) => `Pertanyaan ${i + 1}: "${a.question}"\nJawaban: "${a.answer}"`).join('\n\n');
  const validMBTI = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
  const contextBlock = userContext ? `Data User: Nama: ${userContext.username}, Usia: ${userContext.usia}, Gender: ${userContext.gender}, Zodiak: ${userContext.zodiac}\n\n` : '';
  const prompt = `Kamu adalah AI psikolog dan game designer ARUTHA. Analisis data user berikut dan berikan JSON. 
Max stats adalah 50. PENTING: Jangan memberikan angka yang sama atau hampir sama untuk semua statistik. 
Analisis setiap jawaban secara mendalam untuk menentukan bobot yang akurat pada 5 dimensi:
- JIWA: Berikan skor tinggi jika jawaban mencerminkan ketenangan, spiritualitas, atau introspeksi.
- RAGA: Berikan skor tinggi jika jawaban mencerminkan aktivitas fisik, energi, atau kesehatan.
- HARTA: Berikan skor tinggi jika jawaban mencerminkan ambisi karir, materi, atau manajemen sumber daya.
- ILMU: Berikan skor tinggi jika jawaban mencerminkan rasa ingin tahu, logika, atau belajar hal baru.
- KARMA: Berikan skor tinggi jika jawaban mencerminkan empati, sosial, atau keinginan menolong.

JSON format: {personality_type, personality_title, personality_desc, stats, character_summary, starter_quest}.
PENTING: personality_type HARUS secara eksak salah satu dari: ${validMBTI.join(', ')}.
${contextBlock}Data Jawaban User:
${qaBlock}`;

  try {
    const text = await generateWithFallback(prompt);
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].replace(/^json/, '').replace(/```.*/, '').trim();
    }
    const result = JSON.parse(jsonStr);
    
    const stats = result.stats || {};
    const normalizedStats = {
      JIWA: Math.min(50, Number(stats.JIWA || stats.jiwa) || 30),
      RAGA: Math.min(50, Number(stats.RAGA || stats.raga) || 30),
      HARTA: Math.min(50, Number(stats.HARTA || stats.harta) || 30),
      ILMU: Math.min(50, Number(stats.ILMU || stats.ilmu) || 30),
      KARMA: Math.min(50, Number(stats.KARMA || stats.karma) || 30),
    };

    return {
      personality_type: (result.personality_type || 'INFJ').toUpperCase(),
      personality_title: result.personality_title || 'The Advocate',
      personality_desc: result.personality_desc || 'Karakter dalam pencarian jati diri.',
      character_summary: result.character_summary || 'Karakter belum sepenuhnya terbaca oleh sistem.',
      rationale: text.split('```').pop()?.trim() || '',
      stats: normalizedStats,
      starter_quest: result.starter_quest || { title: 'Mulai Petualangan', desc: 'Lakukan langkah pertama hari ini.', stat: 'JIWA' }
    };
  } catch (e) {
    console.error("Analysis Failure:", e);
  }

  return {
    personality_type: 'INFJ',
    personality_title: 'The Advocate',
    personality_desc: 'Jiwa yang visioner dan penuh empati.',
    stats: { JIWA: 45, RAGA: 30, HARTA: 25, ILMU: 48, KARMA: 35 },
    character_summary: 'Analisis tertunda karena server AI Google sedang penuh.',
    starter_quest: { title: 'Langkah Awal', desc: 'Lakukan meditasi 5 menit.', stat: 'JIWA' }
  };
}

export async function generateDailyQuests(stats: Stats, moodContext?: string, isWeeklyPool?: boolean): Promise<Quest[]> {
  const moodPrompt = moodContext ? `\nMood User: "${moodContext}".` : '';
  const burnoutPrompt = isWeeklyPool ? `\nPENTING: Hasilkan 3 opsi misi WEEKLY progresif (butuh disiplin beberapa hari). XP: 1000-2000.` : '';
  
  const prompt = `Game master ARUTHA. Buat paket misi lengkap berdasarkan stats: JIWA:${stats.JIWA}, RAGA:${stats.RAGA}, HARTA:${stats.HARTA}, ILMU:${stats.ILMU}, KARMA:${stats.KARMA}.${moodPrompt}${burnoutPrompt} 

  ${isWeeklyPool ? '' : `Hasilkan total 6 misi dalam format JSON:
  - 3 misi "DAILY" (Ritual harian ringan, XP: 100-200)
  - 2 misi "WEEKLY" (Tantangan menengah seminggu, XP: 500-1000)
  - 1 misi "MONTHLY" (Pencapaian besar sebulan, XP: 2500-5000)`}

  JSON format: [{id, title, desc, stat, xp, quest_type: "DAILY"|"WEEKLY"|"MONTHLY"}].`;

  try {
    const text = await generateWithFallback(prompt);
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].replace(/^json/, '').replace(/```.*/, '').trim();
    }
    const quests = JSON.parse(jsonStr);
    return quests.map((q: any) => ({ ...q, completed: false }));
  } catch (e) {
    console.error("Quest Generation Failure:", e);
  }

  return [
    { id: 'f1', title: 'Refleksi Singkat', desc: 'Tulis 1 pencapaian kecil hari ini.', stat: 'JIWA', xp: 100, quest_type: 'DAILY', completed: false },
    { id: 'f2', title: 'Aksi Disiplin', desc: 'Lakukan peregangan selama 5 menit.', stat: 'RAGA', xp: 150, quest_type: 'DAILY', completed: false },
    { id: 'f3', title: 'Audit Kecil', desc: 'Cek pengeluaran hari ini dan catat.', stat: 'HARTA', xp: 120, quest_type: 'DAILY', completed: false },
    { id: 'f4', title: 'Eksplorasi Baru', desc: 'Pelajari 3 kata baru dalam bahasa asing.', stat: 'ILMU', xp: 600, quest_type: 'WEEKLY', completed: false },
    { id: 'f5', title: 'Kebaikan Berantai', desc: 'Bantu satu orang teman atau orang asing.', stat: 'KARMA', xp: 550, quest_type: 'WEEKLY', completed: false },
    { id: 'f6', title: 'Mastery Skill', desc: 'Selesaikan satu bab buku atau kursus.', stat: 'ILMU', xp: 3000, quest_type: 'MONTHLY', completed: false }
  ];
}

export async function verifyQuestCompletion(
  questTitle: string, 
  questDesc: string, 
  userNote: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<{ success: boolean; feedback: string }> {
  let promptText = `Validator Mentor Arutha. Verifikasi misi: "${questTitle}". Bukti catatan: "${userNote}".`;
  if (imageBase64) {
    promptText += ` Terdapat lampiran foto bukti.`;
  }
  promptText += ` Output JSON {success: boolean, feedback: string}.`;

  const contents: any[] = [{ text: promptText }];
  if (imageBase64 && imageMimeType) {
    contents.push({
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType
      }
    });
  }

  try {
    const text = await generateWithFallback(contents);
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].replace(/^json/, '').replace(/```.*/, '').trim();
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Verification Failure:", e);
  }
  return { success: true, feedback: "Progres diterima otomatis." };
}

export async function generateRecoveryQuests(fatigueDays: number): Promise<Quest[]> {
  const prompt = `Hasilkan 3 misi pemulihan ringan (berbeda dari biasanya) untuk user yang absen ${fatigueDays} hari. Gunakan variasi tema kegiatan (fisik, mental, atau sosial). Seed: ${Date.now()}. JSON format: [{id, title, desc, stat, xp: 150}].`;

  try {
    const text = await generateWithFallback(prompt);
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].replace(/^json/, '').replace(/```.*/, '').trim();
    }
    const quests = JSON.parse(jsonStr);
    return quests.map((q: any) => ({ ...q, completed: false }));
  } catch (e) {
    console.error("Recovery Quest Failure:", e);
  }
  return [{ id: 'rec-1', title: 'Hening Sejenak', desc: 'Duduk tenang selama 2 menit.', stat: 'JIWA', xp: 150, completed: false }];
}

export async function chatWithArbiter(
  message: string, 
  history: { role: 'user' | 'assistant', content: string }[], 
  userStats: Stats, 
  username: string
): Promise<string> {
  const systemPrompt = `
    Kamu adalah "THE ARBITER" - Teman pintar dan pemandu sistem di Arutha.
    User: ${username}. Stats: JIWA:${userStats.JIWA}, RAGA:${userStats.RAGA}, HARTA:${userStats.HARTA}, ILMU:${userStats.ILMU}, KARMA:${userStats.KARMA}.
    KEPRIBADIAN:
    - Jadilah teman yang suportif, santai, namun sangat paham informasi statistik user.
    - Bicara dengan nada bersahabat (friendly) dan informatif. Anggap user sebagai partner petualanganmu.
    - Fokus pada membantu user memahami progres hidupnya melalui data.
    - Singkat dan jelas, tapi tetap manusiawi. Hindari bahasa yang terlalu kaku atau seperti robot dingin.
  `;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    return await generateWithFallback(contents);
  } catch (e) {
    return "Dimensi astral sedang terganggu.";
  }
}

export interface MentalStateAnalysis {
  dominantCondition: string;
  riskLevel: 'GREEN' | 'YELLOW' | 'RED';
  primaryPattern: string;
  recommendation: string;
  emotionalKeywords: string[];
  phase: number;
  confidence: number;
}

export async function chatWithSoulGuard(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  username: string,
  messageCount: number,
  style: 'concise' | 'deep' = 'concise'
): Promise<string> {
  const currentPhase = messageCount <= 3 ? 1 : messageCount <= 8 ? 2 : 3;

  const systemPrompt = `
    Kamu adalah SOUL GUARD ARUTHA - Pendamping jiwa yang hangat dan psikolog pribadi bagi user.
    User: ${username}. Fase Saat Ini: ${currentPhase}.
    MODE KOMUNIKASI: ${style === 'deep' ? 'Sangat Empatik, Mendalam, Hangat' : 'Menenangkan, Suportif, Singkat'}.

    KEPRIBADIAN:
    - Bicaralah layaknya seorang psikolog sungguhan: tenang, tidak menghakimi, dan penuh perhatian.
    - Gunakan teknik validasi (misal: "Aku mengerti itu terasa berat...", "Wajar jika kamu merasa begitu...").
    - Berikan ruang bagi user untuk bercerita tanpa merasa terintimidasi.
    - Gunakan bahasa yang manusiawi dan menyentuh hati. Gunakan sedikit metafora cahaya/jiwa hanya jika memperkuat rasa aman.
    - Fokus utama: kesehatan mental, emosi, and ketenangan batin.

    STRATEGI PERCAKAPAN:
    - Fase 1 (Pesan 1-3): Bangun rasa percaya. Dengarkan dan validasi dengan lembut.
    - Fase 2 (Pesan 4-8): Eksplorasi emosi. Ajak user melihat ke dalam diri dengan pertanyaan terbuka yang reflektif.
    - Fase 3 (Pesan 9+): Pendampingan penuh. Berikan afirmasi dan dukungan yang menguatkan jiwa.
  `;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    return await generateWithFallback(contents, {
      maxOutputTokens: style === 'concise' ? 150 : 500,
      temperature: 0.7,
    });
  } catch (e) {
    return "Koneksiku terganggu. Aku tetap di sini.";
  }
}

export async function analyzeMentalState(
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  username: string
): Promise<MentalStateAnalysis | null> {
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  if (userMessages.length < 4) return null;

  const conversationText = conversationHistory
    .map(m => `[${m.role === 'user' ? username : 'SoulGuard'}]: ${m.content}`)
    .join('\n');

  const prompt = `Analis psikologis ARUTHA. JSON format. Percakapan: ${conversationText}. Output JSON {dominantCondition, riskLevel, primaryPattern, recommendation, emotionalKeywords, phase, confidence}.`;

  try {
    const text = await generateWithFallback(prompt);
    let jsonStr = text.trim();
    if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].replace(/^json/, '').replace(/```.*/, '').trim();
    }
    return JSON.parse(jsonStr) as MentalStateAnalysis;
  } catch (e) {
    return null;
  }
}
