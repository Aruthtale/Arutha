import talentData from '../data/talents.json';

export type TalentRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface Talent {
  id: string;
  name: string;
  desc: string;
  rarity: TalentRarity;
  statBoost?: {
    stat: 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA' | 'ALL';
    value: number;
  };
  xpBoost?: {
    condition: 'ALWAYS' | 'MORNING' | 'NIGHT' | 'STREAK_3' | 'STREAK_7';
    value: number;
  };
}

export const TALENTS: Talent[] = talentData as Talent[];

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
