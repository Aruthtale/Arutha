import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Sparkles, Star, LayoutDashboard, User, Users, Map, Brain, Dumbbell, Coins, BookOpen, TrendingUp, Clock, Target, ArrowRight, Shield, RefreshCw, Loader2, AlertCircle, Zap, Contact2, ShieldAlert
} from 'lucide-react';
import { cn, getDimensionRank, getDimensionColor, getRankGlow } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Session } from '@supabase/supabase-js';
import { type DecayResult } from '../lib/decaySystem';

type Dimension = 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA';

interface Stats {
  JIWA: number; RAGA: number; HARTA: number; ILMU: number; KARMA: number;
}

interface Quest {
  id: string; title: string; desc: string; stat: Dimension; xp: number; completed: boolean;
}

interface DashboardProps {
  session: Session | null;
  userId: string;
  name: string; level: number; xp: number; stats: Stats; quests: Quest[]; analysis: any;
  streak: number;
  statHistory: any[];
  completeQuest: (id: string, note: string) => Promise<{ success: boolean; feedback: string }>;
  handleLogout: () => void;
  addXp: (amount: number, stat?: Dimension) => void;
  onReOnboard: () => void;
  onRefreshQuests: () => void;
  onGenerateInitialQuests?: (mood: string) => void;
  isRefreshing: boolean;
  lastEvolutionDate: string | null;
  refreshCount: number;
  decayResult: DecayResult | null;
  onTakeRecovery: () => void;
  setPage: (page: any) => void;
}

const EMOJIS = ['😡', '😔', '😐', '😊', '🤩'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  session, userId, name, level, xp, stats, quests, analysis, streak, statHistory, completeQuest, handleLogout, onReOnboard, onRefreshQuests, onGenerateInitialQuests, isRefreshing, lastEvolutionDate, refreshCount, decayResult, onTakeRecovery, setPage 
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [activeQuestInput, setActiveQuestInput] = useState<string | null>(null);

  const statsArray = Object.entries(stats).map(([name, val]) => ({ name, val }));
  const highestDim = statsArray.reduce((prev, current) => (prev.val > current.val) ? prev : current).name;
  const avgStats = statsArray.reduce((acc, curr) => acc + curr.val, 0) / statsArray.length;
  const dominantColor = getDimensionColor(highestDim);
  const [userNote, setUserNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{success: boolean, text: string} | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      setIsChartVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleQuestSubmit = async (id: string) => {
    if (!userNote.trim()) return;
    setIsVerifying(true);
    setVerificationFeedback(null);
    try {
      const res = await completeQuest(id, userNote);
      setVerificationFeedback({ success: res.success, text: res.feedback });
      if (res.success) {
        setTimeout(() => {
          setActiveQuestInput(null);
          setUserNote('');
          setVerificationFeedback(null);
        }, 2000);
      }
    } catch (err) {
      setVerificationFeedback({ success: false, text: 'Gagal verifikasi. Coba lagi.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const getCooldownStatus = () => {
    if (!lastEvolutionDate) return { canEvolve: true, daysLeft: 0 };
    const lastDate = new Date(lastEvolutionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { canEvolve: diffDays >= 30, daysLeft: Math.max(0, 30 - diffDays) };
  };

  const { canEvolve, daysLeft } = getCooldownStatus();

  const DecayStatusBanner = () => {
    if (!decayResult || decayResult.status === 'ok') return null;
    const colors = {
      warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
      fatigue: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
      decay: 'bg-red-500/10 border-red-500/20 text-red-500'
    };
    return (
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className={cn("mb-6 p-4 rounded-2xl border flex items-center justify-between gap-4", colors[decayResult.status])}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-bold leading-tight">{decayResult.message}</p>
        </div>
        <button onClick={onTakeRecovery} className="px-4 py-2 bg-current text-rpg-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
          Ambil Pemulihan
        </button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen text-white pb-24 pt-32 md:pt-36">
      
      {/* SUB-HEADER BAR */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-rpg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/10 rounded-full border border-white/10">
            <LayoutDashboard className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-neutral-200 tracking-widest uppercase">Pusat Misi</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          
          <div className="flex-1 flex items-center gap-4 px-4 bg-white/5 rounded-2xl border border-white/5 h-10 group">
            <Star className="w-4 h-4 text-harta fill-harta/20" />
            <div className="flex-1 h-1.5 bg-rpg-black rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(xp / (level * 1000)) * 100}%` }}
                className="h-full bg-gradient-to-r from-jiwa to-ilmu animate-shimmer" />
            </div>
            <span className="text-[10px] font-black text-neutral-500 font-mono">{xp} / {level * 1000} XP</span>
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 bg-harta/10 rounded-full border border-harta/20 text-harta shrink-0">
            <Zap className="w-4 h-4 fill-harta" />
            <span className="text-xs font-black tracking-tighter uppercase">{streak} Streak</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        
        {/* LEFT COLUMN: ACTION CENTER */}
        <div className="space-y-8">
          <DecayStatusBanner />

          {/* ORACLE SECTION */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-rpg-card to-rpg-black border border-white/5 p-8 md:p-10 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-jiwa/10 blur-[100px] rounded-full -mr-20 -mt-20 opacity-30" />
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/5 rounded-[28px] flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                <Brain className="w-10 h-10 text-jiwa" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-jiwa">Oracle's Word</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-jiwa animate-pulse" />
                </div>
                <h2 className="text-2xl md:text-4xl font-black italic text-neutral-200 leading-tight">
                  "Kekuatan sejati lahir saat kamu memilih untuk tetap bergerak meski arah belum terlihat."
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-jiwa/10 rounded-xl border border-jiwa/20 text-[10px] font-black text-jiwa uppercase">
                     <Zap className="w-3 h-3" /> Aura Fokus
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-ilmu/10 rounded-xl border border-ilmu/20 text-[10px] font-black text-ilmu uppercase">
                     <Sparkles className="w-3 h-3" /> Berkah Kebijaksanaan
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* MISSIONS SECTION */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white text-black rounded-xl shadow-lg"><Target className="w-5 h-5" /></div>
                <h3 className="text-base md:text-lg font-black uppercase tracking-[0.2em]">Misi Hari Ini</h3>
              </div>
              <button onClick={onRefreshQuests} disabled={isRefreshing || refreshCount >= 1}
                className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest border transition-all',
                  refreshCount >= 1 ? 'bg-white/5 text-neutral-600 border-white/5 cursor-not-allowed' : 'bg-white text-black hover:scale-105')}>
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                {refreshCount >= 1 ? 'LIMIT REFRESH' : 'GANTI MISI'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {quests.length > 0 ? (
                quests.map((quest) => (
                  <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -5 }}
                    className={cn("glass-panel p-6 md:p-8 border-l-4 group transition-all flex flex-col", 
                      quest.completed ? "opacity-60 grayscale border-neutral-600" : "border-jiwa hover:border-white shadow-xl hover:shadow-jiwa/5")}>
                    
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-xs font-black uppercase tracking-widest text-neutral-400 bg-black/20 px-3 py-1.5 rounded-lg">{quest.stat}</span>
                      <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                        <Star className="w-4 h-4 text-harta" />
                        <span className="text-xs font-black text-neutral-200">+{quest.xp} XP</span>
                      </div>
                    </div>
                    
                    <h4 className="text-xl md:text-2xl font-black italic mb-3 group-hover:text-jiwa text-neutral-200 transition-colors leading-tight">{quest.title}</h4>
                    <p className="text-sm md:text-base text-neutral-400 mb-8 leading-relaxed flex-1">{quest.desc}</p>
                    
                    <div className="mt-auto">
                      {!quest.completed ? (
                        <button onClick={() => setActiveQuestInput(quest.id)} className="w-full py-3.5 bg-white text-black text-xs md:text-sm font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all shadow-lg">
                          Buktikan Quest
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-3.5 bg-neutral-900 rounded-xl text-xs md:text-sm font-black text-neutral-500 border border-neutral-800">
                          <Shield className="w-4 h-4" /> MISI SELESAI
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full glass-panel p-16 text-center border-dashed border-white/10 opacity-40">
                  <p className="text-base italic font-medium">Memanggil misi baru dari semesta...</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: CHARACTER STATS */}
        <div className="space-y-8">
          <section className={cn(
            "glass-panel p-8 bg-gradient-to-b from-rpg-card to-rpg-black/60 transition-all duration-1000",
            getRankGlow(avgStats)
          )}>
            <div className="flex flex-col items-center mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2">Status Dimensi</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: dominantColor }} />
                <span className="text-[9px] font-black tracking-widest opacity-40 uppercase">Puncak: {highestDim}</span>
              </div>
            </div>
            
            <div className="w-full h-[320px]">
              {isChartVisible && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'JIWA', A: stats.JIWA },
                    { subject: 'RAGA', A: stats.RAGA },
                    { subject: 'HARTA', A: stats.HARTA },
                    { subject: 'ILMU', A: stats.ILMU },
                    { subject: 'KARMA', A: stats.KARMA },
                  ]}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                    <Radar 
                      name="Player" 
                      dataKey="A" 
                      stroke={dominantColor} 
                      fill={dominantColor} 
                      fillOpacity={0.2} 
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-8 space-y-5">
              {[
                { name: 'JIWA', val: stats.JIWA, bar: 'bg-jiwa' },
                { name: 'RAGA', val: stats.RAGA, bar: 'bg-raga' },
                { name: 'HARTA', val: stats.HARTA, bar: 'bg-harta' },
                { name: 'ILMU', val: stats.ILMU, bar: 'bg-ilmu' },
                { name: 'KARMA', val: stats.KARMA, bar: 'bg-karma' },
              ].map(dim => (
                <div key={dim.name} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 tracking-widest">{dim.name}</span>
                      <span className={cn("px-2 py-0.5 rounded-md text-[9px] bg-white/5 border border-white/5", dim.bar.replace('bg-', 'text-'))}>
                        {getDimensionRank(dim.val)}
                      </span>
                    </div>
                    <span className="text-sm italic text-neutral-300">{dim.val}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${dim.val}%` }} 
                      className={cn("h-full relative", dim.bar)} 
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button onClick={onReOnboard} disabled={!canEvolve}
            className={cn('w-full py-5 rounded-2xl text-[10px] font-black tracking-[0.3em] transition-all flex items-center justify-center gap-3',
              canEvolve ? 'bg-jiwa/10 text-jiwa border border-jiwa/20 hover:bg-jiwa/20' : 'bg-white/5 text-neutral-600 border border-white/5 opacity-50 cursor-not-allowed')}>
            <Sparkles className="w-5 h-5" />
            {canEvolve ? 'EVOLUSI KARAKTER' : `EVOLUSI: ${daysLeft} HARI`}
          </button>
        </div>
      </div>

      {/* VERIFICATION MODAL */}
      <AnimatePresence>
        {activeQuestInput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-8 max-w-lg w-full space-y-6 border-jiwa/20 shadow-2xl">
              <div>
                <h3 className="text-2xl font-black italic">Buktikan Keberhasilanmu</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">AI akan menganalisis catatanmu untuk memverifikasi kejujuran progresmu di dimensi ini.</p>
              </div>
              <textarea value={userNote} onChange={e => setUserNote(e.target.value)}
                placeholder="Apa yang kamu lakukan hari ini? Bagaimana perasaanmu? (Min. 5 karakter)..."
                className="w-full h-40 p-6 bg-rpg-black border border-rpg-border rounded-2xl focus:border-jiwa outline-none text-white resize-none text-sm shadow-inner" />
              {verificationFeedback && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className={cn('p-4 rounded-xl text-xs font-bold flex items-center gap-3',
                    verificationFeedback.success ? 'bg-jiwa/10 text-jiwa border border-jiwa/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                  {verificationFeedback.success ? <Star className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {verificationFeedback.text}
                </motion.div>
              )}
              <div className="flex gap-4">
                <button onClick={() => { setActiveQuestInput(null); setUserNote(''); setVerificationFeedback(null); }}
                  disabled={isVerifying} className="flex-1 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-[10px] font-black tracking-widest hover:bg-neutral-800 transition-all">
                  BATAL
                </button>
                <button onClick={() => handleQuestSubmit(activeQuestInput!)} disabled={isVerifying || userNote.length < 5}
                  className="flex-1 py-4 bg-white text-black rounded-2xl text-[10px] font-black tracking-widest hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-xl shadow-white/10">
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'KIRIM BUKTI'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  );
};
