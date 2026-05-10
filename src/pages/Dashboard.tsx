import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Sparkles, Star, LayoutDashboard, User, Users, Map, Brain, Dumbbell, Coins, BookOpen, TrendingUp, Clock, Target, ArrowRight, Shield, RefreshCw, Loader2, AlertCircle, Zap, Contact2, ShieldAlert
} from 'lucide-react';
import { cn, getDimensionRank, getDimensionColor, getRankGlow } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Session } from '@supabase/supabase-js';
import { type DecayResult } from '../lib/decaySystem';
import { AIChatWidget } from '../components/AIChatWidget';
import { isToday } from '../lib/dateUtils';
import { TALENTS } from '../lib/talents';

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
  lastStreakDate: string | null;
  onClaimStreak: () => void;
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
  talents: string[];
}

const EMOJIS = ['😡', '😔', '😐', '😊', '🤩'];

export const Dashboard: React.FC<DashboardProps> = ({
  session, userId, name, level, xp, stats, quests, analysis, streak, lastStreakDate, onClaimStreak, statHistory, completeQuest, handleLogout, onReOnboard, onRefreshQuests, onGenerateInitialQuests, isRefreshing, lastEvolutionDate, refreshCount, decayResult, onTakeRecovery, setPage, talents
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [activeQuestInput, setActiveQuestInput] = useState<string | null>(null);

  const statsArray = Object.entries(stats).map(([name, val]) => ({ name, val }));
  const highestDim = statsArray.reduce((prev, current) => (prev.val > current.val) ? prev : current).name;
  const avgStats = statsArray.reduce((acc, curr) => acc + curr.val, 0) / statsArray.length;
  const dominantColor = getDimensionColor(highestDim);

  const chartData = useMemo(() => [
    { subject: 'JIWA', A: stats.JIWA },
    { subject: 'RAGA', A: stats.RAGA },
    { subject: 'HARTA', A: stats.HARTA },
    { subject: 'ILMU', A: stats.ILMU },
    { subject: 'KARMA', A: stats.KARMA },
  ], [stats]);
  const [userNote, setUserNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{ success: boolean, text: string } | null>(null);
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

  const isClaimedToday = () => isToday(lastStreakDate);

  const claimed = isClaimedToday();

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
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 max-w-[340px] w-[calc(100vw-32px)] glass-panel p-6 border-orange-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(249,115,22,0.1)] overflow-hidden group"
        >
          {/* Background Glow */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-500/10 blur-[40px] rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
                <ShieldAlert className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black italic uppercase tracking-widest text-orange-400 mb-1 leading-none">Misi Pemulihan</h4>
                <p className="text-[11px] font-medium leading-relaxed text-neutral-300">
                  Beberapa stat kamu sedikit menurun karena lama tidak aktif. Ambil misi ringan ini untuk memulihkan kondisimu!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onTakeRecovery}
                disabled={isRefreshing}
                className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    MEMPROSES...
                  </>
                ) : 'Ambil Misi'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen text-white pb-24 pt-32 md:pt-20">
      <DecayStatusBanner />

      {/* SUB-HEADER BAR */}
      <div className="fixed top-16 md:top-0 left-0 md:left-[280px] right-0 z-40 bg-rpg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-3 md:gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2.5 px-3 md:px-4 py-1.5 bg-white/10 rounded-full border border-white/10 shrink-0">
            <LayoutDashboard className="w-4 h-4 text-white" />
            <span className="hidden sm:inline text-xs font-black text-neutral-200 tracking-widest uppercase">Pusat Misi</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/10" />

          <div className="flex-1 flex items-center gap-2 md:gap-4 px-3 md:px-4 bg-white/5 rounded-2xl border border-white/5 h-10 group min-w-[120px]">
            <Star className="w-4 h-4 text-harta fill-harta/20 shrink-0" />
            <div className="flex-1 h-1.5 bg-rpg-black rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(xp / (level * 1000)) * 100}%` }}
                className="h-full bg-gradient-to-r from-jiwa to-ilmu animate-shimmer" />
            </div>
            <span className="text-[10px] font-black text-neutral-500 font-mono shrink-0">{xp} / {level * 1000}</span>
          </div>

          <motion.button
            whileHover={!claimed ? { scale: 1.05 } : {}}
            whileTap={!claimed ? { scale: 0.95 } : {}}
            onClick={() => !claimed && onClaimStreak()}
            disabled={claimed}
            className={cn(
              "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full border transition-all shrink-0",
              claimed
                ? "bg-harta/10 border-harta/20 text-harta opacity-60"
                : "bg-harta text-black border-harta shadow-[0_0_15px_rgba(255,193,7,0.3)] animate-pulse"
            )}
          >
            <Zap className={cn("w-4 h-4", claimed ? "fill-harta" : "fill-black")} />
            <span className="text-xs font-black tracking-tighter uppercase">
              {streak} <span className="hidden sm:inline">Streak</span>
              {!claimed && <span className="ml-1 text-[8px] animate-bounce">!</span>}
            </span>
          </motion.button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        {/* LEFT COLUMN: ACTION CENTER */}
        <div className="space-y-8 min-w-0">
          {/* ORACLE SECTION */}
          <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-rpg-card to-rpg-black border border-white/10 p-10 md:p-14 shadow-[0_30px_100px_rgba(0,0,0,0.5)] group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-jiwa/10 blur-[120px] rounded-full -mr-32 -mt-32 opacity-50 group-hover:bg-jiwa/20 transition-colors duration-1000" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-ilmu/5 blur-[100px] rounded-full -ml-20 -mb-20 opacity-30" />
            
            <div className="relative z-10 flex flex-col gap-10 items-center md:items-start text-center md:text-left">
              <div className="space-y-6 flex-1">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="px-4 py-1.5 bg-jiwa/10 rounded-full border border-jiwa/20 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-jiwa animate-ping" />
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-jiwa">Arutha's Prophecy</span>
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-black italic text-white leading-[1.1] tracking-tighter drop-shadow-2xl">
                  "Kekuatan sejati lahir saat kamu memilih untuk tetap bergerak meski arah belum terlihat."
                </h2>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-[10px] font-black text-neutral-300 uppercase tracking-widest cursor-default">
                    <Zap className="w-4 h-4 text-harta" /> Aura Fokus Aktif
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-[10px] font-black text-neutral-300 uppercase tracking-widest cursor-default">
                    <Sparkles className="w-4 h-4 text-ilmu" /> Berkah Terjaga
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

                    <h4 className="text-2xl md:text-3xl font-black italic mb-4 group-hover:text-jiwa text-neutral-100 transition-colors leading-tight">
                      {quest.title}
                    </h4>
                    <p className="text-sm md:text-base text-neutral-400 mb-8 leading-relaxed flex-1 font-medium">
                      {quest.desc}
                    </p>

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
                <div className="col-span-full glass-panel p-16 text-center border-dashed border-white/10 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-jiwa/10 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-8 h-8 text-jiwa" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-black italic text-white">Dimensi Kosong</p>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">Pilih mood kamu hari ini untuk memanggil misi baru dari semesta.</p>
                  </div>
                  <button 
                    onClick={() => setShowMoodModal(true)}
                    className="px-8 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/5"
                  >
                    Mulai Hari Ini
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: CHARACTER HUD */}
        <div className="space-y-8 min-w-0">
          <section className={cn(
            "glass-panel p-8 bg-gradient-to-b from-rpg-card to-rpg-black/60 transition-all duration-1000",
            getRankGlow(avgStats)
          )}>
            <div className="flex flex-col items-center mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-2 italic">Status Dimensi</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: dominantColor }} />
                <span className="text-[10px] font-black tracking-widest opacity-60 uppercase">Puncak: {highestDim}</span>
              </div>
            </div>

            <div className="w-full h-[280px] max-w-[280px] mx-auto relative mb-4">
              <div className="absolute inset-0 bg-current/5 blur-[40px] rounded-full pointer-events-none" style={{ color: dominantColor }} />
              {isChartVisible && (
                <ResponsiveContainer width="100%" aspect={1} debounce={200}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="#333" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: '900' }} />
                    <Radar
                      name="Player"
                      dataKey="A"
                      stroke={dominantColor}
                      fill={dominantColor}
                      fillOpacity={0.3}
                      strokeWidth={3}
                      isAnimationActive={false}
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
          
          {/* ACTIVE TALENTS */}
          {talents.length > 0 && (
            <section className="glass-panel p-8 bg-rpg-card border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-jiwa/10 text-jiwa rounded-lg"><Sparkles className="w-4 h-4" /></div>
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-300">Bakat Aktif ({talents.length})</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {talents.map(id => {
                  const t = TALENTS.find(talent => talent.id === id);
                  if (!t) return null;
                  return (
                    <div key={id} className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black border flex items-center gap-2",
                      t.rarity === 'Legendary' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      t.rarity === 'Epic' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                      t.rarity === 'Rare' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                      t.rarity === 'Uncommon' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                      'bg-white/5 border-white/10 text-neutral-400'
                    )}>
                      {t.rarity === 'Legendary' && <Star className="w-3 h-3 fill-amber-500" />}
                      {t.name}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* PROGRESS HISTORY */}
          <section className="glass-panel p-8 bg-rpg-card border-white/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <TrendingUp className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-ilmu/10 text-ilmu rounded-lg"><TrendingUp className="w-4 h-4" /></div>
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-300">Progress History</h3>
            </div>

            <div className="w-full min-h-[192px]">
              {statHistory && statHistory.length > 0 && isChartVisible ? (
                <ResponsiveContainer width="100%" aspect={2} debounce={200}>
                  <LineChart data={statHistory}>
                    <XAxis
                      dataKey="created_at"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 'bold' }}
                      tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                      minTickGap={30}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="jiwa" stroke="#C084FC" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="raga" stroke="#F43F5E" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="harta" stroke="#FACC15" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ilmu" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="karma" stroke="#4ADE80" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[10px] font-black text-neutral-600 uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                  Data sejarah belum tersedia
                </div>
              )}
            </div>
            <div className="flex justify-center gap-3 mt-4">
              {['jiwa', 'raga', 'harta', 'ilmu', 'karma'].map(dim => (
                <div key={dim} className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full",
                    dim === 'jiwa' ? 'bg-jiwa' :
                      dim === 'raga' ? 'bg-raga' :
                        dim === 'harta' ? 'bg-harta' :
                          dim === 'ilmu' ? 'bg-ilmu' : 'bg-karma'
                  )} />
                  <span className="text-[8px] font-black text-neutral-500 uppercase">{dim}</span>
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
                <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter">Buktikan Keberhasilanmu</h3>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">AI akan menganalisis catatanmu untuk memverifikasi kejujuran progresmu di dimensi ini.</p>
              </div>
              <textarea value={userNote} onChange={e => setUserNote(e.target.value)}
                placeholder="Ceritakan pengalamanmu menyelesaikan misi ini... (Contoh: 'Saya sudah makan sayur bayam dan merasa lebih segar!')"
                className="w-full h-40 p-6 bg-rpg-black border border-rpg-border rounded-2xl focus:border-jiwa outline-none text-white resize-none text-sm shadow-inner" />
              <p className="text-[10px] text-neutral-500 italic text-center">Tip: Ceritakan minimal satu kalimat agar Mentor Arutha bisa memverifikasi progresmu.</p>
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

      {/* MOOD MODAL */}
      <AnimatePresence>
        {showMoodModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-10 max-w-xl w-full text-center space-y-8 border-jiwa/30">
              <div className="space-y-2">
                <div className="inline-block p-3 bg-jiwa/10 rounded-2xl mb-4">
                  <Sparkles className="w-8 h-8 text-jiwa" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black italic text-white tracking-tighter">BAGAIMANA MOOD KAMU?</h3>
                <p className="text-xs text-neutral-400 uppercase tracking-[0.2em]">Arutha akan menyesuaikan tantangan dengan energimu</p>
              </div>

              <div className="flex justify-center gap-4 md:gap-6">
                {EMOJIS.map((emoji, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.2, y: -10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowMoodModal(false);
                      onGenerateInitialQuests?.(['Sangat Buruk', 'Buruk', 'Biasa Saja', 'Baik', 'Sangat Bersemangat'][i]);
                    }}
                    className="text-4xl md:text-5xl filter grayscale hover:grayscale-0 transition-all p-2"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>

              <p className="text-[10px] text-neutral-500 italic max-w-sm mx-auto">
                "Kondisi mentalmu adalah kompas dalam perjalanan ini. Jujurlah pada dirimu sendiri."
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIChatWidget userId={userId} username={name} stats={stats} />
    </div>
  );
};
