import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Sparkles, Star, LayoutDashboard, User, Users, Map, Brain, Dumbbell, Coins, BookOpen, TrendingUp, Clock, Target, ArrowRight, Shield, RefreshCw, Loader2, AlertCircle, Zap, Contact2, ShieldAlert, ImagePlus, X, Calendar, Trophy, Globe
} from 'lucide-react';
import { useStore } from '../store/useStore';
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
  quest_type?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'WORLD';
  is_global?: boolean;
  is_weekly?: boolean;
  steps?: {
    current: number;
    total: number;
    last_check_in?: string;
  };
}

interface DashboardProps {
  session: Session | null;
  userId: string;
  name: string; level: number; xp: number; stats: Stats; quests: Quest[]; analysis: any;
  streak: number;
  lastStreakDate: string | null;
  onClaimStreak: () => void;
  statHistory: any[];
  completeQuest: (id: string, note: string, photoBase64?: string, photoMimeType?: string) => Promise<{ success: boolean; feedback: string }>;
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
  onClaimGlobalQuest: (questId: string) => void;
  availableWeeklyQuests: Quest[];
  activeWeeklyQuests: Quest[];
  onClaimWeeklyQuest: (id: string) => void;
  talentChoicesAvailable: number;
  onSelectTalent: (selectedId: string, replacedId?: string) => Promise<void>;
}

const EMOJIS = ['😡', '😔', '😐', '😊', '🤩'];

export const Dashboard: React.FC<DashboardProps> = ({
  session, userId, name, level, xp, stats, quests, analysis, streak, lastStreakDate, onClaimStreak, statHistory, completeQuest, handleLogout, onReOnboard, onRefreshQuests, onGenerateInitialQuests, isRefreshing, lastEvolutionDate, refreshCount, decayResult, onTakeRecovery, setPage, talents, onClaimGlobalQuest,
  availableWeeklyQuests, activeWeeklyQuests, onClaimWeeklyQuest, talentChoicesAvailable, onSelectTalent
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [activeQuestInput, setActiveQuestInput] = useState<string | null>(null);

  const questFilter = useStore(state => state.questFilter);
  const setQuestFilter = useStore(state => state.setQuestFilter);
  const globalQuests = useStore(state => state.globalQuests);

  const filteredQuests = quests.filter(q => {
    if (questFilter === 'WORLD') return q.is_global;
    if (q.is_global) return false; // Hide global quests from other tabs
    return (q.quest_type || 'DAILY') === questFilter;
  });

  const activeGlobalQuests = globalQuests.filter(q => questFilter === 'WORLD' || q.is_global);

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
  const [photoData, setPhotoData] = useState<{ base64: string, mimeType: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [verificationFeedback, setVerificationFeedback] = useState<{ success: boolean, text: string } | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showTalentModal, setShowTalentModal] = useState(false);
  const [talentPool, setTalentPool] = useState<any[]>([]);
  const [replacingTalentId, setReplacingTalentId] = useState<string | null>(null);
  const [selectedNewTalentId, setSelectedNewTalentId] = useState<string | null>(null);

  useEffect(() => {
    if (talentChoicesAvailable > 0 && !showTalentModal) {
      // Prepare 3 random talents that are NOT currently owned
      const unowned = TALENTS.filter(t => !talents.includes(t.id));
      const pool = [...unowned].sort(() => 0.5 - Math.random()).slice(0, 3);
      setTalentPool(pool);
      setShowTalentModal(true);
      setReplacingTalentId(null);
      setSelectedNewTalentId(null);
    }
  }, [talentChoicesAvailable, talents, showTalentModal]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran foto maksimal 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const mimeType = result.split(';')[0].split(':')[1];
        const base64 = result.split(',')[1];
        setPhotoData({ base64, mimeType });
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      setIsChartVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleQuestSubmit = async (id: string) => {
    if (!userNote.trim() && !photoData) return;
    setIsVerifying(true);
    setVerificationFeedback(null);
    try {
      const res = await completeQuest(id, userNote, photoData?.base64, photoData?.mimeType);
      setVerificationFeedback({ success: res.success, text: res.feedback });
      if (res.success) {
        setTimeout(() => {
          setActiveQuestInput(null);
          setUserNote('');
          setPhotoData(null);
          setPhotoPreview(null);
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

      {/* SUB-HEADER HUD */}
      <div className="fixed top-16 md:top-0 left-0 md:left-[280px] right-0 z-40">
        {/* Subtle top border glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="bg-rpg-black/70 backdrop-blur-2xl border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 md:py-3 flex items-center justify-between gap-3 md:gap-6 overflow-x-auto hide-scrollbar">
            
            {/* Title Badge */}
            <div className="flex items-center gap-2 px-4 py-2 md:py-2.5 bg-gradient-to-br from-white/10 to-transparent rounded-2xl border border-white/10 shrink-0 shadow-inner">
              <LayoutDashboard className="w-4 h-4 text-jiwa" />
              <span className="text-[10px] md:text-xs font-black text-white tracking-[0.2em] uppercase">Pusat Misi</span>
            </div>

            {/* Level & XP Bar */}
            <div className="flex-1 flex items-center min-w-[200px] max-w-xl bg-white/[0.03] p-1.5 md:p-2 rounded-2xl border border-white/5 shadow-inner group">
              <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-rpg-black rounded-xl border border-white/10 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-harta/20 to-ilmu/20 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="relative text-xs md:text-sm font-black text-white">L{level}</span>
              </div>
              <div className="flex-1 px-3 md:px-4">
                <div className="flex justify-between items-end mb-1 md:mb-1.5">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Experience</span>
                  <span className="text-[9px] md:text-[10px] font-black text-harta font-mono tracking-tighter">{xp} / {level * 1000}</span>
                </div>
                <div className="h-1.5 md:h-2 w-full bg-rpg-black rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${Math.max(0, Math.min(100, (xp / (Math.max(1, level) * 1000)) * 100 || 0))}%` }}
                    className="h-full bg-gradient-to-r from-jiwa via-harta to-ilmu relative">
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Streak Button */}
            <motion.button
              whileHover={!claimed ? { scale: 1.05 } : {}}
              whileTap={!claimed ? { scale: 0.95 } : {}}
              onClick={() => !claimed && onClaimStreak()}
              disabled={claimed}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2 md:py-2.5 rounded-2xl border transition-all shrink-0 relative overflow-hidden",
                claimed
                  ? "bg-white/5 border-white/10 opacity-70 cursor-default"
                  : "bg-gradient-to-br from-harta to-amber-600 text-black border-harta/50 shadow-[0_0_20px_rgba(255,193,7,0.4)] cursor-pointer"
              )}
            >
              {!claimed && <div className="absolute inset-0 bg-white/20 animate-shimmer" />}
              <Zap className={cn("w-4 h-4 md:w-5 md:h-5 relative z-10", claimed ? "text-harta opacity-50" : "fill-black")} />
              <div className="flex flex-col items-start relative z-10">
                <span className={cn("text-[8px] md:text-[9px] font-black tracking-widest uppercase", claimed ? "text-neutral-500" : "text-black/70")}>
                  {claimed ? "Terklaim" : "Klaim"}
                </span>
                <span className={cn("text-xs md:text-sm font-black tracking-tighter leading-none", claimed ? "text-white" : "text-black")}>
                  {streak} Streak
                </span>
              </div>
              {!claimed && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-ping" />}
            </motion.button>

          </div>
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
                <h3 className="text-base md:text-lg font-black uppercase tracking-[0.2em]">
                  {questFilter === 'DAILY' && 'Ritual Harian'}
                  {questFilter === 'WEEKLY' && 'Ujian Mingguan'}
                  {questFilter === 'MONTHLY' && 'Kisah Bulanan'}
                  {questFilter === 'WORLD' && 'Anomali Dunia'}
                </h3>
              </div>
              <button onClick={onRefreshQuests} disabled={isRefreshing || refreshCount >= 1}
                className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest border transition-all',
                  refreshCount >= 1 ? 'bg-white/5 text-neutral-600 border-white/5 cursor-not-allowed' : 'bg-white text-black hover:scale-105')}>
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                {refreshCount >= 1 ? 'LIMIT REFRESH' : 'GANTI MISI'}
              </button>
            </div>

            {/* QUEST FILTER TABS */}
            <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 gap-1">
              {[
                { id: 'DAILY', label: 'Rites', sub: 'Harian', icon: Target },
                { id: 'WEEKLY', label: 'Trials', sub: 'Mingguan', icon: Calendar },
                { id: 'MONTHLY', label: 'Sagas', sub: 'Bulanan', icon: Trophy },
                { id: 'WORLD', label: 'World', sub: 'Anomaly', icon: Globe },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQuestFilter(tab.id as any)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all border border-transparent",
                    questFilter === tab.id 
                      ? "bg-white text-black shadow-xl" 
                      : "hover:bg-white/5 text-neutral-500 hover:text-white"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4 mb-1", questFilter === tab.id ? "text-black" : "text-neutral-500")} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                  <span className={cn("text-[8px] font-medium uppercase tracking-tighter opacity-50 mt-1", questFilter === tab.id ? "text-black" : "text-neutral-500")}>
                    {tab.sub}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
              {questFilter === 'WORLD' ? (
                activeGlobalQuests.length > 0 ? (
                  activeGlobalQuests.map((quest) => (
                    <motion.div key={quest.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-amber-500/20 to-rpg-black border border-amber-500/30 p-8 shadow-2xl shadow-amber-500/5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/40">
                            <Globe className="w-3 h-3 text-amber-500" />
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Global Anomaly</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest block mb-1">Hadiah</span>
                            <span className="text-2xl font-black text-white font-mono">+{quest.xp} XP</span>
                          </div>
                        </div>
                        <h4 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tighter italic">"{quest.title}"</h4>
                        <p className="text-neutral-400 text-sm mb-8 leading-relaxed font-medium">{quest.desc}</p>
                        <button 
                          onClick={() => setActiveQuestInput(quest.id)}
                          className="mt-auto w-full py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                        >
                          Buktikan Tantangan Dunia
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-6 bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                      <Globe className="w-10 h-10 text-neutral-700" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-widest mb-2">Dunia Sedang Tenang</h4>
                      <p className="text-neutral-500 text-sm max-w-xs mx-auto">Tidak ada anomali global saat ini. Bersantailah, atau selesaikan ritual harianmu.</p>
                    </div>
                  </div>
                )
              ) : questFilter === 'WEEKLY' ? (
                <div className="col-span-full space-y-12">
                  {/* ACTIVE WEEKLY QUESTS */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-jiwa rounded-full shadow-[0_0_10px_rgba(var(--color-jiwa),0.5)]" />
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white">Misi Berjalan</h4>
                    </div>
                    
                    {activeWeeklyQuests.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {activeWeeklyQuests.map((quest) => (
                          <motion.div key={quest.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className={cn("glass-panel p-6 md:p-8 border-l-4 group relative overflow-hidden",
                              quest.completed ? "border-neutral-600 opacity-60 grayscale" : "border-jiwa")}>
                            
                            <div className="flex justify-between items-start mb-6">
                              <span className="text-[10px] font-black uppercase tracking-widest text-jiwa bg-jiwa/10 px-3 py-1 rounded-lg">
                                {quest.stat}
                              </span>
                              <div className="text-right">
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-1">Hadiah</span>
                                <span className="text-xl font-black text-white">+{quest.xp} XP</span>
                              </div>
                            </div>

                            <h4 className="text-xl md:text-2xl font-black italic mb-3 text-white">"{quest.title}"</h4>
                            <p className="text-sm text-neutral-400 mb-6 font-medium leading-relaxed">{quest.desc}</p>

                            {/* PROGRESS BAR */}
                            {quest.steps && (
                              <div className="space-y-3 mb-8">
                                <div className="flex justify-between items-end">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Progres Disiplin</span>
                                  <span className="text-xs font-black text-white">{quest.steps.current} / {quest.steps.total} Hari</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(quest.steps.current / quest.steps.total) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-jiwa to-ilmu shadow-[0_0_15px_rgba(var(--color-jiwa),0.3)]"
                                  />
                                </div>
                              </div>
                            )}

                            {!quest.completed ? (
                              <button onClick={() => setActiveQuestInput(quest.id)} 
                                className="w-full py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-xl">
                                Lapor Progres Hari Ini
                              </button>
                            ) : (
                              <div className="w-full py-4 bg-neutral-900 border border-neutral-800 text-neutral-500 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">
                                <Shield className="w-4 h-4" /> UJIAN SELESAI
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 bg-white/[0.02] rounded-[32px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4">
                        <Calendar className="w-8 h-8 text-neutral-700" />
                        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Belum ada misi mingguan aktif</p>
                      </div>
                    )}
                  </div>

                  {/* AVAILABLE WEEKLY QUESTS */}
                  {availableWeeklyQuests.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-neutral-700 rounded-full" />
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-500">Pilihan Ujian Minggu Ini</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {availableWeeklyQuests.map((quest) => (
                          <motion.div key={quest.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel p-6 border border-white/5 hover:border-white/20 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500">{quest.stat}</span>
                              <span className="text-xs font-black text-neutral-300">+{quest.xp} XP</span>
                            </div>
                            <h5 className="text-lg font-black italic text-white mb-2 group-hover:text-jiwa transition-colors">"{quest.title}"</h5>
                            <p className="text-xs text-neutral-400 mb-6 font-medium line-clamp-2">{quest.desc}</p>
                            <button onClick={() => onClaimWeeklyQuest(quest.id)}
                              className="w-full py-3 bg-white/5 hover:bg-white text-neutral-400 hover:text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5">
                              Ambil Misi
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                filteredQuests.length > 0 ? (
                  filteredQuests.map((quest) => (
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
              ))}
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
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.max(0, Math.min(100, Number(dim.val) || 0))}%` }}
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
                placeholder="Ceritakan pengalamanmu menyelesaikan misi ini... (Opsional jika melampirkan foto)"
                className="w-full h-32 p-4 bg-rpg-black border border-rpg-border rounded-2xl focus:border-jiwa outline-none text-white resize-none text-sm shadow-inner" />
              
              <div className="flex flex-col gap-3">
                {photoPreview ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 group">
                    <img src={photoPreview} alt="Bukti" className="w-full h-full object-cover" />
                    <button onClick={() => { setPhotoPreview(null); setPhotoData(null); }} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 rounded-lg backdrop-blur-sm transition-colors text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full py-4 border-2 border-dashed border-white/10 hover:border-jiwa/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white/5 group">
                    <ImagePlus className="w-6 h-6 text-neutral-500 group-hover:text-jiwa" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-neutral-200">Lampirkan Foto (Opsional)</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
              </div>
              
              <p className="text-[10px] text-neutral-500 italic text-center">Tip: Sertakan foto jika kesulitan mendeskripsikan dengan kata-kata agar lebih meyakinkan AI.</p>
              {verificationFeedback && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className={cn('p-4 rounded-xl text-xs font-bold flex items-center gap-3',
                    verificationFeedback.success ? 'bg-jiwa/10 text-jiwa border border-jiwa/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                  {verificationFeedback.success ? <Star className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {verificationFeedback.text}
                </motion.div>
              )}
              <div className="flex gap-4">
                <button onClick={() => { setActiveQuestInput(null); setUserNote(''); setPhotoData(null); setPhotoPreview(null); setVerificationFeedback(null); }}
                  disabled={isVerifying} className="flex-1 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-[10px] font-black tracking-widest hover:bg-neutral-800 transition-all">
                  BATAL
                </button>
                <button onClick={() => handleQuestSubmit(activeQuestInput!)} disabled={isVerifying || (!userNote.trim() && !photoData)}
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

      {/* TALENT SELECTION MODAL */}
      <AnimatePresence>
        {showTalentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl overflow-y-auto">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-4xl w-full py-12 px-6 md:px-12 space-y-12">
              
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-jiwa/10 border border-jiwa/20 rounded-full">
                  <Star className="w-4 h-4 text-jiwa" />
                  <span className="text-[10px] font-black tracking-[0.3em] text-jiwa uppercase">Pilihan Takdir Baru</span>
                </div>
                <h3 className="text-4xl md:text-6xl font-black italic text-white tracking-tighter leading-none">PILIH TALENTA ANDA</h3>
                <p className="text-sm text-neutral-400 max-w-lg mx-auto">Satu pilihan akan mengubah jalannya sejarah. Pilih dengan bijak, Pahlawan.</p>
              </div>

              <div className="flex justify-center gap-4">
                {[0, 1, 2].map((i) => {
                  const talentId = talents[i];
                  const talent = talentId ? TALENTS.find(t => t.id === talentId) : null;
                  
                  const colors = talent ? {
                    'Common': 'border-neutral-500/20 bg-neutral-500/5 text-neutral-400',
                    'Uncommon': 'border-green-500/20 bg-green-500/5 text-green-400',
                    'Rare': 'border-blue-500/20 bg-blue-500/5 text-blue-400',
                    'Epic': 'border-purple-500/20 bg-purple-500/5 text-purple-400',
                    'Legendary': 'border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                  }[talent.rarity as string] : 'border-dashed border-white/10 bg-transparent text-white/20';

                  return (
                    <motion.div 
                      key={i}
                      whileHover={talent ? { scale: 1.05, y: -5 } : {}}
                      onClick={() => talents.length >= 3 && talentId && setReplacingTalentId(talentId)}
                      className={cn(
                        "w-24 h-24 md:w-32 md:h-32 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer relative overflow-hidden",
                        colors,
                        replacingTalentId === talentId && talentId ? "border-white ring-4 ring-white/20 bg-white text-black" : ""
                      )}
                    >
                      {talent ? (
                        <>
                          <div className="text-2xl">{talent.rarity === 'Legendary' ? '🔱' : talent.rarity === 'Epic' ? '💎' : talent.rarity === 'Rare' ? '⚔️' : '✨'}</div>
                          <div className={cn("text-[8px] font-black uppercase tracking-widest text-center px-2", replacingTalentId === talentId ? "text-black" : "text-white/40")}>{talent.name}</div>
                          <div className={cn("absolute bottom-2 px-1.5 py-0.5 rounded-[4px] text-[6px] font-bold uppercase tracking-widest", replacingTalentId === talentId ? "bg-black text-white" : "bg-white/10 text-white")}>
                            {talent.rarity}
                          </div>
                        </>
                      ) : (
                        <div className="text-[8px] font-black uppercase tracking-widest">Slot Kosong</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {talents.length >= 3 && !replacingTalentId && (
                <p className="text-center text-jiwa text-xs font-black animate-bounce">Slot Penuh! Pilih satu talenta di atas untuk diganti.</p>
              )}

              {/* OPTIONS POOL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {talentPool.map((t) => {
                  const colors = {
                    'Common': 'text-neutral-400 border-neutral-500/20 bg-neutral-500/5',
                    'Uncommon': 'text-green-400 border-green-500/20 bg-green-500/5',
                    'Rare': 'text-blue-400 border-blue-500/20 bg-blue-500/5',
                    'Epic': 'text-purple-400 border-purple-500/20 bg-purple-500/5',
                    'Legendary': 'text-amber-400 border-amber-500/20 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                  }[t.rarity as string] || 'text-white border-white/10';

                  const badgeColors = {
                    'Common': 'bg-neutral-500/20 text-neutral-400',
                    'Uncommon': 'bg-green-500/20 text-green-400',
                    'Rare': 'bg-blue-500/20 text-blue-400',
                    'Epic': 'bg-purple-500/20 text-purple-400',
                    'Legendary': 'bg-amber-500 text-black font-black'
                  }[t.rarity as string] || 'bg-white/10 text-white';

                  return (
                    <motion.div
                      key={t.id}
                      whileHover={{ y: -10, scale: 1.02 }}
                      onClick={() => {
                        if (talents.length < 3 || replacingTalentId) {
                          setSelectedNewTalentId(t.id);
                        }
                      }}
                      className={cn(
                        "glass-panel p-6 border transition-all cursor-pointer text-left space-y-4 group relative overflow-hidden",
                        colors,
                        selectedNewTalentId === t.id ? "bg-white text-black border-white ring-4 ring-white/20" : ""
                      )}
                    >
                      {t.rarity === 'Legendary' && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                      )}
                      
                      <div className="flex justify-between items-start">
                        <div className={cn("text-4xl group-hover:scale-125 transition-transform duration-500", selectedNewTalentId === t.id ? "text-black" : "")}>
                          {t.rarity === 'Legendary' ? '🔱' : t.rarity === 'Epic' ? '💎' : t.rarity === 'Rare' ? '⚔️' : '✨'}
                        </div>
                        <div className={cn("px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase", selectedNewTalentId === t.id ? "bg-black text-white" : badgeColors)}>
                          {t.rarity}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-black italic text-xl leading-tight uppercase tracking-tighter">{t.name}</h4>
                        <p className={cn("text-[11px] leading-relaxed font-medium", selectedNewTalentId === t.id ? "text-black/80" : "text-neutral-400")}>
                          {t.desc}
                        </p>
                      </div>

                      {/* BONUS INFO */}
                      <div className="pt-2 flex flex-wrap gap-2">
                        {t.statBoost && (
                          <div className={cn("px-2 py-1 rounded bg-black/20 text-[9px] font-bold flex items-center gap-1", selectedNewTalentId === t.id ? "bg-black/10 text-black" : "text-white/60")}>
                            <span className="opacity-50">BUFF:</span>
                            <span className="text-white">+{Math.round(t.statBoost.value * 100)}% {t.statBoost.stat}</span>
                          </div>
                        )}
                        {t.xpBoost && (
                          <div className={cn("px-2 py-1 rounded bg-black/20 text-[9px] font-bold flex items-center gap-1", selectedNewTalentId === t.id ? "bg-black/10 text-black" : "text-white/60")}>
                            <span className="opacity-50">XP:</span>
                            <span className="text-white">+{Math.round(t.xpBoost.value * 100)}% ({t.xpBoost.condition})</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  disabled={!selectedNewTalentId || (talents.length >= 3 && !replacingTalentId)}
                  onClick={async () => {
                    await onSelectTalent(selectedNewTalentId!, replacingTalentId || undefined);
                    setShowTalentModal(false);
                  }}
                  className="px-12 py-5 bg-white text-black rounded-2xl font-black italic tracking-widest hover:scale-110 active:scale-95 transition-all disabled:opacity-20 shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                >
                  KONFIRMASI TAKDIR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIChatWidget userId={userId} username={name} stats={stats} />
    </div>
  );
};
