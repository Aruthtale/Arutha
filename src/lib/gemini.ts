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
}

export interface OnboardingAnswer {
  question: string;
  answer: string;
}

const MODELS_3X = [
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview'
];

export async function generateOnboardingQuestions(): Promise<string[]> {
  const aiClient = getClient();
  const prompt = `Buatkan 10 pertanyaan pendek, simpel, dan cepat dijawab dalam bahasa Indonesia yang digunakan untuk menganalisis kepribadian seseorang layaknya karakter RPG. 
Tujuan dari 10 pertanyaan ini adalah untuk memetakan orang tersebut ke dalam 5 dimensi:
- JIWA (Mental, spiritual, kedamaian batin)
- RAGA (Fisik, kesehatan, kekuatan)
- HARTA (Manajemen keuangan, karir, materi)
- ILMU (Pengetahuan, kebijaksanaan, rasa ingin tahu)
- KARMA (Hubungan sosial, empati, dampak pada orang lain)

Pertanyaan harus sangat pendek, santai (casual), dan mudah dimengerti remaja (literasi rendah). Hindari pertanyaan filosofis yang terlalu dalam.
Kembalikan HANYA array JSON berisi 10 string pertanyaan, tanpa markdown tambahan.`;

  for (const modelName of MODELS_3X) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let jsonStr = text.trim();
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].replace(/^json/, '').trim();
      }
      return JSON.parse(jsonStr);
    } catch (e: any) {
      continue;
    }
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

export interface CharacterAnalysis {
  personality_type: string;
  personality_title: string;
  personality_desc: string;
  stats: Stats;
  character_summary: string;
  starter_quest: {
    title: string;
    desc: string;
    stat: string;
  };
}

export async function analyzeCharacter(answers: OnboardingAnswer[], userContext?: { usia?: number; gender?: string; username?: string }): Promise<CharacterAnalysis> {
  const aiClient = getClient();
  const qaBlock = answers.map((a, i) => `Pertanyaan ${i + 1}: "${a.question}"\nJawaban: "${a.answer}"`).join('\n\n');
  const validMBTI = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
  const prompt = `Kamu adalah AI psikolog dan game designer ARUTHA. Analisis data user dan berikan JSON. Max stats 50. JSON format: {personality_type, personality_title, personality_desc, stats, character_summary, starter_quest}.
PENTING: personality_type HARUS secara eksak salah satu dari: ${validMBTI.join(', ')}. Jangan membuat tipe lain.
Data: ${qaBlock}`;

  for (const modelName of MODELS_3X) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let jsonStr = text.trim();
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].replace(/^json/, '').trim();
      }
      const result = JSON.parse(jsonStr);
      
      // Safety Fallbacks: Garansi tidak ada data null yang masuk ke Supabase
      result.personality_type = result.personality_type || 'INFJ';
      if (!validMBTI.includes(result.personality_type.toUpperCase())) {
        result.personality_type = 'INFJ'; // Fallback aman
      } else {
        result.personality_type = result.personality_type.toUpperCase();
      }
      
      result.personality_title = result.personality_title || 'The Advocate';
      result.personality_desc = result.personality_desc || 'Karakter dalam pencarian jati diri.';
      result.character_summary = result.character_summary || 'Karakter belum sepenuhnya terbaca oleh sistem.';
      
      result.stats = {
        JIWA: Math.min(50, Number(result.stats?.JIWA) || 30),
        RAGA: Math.min(50, Number(result.stats?.RAGA) || 30),
        HARTA: Math.min(50, Number(result.stats?.HARTA) || 30),
        ILMU: Math.min(50, Number(result.stats?.ILMU) || 30),
        KARMA: Math.min(50, Number(result.stats?.KARMA) || 30),
      };

      return result;
    } catch (e: any) {
      continue; 
    }
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

export async function generateDailyQuests(stats: Stats, moodContext?: string): Promise<Quest[]> {
  const aiClient = getClient();
  const moodPrompt = moodContext ? `\nMood User: "${moodContext}".` : '';
  const prompt = `Game master ARUTHA. Buat 3 quest harian berdasarkan stats: JIWA:${stats.JIWA}, RAGA:${stats.RAGA}, HARTA:${stats.HARTA}, ILMU:${stats.ILMU}, KARMA:${stats.KARMA}.${moodPrompt} JSON format: [{id, title, desc, stat, xp: 150}].`;

  for (const modelName of MODELS_3X) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let jsonStr = text.trim();
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].replace(/^json/, '').trim();
      }
      const quests = JSON.parse(jsonStr);
      return quests.map((q: any) => ({ ...q, completed: false }));
    } catch (e: any) {
      continue;
    }
  }

  return [{ id: 'f1', title: 'Refleksi Singkat', desc: 'Tulis 1 pencapaian kecil hari ini.', stat: 'JIWA', xp: 100, completed: false }];
}

export async function verifyQuestCompletion(questTitle: string, questDesc: string, userNote: string): Promise<{ success: boolean; feedback: string }> {
  const aiClient = getClient();
  const prompt = `Validator Mentor Arutha. Verifikasi misi: "${questTitle}". Bukti: "${userNote}". Output JSON {success, feedback}.`;

  for (const modelName of MODELS_3X) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let jsonStr = text.trim();
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].replace(/^json/, '').trim();
      }
      return JSON.parse(jsonStr);
    } catch (e: any) {
      continue;
    }
  }
  return { success: true, feedback: "Progres diterima otomatis." };
}

export async function generateRecoveryQuests(fatigueDays: number): Promise<Quest[]> {
  const aiClient = getClient();
  const prompt = `Hasilkan 3 misi pemulihan ringan untuk user yang absen ${fatigueDays} hari. JSON format: [{id, title, desc, stat, xp: 150}].`;

  for (const modelName of MODELS_3X) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let jsonStr = text.trim();
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].replace(/^json/, '').trim();
      }
      const quests = JSON.parse(jsonStr);
      return quests.map((q: any) => ({ ...q, completed: false }));
    } catch (e: any) {
      continue;
    }
  }
  return [{ id: 'rec-1', title: 'Hening Sejenak', desc: 'Duduk tenang selama 2 menit.', stat: 'JIWA', xp: 150, completed: false }];
}

export async function chatWithArbiter(
  message: string, 
  history: { role: 'user' | 'assistant', content: string }[], 
  userStats: Stats, 
  username: string
): Promise<string> {
  const aiClient = getClient();
  const systemPrompt = `Kamu adalah "The Arbiter" asisten RPG Arutha. User: ${username}. Stats: JIWA:${userStats.JIWA}, RAGA:${userStats.RAGA}, HARTA:${userStats.HARTA}, ILMU:${userStats.ILMU}, KARMA:${userStats.KARMA}.`;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  for (const modelName of MODELS_3X) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: contents,
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      continue;
    }
  }
  return "Dimensi astral sedang terganggu.";
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
  const aiClient = getClient();
  const currentPhase = messageCount <= 3 ? 1 : messageCount <= 8 ? 2 : 3;

  const systemPrompt = `
    Kamu adalah SOUL GUARD ARUTHA. Pendamping jiwa mistis.
    MODE: ${style.toUpperCase()}. 
    - Jika 'CONCISE': Jawab MAKSIMAL DALAM 1 PARAGRAF SINGKAT (2-4 kalimat). Langsung ke inti, jangan berbasa-basi.
    - Jika 'DEEP': Boleh 2-3 paragraf.
    TAROT OF THE SOUL: Gunakan kartu SANGAT JARANG (1 per 10-15 pesan). Tag: [TAROT:card_id].
    ID: the_fool, the_magician, high_priestess, empress, emperor, hierophant, lovers, chariot, strength, hermit, wheel_of_fortune, justice, hanged_man, death, temperance, devil, tower, star, moon, sun, judgement, world.
    Jangan beri diagnosis medis. User: ${username}. Fase: ${currentPhase}. Hemat token.`;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  for (const modelName of MODELS_3X) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: contents,
        generationConfig: {
          maxOutputTokens: style === 'concise' ? 150 : 500,
          temperature: 0.7,
        }
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      continue;
    }
  }
  return "Koneksiku terganggu. Aku tetap di sini.";
}

export async function analyzeMentalState(
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  username: string
): Promise<MentalStateAnalysis | null> {
  const aiClient = getClient();
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  if (userMessages.length < 4) return null;

  const conversationText = conversationHistory
    .map(m => `[${m.role === 'user' ? username : 'SoulGuard'}]: ${m.content}`)
    .join('\n');

  const prompt = `Analis psikologis ARUTHA. JSON format. Percakapan: ${conversationText}. Output JSON {dominantCondition, riskLevel, primaryPattern, recommendation, emotionalKeywords, phase, confidence}.`;

  for (const modelName of MODELS_3X) {
    try {
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      let jsonStr = text.trim();
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].replace(/^json/, '').trim();
      }
      return JSON.parse(jsonStr) as MentalStateAnalysis;
    } catch (e) {
      continue;
    }
  }
  return null;
}
