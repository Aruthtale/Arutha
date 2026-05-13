import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DashboardHUDProps {
  level: number;
  xp: number;
  streak: number;
  claimed: boolean;
  onClaimStreak: () => void;
  dominantColor: string;
}

export const DashboardHUD = React.memo(({ level, xp, streak, claimed, onClaimStreak, dominantColor }: DashboardHUDProps) => {
  return (
    <div className="relative md:fixed md:top-0 md:left-20 xl:left-[280px] md:right-0 z-30 mb-8 md:mb-0 border-y border-rpg-border/30 md:border-t-0">
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-50 transition-all duration-1000" style={{ background: `linear-gradient(90deg, transparent, ${dominantColor}, transparent)` }} />
      
      <div className="bg-rpg-black/80 backdrop-blur-3xl border-b border-rpg-border/50 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 md:py-3 flex items-center justify-between gap-3 md:gap-6 overflow-x-auto hide-scrollbar">
          
          <div className="flex items-center gap-2 px-4 py-2 md:py-2.5 bg-gradient-to-br from-white/10 to-transparent rounded-2xl border border-rpg-border shrink-0 shadow-inner">
            <LayoutDashboard className="w-4 h-4 text-jiwa" />
            <span className="text-[10px] md:text-xs font-black text-rpg-text tracking-[0.2em] uppercase">Pusat Misi</span>
          </div>

          <div className="flex-1 flex items-center min-w-[200px] max-w-xl bg-white/[0.03] p-1.5 md:p-2 rounded-2xl border border-rpg-border/50 shadow-inner group">
            <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-rpg-black rounded-xl border border-rpg-border shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-harta/20 to-ilmu/20 opacity-50 group-hover:opacity-100 transition-opacity" />
              <span className="relative text-xs md:text-sm font-black text-rpg-text">L{level}</span>
            </div>
            <div className="flex-1 px-3 md:px-4">
              <div className="flex justify-between items-end mb-1 md:mb-1.5">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-rpg-text/40">Experience</span>
                <span className="text-[9px] md:text-[10px] font-black text-harta font-mono tracking-tighter">{xp} / {level * 1000}</span>
              </div>
              <div className="h-1.5 md:h-2 w-full bg-rpg-black rounded-full overflow-hidden border border-rpg-border/50">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.max(0, Math.min(100, (xp / (Math.max(1, level) * 1000)) * 100 || 0))}%` }}
                  className="h-full bg-gradient-to-r from-jiwa via-harta to-ilmu relative">
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={!claimed ? { scale: 1.05 } : {}}
            whileTap={!claimed ? { scale: 0.95 } : {}}
            onClick={() => !claimed && onClaimStreak()}
            disabled={claimed}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 md:py-2.5 rounded-2xl border transition-all shrink-0 relative overflow-hidden",
              claimed
                ? "bg-rpg-border/5 border-rpg-border opacity-70 cursor-default"
                : "bg-gradient-to-br from-harta to-amber-600 text-black border-harta/50 shadow-[0_0_20px_rgba(255,193,7,0.4)] cursor-pointer"
            )}
          >
            {!claimed && <div className="absolute inset-0 bg-white/20 animate-shimmer" />}
            <Zap className={cn("w-4 h-4 md:w-5 md:h-5 relative z-10", claimed ? "text-harta opacity-50" : "fill-black")} />
            <div className="flex flex-col items-start relative z-10">
              <span className={cn("text-[8px] md:text-[9px] font-black tracking-widest uppercase", claimed ? "text-neutral-500" : "text-black/70")}>
                {claimed ? "Terklaim" : "Klaim"}
              </span>
              <span className={cn("text-xs md:text-sm font-black tracking-tighter leading-none", claimed ? "text-rpg-text" : "text-black")}>
                {streak} Streak
              </span>
            </div>
            {!claimed && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-ping" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
});
