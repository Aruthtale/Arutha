import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

type Dimension = 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA';

interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  boostedDimension: Dimension | 'ALL';
  multiplier: number;
  emoji: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  /** ISO weekday 0=Sun, 1=Mon ... 6=Sat — which day this event is active */
  activeDayOfWeek: number;
}

// Rotating weekly events — each dimension gets a spotlight day
const WEEKLY_EVENTS: SeasonalEvent[] = [
  { id: 'festival_karma',   name: 'Festival Karma',     description: 'Quest Karma hari ini memberimu 2× XP. Tebar kebaikan!',           boostedDimension: 'KARMA', multiplier: 2,   emoji: '💚', colorClass: 'text-karma',  borderClass: 'border-karma/30',  bgClass: 'bg-karma/10',  textClass: 'text-karma',  activeDayOfWeek: 0 },
  { id: 'hari_jiwa',        name: 'Hari Jiwa',          description: 'Dimensi JIWA bersinar hari ini. Quest spiritual dapat 2× XP.',    boostedDimension: 'JIWA',  multiplier: 2,   emoji: '🔮', colorClass: 'text-jiwa',   borderClass: 'border-jiwa/30',   bgClass: 'bg-jiwa/10',   textClass: 'text-jiwa',   activeDayOfWeek: 1 },
  { id: 'puncak_raga',      name: 'Puncak Raga',        description: 'Tubuh adalah senjatamu. Quest RAGA mendapat bonus 2× XP!',        boostedDimension: 'RAGA',  multiplier: 2,   emoji: '⚡', colorClass: 'text-raga',   borderClass: 'border-raga/30',   bgClass: 'bg-raga/10',   textClass: 'text-raga',   activeDayOfWeek: 2 },
  { id: 'hari_ilmu',        name: 'Hari Ilmu',          description: 'Belajar hari ini berlipat ganda nilainya. Quest ILMU 2× XP.',      boostedDimension: 'ILMU',  multiplier: 2,   emoji: '📚', colorClass: 'text-ilmu',   borderClass: 'border-ilmu/30',   bgClass: 'bg-ilmu/10',   textClass: 'text-ilmu',   activeDayOfWeek: 3 },
  { id: 'festival_harta',   name: 'Festival Harta',     description: 'Rezeki terbuka lebar! Quest HARTA mendapat 2× XP hari ini.',      boostedDimension: 'HARTA', multiplier: 2,   emoji: '💰', colorClass: 'text-harta',  borderClass: 'border-harta/30',  bgClass: 'bg-harta/10',  textClass: 'text-harta',  activeDayOfWeek: 4 },
  { id: 'hari_keseimbangan',name: 'Hari Keseimbangan', description: 'Semua dimensi bersatu. Setiap quest hari ini dapat 1.5× XP!',    boostedDimension: 'ALL',   multiplier: 1.5, emoji: '✨', colorClass: 'text-amber-500', borderClass: 'border-amber-500/30', bgClass: 'bg-amber-500/10', textClass: 'text-amber-500', activeDayOfWeek: 5 },
  { id: 'hari_refleksi',    name: 'Hari Refleksi',      description: 'Minggu untuk merenungkan perjalananmu. Bonus 1.5× XP untuk semua!', boostedDimension: 'ALL', multiplier: 1.5, emoji: '🌙', colorClass: 'text-purple-500', borderClass: 'border-purple-500/30', bgClass: 'bg-purple-500/10', textClass: 'text-purple-500', activeDayOfWeek: 6 },
];

export function getActiveEvent(): SeasonalEvent | null {
  const dow = new Date().getDay(); // 0=Sun
  return WEEKLY_EVENTS.find(e => e.activeDayOfWeek === dow) ?? null;
}

/** 
 * Returns the XP multiplier for a given dimension based on active event.
 * Call this in addXp to stack with streak multiplier.
 */
export function getEventXpMultiplier(dimension: Dimension): number {
  const event = getActiveEvent();
  if (!event) return 1;
  if (event.boostedDimension === 'ALL' || event.boostedDimension === dimension) {
    return event.multiplier;
  }
  return 1;
}

interface SeasonalEventBannerProps {
  className?: string;
}

export const SeasonalEventBanner: React.FC<SeasonalEventBannerProps> = ({ className }) => {
  const theme = useStore(state => state.theme);
  const isLight = theme === 'DIVINE';
  
  const event = useMemo(() => getActiveEvent(), []);
  if (!event) return null;

  const endsIn = useMemo(() => {
    const now = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const diff = end.getTime() - now.getTime();
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}j ${mins}m`;
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 flex items-center gap-4 transition-all duration-500',
        event.bgClass, 
        isLight ? "border-neutral-200" : event.borderClass, 
        className
      )}
    >
      {/* Animated shimmer */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-transparent -skew-x-12 animate-shimmer pointer-events-none",
        isLight ? "via-white/20" : "via-white/5"
      )} />

      <div className="text-2xl shrink-0">{event.emoji}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-[10px] font-black tracking-[0.3em] uppercase', 
            isLight ? "text-neutral-900/60" : event.textClass
          )}>
            EVENT AKTIF
          </span>
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black', 
            isLight ? "bg-white border-neutral-200" : cn(event.borderClass, event.bgClass),
            isLight ? "text-neutral-900" : event.textClass
          )}>
            <Zap className={cn("w-2.5 h-2.5", isLight ? "text-amber-500" : "")} />
            {event.multiplier}× XP
          </div>
        </div>
        <h4 className="text-sm font-black text-rpg-text mt-0.5">{event.name}</h4>
        <p className={cn("text-[10px] mt-0.5 leading-relaxed font-medium", isLight ? "text-neutral-600" : "text-rpg-text/60")}>
          {event.description}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1 text-rpg-text/40">
          <Calendar className="w-3 h-3" />
          <span className="text-[9px] font-bold">Berakhir</span>
        </div>
        <span className={cn('text-xs font-black', isLight ? "text-neutral-900" : event.textClass)}>{endsIn}</span>
      </div>
    </motion.section>
  );
};
