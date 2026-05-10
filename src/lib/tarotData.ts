import tarotData from '../data/tarot.json';

export interface TarotCard {
  id: string;
  name: string;
  meaning: string;
  image: string;
}

export const MAJOR_ARCANA: TarotCard[] = tarotData;
