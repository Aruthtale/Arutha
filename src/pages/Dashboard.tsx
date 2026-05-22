import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Trophy, Calendar, Globe, RefreshCw, Loader2, Sparkles 
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useAppCore } from '../hooks/useAppCore';
import { QuestCard } from '../components/dashboard/QuestCard';
import { DashboardHUD } from '../components/dashboard/DashboardHUD';
import { StatRadar } from '../components/dashboard/StatRadar';
import { DailyTarotWidget } from '../components/dashboard/DailyTarotWidget';
import { MoodJournal } from '../components/dashboard/MoodJournal';
import { SeasonalEventBanner } from '../components/dashboard/SeasonalEventBanner';
import { cn } from '../lib/utils';

export default function Dashboard() {
  // Actions from useAppCore
  const { 
    refreshQuests, handleClaimStreak, completeQuest, handleClaimWeeklyQuest, handleClaimGlobalQuest 
  } = useAppCore();

  // State from useStore
  const {
    level, xp, streak, lastStreakDate, stats, quests, 
    characterAnalysis, dbUserId, name, lastEvolutionDate,
    isRefreshing, refreshCount, globalQuests,
    activeWeeklyQuests, availableWeeklyQuests, theme, session
  } = useStore();

  const isLight = theme === 'DIVINE';

  const [questFilter, setQuestFilter] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'WORLD'>('DAILY');
  const [activeQuestInput, setActiveQuestInput] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [photoData, setPhotoData] = useState<{base64: string, mimeType: string} | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{success: boolean, text: string} | null>(null);

  const filteredQuests = useMemo(() => {
    return (quests || []).filter(q => q.quest_type === questFilter);
  }, [quests, questFilter]);

  const chartData = useMemo(() => {
    return Object.entries(stats || {}).map(([key, value]) => ({
      subject: key,
      A: value as number
    }));
  }, [stats]);

  const dominantColor = useMemo(() => {
    // Determine color based on dominant stat
    const entries = Object.entries(stats || {});
    if (entries.length === 0) return "#94a3b8"; // Default slate
    const dominant = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    
    switch(dominant[0]) {
      case 'JIWA': return isLight ? "#7c3aed" : "#818cf8"; // Purple/Indigo
      case 'RAGA': return isLight ? "#dc2626" : "#f87171"; // Red
      case 'HARTA': return isLight ? "#d97706" : "#fbbf24"; // Amber
      case 'ILMU': return isLight ? "#0891b2" : "#2dd4bf"; // Cyan/Teal
      case 'KARMA': return isLight ? "#db2777" : "#f472b6"; // Pink
      default: return "#94a3b8";
    }
  }, [stats, isLight]);

  const avgStats = useMemo(() => {
    if (!stats) return 0;
    const vals = Object.values(stats) as number[];
    return vals.reduce((a, b) => a + (b || 0), 0) / (vals.length || 1);
  }, [stats]);

  const getRankGlow = (avg: number) => {
    if (avg >= 80) return "shadow-[0_0_50px_rgba(245,158,11,0.2)]";
    if (avg >= 60) return "shadow-[0_0_40px_rgba(168,85,247,0.15)]";
    return "shadow-[0_0_30px_rgba(59,130,246,0.1)]";
  };

  const isTodayDate = (dateString?: string | null) => {
    if (!dateString) return false;
    const today = new Date().toDateString();
    const target = new Date(dateString).toDateString();
    return today === target;
  };

  const daysLeft = useMemo(() => {
    if (!lastEvolutionDate) return 30;
    const diffTime = Math.abs(new Date().getTime() - new Date(lastEvolutionDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  }, [lastEvolutionDate]);

  const getStatColorClass = (statName: string) => {
    switch(statName) {
      case 'JIWA': return 'bg-jiwa';
      case 'RAGA': return 'bg-raga';
      case 'HARTA': return 'bg-harta';
      case 'ILMU': return 'bg-ilmu';
      case 'KARMA': return 'bg-karma';
      default: return 'bg-rpg-primary';
    }
  };

  return (
    <div className="min-h-screen bg-rpg-black text-rpg-text pb-24 pt-20 relative overflow-hidden font-sans transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-20",
          isLight ? "bg-gradient-to-b from-jiwa/5 to-transparent" : "bg-gradient-to-b from-jiwa/10 to-transparent"
        )} />
      </div>

      <DashboardHUD level={level} xp={xp} streak={streak} claimed={isTodayDate(lastStreakDate)} onClaimStreak={handleClaimStreak} dominantColor={dominantColor} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12 md:mt-24 space-y-12 relative z-10">
        <header className={cn(
          "relative py-12 md:py-20 px-8 md:px-16 rounded-[48px] overflow-hidden border transition-all duration-700 shadow-2xl",
          isLight 
            ? "border-neutral-200 bg-white" 
            : "border-white/5 bg-gradient-to-br from-rpg-card to-rpg-black"
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] rounded-full -mr-48 -mt-48 transition-all duration-1000",
            isLight ? "bg-jiwa/5 opacity-30" : "bg-jiwa/5 opacity-40 group-hover:bg-jiwa/10"
          )} />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className={cn(
                "inline-flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md border",
                isLight ? "bg-neutral-100 border-neutral-200" : "bg-white/5 border-white/10"
              )}>
                <Sparkles className="w-4 h-4 text-jiwa animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-jiwa">Oracle of Arutha</span>
              </div>
              <h2 className={cn(
                "text-3xl md:text-6xl font-black italic leading-[1.05] tracking-tighter",
                isLight ? "text-neutral-900" : "text-white"
              )}>
                {characterAnalysis?.daily_oracle?.quote ? `"${characterAnalysis.daily_oracle.quote}"` : '"Kekuatan sejati lahir saat kamu memilih untuk tetap bergerak meski arah belum terlihat."'}
              </h2>
            </div>

            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Waktu Tersisa</span>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-5xl font-black tracking-tighter", isLight ? "text-neutral-900" : "text-white")}>{daysLeft}</span>
                <span className="text-sm font-black text-jiwa uppercase tracking-widest">Hari</span>
              </div>
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Menuju Evolusi Berikutnya</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          <div className="space-y-12">
            <SeasonalEventBanner />

            <section className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-rpg-primary">
                    <Target className="w-6 h-6" />
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Mission Hub</h3>
                  </div>
                </div>
                
                <button 
                  onClick={refreshQuests} 
                  disabled={isRefreshing || refreshCount >= 1 || quests.some(q => q.quest_type === 'RECOVERY')} 
                  className={cn(
                    "flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black border transition-all disabled:opacity-30",
                    isLight 
                      ? "bg-neutral-100 border-neutral-200 text-neutral-900 hover:bg-neutral-200" 
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} /> REFRESH HUB
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                {[
                  { id: 'DAILY', label: 'Rites', sub: 'Harian', icon: Target, color: 'text-jiwa' },
                  { id: 'WEEKLY', label: 'Trials', sub: 'Mingguan', icon: Calendar, color: 'text-ilmu' },
                  { id: 'MONTHLY', label: 'Sagas', sub: 'Bulanan', icon: Trophy, color: 'text-harta' },
                  { id: 'WORLD', label: 'World', sub: 'Anomaly', icon: Globe, color: 'text-amber-500' },
                ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setQuestFilter(tab.id as any)} 
                    className={cn(
                      "flex flex-col items-center min-w-[130px] py-5 rounded-[32px] border transition-all duration-500 group", 
                      questFilter === tab.id 
                        ? "bg-rpg-primary text-rpg-primary-text border-rpg-primary shadow-xl" 
                        : isLight
                          ? "bg-neutral-100 border-neutral-200 text-neutral-500 hover:border-neutral-300"
                          : "bg-white/5 border-white/5 text-neutral-500 hover:border-white/10"
                    )}
                  >
                    <tab.icon className={cn("w-6 h-6 mb-2", questFilter === tab.id ? "text-rpg-primary-text" : tab.color)} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[450px]">
                {questFilter === 'WORLD' ? (
                  (globalQuests || []).length > 0 ? (
                    globalQuests.map(q => <QuestCard key={q.id} quest={q} onAction={setActiveQuestInput} isGlobal />)
                  ) : (
                    <div className="col-span-full glass-panel p-24 text-center border-dashed border-rpg-border flex flex-col items-center gap-6">
                      <Globe className="w-10 h-10 text-amber-500/30" />
                      <h4 className="text-2xl font-black uppercase tracking-widest text-neutral-500">Dunia Sedang Tenang</h4>
                    </div>
                  )
                ) : questFilter === 'WEEKLY' ? (
                  <div className="col-span-full space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {(activeWeeklyQuests || []).map(q => <QuestCard key={q.id} quest={q} onAction={setActiveQuestInput} />)}
                    </div>
                    {(availableWeeklyQuests || []).length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-rpg-text/40 px-2">Available Weekly Challenges</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {availableWeeklyQuests.map(q => (
                            <div key={q.id} className="glass-panel p-8 border border-rpg-border bg-rpg-card/40 flex flex-col justify-between group hover:border-rpg-primary/30 transition-all">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-jiwa mb-4 block">{q.stat}</span>
                                <h5 className="font-sans font-black text-xl text-rpg-text mb-6">"{q.title}"</h5>
                              </div>
                              <button onClick={() => handleClaimWeeklyQuest(q.id)} className="w-full py-4 bg-rpg-primary text-rpg-primary-text rounded-2xl text-[10px] font-black uppercase hover:scale-[1.02] transition-all">Ambil Misi</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {questFilter === 'DAILY' && quests.filter(q => q.quest_type === 'DAILY' || !q.quest_type).length > 0 && (
                      <div className="col-span-full mb-4">
                        <div className={cn(
                          "glass-panel p-6 border-l-4 transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6",
                          quests.filter(q => (q.quest_type === 'DAILY' || !q.quest_type) && q.completed).length === quests.filter(q => q.quest_type === 'DAILY' || !q.quest_type).length
                            ? "border-green-500 bg-green-500/5"
                            : "border-jiwa bg-jiwa/5"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center border-2",
                              quests.filter(q => (q.quest_type === 'DAILY' || !q.quest_type) && q.completed).length === quests.filter(q => q.quest_type === 'DAILY' || !q.quest_type).length
                                ? "border-green-500 bg-green-500/20 text-green-500"
                                : "border-jiwa bg-jiwa/20 text-jiwa"
                            )}>
                              <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black uppercase tracking-tight">Progres Ritual Harian</h4>
                              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">Selesaikan semua Rites untuk bonus +300 XP</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="flex-1 md:w-48">
                              <div className="flex justify-between items-end mb-2 px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Completion</span>
                                <span className="text-xs font-black text-white">
                                  {quests.filter(q => (q.quest_type === 'DAILY' || !q.quest_type) && q.completed).length} / {quests.filter(q => q.quest_type === 'DAILY' || !q.quest_type).length}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ 
                                    width: `${(quests.filter(q => (q.quest_type === 'DAILY' || !q.quest_type) && q.completed).length / (quests.filter(q => q.quest_type === 'DAILY' || !q.quest_type).length || 1)) * 100}%` 
                                  }}
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    quests.filter(q => (q.quest_type === 'DAILY' || !q.quest_type) && q.completed).length === quests.filter(q => q.quest_type === 'DAILY' || !q.quest_type).length
                                      ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                      : "bg-jiwa shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {filteredQuests.length > 0 ? (
                      filteredQuests.map(q => <QuestCard key={q.id} quest={q} onAction={setActiveQuestInput} />)
                    ) : (
                      <div className="col-span-full glass-panel p-24 text-center border-dashed border-rpg-border flex flex-col items-center gap-6">
                        <Sparkles className="w-16 h-16 text-jiwa/20 animate-pulse" />
                        <h4 className="text-2xl font-black uppercase tracking-widest text-neutral-500">Semua Misi Selesai</h4>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className={cn(
              "glass-panel p-10 relative overflow-hidden group transition-all duration-500", 
              isLight ? "bg-white shadow-xl" : "bg-gradient-to-b from-jiwa/10 to-rpg-black/80",
              getRankGlow(avgStats)
            )}>
              <div className="relative z-10 scale-105 mb-10">
                <StatRadar chartData={chartData} dominantColor={dominantColor} />
              </div>
              <div className="flex flex-col gap-6">
                {Object.entries(stats || {}).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black tracking-[0.2em] uppercase text-rpg-text/60">{key}</span>
                      <span className="text-[11px] font-black text-rpg-text/80">{value as number}%</span>
                    </div>
                    <div className={cn("h-2 w-full rounded-full overflow-hidden border", isLight ? "bg-neutral-100 border-neutral-200" : "bg-white/5 border-white/5")}>
                      <div className={cn("h-full transition-all duration-1000", getStatColorClass(key))} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {dbUserId && stats && name && (
              <DailyTarotWidget userId={dbUserId} stats={stats} username={name} />
            )}

            {session?.user?.id && (
              <MoodJournal userId={session.user.id} />
            )}
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {activeQuestInput && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="max-w-xl w-full glass-panel p-10 border-white/10 space-y-8">
              <h3 className="text-4xl font-black tracking-tighter uppercase italic text-white">Bukti Keberanian</h3>
              <textarea value={userNote} onChange={(e) => setUserNote(e.target.value)} placeholder="Tuliskan pengalaman Anda..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none text-white" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => document.getElementById('photo-upload')?.click()} className="h-44 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Unggah Foto (Opsional)</span>
                </button>
                {photoPreview && <img src={photoPreview} className="h-44 w-full object-cover rounded-2xl" />}
              </div>
              <input type="file" id="photo-upload" hidden accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const result = reader.result as string;
                    setPhotoData({ base64: result.split(',')[1], mimeType: result.split(';')[0].split(':')[1] });
                    setPhotoPreview(result);
                  };
                  reader.readAsDataURL(file);
                }
              }} />

              <div className="flex gap-4">
                <button onClick={() => setActiveQuestInput(null)} className="flex-1 py-5 bg-white/5 border border-white/10 text-neutral-400 rounded-2xl font-black uppercase text-xs">Batal</button>
                <button onClick={async () => {
                  if (!photoData && !userNote.trim()) return alert("Sertakan catatan atau foto sebagai bukti!");
                  setIsVerifying(true);
                  try {
                    const res = await completeQuest(
                      activeQuestInput!, 
                      userNote, 
                      photoData ? photoData.base64 : undefined, 
                      photoData ? photoData.mimeType : undefined
                    );
                    if (res.success) setActiveQuestInput(null);
                  } finally { setIsVerifying(false); }
                }} disabled={isVerifying} className="flex-[2] py-5 bg-rpg-primary text-rpg-primary-text rounded-2xl font-black uppercase text-xs">
                  {isVerifying ? '...' : 'Selesaikan Misi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
