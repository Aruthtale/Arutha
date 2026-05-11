import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Star, Target, RefreshCw, Loader2, Zap, Calendar, Trophy, Globe, TrendingUp, ShieldAlert
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, getDimensionRank, getDimensionColor, getRankGlow } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Session } from '@supabase/supabase-js';
import { type DecayResult } from '../lib/decaySystem';
import { AIChatWidget } from '../components/AIChatWidget';
import { isToday } from '../lib/dateUtils';
import { TALENTS } from '../lib/talents';

// Modular Components
import { QuestCard } from '../components/dashboard/QuestCard';
import { DashboardHUD } from '../components/dashboard/DashboardHUD';
import { StatRadar } from '../components/dashboard/StatRadar';
import { VerificationModal } from '../components/dashboard/VerificationModal';
import { TalentModal } from '../components/dashboard/TalentModal';

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
  pendingTalentPool: any[];
  onSaveTalentPool: (pool: any[]) => void;
  onSkipTalent: () => Promise<void>;
}

const EMOJIS = ['😡', '😔', '😐', '😊', '🤩'];

export const Dashboard: React.FC<DashboardProps> = ({
  session, userId, name, level, xp, stats, quests, analysis, streak, lastStreakDate, onClaimStreak, statHistory, completeQuest, handleLogout, addXp, onReOnboard, onRefreshQuests, onGenerateInitialQuests, isRefreshing, lastEvolutionDate, refreshCount, decayResult, onTakeRecovery, setPage, talents, onClaimGlobalQuest,
  availableWeeklyQuests, activeWeeklyQuests, onClaimWeeklyQuest, talentChoicesAvailable, onSelectTalent, pendingTalentPool, onSaveTalentPool, onSkipTalent
}) => {
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [activeQuestInput, setActiveQuestInput] = useState<string | null>(null);

  const questFilter = useStore(state => state.questFilter);
  const setQuestFilter = useStore(state => state.setQuestFilter);
  const globalQuests = useStore(state => state.globalQuests);

  const filteredQuests = quests.filter(q => {
    if (questFilter === 'WORLD') return q.is_global;
    if (q.is_global) return false;
    return (q.quest_type || 'DAILY') === questFilter;
  });

  const activeGlobalQuests = globalQuests.filter(q => questFilter === 'WORLD' || q.is_global);

  const statsArray = Object.entries(stats).map(([name, val]) => ({ name, val }));
  const highestDim = statsArray.reduce((prev, current) => (prev.val > current.val) ? prev : current).name;
  const avgStats = statsArray.reduce((acc, curr) => acc + curr.val, 0) / statsArray.length;
  const dominantColor = getDimensionColor(highestDim);

  const auraTheme = useMemo(() => {
    const colors: Record<string, { main: string, glow: string, bg: string }> = {
      'JIWA': { main: 'var(--color-jiwa)', glow: 'rgba(255, 0, 128, 0.4)', bg: 'from-jiwa/20' },
      'RAGA': { main: 'var(--color-raga)', glow: 'rgba(255, 77, 77, 0.4)', bg: 'from-raga/20' },
      'HARTA': { main: 'var(--color-harta)', glow: 'rgba(255, 204, 0, 0.4)', bg: 'from-harta/20' },
      'ILMU': { main: 'var(--color-ilmu)', glow: 'rgba(0, 204, 255, 0.4)', bg: 'from-ilmu/20' },
      'KARMA': { main: 'var(--color-karma)', glow: 'rgba(0, 255, 170, 0.4)', bg: 'from-karma/20' }
    };
    return colors[highestDim] || colors['JIWA'];
  }, [highestDim]);

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
      if (pendingTalentPool && pendingTalentPool.length > 0) {
        setTalentPool(pendingTalentPool);
      } else {
        const unowned = TALENTS.filter(t => !talents.includes(t.id));
        const pool = [...unowned].sort(() => 0.5 - Math.random()).slice(0, 3);
        setTalentPool(pool);
        onSaveTalentPool(pool);
      }
      setShowTalentModal(true);
      setReplacingTalentId(null);
      setSelectedNewTalentId(null);
    }
  }, [talentChoicesAvailable, talents, showTalentModal, pendingTalentPool]);

  useEffect(() => {
    const timer = setTimeout(() => setIsChartVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleQuestSubmit = async () => {
    if (!activeQuestInput) return;
    setIsVerifying(true);
    setVerificationFeedback(null);
    try {
      const res = await completeQuest(activeQuestInput, userNote, photoData?.base64, photoData?.mimeType);
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
        setPhotoData({ base64: result.split(',')[1], mimeType: result.split(';')[0].split(':')[1] });
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const { canEvolve, daysLeft } = useMemo(() => {
    if (!lastEvolutionDate) return { canEvolve: true, daysLeft: 0 };
    const diffTime = Math.abs(new Date().getTime() - new Date(lastEvolutionDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { canEvolve: diffDays >= 30, daysLeft: Math.max(0, 30 - diffDays) };
  }, [lastEvolutionDate]);

  return (
    <div className="min-h-screen bg-rpg-black text-rpg-text pb-24 pt-32 md:pt-20 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b opacity-20 transition-all duration-1000", auraTheme.bg, "to-transparent")} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-[1000%] contrast-[150%]" />
      </div>

      {decayResult && decayResult.status !== 'ok' && (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 max-w-[340px] glass-panel p-6 border-orange-500/30 shadow-2xl">
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-6 h-6 text-orange-500 shrink-0" />
            <div>
              <h4 className="text-sm font-black uppercase text-orange-400">Misi Pemulihan</h4>
              <p className="text-[11px] text-neutral-300 mt-1">Ambil misi ringan ini untuk memulihkan stat yang menurun.</p>
              <button onClick={onTakeRecovery} disabled={isRefreshing} className="mt-4 w-full py-3 bg-rpg-primary rounded-xl text-[10px] font-black uppercase">
                {isRefreshing ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Ambil Misi'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <DashboardHUD level={level} xp={xp} streak={streak} claimed={isToday(lastStreakDate)} onClaimStreak={onClaimStreak} dominantColor={dominantColor} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 mt-12 md:mt-24">
        <div className="space-y-8 min-w-0">
          <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-rpg-card to-rpg-black border border-rpg-border p-10 md:p-14 shadow-2xl group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-jiwa/10 blur-[120px] rounded-full -mr-32 -mt-32 opacity-50" />
            <div className="relative z-10 space-y-6">
              <div className="px-4 py-1.5 bg-jiwa/10 rounded-full border border-jiwa/20 inline-flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-jiwa animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-jiwa">Arutha's Prophecy</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black italic text-rpg-text leading-[1.1] tracking-tighter">
                "Kekuatan sejati lahir saat kamu memilih untuk tetap bergerak meski arah belum terlihat."
              </h2>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rpg-primary text-rpg-primary-text rounded-xl shadow-lg"><Target className="w-5 h-5" /></div>
                <h3 className="text-base md:text-lg font-black uppercase tracking-[0.2em]">{questFilter}</h3>
              </div>
              <button onClick={onRefreshQuests} disabled={isRefreshing || refreshCount >= 1} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black border bg-rpg-primary text-rpg-primary-text disabled:opacity-50">
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} /> REFRESH
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { id: 'DAILY', label: 'Rites', sub: 'Harian', icon: Target, color: 'text-jiwa' },
                { id: 'WEEKLY', label: 'Trials', sub: 'Mingguan', icon: Calendar, color: 'text-ilmu' },
                { id: 'MONTHLY', label: 'Sagas', sub: 'Bulanan', icon: Trophy, color: 'text-harta' },
                { id: 'WORLD', label: 'World', sub: 'Anomaly', icon: Globe, color: 'text-amber-500' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setQuestFilter(tab.id as any)} className={cn("flex flex-col items-center py-5 rounded-[24px] border transition-all", questFilter === tab.id ? "bg-rpg-primary text-rpg-primary-text" : "bg-rpg-card border-rpg-border/50")}>
                  <tab.icon className={cn("w-6 h-6 mb-2", questFilter === tab.id ? "text-rpg-primary-text" : tab.color)} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                  <span className="text-[8px] opacity-60 uppercase">{tab.sub}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {questFilter === 'WORLD' ? (
                activeGlobalQuests.map(q => <QuestCard key={q.id} quest={q} onAction={setActiveQuestInput} isGlobal />)
              ) : questFilter === 'WEEKLY' ? (
                <div className="col-span-full space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {activeWeeklyQuests.map(q => <QuestCard key={q.id} quest={q} onAction={setActiveQuestInput} />)}
                  </div>
                  {availableWeeklyQuests.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {availableWeeklyQuests.map(q => (
                        <div key={q.id} className="glass-panel p-6 border border-rpg-border/50">
                          <h5 className="font-black italic text-rpg-text mb-4">"{q.title}"</h5>
                          <button onClick={() => onClaimWeeklyQuest(q.id)} className="w-full py-3 bg-rpg-primary text-rpg-primary-text rounded-xl text-[10px] font-black uppercase">Ambil Misi</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                filteredQuests.length > 0 ? (
                  filteredQuests.map(q => <QuestCard key={q.id} quest={q} onAction={setActiveQuestInput} />)
                ) : (
                  <div className="col-span-full glass-panel p-16 text-center border-dashed border-rpg-border flex flex-col items-center gap-6">
                    <Sparkles className="w-8 h-8 text-jiwa" />
                    <button onClick={() => setShowMoodModal(true)} className="px-8 py-3 bg-rpg-primary text-rpg-primary-text rounded-xl font-black uppercase">Mulai Hari Ini</button>
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8 min-w-0">
          <section className={cn("glass-panel p-8 bg-gradient-to-b", auraTheme.bg, "to-rpg-black/60", getRankGlow(avgStats))}>
            <StatRadar chartData={chartData} dominantColor={dominantColor} />
            <div className="space-y-4">
              {statsArray.map(dim => (
                <div key={dim.name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span>{dim.name} ({getDimensionRank(dim.val)})</span>
                    <span>{dim.val}%</span>
                  </div>
                  <div className="h-1.5 bg-rpg-border/10 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${dim.val}%` }} className={cn("h-full", getDimensionColor(dim.name as any) === 'var(--color-jiwa)' ? 'bg-jiwa' : getDimensionColor(dim.name as any) === 'var(--color-raga)' ? 'bg-raga' : getDimensionColor(dim.name as any) === 'var(--color-harta)' ? 'bg-harta' : getDimensionColor(dim.name as any) === 'var(--color-ilmu)' ? 'bg-ilmu' : 'bg-karma')} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {talents.length > 0 && (
            <section className="glass-panel p-8 bg-rpg-card">
              <h3 className="text-[10px] font-black uppercase text-rpg-text/40 mb-4">Bakat Aktif ({talents.length})</h3>
              <div className="flex flex-wrap gap-2">
                {talents.map(id => {
                  const t = TALENTS.find(x => x.id === id);
                  return t ? <div key={id} className="px-3 py-1.5 rounded-lg bg-rpg-border/10 border border-rpg-border/50 text-[10px] font-black">{t.name}</div> : null;
                })}
              </div>
            </section>
          )}

          <section className="glass-panel p-8 bg-rpg-card">
             <div className="flex items-center gap-2 mb-6">
               <TrendingUp className="w-4 h-4 text-ilmu" />
               <h3 className="text-[10px] font-black uppercase text-rpg-text/40">History</h3>
             </div>
             <div className="h-48">
               {isChartVisible && statHistory.length > 0 && (
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={statHistory}>
                     <XAxis dataKey="created_at" hide />
                     <YAxis hide domain={[0, 100]} />
                     <Tooltip contentStyle={{ backgroundColor: '#111', borderRadius: '12px' }} />
                     <Line type="monotone" dataKey="jiwa" stroke="var(--color-jiwa)" strokeWidth={2} dot={false} />
                     <Line type="monotone" dataKey="raga" stroke="var(--color-raga)" strokeWidth={2} dot={false} />
                     <Line type="monotone" dataKey="harta" stroke="var(--color-harta)" strokeWidth={2} dot={false} />
                     <Line type="monotone" dataKey="ilmu" stroke="var(--color-ilmu)" strokeWidth={2} dot={false} />
                     <Line type="monotone" dataKey="karma" stroke="var(--color-karma)" strokeWidth={2} dot={false} />
                   </LineChart>
                 </ResponsiveContainer>
               )}
             </div>
          </section>

          <button onClick={onReOnboard} disabled={!canEvolve} className={cn("w-full py-5 rounded-2xl text-[10px] font-black tracking-widest", canEvolve ? "bg-jiwa/10 text-jiwa border border-jiwa/20" : "opacity-40 cursor-not-allowed")}>
            {canEvolve ? 'EVOLUSI KARAKTER' : `EVOLUSI DALAM ${daysLeft} HARI`}
          </button>
        </div>
      </div>

      <VerificationModal 
        isOpen={!!activeQuestInput} onClose={() => setActiveQuestInput(null)}
        userNote={userNote} setUserNote={setUserNote} photoPreview={photoPreview}
        onPhotoUpload={handlePhotoUpload} onRemovePhoto={() => { setPhotoPreview(null); setPhotoData(null); }}
        onSubmit={handleQuestSubmit} isVerifying={isVerifying} feedback={verificationFeedback}
      />

      <TalentModal 
        isOpen={showTalentModal} talents={talents} talentPool={talentPool}
        replacingTalentId={replacingTalentId} setReplacingTalentId={setReplacingTalentId}
        selectedNewTalentId={selectedNewTalentId} setSelectedNewTalentId={setSelectedNewTalentId}
        onSelectTalent={onSelectTalent} onSkipTalent={onSkipTalent} onClose={() => setShowTalentModal(false)}
      />

      <AnimatePresence>
        {showMoodModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div className="glass-panel p-10 max-w-xl w-full text-center space-y-8">
              <h3 className="text-3xl font-black italic">MOOD ANDA?</h3>
              <div className="flex justify-center gap-4">
                {EMOJIS.map((e, i) => (
                  <button key={i} onClick={() => { setShowMoodModal(false); onGenerateInitialQuests?.(['Sangat Buruk', 'Buruk', 'Biasa Saja', 'Baik', 'Sangat Bersemangat'][i]); }} className="text-4xl hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AIChatWidget userId={userId} username={name} stats={stats} />
    </div>
  );
};
