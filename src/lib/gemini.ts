import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { supabase } from "./supabase";
import { APP_CONFIG } from "./config";

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
  quest_type?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'WORLD' | 'RECOVERY';
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
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.1-pro-preview'
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getFromCache(cacheKey: string) {
  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('response, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error) return null;
    if (data && new Date(data.expires_at) > new Date()) {
      return data.response;
    }
  } catch (e) {
    console.warn("AI Cache read failed:", e);
  }
  return null;
}

// Save to AI Cache via Supabase
async function saveToCache(cacheKey: string, model: string, prompt: string, response: any, ttlHours: number = 24) {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);
    
    await supabase.from('ai_cache').upsert({
      cache_key: cacheKey,
      model,
      prompt,
      response,
      expires_at: expiresAt.toISOString()
    });
  } catch (e) {
    console.warn("AI Cache save failed:", e);
  }
}

/**
 * Helper to generate content with multiple model fallbacks and retries on 503/429 errors.
 * Includes caching and simplified prompt on fallback.
 */
async function generateWithFallbackAndCache(
  prompt: string | any[], 
  cacheKey: string | null = null, 
  ttlHours: number = 24,
  schema?: z.ZodTypeAny
): Promise<any> {
  if (cacheKey) {
    const cached = await getFromCache(cacheKey);
    if (cached) return cached;
  }

  const aiClient = getClient();
  let currentPrompt = prompt;

  for (let i = 0; i < MODELS_STABLE.length; i++) {
    const modelName = MODELS_STABLE[i];
    let retries = 2;
    let backoff = 1000;

    // Simplified prompt for fallback models (if not the primary pro model and prompt is string)
    if (i > 0 && typeof currentPrompt === 'string') {
        currentPrompt = currentPrompt + "\n(Beri respon singkat dan langsung).";
    }

    while (retries > 0) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: Array.isArray(currentPrompt) ? currentPrompt : currentPrompt,
        });

        const text = response.text;
        if (!text) {
          throw new Error("Empty response text");
        }

        let parsedData = text;
        
        // If schema is provided, attempt to parse JSON
        if (schema) {
          let jsonStr = text.trim();
          if (jsonStr.includes('```')) {
            jsonStr = jsonStr.split('```')[1].replace(/^json/, '').replace(/```.*/, '').trim();
          }
          parsedData = JSON.parse(jsonStr);
          parsedData = schema.parse(parsedData);
        }

        if (cacheKey) {
          await saveToCache(cacheKey, modelName, JSON.stringify(currentPrompt), parsedData, ttlHours);
        }

        return parsedData;
      } catch (e: any) {
        console.warn(`Gemini Warning with ${modelName} (Retries left: ${retries - 1}):`, e.message || e);

        const status = e.status || 0;
        const message = (e.message || "").toLowerCase();
        
        // Retry only if it's a 503 or overloaded/high demand error
        const isRetryable = status === 503 || message.includes('overloaded') || message.includes('high demand');
        
        // If it's a 429 or quota limit, DO NOT retry the same model, jump to fallback immediately
        const isQuota = status === 429 || message.includes('quota') || message.includes('exhausted');

        if (isRetryable) {
          retries--;
          await delay(backoff);
          backoff *= 2; // Exponential backoff
          continue;
        } else if (isQuota) {
          break; // Break the while loop to move to the next model in MODELS_STABLE
        }

        break; // Move to next model on schema validation errors or fatal errors
      }
    }
  }
  throw new Error("Critical AI Failure.");
}

/**
 * Public export: generic AI generation with caching. Used by widgets like DailyTarotWidget.
 * @param prompt  - text prompt
 * @param cacheKey - supabase cache key (null = no cache)
 * @param ttlHours - cache TTL in hours
 */
export async function generateWithFallback(
  prompt: string,
  cacheKey: string | null = null,
  ttlHours = 24
): Promise<string> {
  return generateWithFallbackAndCache(prompt, cacheKey, ttlHours);
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

  const schema = z.array(z.string()).min(5);

  try {
    return await generateWithFallbackAndCache(prompt, null, 0, schema);
  } catch (e) {
    console.error("Critical AI Failure:", e);
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
}

export async function generateSpecificQuestions(previousAnswers: OnboardingAnswer[]) {
  const context = previousAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n');
  const prompt = `Analisis jawaban user berikut ini untuk memahami profil mereka dalam 5 Dimensi (JIWA, RAGA, HARTA, ILMU, KARMA):
${context}

Berdasarkan data tersebut, buatlah 5 pertanyaan tambahan yang LEBIH SPESIFIK dan personal untuk memvalidasi atau memperdalam pemahaman tentang salah satu dimensi yang paling dominan atau paling lemah.
Pertanyaan harus tetap santai, pendek, dan menggunakan gaya bahasa 'lu/gue' jika cocok atau bahasa santai lainnya.
Kembalikan HANYA array JSON berisi 5 string pertanyaan.`;

  const schema = z.array(z.string()).min(1);

  try {
    return await generateWithFallbackAndCache(prompt, null, 0, schema);
  } catch (e) {
    console.error("Failed to generate specific questions:", e);
    return [
      "Jika harus memilih satu hal yang paling berharga, apa itu?",
      "Apa ketakutan terbesarmu dalam mencapai tujuan?",
      "Bagaimana cara lu biasanya menghadapi kegagalan?",
      "Siapa orang yang paling lu percayai saat ini?",
      "Apa satu pencapaian yang paling lu banggakan?",
    ];
  }
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
  daily_oracle?: {
    quote: string;
    meaning: string;
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

JSON format: {personality_type, personality_title, personality_desc, stats: {JIWA, RAGA, HARTA, ILMU, KARMA}, character_summary, starter_quest: {title, desc, stat}}.
PENTING: personality_type HARUS secara eksak salah satu dari: ${validMBTI.join(', ')}.
${contextBlock}Data Jawaban User:
${qaBlock}`;

  const schema = z.object({
    personality_type: z.string(),
    personality_title: z.string(),
    personality_desc: z.string(),
    stats: z.object({
      JIWA: z.number().max(50),
      RAGA: z.number().max(50),
      HARTA: z.number().max(50),
      ILMU: z.number().max(50),
      KARMA: z.number().max(50),
    }),
    character_summary: z.string(),
    starter_quest: z.object({
      title: z.string(),
      desc: z.string(),
      stat: z.string()
    })
  });

  try {
    const result = await generateWithFallbackAndCache(prompt, null, 0, schema);
    
    return {
      personality_type: result.personality_type.toUpperCase(),
      personality_title: result.personality_title,
      personality_desc: result.personality_desc,
      character_summary: result.character_summary,
      stats: result.stats,
      starter_quest: result.starter_quest
    };
  } catch (e) {
    console.error("Analysis Failure:", e);
    return {
      personality_type: 'INFJ',
      personality_title: 'The Advocate',
      personality_desc: 'Jiwa yang visioner dan penuh empati.',
      stats: { JIWA: 45, RAGA: 30, HARTA: 25, ILMU: 48, KARMA: 35 },
      character_summary: 'Analisis tertunda karena server AI Google sedang penuh.',
      starter_quest: { title: 'Langkah Awal', desc: 'Lakukan meditasi 5 menit.', stat: 'JIWA' }
    };
  }
}

export async function generateDailyQuests(stats: Stats, moodContext?: string, isWeeklyPool?: boolean, userId?: string, forceRefresh?: boolean): Promise<Quest[]> {
  const moodPrompt = moodContext ? `\nMood User: "${moodContext}".` : '';
  const burnoutPrompt = isWeeklyPool ? `\nPENTING: Hasilkan 3 opsi misi WEEKLY progresif (butuh disiplin beberapa hari). XP: 1000-2000.` : '';
  const refreshPrompt = forceRefresh ? `\nPENTING: Ini adalah proses refresh manual misi harian. Hasilkan misi yang BENAR-BENAR BARU, UNIK, dan KREATIF! Hindari menghasilkan misi yang sama dengan sebelum-sebelumnya agar petualangan terasa segar. Gunakan variasi aktivitas fisik, mental, atau finansial yang unik.` : '';

  const prompt = `Game master ARUTHA. Buat paket misi lengkap berdasarkan stats: JIWA:${stats.JIWA}, RAGA:${stats.RAGA}, HARTA:${stats.HARTA}, ILMU:${stats.ILMU}, KARMA:${stats.KARMA}.${moodPrompt}${burnoutPrompt}${refreshPrompt} 

  ${isWeeklyPool ? '' : `Hasilkan total 6 misi dalam format JSON:
  - 3 misi "DAILY" (Ritual harian ringan, XP: 100-200)
  - 2 misi "WEEKLY" (Tantangan menengah seminggu, XP: 500-1000)
  - 1 misi "MONTHLY" (Pencapaian besar sebulan, XP: 2500-5000)`}

  JSON format: [{id, title, desc, stat, xp, quest_type: "DAILY"|"WEEKLY"|"MONTHLY"}].`;

  const schema = z.array(z.object({
    id: z.string().or(z.number()).transform(v => v.toString()),
    title: z.string(),
    desc: z.string(),
    stat: z.string(),
    xp: z.number(),
    quest_type: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional()
  }));

  const cacheKey = (userId && !forceRefresh) ? `quests_${userId}_${new Date().toISOString().split('T')[0]}_${isWeeklyPool ? 'weekly' : 'daily'}` : null;

  try {
    const quests = await generateWithFallbackAndCache(prompt, cacheKey, 24, schema);
    return quests.map((q: any) => ({ ...q, completed: false }));
  } catch (e) {
    console.error("Quest Generation Failure:", e);
    return [
      { id: 'f1', title: 'Refleksi Singkat', desc: 'Tulis 1 pencapaian kecil hari ini.', stat: 'JIWA', xp: 100, quest_type: 'DAILY', completed: false },
      { id: 'f2', title: 'Aksi Disiplin', desc: 'Lakukan peregangan selama 5 menit.', stat: 'RAGA', xp: 150, quest_type: 'DAILY', completed: false },
      { id: 'f3', title: 'Audit Kecil', desc: 'Cek pengeluaran hari ini dan catat.', stat: 'HARTA', xp: 120, quest_type: 'DAILY', completed: false },
      { id: 'f4', title: 'Eksplorasi Baru', desc: 'Pelajari 3 kata baru dalam bahasa asing.', stat: 'ILMU', xp: 600, quest_type: 'WEEKLY', completed: false },
      { id: 'f5', title: 'Kebaikan Berantai', desc: 'Bantu satu orang teman atau orang asing.', stat: 'KARMA', xp: 550, quest_type: 'WEEKLY', completed: false },
      { id: 'f6', title: 'Mastery Skill', desc: 'Selesaikan satu bab buku atau kursus.', stat: 'ILMU', xp: 3000, quest_type: 'MONTHLY', completed: false }
    ];
  }
}

export async function verifyQuestCompletion(
  questTitle: string,
  questDesc: string,
  userNote: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<{ success: boolean; feedback: string }> {
  let promptText = `Anda adalah Mentor Stoik Arutha yang bertugas memverifikasi penyelesaian misi (quest) pahlawan secara bijaksana, adil, dan tegas.
  
Misi yang dikerjakan:
- Judul Misi: "${questTitle}"
- Deskripsi Misi: "${questDesc}"

Bukti dari Pahlawan:
- Catatan Bukti: "${userNote}"
${imageBase64 ? "- Terlampir juga foto bukti fisik untuk Anda analisis." : "- Pahlawan TIDAK melampirkan foto bukti fisik (Ini diperbolehkan)."}

PENTING - ATURAN BUKTI FOTO:
- Foto bukti bersifat SEPENUHNYA OPSIONAL. 
- Jika pahlawan TIDAK mengirimkan foto, itu adalah tindakan yang sepenuhnya sah dan jujur. Anda TIDAK BOLEH menolak misi atau menuduh mereka berbohong/curang hanya karena mereka tidak melampirkan foto.
- Evaluasi kelayakan misi jika tidak ada foto harus didasarkan SEPENUHNYA pada isi "Catatan Bukti" mereka.

Tugas Anda:
1. Evaluasi apakah bukti catatan valid, jujur, relevan dengan Deskripsi Misi, dan bermakna. (Gunakan foto untuk validasi tambahan jika terlampir, tetapi abaikan jika tidak ada).
2. TOLAK (success = false) jika dan hanya jika:
   - Catatan pahlawan terdeteksi asal-asalan, berupa ketikan asal (seperti "asdf", "asdfgh", "qwerty", "123", "a"), spam, atau teks tidak bermakna lainnya.
   - Catatan terlalu pendek/low-effort (hanya 1-2 kata tidak bermakna seperti "ok", "done", "sudah", "test", "a") sementara misinya membutuhkan refleksi atau deskripsi tindakan.
   - Bukti catatan sama sekali tidak relevan dengan apa yang diminta oleh misi.
3. Jika ditolak, berikan feedback berupa nasihat bijak ala Mentor Stoik yang tegas namun tetap memotivasi. Jelaskan dengan detail kesalahan mereka secara spesifik pada CATATANNYA dan apa yang harus mereka perbaiki (misalnya meminta mereka menulis refleksi yang jujur). Jangan sebut-sebut masalah foto jika mereka memang memilih tidak melampirkannya.
4. Jika disetujui (success = true), berikan feedback berupa apresiasi Stoik yang mendalam, mengaitkannya dengan pertumbuhan karakter mereka.

Output HARUS berupa JSON dengan skema berikut:
{
  "success": boolean,
  "feedback": "Pesan dari Mentor Stoik Arutha dalam bahasa Indonesia"
}`;

  const contents: any[] = [{ text: promptText }];
  if (imageBase64 && imageMimeType) {
    contents.push({
      inlineData: {
        data: imageBase64,
        mimeType: imageMimeType
      }
    });
  }

  const schema = z.object({
    success: z.boolean(),
    feedback: z.string()
  });

  try {
    return await generateWithFallbackAndCache(contents, null, 0, schema);
  } catch (e) {
    console.error("Verification Failure:", e);
    return { success: true, feedback: "Progres diterima otomatis." };
  }
}

export async function generateRecoveryQuests(fatigueDays: number): Promise<Quest[]> {
  const prompt = `Hasilkan 3 misi pemulihan ringan (berbeda dari biasanya) untuk user yang absen ${fatigueDays} hari. Gunakan variasi tema kegiatan (fisik, mental, atau sosial). Seed: ${Date.now()}. JSON format: [{id, title, desc, stat, xp: 150}].`;

  const schema = z.array(z.object({
    id: z.string().or(z.number()).transform(v => v.toString()),
    title: z.string(),
    desc: z.string(),
    stat: z.string(),
    xp: z.number()
  }));

  try {
    const quests = await generateWithFallbackAndCache(prompt, null, 0, schema);
    return quests.map((q: any) => ({ ...q, completed: false, quest_type: 'RECOVERY' }));
  } catch (e) {
    console.error("Recovery Quest Failure:", e);
    return [{ id: 'rec-1', title: 'Hening Sejenak', desc: 'Duduk tenang selama 2 menit.', stat: 'JIWA', xp: 150, completed: false, quest_type: 'RECOVERY' }];
  }
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
    const responseText = await generateWithFallbackAndCache(contents);
    // Caching handled in caller if needed, or chat is volatile.
    return responseText;
  } catch (e) {
    return "Sang Arbiter sedang merenung, coba sebentar lagi…";
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
    return await generateWithFallbackAndCache(contents);
  } catch (e) {
    return "Soul Guard sedang mencari ketenangan, mari coba lagi nanti…";
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

  const schema = z.object({
    dominantCondition: z.string(),
    riskLevel: z.enum(["GREEN", "YELLOW", "RED"]),
    primaryPattern: z.string(),
    recommendation: z.string(),
    emotionalKeywords: z.array(z.string()),
    phase: z.number(),
    confidence: z.number()
  });

  try {
    return await generateWithFallbackAndCache(prompt, null, 0, schema);
  } catch (e) {
    return null;
  }
}
