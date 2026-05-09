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

export async function generateOnboardingQuestions(): Promise<string[]> {
  const aiClient = getClient();
  const prompt = `Buatkan 7 pertanyaan unik dan kreatif dalam bahasa Indonesia yang digunakan untuk menganalisis kepribadian seseorang layaknya karakter RPG. 
Tujuan dari 7 pertanyaan ini adalah untuk memetakan orang tersebut ke dalam 5 dimensi:
- JIWA (Mental, spiritual, kedamaian batin)
- RAGA (Fisik, kesehatan, kekuatan)
- HARTA (Manajemen keuangan, karir, materi)
- ILMU (Pengetahuan, kebijaksanaan, rasa ingin tahu)
- KARMA (Hubungan sosial, empati, dampak pada orang lain)

Pertanyaan harus terdengar seperti percakapan biasa (casual, tidak kaku), bukan seperti tes psikologi formal.
Kembalikan HANYA array JSON berisi 7 string pertanyaan, tanpa markdown tambahan.
Contoh format output:
[
  "Apa yang kamu lakukan kalau tiba-tiba punya waktu kosong seharian tanpa rencana?",
  "Pernah nggak sih kamu ngerasa bangga banget sama tubuhmu sendiri? Pas kapan itu?",
  ...dll
]`;

  const tryGenerate = async (modelName: string) => {
    const response = await aiClient.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let jsonStr = text.trim();
    if (jsonStr.includes('\`\`\`')) {
      jsonStr = jsonStr.split('\`\`\`')[1].replace(/^json/, '').trim();
    }
    return JSON.parse(jsonStr);
  };

  const modelsToTry = [
    'gemini-3.1-flash-lite-preview',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview'
  ];

  for (const modelName of modelsToTry) {
    try {
      return await tryGenerate(modelName);
    } catch (e: any) {
      console.warn(`Gen Questions ${modelName} gagal:`, e.message || e);
      continue;
    }
  }
  
  // Fallback if all models fail
  return [
    "Ceritakan, bagaimana harimu hari ini?",
    "Apa yang biasanya kamu lakukan ketika punya waktu senggang?",
    "Kalau ada uang 10 juta tiba-tiba masuk rekeningmu, apa yang pertama kamu pikirkan?",
    "Hal terakhir apa yang membuatmu penasaran dan ingin tahu lebih dalam?",
    "Bagaimana hubunganmu dengan orang-orang di sekitarmu belakangan ini?",
    "Apa yang paling sering membuatmu cemas atau khawatir?",
    "Kalau hidupmu dijadikan sebuah novel, kira-kira apa judul chapter yang sedang kamu jalani sekarang?",
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

export async function analyzeCharacter(answers: OnboardingAnswer[]): Promise<CharacterAnalysis> {
  const aiClient = getClient();
  const qaBlock = answers.map((a, i) => `Pertanyaan ${i + 1}: "${a.question}"\nJawaban: "${a.answer}"`).join('\n\n');

  const prompt = `Kamu adalah AI psikolog dan game designer untuk aplikasi bernama ARUTHA.
Analisis jawaban user berikut dan berikan output JSON MURNI untuk profil karakter RPG.

User Answers:
${qaBlock}

Output JSON format:
{
  "personality_type": "MBTI_TYPE",
  "personality_title": "Title in English",
  "personality_desc": "1-2 sentences in Indonesian",
  "stats": { "JIWA": 10-50, "RAGA": 10-50, "HARTA": 10-50, "ILMU": 10-50, "KARMA": 10-50 },
  "character_summary": "2-3 sentences narration in Indonesian",
  "starter_quest": { "title": "Quest Title", "desc": "Quest Desc", "stat": "LOWEST_STAT" }
}
PENTING: Nilai stats awal TIDAK BOLEH melebihi 50 agar pemain memiliki ruang untuk berkembang.`;

  const tryGenerate = async (modelName: string) => {
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
    
    // Hard-cap stats at 50
    if (result.stats) {
      Object.keys(result.stats).forEach(key => {
        const k = key as keyof Stats;
        result.stats[k] = Math.min(50, result.stats[k]);
      });
    }
    return result;
  };

  const modelsToTry = [
    'gemini-3.1-flash-lite-preview',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Menghubungi AI menggunakan model: ${modelName}...`);
      return await tryGenerate(modelName);
    } catch (e: any) {
      // Menangkap error APAPUN (503, 429, dll) dan lanjut ke model berikutnya
      console.warn(`Model ${modelName} gagal atau sibuk:`, e.message || e);
      continue; 
    }
  }

  // Jika SEMUA model (4 model) gagal, baru berikan data default agar aplikasi tidak crash
  console.error("Semua model Gemini sedang overload. Menggunakan analisis default.");
  return {
    personality_type: 'INFJ',
    personality_title: 'The Advocate',
    personality_desc: 'Jiwa yang visioner dan penuh empati.',
    stats: { JIWA: 45, RAGA: 30, HARTA: 25, ILMU: 48, KARMA: 35 },
    character_summary: 'Analisis tertunda karena server AI Google sedang penuh, namun jiwamu tetap bersinar sebagai Advocate.',
    starter_quest: { title: 'Langkah Awal', desc: 'Lakukan meditasi 5 menit.', stat: 'JIWA' }
  };
}

export async function generateDailyQuests(stats: Stats, moodContext?: string): Promise<Quest[]> {
  const aiClient = getClient();
  const moodPrompt = moodContext ? `\nMood User Hari Ini: "${moodContext}". Sesuaikan tingkat kesulitan dan gaya quest dengan mood ini. Jika mood buruk/sedih, buat quest yang lebih ringan dan menghibur.` : '';
  const prompt = `Kamu adalah game master untuk aplikasi RPG pengembangan diri bernama ARUTHA.
Buatlah 3 quest harian yang dipersonalisasi berdasarkan statistik user saat ini:${moodPrompt}
JIWA: ${stats.JIWA}, RAGA: ${stats.RAGA}, HARTA: ${stats.HARTA}, ILMU: ${stats.ILMU}, KARMA: ${stats.KARMA}

Ketentuan:
1. Quest harus relevan dengan dimensi yang statistiknya paling rendah untuk membantu user berkembang.
2. Berikan aksi nyata yang bisa dilakukan dalam 5-15 menit.
3. Output harus berupa JSON array berisi objek Quest.

Output JSON format:
[
  { "id": "q1", "title": "Quest Title", "desc": "Short Description", "stat": "JIWA|RAGA|HARTA|ILMU|KARMA", "xp": 150 },
  ...
]`;

  const tryGenerateQuests = async (modelName: string) => {
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
  };

  const modelsToTry = [
    'gemini-3.1-flash-lite-preview',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Generating quests menggunakan model: ${modelName}...`);
      return await tryGenerateQuests(modelName);
    } catch (e: any) {
      console.warn(`Quest Gen ${modelName} gagal:`, e.message || e);
      continue;
    }
  }

  // Final fallback
  console.error("Semua model Quest Gen gagal. Menggunakan quest default.");
  return [
    { id: 'f1', title: 'Refleksi Singkat', desc: 'Tulis 1 pencapaian kecil hari ini.', stat: 'JIWA', xp: 100, completed: false },
    { id: 'f2', title: 'Olahraga Ringan', desc: 'Lakukan stretching selama 5 menit.', stat: 'RAGA', xp: 100, completed: false },
    { id: 'f3', title: 'Belajar Hal Baru', desc: 'Baca 1 berita atau artikel edukatif.', stat: 'ILMU', xp: 100, completed: false }
  ];
}

export async function verifyQuestCompletion(questTitle: string, questDesc: string, userNote: string): Promise<{ success: boolean; feedback: string }> {
  const aiClient = getClient();
  const prompt = `Kamu adalah validator kejujuran untuk aplikasi RPG Arutha.
User baru saja melaporkan bahwa dia menyelesaikan quest berikut:
Quest: "${questTitle}"
Instruksi Quest: "${questDesc}"

Catatan/Refleksi User: "${userNote}"

Tugasmu:
1. Analisis apakah catatan user logis dan relevan dengan instruksi quest.
2. Jika jawaban user terlalu singkat (hanya "ok", "sudah", dll), tidak relevan, atau tidak masuk akal, anggap user BOHONG.
3. Berikan output JSON murni.

Output JSON format:
{
  "success": true/false,
  "feedback": "Pesan singkat dalam bahasa Indonesia (misal: 'Analisis yang bagus!' atau 'Jawaban terlalu singkat, ceritakan lebih detail.')"
}`;

  const tryVerify = async (modelName: string) => {
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
  };

  const modelsToTry = [
    'gemini-3.1-flash-lite-preview',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Verifying quest menggunakan model: ${modelName}...`);
      return await tryVerify(modelName);
    } catch (e: any) {
      console.warn(`Verify AI ${modelName} gagal:`, e.message || e);
      continue;
    }
  }

  console.error("Semua model Verifikasi gagal. Progres diterima otomatis.");
  return { success: true, feedback: "Sistem verifikasi sedang sibuk, progres diterima secara manual." };
}

export async function generateRecoveryQuests(fatigueDays: number): Promise<Quest[]> {
  const aiClient = getClient();
  const prompt = `Generate 3 extremely light, encouraging, and restorative "Recovery Quests" for a user who has been inactive for ${fatigueDays} days in their Life RPG (ARUTHA).
  
  The tone should be "welcome back", warm, and non-punishing. 
  Each quest should be very easy to complete (e.g., "Drink a glass of water", "Take 3 deep breaths", "Write one thing you're grateful for").
  
  Assign each quest to one of these dimensions: JIWA, RAGA, HARTA, ILMU, KARMA.
  
  Return ONLY a JSON array of objects with this structure:
  [
    { "id": "rec-1", "title": "...", "desc": "...", "stat": "DIMENSION", "xp": 150 }
  ]
  Note: Set XP to 150 for each quest (this is 1.5x the normal XP to reward their return).`;

  const tryGenerateRecovery = async (modelName: string) => {
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
  };

  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-pro-preview'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`Generating recovery quests menggunakan model: ${modelName}...`);
      return await tryGenerateRecovery(modelName);
    } catch (e: any) {
      console.warn(`Recovery Gen ${modelName} gagal:`, e.message || e);
      continue;
    }
  }

  // Fallback
  return [
    { id: 'rec-1', title: 'Moment of Stillness', desc: 'Sit quietly for 2 minutes and just breathe.', stat: 'JIWA', xp: 150, completed: false },
    { id: 'rec-2', title: 'Hydration Ritual', desc: 'Drink a full glass of water to refresh your body.', stat: 'RAGA', xp: 150, completed: false },
    { id: 'rec-3', title: 'Gratitude Spark', desc: 'Write down one thing you are happy about today.', stat: 'KARMA', xp: 150, completed: false },
  ];
}
