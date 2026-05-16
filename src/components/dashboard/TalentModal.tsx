import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { TALENTS } from '../../lib/talents';
import { cn } from '../../lib/utils';

interface TalentModalProps {
  isOpen: boolean;
  talents: string[];
  talentPool: any[];
  replacingTalentId: string | null;
  setReplacingTalentId: (id: string | null) => void;
  selectedNewTalentId: string | null;
  setSelectedNewTalentId: (id: string | null) => void;
  onSelectTalent: (selectedId: string, replacedId?: string) => Promise<void>;
  onSkipTalent: () => Promise<void>;
  onClose: () => void;
}

export const TalentModal = ({
  isOpen, talents, talentPool, replacingTalentId, setReplacingTalentId,
  selectedNewTalentId, setSelectedNewTalentId, onSelectTalent, onSkipTalent, onClose
}: TalentModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl overflow-y-auto">
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="max-w-4xl w-full py-6 md:py-12 px-4 md:px-12 space-y-8 md:space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-jiwa/10 border border-jiwa/20 rounded-full">
              <Star className="w-3 h-3 text-jiwa" />
              <span className="text-[8px] md:text-[10px] font-black tracking-[0.3em] text-jiwa uppercase">Pilihan Takdir Baru</span>
            </div>
            <h3 className="text-3xl md:text-6xl font-black italic text-rpg-text tracking-tighter leading-none uppercase">Pilih Talenta</h3>
            <p className="text-xs md:text-sm text-neutral-400 max-w-lg mx-auto">Satu pilihan akan mengubah jalannya sejarah. Pilih dengan bijak.</p>
          </div>

          <div className="mt-4 md:mt-8 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rpg-text/30 mb-4 flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-rpg-border/10"></div>
              {talents.length >= 3 ? "Ganti Talenta" : "Slot Anda"}
              <div className="h-px w-8 bg-rpg-border/10"></div>
            </div>

            <div className="flex justify-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {[0, 1, 2].map((i) => {
                const talentId = talents[i];
                const talent = talentId ? TALENTS.find(t => t.id === talentId) : null;
                
                const colors = talent ? {
                  'Common': 'border-neutral-500/20 bg-neutral-500/5 text-neutral-400',
                  'Uncommon': 'border-green-500/20 bg-green-500/5 text-green-400',
                  'Rare': 'border-blue-500/20 bg-blue-500/5 text-blue-400',
                  'Epic': 'border-purple-500/20 bg-purple-500/5 text-purple-400',
                  'Legendary': 'border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                }[talent.rarity as string] : 'border-dashed border-rpg-border bg-transparent text-rpg-text/10';

                return (
                  <motion.div 
                    key={i}
                    whileHover={talent ? { scale: 1.05, y: -5 } : {}}
                    onClick={() => talents.length >= 3 && talentId && setReplacingTalentId(talentId)}
                    className={cn(
                      "w-20 h-24 md:w-36 md:h-40 rounded-2xl md:rounded-3xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer relative overflow-hidden p-1.5",
                      colors,
                      replacingTalentId === talentId && talentId ? "ring-4 ring-rpg-primary/50 border-rpg-primary bg-rpg-primary/20" : ""
                    )}
                  >
                    {talent ? (
                      <>
                        <div className="text-lg md:text-2xl">{talent.rarity === 'Legendary' ? '🔱' : talent.rarity === 'Epic' ? '💎' : talent.rarity === 'Rare' ? '⚔️' : '✨'}</div>
                        <div className={cn("text-[6px] md:text-[9px] font-black uppercase tracking-tight text-center leading-tight mb-1 px-1", replacingTalentId === talentId ? "text-white" : "text-rpg-text")}>
                          {talent.name}
                        </div>
                        
                        <div className="flex flex-col gap-0.5 items-center">
                          {talent.statBoost && (
                            <div className={cn("text-[5px] md:text-[8px] font-bold", replacingTalentId === talentId ? "text-white/80" : "text-rpg-text/60")}>
                              +{Math.round(talent.statBoost.value * 100)}% {talent.statBoost.stat}
                            </div>
                          )}
                          {talent.xpBoost && (
                            <div className={cn("text-[5px] md:text-[8px] font-bold", replacingTalentId === talentId ? "text-white/80" : "text-rpg-text/60")}>
                              +{Math.round(talent.xpBoost.value * 100)}% XP
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-[6px] font-black uppercase tracking-widest opacity-20 text-center">Slot</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {talents.length >= 3 && !replacingTalentId && (
            <p className="text-center text-jiwa text-[10px] font-black animate-pulse">Pilih talenta di atas untuk diganti.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {talentPool.map((t) => {
              const colors = {
                'Common': 'text-neutral-400 border-neutral-500/20 bg-neutral-500/5',
                'Uncommon': 'text-green-400 border-green-500/20 bg-green-500/5',
                'Rare': 'text-blue-400 border-blue-500/20 bg-blue-500/5',
                'Epic': 'text-purple-400 border-purple-500/20 bg-purple-500/5',
                'Legendary': 'text-amber-400 border-amber-500/20 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
              }[t.rarity as string] || 'text-rpg-text border-rpg-border';

              const badgeColors = {
                'Common': 'bg-neutral-500/20 text-neutral-400',
                'Uncommon': 'bg-green-500/20 text-green-400',
                'Rare': 'bg-blue-500/20 text-blue-400',
                'Epic': 'bg-purple-500/20 text-purple-400',
                'Legendary': 'bg-amber-500 text-black font-black'
              }[t.rarity as string] || 'bg-rpg-border/10 text-rpg-text';

              return (
                <motion.div
                  key={t.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  onClick={() => {
                    if (talents.length < 3 || replacingTalentId) {
                      setSelectedNewTalentId(t.id);
                    }
                  }}
                  className={cn(
                    "glass-panel p-5 md:p-6 border transition-all cursor-pointer text-left space-y-4 group relative overflow-hidden",
                    colors,
                    selectedNewTalentId === t.id ? "ring-2 ring-rpg-primary border-rpg-primary bg-rpg-primary/10" : "hover:border-rpg-border"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className={cn("text-3xl md:text-4xl group-hover:scale-110 transition-transform duration-500", selectedNewTalentId === t.id ? "scale-105" : "")}>
                      {t.rarity === 'Legendary' ? '🔱' : t.rarity === 'Epic' ? '💎' : t.rarity === 'Rare' ? '⚔️' : '✨'}
                    </div>
                    <div className={cn("px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase", selectedNewTalentId === t.id ? "bg-rpg-primary text-black" : badgeColors)}>
                      {t.rarity}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className={cn("font-black text-lg md:text-xl leading-tight uppercase tracking-tight", selectedNewTalentId === t.id ? "text-white" : "text-rpg-text")}>{t.name}</h4>
                    <p className={cn("text-[10px] md:text-[11px] leading-relaxed font-medium", selectedNewTalentId === t.id ? "text-white/90" : "text-neutral-400")}>
                      {t.desc}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    {t.statBoost && (
                      <div className={cn(
                        "px-3 py-2 rounded-xl flex items-center justify-between transition-all",
                        selectedNewTalentId === t.id ? "bg-white/10 border border-white/5" : "bg-black/20 border border-white/5"
                      )}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", selectedNewTalentId === t.id ? "bg-rpg-primary" : "bg-jiwa")}></div>
                          <span className={cn("text-[9px] font-black uppercase tracking-wider", selectedNewTalentId === t.id ? "text-white/60" : "text-rpg-text/60")}>Stat Buff</span>
                        </div>
                        <span className={cn("text-[11px] font-black", selectedNewTalentId === t.id ? "text-white" : "text-rpg-text")}>
                          +{Math.round(t.statBoost.value * 100)}% {t.statBoost.stat}
                        </span>
                      </div>
                    )}
                    {t.xpBoost && (
                      <div className={cn(
                        "px-3 py-2 rounded-xl flex items-center justify-between transition-all",
                        selectedNewTalentId === t.id ? "bg-white/10 border border-white/5" : "bg-black/20 border border-white/5"
                      )}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", selectedNewTalentId === t.id ? "bg-rpg-primary" : "bg-amber-400")}></div>
                          <span className={cn("text-[9px] font-black uppercase tracking-wider", selectedNewTalentId === t.id ? "text-white/60" : "text-rpg-text/60")}>XP Boost</span>
                        </div>
                        <span className={cn("text-[11px] font-black", selectedNewTalentId === t.id ? "text-white" : "text-rpg-text")}>
                          +{Math.round(t.xpBoost.value * 100)}% <span className="text-[7px] opacity-60">({t.xpBoost.condition})</span>
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              disabled={!selectedNewTalentId || (talents.length >= 3 && !replacingTalentId)}
              onClick={async () => {
                await onSelectTalent(selectedNewTalentId!, replacingTalentId || undefined);
                onClose();
              }}
              className="w-full py-4 bg-rpg-primary text-black rounded-2xl font-black tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-10 shadow-[0_10px_30px_rgba(var(--rpg-primary-rgb),0.2)]"
            >
              KONFIRMASI TAKDIR
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onClose}
                className="py-3 bg-white/5 border border-white/10 text-rpg-text/50 rounded-xl font-black text-[10px] tracking-widest hover:bg-white/10 transition-all uppercase"
              >
                KEMBALI
              </button>
              <button 
                onClick={async () => {
                  if (confirm("Apakah Anda yakin ingin melewati pilihan talenta ini?")) {
                    await onSkipTalent();
                    onClose();
                  }
                }}
                className="py-3 bg-red-500/10 border border-red-500/20 text-red-500/60 rounded-xl font-black text-[10px] tracking-widest hover:bg-red-500/20 transition-all uppercase"
              >
                LEWATI
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
