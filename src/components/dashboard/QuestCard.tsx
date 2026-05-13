import React from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Globe, Calendar } from 'lucide-react';
import { cn, getDimensionColor } from '../../lib/utils';

type Dimension = 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA';

interface Quest {
  id: string;
  title: string;
  desc: string;
  stat: Dimension;
  xp: number;
  completed: boolean;
  is_global?: boolean;
  is_weekly?: boolean;
  steps?: {
    current: number;
    total: number;
    last_check_in?: string;
  };
}

interface QuestCardProps {
  quest: Quest;
  onAction: (id: string) => void;
  isGlobal?: boolean;
}

export const QuestCard = React.memo(({ quest, onAction, isGlobal }: QuestCardProps) => {
  const isWeekly = quest.is_weekly;
  
  if (isGlobal) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-amber-500/20 to-rpg-black border border-amber-500/30 p-8 shadow-2xl shadow-amber-500/5 quest-card"
        style={{ '--glow-color': 'rgba(245, 158, 11, 0.4)' } as React.CSSProperties}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/40">
              <Globe className="w-3 h-3 text-amber-500" />
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Global Anomaly</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest block mb-1">Hadiah</span>
              <span className="text-2xl font-black text-rpg-text font-mono">+{quest.xp} XP</span>
            </div>
          </div>
          <h4 className="text-xl md:text-3xl font-serif font-black text-rpg-text mb-3 tracking-tighter italic">"{quest.title}"</h4>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed font-medium">{quest.desc}</p>
          <button 
            onClick={() => onAction(quest.id)}
            className="mt-auto w-full py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
          >
            Buktikan Tantangan Dunia
          </button>
        </div>
      </motion.div>
    );
  }

  if (isWeekly) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "quest-card p-6 md:p-8 border-l-4 group relative overflow-hidden",
          quest.completed ? "border-neutral-600 opacity-60 grayscale" : "border-jiwa"
        )}
        style={{ '--glow-color': getDimensionColor(quest.stat) } as React.CSSProperties}
      >
        <div className="flex justify-between items-start mb-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-jiwa bg-jiwa/10 px-3 py-1 rounded-lg">
            {quest.stat}
          </span>
          <div className="text-right">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Hadiah</span>
            <span className="text-xl font-black text-rpg-text">+{quest.xp} XP</span>
          </div>
        </div>

        <h4 className="text-2xl md:text-3xl font-serif font-black italic mb-3 text-rpg-text">"{quest.title}"</h4>
        <p className="text-sm text-neutral-400 mb-6 font-medium leading-relaxed">{quest.desc}</p>

        {quest.steps && (
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Progres Disiplin</span>
              <span className="text-xs font-black text-rpg-text">{quest.steps.current} / {quest.steps.total} Hari</span>
            </div>
            <div className="h-2 w-full bg-rpg-border/5 rounded-full overflow-hidden border border-rpg-border/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(quest.steps.current / quest.steps.total) * 100}%` }}
                className="h-full bg-gradient-to-r from-jiwa to-ilmu shadow-[0_0_15px_rgba(var(--color-jiwa),0.3)]"
              />
            </div>
          </div>
        )}

        {!quest.completed ? (
          <button onClick={() => onAction(quest.id)} 
            className="w-full py-4 bg-rpg-primary text-rpg-primary-text text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-xl">
            Lapor Progres Hari Ini
          </button>
        ) : (
          <div className="w-full py-4 bg-neutral-900 border border-neutral-800 text-neutral-500 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> UJIAN SELESAI
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={cn(
        "quest-card p-6 md:p-8 border-l-4 group flex flex-col h-full",
        quest.completed ? "opacity-60 grayscale border-rpg-border" : "border-jiwa hover:border-rpg-primary"
      )}
      style={{ '--glow-color': getDimensionColor(quest.stat) } as React.CSSProperties}
    >
      <div className="flex justify-between items-start mb-5">
        <span className="text-xs font-black uppercase tracking-widest text-rpg-text/60 bg-rpg-border/20 px-3 py-1.5 rounded-lg">{quest.stat}</span>
        <div className="flex items-center gap-2 bg-rpg-border/10 px-3 py-1.5 rounded-lg border border-rpg-border/50">
          <Star className="w-4 h-4 text-harta" />
          <span className="text-xs font-black text-rpg-text/80">+{quest.xp} XP</span>
        </div>
      </div>

      <h4 className="text-3xl md:text-4xl font-serif font-black italic mb-4 group-hover:text-jiwa text-rpg-text transition-colors leading-tight">
        {quest.title}
      </h4>
      <p className="text-sm md:text-base text-rpg-text/60 mb-8 leading-relaxed flex-1 font-medium">
        {quest.desc}
      </p>

      <div className="mt-auto">
        {!quest.completed ? (
          <button onClick={() => onAction(quest.id)} className="w-full py-3.5 bg-rpg-primary text-rpg-primary-text text-xs md:text-sm font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all shadow-lg">
            Buktikan Quest
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3.5 bg-rpg-border/10 rounded-xl text-xs md:text-sm font-black text-rpg-text/40 border border-rpg-border/50">
            <Shield className="w-4 h-4" /> MISI SELESAI
          </div>
        )}
      </div>
    </motion.div>
  );
});
