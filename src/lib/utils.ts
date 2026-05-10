import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getDimensionRank(value: number): string {
  if (value < 20) return "NEOPHYTE"; // Baru mulai
  if (value < 40) return "INITIATE"; // Tahap awal
  if (value < 60) return "ADEPT";    // Mahir
  if (value < 80) return "MASTER";   // Ahli
  if (value < 100) return "ASCENDED"; // Melebihi batas
  return "DIVINE";                   // Dewata
}

export function getDimensionColor(dim: string): string {
  const colors: Record<string, string> = {
    JIWA: '#C084FC',
    RAGA: '#4ADE80',
    HARTA: '#FACC15',
    ILMU: '#3B82F6',
    KARMA: '#F43F5E',
  };
  return colors[dim.toUpperCase()] || '#C084FC';
}

export function getRankGlow(avgStats: number): string {
  if (avgStats < 20) return "shadow-none border-white/5";
  if (avgStats < 40) return "shadow-lg shadow-white/5 border-white/10";
  if (avgStats < 60) return "shadow-xl shadow-jiwa/10 border-jiwa/20";
  if (avgStats < 80) return "shadow-2xl shadow-jiwa/20 border-jiwa/30";
  if (avgStats < 100) return "shadow-[0_0_50px_rgba(167,139,250,0.3)] border-jiwa/40";
  return "shadow-[0_0_60px_rgba(251,191,36,0.4)] border-harta/40 ring-2 ring-harta/20";
}
