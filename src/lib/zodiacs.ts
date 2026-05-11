import zodiacData from '../data/zodiacs.json';

export type ZodiacElement = 'FIRE' | 'EARTH' | 'AIR' | 'WATER';

export interface Zodiac {
  id: string;
  name: string;
  element: ZodiacElement;
  icon: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  description: string;
  buff: string;
  rpgEffect: string;
}

export const ZODIACS = zodiacData as Zodiac[];

export const getZodiacFromDate = (day: number, month: number): Zodiac | null => {
  return ZODIACS.find(z => {
    // Penanganan khusus Capricorn (menyeberang tahun)
    if (z.id === 'capricorn') {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return true;
    }
    
    // Penanganan umum
    if (month === z.startMonth && day >= z.startDay) return true;
    if (month === z.endMonth && day <= z.endDay) return true;
    
    return false;
  }) || null;
};
