import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Zap, Shield, Book, Heart, Coins } from 'lucide-react';
import { TALENTS, getRandomTalents, type Talent } from '../lib/talents';
import { cn } from '../lib/utils';

interface TalentSelectorProps {
  level: number;
  onSelect: (talent: Talent) => void;
}

const RarityColors = {
  Common: 'from-neutral-400 to-neutral-600 border-neutral-500/30 text-neutral-200',
  Uncommon: 'from-green-400 to-green-600 border-green-500/30 text-green-100',
  Rare: 'from-blue-400 to-blue-600 border-blue-500/30 text-blue-100',
  Epic: 'from-purple-400 to-purple-600 border-purple-500/30 text-purple-100',
  Legendary: 'from-amber-300 to-amber-600 border-amber-400/50 text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.3)]',
};

const RarityIcons = {
  Common: Star,
  Uncommon: Zap,
  Rare: Shield,
  Epic: Sparkles,
  Legendary: Star,
};

export const TalentSelector: React.FC<TalentSelectorProps> = ({ level, onSelect }) => {
  const [options, setOptions] = useState<Talent[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    // Every 5 levels get a forceRarePlus roll
    setOptions(getRandomTalents(3, level % 5 === 0));
  }, [level]);

  if (options.length === 0) return null;

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black italic tracking-tighter text-white">PILIH BERKAHMU</h3>
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em]">
          {level % 5 === 0 ? 'BERKAH SPESIAL LEVEL 5: DIJAMIN RARE+' : 'PILIH SATU BAKAT PERMANEN'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {options.map((talent, index) => {
          const Icon = RarityIcons[talent.rarity];
          return (
            <motion.div
              key={talent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredId(talent.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelect(talent)}
              className={cn(
                "relative group cursor-pointer h-full",
                "bg-gradient-to-br p-0.5 rounded-[32px] transition-all duration-500",
                hoveredId === talent.id ? "scale-[1.05] -translate-y-2" : "scale-100"
              )}
              style={{
                background: talent.rarity === 'Legendary' 
                  ? 'linear-gradient(45deg, #fbbf24, #f59e0b, #fbbf24)' 
                  : undefined
              }}
            >
              <div className={cn(
                "h-full bg-rpg-black rounded-[31px] p-6 flex flex-col items-center text-center space-y-4 border border-white/5",
                hoveredId === talent.id && "bg-neutral-900"
              )}>
                {/* Rarity Tag */}
                <div className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase",
                  talent.rarity === 'Common' && "bg-neutral-500/20 text-neutral-400",
                  talent.rarity === 'Uncommon' && "bg-green-500/20 text-green-400",
                  talent.rarity === 'Rare' && "bg-blue-500/20 text-blue-400",
                  talent.rarity === 'Epic' && "bg-purple-500/20 text-purple-400",
                  talent.rarity === 'Legendary' && "bg-amber-500/20 text-amber-400 animate-pulse"
                )}>
                  {talent.rarity}
                </div>

                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:rotate-12",
                  "bg-gradient-to-br",
                  RarityColors[talent.rarity]
                )}>
                  <Icon className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white leading-tight">{talent.name}</h4>
                  <p className="text-[10px] text-neutral-500 leading-relaxed font-medium">
                    {talent.desc}
                  </p>
                </div>

                {/* Effect Preview */}
                <div className="mt-auto pt-4 border-t border-white/5 w-full">
                  <div className="flex items-center justify-center gap-2 text-jiwa font-black text-xs italic">
                    <Zap className="w-3 h-3 fill-jiwa" />
                    PASIF AKTIF
                  </div>
                </div>
              </div>

              {/* Legendary Glow */}
              {talent.rarity === 'Legendary' && (
                <div className="absolute inset-0 -z-10 bg-amber-500/20 blur-2xl rounded-full scale-75 animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
