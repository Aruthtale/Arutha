export type TalentRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Talent {
  id: string;
  name: string;
  desc: string;
  rarity: TalentRarity;
  statBoost?: {
    stat: 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA' | 'ALL';
    value: number; // Persentase (0.01 = 1%)
  };
  xpBoost?: {
    condition: 'ALWAYS' | 'MORNING' | 'NIGHT' | 'STREAK_3' | 'STREAK_7';
    value: number; // Persentase
  };
}

export const TALENTS: Talent[] = [
  // COMMON (1-2%)
  { id: 'c_jiwa_1', name: 'Ketenangan Kecil', desc: '+1% XP untuk dimensi JIWA', rarity: 'Common', xpBoost: { condition: 'ALWAYS', value: 0.01 } },
  { id: 'c_raga_1', name: 'Napas Teratur', desc: '+1% Progres dimensi RAGA', rarity: 'Common', statBoost: { stat: 'RAGA', value: 0.01 } },
  { id: 'c_harta_1', name: 'Hemat Pangkal Kaya', desc: '+2% XP untuk misi HARTA', rarity: 'Common', xpBoost: { condition: 'ALWAYS', value: 0.02 } },
  { id: 'c_ilmu_1', name: 'Rasa Ingin Tahu', desc: '+1% XP untuk dimensi ILMU', rarity: 'Common', xpBoost: { condition: 'ALWAYS', value: 0.01 } },
  { id: 'c_morning_1', name: 'Burung Pagi', desc: '+2% Semua XP sebelum jam 09:00', rarity: 'Common', xpBoost: { condition: 'MORNING', value: 0.02 } },

  // UNCOMMON (3-4%)
  { id: 'u_all_1', name: 'Disiplin Dasar', desc: '+3% Semua perolehan XP', rarity: 'Uncommon', xpBoost: { condition: 'ALWAYS', value: 0.03 } },
  { id: 'u_karma_1', name: 'Tangan Terbuka', desc: '+4% Progres dimensi KARMA', rarity: 'Uncommon', statBoost: { stat: 'KARMA', value: 0.04 } },
  { id: 'u_streak_1', name: 'Momentum', desc: '+4% XP saat Streak di atas 3 hari', rarity: 'Uncommon', xpBoost: { condition: 'STREAK_3', value: 0.04 } },

  // RARE (5-6%)
  { id: 'r_raga_1', name: 'Atlet Amatir', desc: '+5% Progres dimensi RAGA', rarity: 'Rare', statBoost: { stat: 'RAGA', value: 0.05 } },
  { id: 'r_ilmu_1', name: 'Cendekiawan', desc: '+6% Progres dimensi ILMU', rarity: 'Rare', statBoost: { stat: 'ILMU', value: 0.06 } },
  { id: 'r_night_1', name: 'Burung Hantu', desc: '+6% XP jika selesai di atas jam 21:00', rarity: 'Rare', xpBoost: { condition: 'NIGHT', value: 0.06 } },

  // EPIC (7-8%)
  { id: 'e_balance_1', name: 'Harmoni Kehidupan', desc: '+7% Progres semua dimensi', rarity: 'Epic', statBoost: { stat: 'ALL', value: 0.07 } },
  { id: 'e_streak_1', name: 'Disiplin Baja', desc: '+8% XP saat Streak di atas 7 hari', rarity: 'Epic', xpBoost: { condition: 'STREAK_7', value: 0.08 } },

  // LEGENDARY (10%)
  { id: 'l_avatar_1', name: 'Pencerahan Arutha', desc: '+10% Semua perolehan XP & Statistik', rarity: 'Legendary', statBoost: { stat: 'ALL', value: 0.1 }, xpBoost: { condition: 'ALWAYS', value: 0.1 } },
];

export const getRandomTalents = (count: number, forceRarePlus = false): Talent[] => {
  const getRandomRarity = (): TalentRarity => {
    const roll = Math.random() * 100;
    if (forceRarePlus) {
      if (roll < 70) return 'Rare';
      if (roll < 95) return 'Epic';
      return 'Legendary';
    }
    if (roll < 70) return 'Common';
    if (roll < 90) return 'Uncommon';
    if (roll < 97) return 'Rare';
    if (roll < 99.5) return 'Epic';
    return 'Legendary';
  };

  const selected: Talent[] = [];
  const usedIds = new Set<string>();

  while (selected.length < count) {
    const rarity = getRandomRarity();
    const options = TALENTS.filter(t => t.rarity === rarity && !usedIds.has(t.id));
    
    if (options.length > 0) {
      const talent = options[Math.floor(Math.random() * options.length)];
      selected.push(talent);
      usedIds.add(talent.id);
    } else {
      // Fallback jika rarity tersebut habis (jarang terjadi dengan pool besar)
      const anyOption = TALENTS.find(t => !usedIds.has(t.id));
      if (anyOption) {
        selected.push(anyOption);
        usedIds.add(anyOption.id);
      }
    }
  }
  return selected;
};
