import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Shield, Globe, Calendar, CheckCircle2, 
  PlusCircle, Loader2 
} from 'lucide-react';
import { cn, getDimensionColor } from '../../lib/utils';
import { useStore } from '../../store/useStore';

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
  is_verifying?: boolean;
}

interface QuestCardProps {
  quest: Quest;
  onAction: (id: string) => void;
  isGlobal?: boolean;
}

export const QuestCard = React.memo(({ quest, onAction, isGlobal }: QuestCardProps) => {
  const isWeekly = quest.is_weekly;
  const theme = useStore(state => state.theme);
  const isLight = theme === 'DIVINE';
  const isPending = (quest as any).submission_status === 'PENDING';
  
  const getDifficulty = (xp: number) => {
    if (xp <= 150) return '⭐ Easy';
    if (xp <= 1000) return '⭐⭐ Hard';
    return '⭐⭐⭐ Epic';
  };

  const dimColor = getDimensionColor(quest.stat);
  
  if (isGlobal) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "group relative overflow-hidden rounded-[40px] border p-8 md:p-12 shadow-2xl transition-all col-span-full",
          isLight 
            ? "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-amber-500/5 hover:border-amber-400" 
            : "bg-gradient-to-br from-amber-500/20 via-rpg-black to-rpg-black border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.05)] hover:border-amber-500/50"
        )}
      >
        <div className={cn(
          "absolute top-0 right-0 w-96 h-96 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 transition-all duration-700",
          isLight ? "bg-amber-400/20" : "bg-amber-500/10 group-hover:bg-amber-500/20"
        )} />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md",
                isLight ? "bg-amber-100 border-amber-200" : "bg-amber-500/20 border-amber-500/30"
              )}>
                <Globe className={cn("w-4 h-4 animate-pulse", isLight ? "text-amber-600" : "text-amber-400")} />
                <span className={cn("text-[11px] font-black uppercase tracking-[0.3em]", isLight ? "text-amber-700" : "text-amber-400")}>Event Dunia Aktif</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className={cn(
                "text-4xl md:text-6xl font-black leading-none tracking-tighter uppercase italic transition-colors duration-500",
                isLight ? "text-neutral-900 group-hover:text-amber-600" : "text-white group-hover:text-amber-400"
              )}>
                {quest.title || "ANOMALI TERDETEKSI"}
              </h4>
              <p className={cn(
                "text-base md:text-lg leading-relaxed font-medium max-w-2xl border-l-2 pl-6 py-2",
                isLight ? "text-neutral-600 border-amber-300" : "text-neutral-300 border-amber-500/30"
              )}>
                {quest.desc || "Sesuatu yang luar biasa sedang terjadi di dunia Arutha. Ambil bagianmu dalam sejarah sekarang."}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className={cn(
                "flex items-center gap-3 border px-5 py-3 rounded-2xl",
                isLight ? "bg-neutral-50 border-neutral-200" : "bg-white/5 border-white/10"
              )}>
                <div className={cn("p-2 rounded-lg", isLight ? "bg-amber-100" : "bg-amber-500/20")}>
                  <Star className={cn("w-5 h-5", isLight ? "text-amber-600 fill-amber-600" : "text-amber-400 fill-amber-400")} />
                </div>
                <div>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest block", isLight ? "text-amber-700/50" : "text-amber-500/40")}>Bonus Pengalaman</span>
                  <span className={cn("text-xl font-black", isLight ? "text-neutral-900" : "text-white")}>+{quest.xp || 500} XP</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => onAction(quest.id)}
              disabled={quest.is_verifying || isPending}
              className={cn(
                "w-full py-6 rounded-[24px] font-black text-sm uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-50",
                isPending
                  ? "bg-neutral-600/40 border border-neutral-700/50 text-neutral-400 cursor-not-allowed"
                  : isLight ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30"
              )}
            >
              {quest.is_verifying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : isPending ? 'MENUNGGU VERIFIKASI ADMIN' : 'KIRIM BUKTI QUEST'}
            </button>
          </div>
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
          "group relative overflow-hidden rounded-[32px] p-8 md:p-10 border-2 transition-all duration-500",
          quest.completed ? "opacity-60 grayscale bg-neutral-100 border-neutral-200" : isLight ? "bg-white border-neutral-100 hover:border-rpg-primary/30 shadow-lg hover:shadow-2xl" : "bg-rpg-card border-rpg-border hover:border-white/10 shadow-2xl"
        )}
      >
        <div className="absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-10 transition-all group-hover:opacity-20" style={{ backgroundColor: dimColor }} />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-neutral-100 overflow-hidden relative">
                <div className="w-full h-full opacity-20 absolute inset-0" style={{ backgroundColor: dimColor }} />
                <Calendar className="w-5 h-5 relative z-10" style={{ color: dimColor }} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 block">Weekly Trial</span>
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: dimColor }}>{quest.stat} Dimension</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-rpg-text tracking-tighter text-2xl block">+{quest.xp} <span className="text-[10px] uppercase tracking-widest opacity-40">XP</span></span>
            </div>
          </div>

          <h4 className="text-2xl md:text-3xl font-black mb-4 text-rpg-text tracking-tight leading-tight group-hover:translate-x-1 transition-transform">
            {quest.title}
          </h4>
          <p className={cn("text-sm mb-8 font-medium leading-relaxed max-w-md", isLight ? "text-neutral-600" : "text-neutral-400")}>
            {quest.desc}
          </p>

          {quest.steps && (
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-end px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: dimColor }} />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Discipline Progress</span>
                </div>
                <span className="text-xs font-black text-rpg-text">{quest.steps.current} <span className="opacity-30">/</span> {quest.steps.total} <span className="text-[10px] opacity-40">DAYS</span></span>
              </div>
              <div className={cn("h-3 w-full rounded-full overflow-hidden p-0.5 border", isLight ? "bg-neutral-100 border-neutral-200" : "bg-white/5 border-white/5")}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(quest.steps.current / quest.steps.total) * 100}%` }}
                  className="h-full rounded-full shadow-lg transition-all duration-1000"
                  style={{ 
                    backgroundColor: dimColor,
                    boxShadow: `0 0 15px ${dimColor}40`
                  }}
                />
              </div>
            </div>
          )}

          {!quest.completed ? (
            <button 
              onClick={() => onAction(quest.id)} 
              disabled={quest.is_verifying}
              className={cn(
                "w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-2 group/btn",
                isLight ? "bg-neutral-900 text-white" : "bg-white text-black"
              )}
              style={!isLight ? { backgroundColor: dimColor, color: '#fff' } : {}}
            >
              {quest.is_verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />}
              {quest.is_verifying ? 'Verifying...' : 'Lapor Progres Hari Ini'}
            </button>
          ) : (
            <div className={cn(
              "w-full py-5 border text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3",
              isLight ? "bg-neutral-50 border-neutral-200 text-neutral-400" : "bg-neutral-900 border-neutral-800 text-neutral-500"
            )}>
              <CheckCircle2 className="w-5 h-5 text-green-500" /> UJIAN SELESAI
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={cn(
        "quest-card p-6 md:p-8 border-l-4 group flex flex-col h-full",
        quest.completed ? "opacity-60 grayscale border-rpg-border" : "hover:border-rpg-primary"
      )}
      style={{ 
        borderLeftColor: !quest.completed ? dimColor : undefined,
        '--glow-color': dimColor 
      } as React.CSSProperties}
    >
      <div className="flex justify-between items-start mb-5">
        <span className={cn(
          "text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg",
          isLight ? "bg-neutral-100 text-neutral-600" : "bg-rpg-border/20 text-rpg-text/60"
        )}>{quest.stat}</span>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{getDifficulty(quest.xp)}</span>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
            isLight ? "bg-neutral-50 border-neutral-200" : "bg-rpg-border/10 border-rpg-border/50"
          )}>
            <Star className="w-4 h-4 text-harta" />
            <span className={cn("text-xs font-black", isLight ? "text-neutral-900" : "text-rpg-text/80")}>+{quest.xp} XP</span>
          </div>
        </div>
      </div>

      <h4 className={cn(
        "text-2xl md:text-3xl font-black mb-4 transition-colors leading-tight tracking-tight",
        isLight ? "text-neutral-900 group-hover:text-rpg-primary" : "text-rpg-text group-hover:text-jiwa"
      )}>
        {quest.title}
      </h4>
      <p className={cn(
        "text-sm md:text-base mb-8 leading-relaxed flex-1 font-medium",
        isLight ? "text-neutral-600" : "text-rpg-text/60"
      )}>
        {quest.desc}
      </p>

      <div className="mt-auto">
        {!quest.completed ? (
          <button onClick={() => onAction(quest.id)} disabled={quest.is_verifying} className="w-full py-3.5 bg-rpg-primary text-rpg-primary-text text-xs md:text-sm font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50">
            {quest.is_verifying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Buktikan Quest'}
          </button>
        ) : (
          <div className={cn(
            "flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs md:text-sm font-black border",
            isLight ? "bg-neutral-100 text-neutral-400 border-neutral-200" : "bg-rpg-border/10 text-rpg-text/40 border-rpg-border/50"
          )}>
            <Shield className="w-4 h-4" /> MISI SELESAI
          </div>
        )}
      </div>
    </motion.div>
  );
});
