import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Sparkles, Star, LayoutDashboard, User, Users, Map, Brain, Dumbbell, Coins, BookOpen, TrendingUp, Clock, Target, ArrowRight, Shield, RefreshCw, Loader2, AlertCircle, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { type DecayResult } from '../lib/decaySystem';

type Dimension = 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA';

interface Stats {
  JIWA: number; RAGA: number; HARTA: number; ILMU: number; KARMA: number;
}

interface Quest {
  id: string; title: string; desc: string; stat: Dimension; xp: number; completed: boolean;
}

interface DashboardProps {
  userId: string;
  name: string; level: number; xp: number; stats: Stats; quests: Quest[]; analysis: any;
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
  userId, name, level, xp, stats, quests, analysis, statHistory, completeQuest, handleLogout, onReOnboard, onRefreshQuests, onGenerateInitialQuests, isRefreshing, lastEvolutionDate, refreshCount, decayResult, onTakeRecovery, setPage 
}) => {
  const [isMounted, setIsMounted] = useState(false);

  const DecayStatusBanner = () => {
    if (!decayResult || decayResult.status === 'ok') return null;

    const colors = {
      warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
      fatigue: 'bg-orange-500/10 border-orange-500/20 text-orange-500',
      decay: 'bg-red-500/10 border-red-500/20 text-red-500'
    };

    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("mb-6 p-4 rounded-2xl border flex items-center justify-between gap-4", colors[decayResult.status])}
      >
        <div className="flex items-center gap-4">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-bold tracking-wide">{decayResult.message}</p>
        </div>
        {decayResult.status === 'decay' && (
          <button 
            onClick={onTakeRecovery}
            className="px-5 py-2.5 bg-red-500 text-white text-xs font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> AMBIL RECOVERY QUEST
          </button>
        )}
      </motion.div>
    );
  };
  
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodEmoji, setMoodEmoji] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);

  useEffect(() => { 
    setIsMounted(true);
    // Tampilkan modal mood jika belum ada quest hari ini (awal hari)
    if (quests && quests.length === 0 && !isRefreshing && !isGeneratingInitial && onGenerateInitialQuests) {
      setShowMoodModal(true);
    }
  }, [quests, isRefreshing, isGeneratingInitial, onGenerateInitialQuests]);

  const handleMoodSubmit = () => {
    const moodContext = `${moodEmoji} ${moodNote}`.trim();
    setShowMoodModal(false);
    setIsGeneratingInitial(true);
    if (onGenerateInitialQuests) {
      onGenerateInitialQuests(moodContext);
    }
  };

  const [view, setView] = useState<'DASHBOARD' | 'DIMENSION'>('DASHBOARD');
  const [currentDimension, setCurrentDimension] = useState<Dimension | null>(null);
  const [activeQuestInput, setActiveQuestInput] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{success: boolean, text: string} | null>(null);

  const [reflectionText, setReflectionText] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [reflections, setReflections] = useState<any[]>([]);

  const fetchReflections = async () => {
    if (!currentDimension || !userId) return;
    const { data, error } = await supabase
      .from('dimension_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('dimension', currentDimension)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setReflections(data);
    }
  };

  useEffect(() => {
    if (view === 'DIMENSION' && currentDimension) {
      fetchReflections();
    }
  }, [view, currentDimension, userId]);

  const handleSaveReflection = async () => {
    if (!reflectionText.trim() || !currentDimension || !userId) return;
    setIsSavingReflection(true);
    try {
      const { data, error } = await supabase
        .from('dimension_reflections')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          dimension: currentDimension,
          reflection_text: reflectionText.trim()
        })
        .select();
      
      if (error) {
        console.error('Supabase Error Details:', error);
        throw error;
      }
      
      console.log('Reflection saved successfully:', data);
      setReflectionText('');
      alert('Refleksi berhasil disimpan!');
      fetchReflections();
    } catch (err: any) {
      console.error('Save reflection error full:', err);
      alert(`Gagal menyimpan refleksi: ${err.message || 'Error tidak diketahui'}`);
    } finally {
      setIsSavingReflection(false);
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

  const handleQuestSubmit = async (id: string) => {
    if (!userNote.trim()) return;
    setIsVerifying(true);
    setVerificationFeedback(null);
    try {
      const result = await completeQuest(id, userNote);
      setVerificationFeedback({ success: result.success, text: result.feedback });
      if (result.success) {
        setTimeout(() => {
          setActiveQuestInput(null);
          setUserNote('');
          setVerificationFeedback(null);
        }, 2500);
      }
    } catch (error) {
      setVerificationFeedback({ success: false, text: "Terjadi kesalahan saat verifikasi." });
    } finally {
      setIsVerifying(false);
    }
  };

  const chartData = [
    { subject: 'Jiwa', A: stats.JIWA }, { subject: 'Raga', A: stats.RAGA },
    { subject: 'Harta', A: stats.HARTA }, { subject: 'Ilmu', A: stats.ILMU }, { subject: 'Karma', A: stats.KARMA },
  ];

  if (view === 'DIMENSION' && currentDimension) {
    const config = {
      JIWA: { title: 'Health Mentality', icon: <Brain />, color: 'text-jiwa', desc: 'Kelola pikiran, jurnal emosi, dan ketenangan jiwa.' },
      RAGA: { title: 'Physical Power', icon: <Dumbbell />, color: 'text-raga', desc: 'Pantau kebugaran, pola tidur, dan kesehatan fisik.' },
      HARTA: { title: 'Wealth Management', icon: <Coins />, color: 'text-harta', desc: 'Atur keuangan, hindari jebakan utang, dan investasi.' },
      ILMU: { title: 'Knowledge Growth', icon: <BookOpen />, color: 'text-ilmu', desc: 'Belajar hal baru setiap hari untuk menaikkan intelegensia.' },
      KARMA: { title: 'Social Standing', icon: <Users />, color: 'text-karma', desc: 'Berdampak bagi orang lain dan bangun komunitas positif.' },
    };
    const active = config[currentDimension];
    
    // Real data dari stat_history
    const formattedHistory = statHistory.map((item, idx) => {
      const date = new Date(item.created_at);
      const label = idx === statHistory.length - 1 ? 'Hari Ini' : `${date.getDate()}/${date.getMonth() + 1}`;
      const val = item[currentDimension.toLowerCase()] || 0;
      return { day: label, val };
    });

    // Fallback jika history kosong
    const chartHistory = formattedHistory.length > 0 ? formattedHistory : [
      { day: 'T1', val: 0 }, { day: 'T2', val: 0 }, { day: 'T3', val: 0 }, { day: 'T4', val: 0 }, { day: 'T5', val: 0 }, { day: 'T6', val: 0 }, { day: 'Hari Ini', val: stats[currentDimension] }
    ];

    // Menggabungkan quest hari ini yang selesai dengan mock quest lampau
    const todayCompleted = quests.filter(q => q.stat === currentDimension && q.completed);

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 pb-32 pt-24 text-white">
        <header className="flex items-center gap-8 pt-8">
          <button onClick={() => setView('DASHBOARD')} className="p-4 bg-rpg-card border border-rpg-border rounded-2xl hover:scale-105 transition-all shadow-xl shadow-black/20"><LayoutDashboard className="w-7 h-7" /></button>
          <div>
            <div className="flex items-center gap-2 mb-1.5"><span className={cn("p-1 rounded-md bg-white/5", active.color)}>{active.icon}</span><span className="text-sm font-mono font-bold text-neutral-500 uppercase tracking-widest">{currentDimension}</span></div>
            <h2 className="text-4xl font-black tracking-tight">{active.title}</h2>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <section className="glass-panel p-8 border-t-4" style={{ borderTopColor: 'var(--tw-border-opacity)' }}>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 mb-8 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Grafik 7 Hari Terakhir</h3>
              <div className="h-64 w-full relative -ml-4">
                {isMounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={chartHistory}>
                      <XAxis dataKey="day" stroke="#555" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #333', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                      <Line type="monotone" dataKey="val" stroke="#fff" strokeWidth={4} dot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="glass-panel p-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 mb-8 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Jurnal Refleksi</h3>
              <div className="space-y-6">
                <textarea 
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder={`Apa yang kamu pelajari hari ini tentang ${currentDimension}? (Catatan ini akan tersimpan di Supabase)`}
                  className="w-full p-6 bg-rpg-black border border-rpg-border rounded-2xl focus:border-white/30 outline-none text-base resize-none shadow-inner"
                  rows={4}
                />
                <button 
                  className="w-full py-4 bg-white text-black font-black rounded-2xl text-sm hover:scale-[1.02] transition-all disabled:opacity-50 shadow-xl shadow-white/5" 
                  onClick={handleSaveReflection}
                  disabled={isSavingReflection || !reflectionText.trim()}
                >
                  {isSavingReflection ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Simpan Refleksi'}
                </button>
              </div>
            </section>

            {reflections.length > 0 && (
              <section className="glass-panel p-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-6 flex items-center gap-2"><Clock className="w-4 h-4" /> Timeline Refleksi</h3>
                <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                  {reflections.map((ref, idx) => (
                    <div key={ref.id} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-rpg-black border-2 border-white/20 z-10" />
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest font-bold">
                          {new Date(ref.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <p className="text-base text-white leading-relaxed font-medium bg-white/5 p-4 rounded-xl border border-white/5">
                          {ref.reflection_text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="glass-panel p-6 h-full flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-6 flex items-center gap-2"><Target className="w-4 h-4" /> Riwayat Quest Selesai</h3>
              <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                {todayCompleted.length > 0 ? (
                  todayCompleted.map(q => (
                    <div key={q.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-black text-white">{q.title}</span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/5">Hari ini</span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{q.desc}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-white/5 border border-dashed border-white/10 rounded-xl text-center py-6">
                    <p className="text-xs text-neutral-500 italic">Belum ada quest diselesaikan hari ini.</p>
                  </div>
                )}
                
                {/* Mock data past quests */}
                <div className="relative pt-6 mt-6 border-t border-white/5">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rpg-black px-3 text-[10px] font-mono text-neutral-600">Riwayat Lampau</span>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl opacity-60">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-neutral-300">Quest Lampau Mock 1</span>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">H-1</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 line-clamp-1">Data riwayat quest dari Supabase akan tampil berderet di sini.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24 pt-14">

      {/* Sub-header bar */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-rpg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center gap-4">
          {/* Page pill */}
          <div className="flex items-center gap-2.5 px-4 py-1.5 bg-white/10 rounded-full border border-white/10">
            <LayoutDashboard className="w-4 h-4 text-white" />
            <span className="text-xs font-black text-white tracking-widest uppercase">Home</span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          {/* XP Progress Bar Section */}
          <div className="flex-1 flex items-center gap-4 px-4 bg-white/5 rounded-2xl border border-white/5 h-10 group hover:border-white/10 transition-all">
            <div className="flex items-center gap-2 shrink-0">
              <Star className="w-4 h-4 text-harta fill-harta/20" />
              <span className="text-sm font-black text-white tracking-tight">{xp}</span>
            </div>
            
            <div className="flex-1 h-2 bg-rpg-black rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(xp / (level * 1000)) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-jiwa via-ilmu to-jiwa bg-[length:200%_100%] animate-shimmer rounded-full"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 text-neutral-500 font-mono text-[10px] font-bold">
              <span>{Math.floor((xp / (level * 1000)) * 100)}%</span>
              <span className="opacity-30">/</span>
              <span>{level * 1000} XP</span>
            </div>
          </div>

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Level & Evolution */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">Level</span>
              <span className="text-xl font-black italic text-white leading-none">{level}</span>
            </div>
            
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">Evolusi</span>
              <div className="flex items-center gap-1.5">
                <RefreshCw className={cn("w-3 h-3", canEvolve ? "text-jiwa animate-spin-slow" : "text-neutral-600")} />
                <span className={cn("text-xs font-bold", canEvolve ? "text-jiwa" : "text-neutral-400")}>
                  {canEvolve ? 'READY' : `${daysLeft}d`}
                </span>
              </div>
            </div>
          </div>
          {/* Refresh quest */}
          <button
            onClick={onRefreshQuests}
            disabled={isRefreshing || refreshCount >= 1}
            className={cn(
              'flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black tracking-widest border transition-all',
              refreshCount >= 1
                ? 'bg-white/5 text-neutral-600 border-white/5 cursor-not-allowed'
                : 'bg-white text-black border-transparent hover:scale-105 shadow-xl shadow-white/10'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            <span className="hidden sm:inline">{refreshCount >= 1 ? 'LIMIT REFRESH' : 'REFRESH QUEST'}</span>
          </button>
        </div>
      </div>

      {/* Quest completion modal */}
      <AnimatePresence>
        {activeQuestInput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-panel p-6 md:p-8 max-w-lg w-full space-y-5 border-jiwa/20 shadow-2xl">
              <div>
                <h3 className="text-xl font-black italic">Buktikan Keberhasilanmu</h3>
                <p className="text-xs text-neutral-400 mt-1">AI akan menganalisis catatanmu untuk memverifikasi kejujuran progresmu.</p>
              </div>
              <textarea value={userNote} onChange={e => setUserNote(e.target.value)}
                placeholder="Apa yang kamu lakukan? Bagaimana rasanya? (Tulis 1-2 kalimat)..."
                className="w-full h-36 p-4 bg-rpg-black border border-rpg-border rounded-xl focus:border-jiwa outline-none text-white resize-none text-sm" />
              {verificationFeedback && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className={cn('p-3 rounded-xl text-xs font-bold flex items-center gap-2',
                    verificationFeedback.success ? 'bg-jiwa/10 text-jiwa border border-jiwa/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                  {verificationFeedback.success ? <Star className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  {verificationFeedback.text}
                </motion.div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setActiveQuestInput(null); setUserNote(''); setVerificationFeedback(null); }}
                  disabled={isVerifying}
                  className="flex-1 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-black tracking-widest hover:bg-neutral-800 transition-all">
                  BATAL
                </button>
                <button onClick={() => handleQuestSubmit(activeQuestInput!)} disabled={isVerifying || userNote.length < 5}
                  className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black tracking-widest hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-40 transition-all">
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'KIRIM BUKTI'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-14 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* LEFT COLUMN */}
        <div className="space-y-5 min-w-0">
          <DecayStatusBanner />

          {/* Character Summary */}
          {analysis && (
            <section className="glass-panel p-8 bg-gradient-to-br from-jiwa/10 via-transparent to-ilmu/5 border-white/5 relative overflow-hidden shadow-2xl">
              <div className="absolute -top-4 -right-4 text-[120px] font-black text-white/5 leading-none select-none pointer-events-none">A+</div>
              <div className="relative z-10 space-y-2">
                <h2 className="text-2xl font-black italic text-white tracking-tight">{analysis.personality_title}</h2>
                <p className="text-base text-neutral-300 leading-relaxed max-w-2xl italic">"{analysis.character_summary}"</p>
              </div>
            </section>
          )}

          {/* Daily Quests */}
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                <Target className="w-5 h-5" /> Daily Quests
              </h3>
              <span className="text-xs font-black px-3 py-1.5 bg-white/5 rounded-full text-neutral-500 border border-white/5 uppercase">
                Progress {quests.filter(q => q.completed).length}/{quests.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {quests && quests.length > 0 ? (
                quests.map(quest => (
                  <div key={quest.id} className={cn(
                    'p-6 glass-panel border-l-4 transition-all relative overflow-hidden',
                    quest.completed ? 'opacity-50 border-neutral-800' : 'hover:border-rpg-border',
                    quest.stat === 'JIWA' && 'border-l-jiwa', quest.stat === 'RAGA' && 'border-l-raga',
                    quest.stat === 'HARTA' && 'border-l-harta', quest.stat === 'ILMU' && 'border-l-ilmu',
                    quest.stat === 'KARMA' && 'border-l-karma',
                  )}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-mono font-bold text-neutral-400">+{quest.xp} XP</span>
                      <span className="text-[10px] font-black px-2 py-1 rounded border border-white/10 text-neutral-500 uppercase tracking-widest">{quest.stat}</span>
                      {quest.completed && <Star className="w-5 h-5 text-harta fill-harta ml-auto" />}
                    </div>
                    <h4 className={cn('font-black text-lg mb-2', quest.completed ? 'text-neutral-500' : 'text-white tracking-tight')}>{quest.title}</h4>
                    <p className={cn('text-sm leading-relaxed mb-8 line-clamp-3', quest.completed ? 'text-neutral-600' : 'text-neutral-300')}>
                      {quest.desc}
                    </p>
                    {!quest.completed ? (
                      <button onClick={() => setActiveQuestInput(quest.id)}
                        className="w-full py-3.5 bg-white text-black rounded-xl text-xs font-black tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 uppercase shadow-xl shadow-white/5">
                        SELESAIKAN <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="text-xs font-black text-neutral-600 tracking-widest flex items-center gap-2 uppercase">
                        <Shield className="w-4 h-4 text-jiwa" /> Quest Selesai
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full glass-panel p-16 text-center border-dashed border-white/10 space-y-4">
                  <div className="p-4 bg-white/5 rounded-full w-fit mx-auto"><Target className="w-8 h-8 text-neutral-800" /></div>
                  <p className="text-sm text-neutral-600 italic">Belum ada quest harian.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">

          {/* Stat Distribution */}
          <section className="glass-panel p-6 md:p-8 bg-gradient-to-b from-rpg-card to-rpg-black/60 flex flex-col items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-6 md:mb-8 w-full text-center">Stat Distribution</h3>
            <div className="w-full" style={{ height: '320px', minHeight: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Player" dataKey="A" stroke="#A78BFA" fill="#A78BFA" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Dimensions */}
          <section className="glass-panel p-6 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 mb-4 flex items-center gap-2">
              <Map className="w-4 h-4" /> Dimensions
            </h3>
            {[
              { name: 'JIWA', icon: <Brain className="w-5 h-5" />, color: 'text-jiwa', bar: 'bg-jiwa', bg: 'bg-jiwa/10' },
              { name: 'RAGA', icon: <Dumbbell className="w-5 h-5" />, color: 'text-raga', bar: 'bg-raga', bg: 'bg-raga/10' },
              { name: 'HARTA', icon: <Coins className="w-5 h-5" />, color: 'text-harta', bar: 'bg-harta', bg: 'bg-harta/10' },
              { name: 'ILMU', icon: <BookOpen className="w-5 h-5" />, color: 'text-ilmu', bar: 'bg-ilmu', bg: 'bg-ilmu/10' },
              { name: 'KARMA', icon: <Users className="w-5 h-5" />, color: 'text-karma', bar: 'bg-karma', bg: 'bg-karma/10' },
            ].map(dim => (
              <button key={dim.name}
                onClick={() => { setCurrentDimension(dim.name as Dimension); setView('DIMENSION'); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                <div className={cn('p-2.5 rounded-xl shrink-0 shadow-lg', dim.bg, dim.color)}>{dim.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">{dim.name}</span>
                    <div className="flex items-center gap-2">
                      {decayResult && decayResult.status !== 'ok' && (
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                      )}
                      <span className="text-sm font-mono font-black text-white">{stats[dim.name as Dimension]}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div className={cn('h-full rounded-full', dim.bar)}
                      initial={{ width: 0 }} animate={{ width: `${stats[dim.name as Dimension]}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }} />
                  </div>
                </div>
              </button>
            ))}
          </section>

          {/* Evolution button */}
          <button onClick={onReOnboard} disabled={!canEvolve}
            className={cn('w-full py-4 rounded-2xl text-xs font-black tracking-[0.2em] transition-all flex items-center justify-center gap-3',
              canEvolve ? 'bg-jiwa/10 text-jiwa border border-jiwa/20 hover:bg-jiwa/20 shadow-lg shadow-jiwa/5' : 'bg-white/5 text-neutral-600 border border-white/5 cursor-not-allowed opacity-50')}>
            <Sparkles className="w-5 h-5" />
            {canEvolve ? 'EVOLUSI KARAKTER' : `EVOLUSI: ${daysLeft} HARI`}
          </button>
        </div>
      </div>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 glass-panel border-white/10 shadow-2xl ring-1 ring-white/5 scale-110">
        {[
          { icon: <LayoutDashboard className="w-6 h-6" />, action: () => setView('DASHBOARD'), active: view === 'DASHBOARD' },
          { icon: <User className="w-6 h-6" />, action: () => setPage('SETTINGS'), active: false },
          { icon: <Map className="w-6 h-6" />, action: () => {}, active: false },
          { icon: <Sparkles className="w-6 h-6" />, action: () => {}, active: false },
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className={cn('p-4 rounded-2xl transition-all hover:scale-110',
              item.active ? 'text-white bg-white/10 shadow-inner' : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5')}>
            {item.icon}
          </button>
        ))}
      </nav>

      {/* Mood Modal */}
      <AnimatePresence>
        {showMoodModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-panel p-10 text-center space-y-8 border-white/10 shadow-2xl">
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">Bagaimana kabarmu hari ini?</h2>
                <p className="text-sm text-neutral-400">Pilih emoji untuk mengatur tingkat kesulitan questmu.</p>
              </div>
              <div className="flex justify-center gap-3">
                {EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => setMoodEmoji(emoji)}
                    className={cn('text-4xl p-4 rounded-2xl transition-all hover:scale-110 bg-rpg-black/50 border',
                      moodEmoji === emoji ? 'border-white scale-110 shadow-[0_0_25px_rgba(255,255,255,0.2)]' : 'border-rpg-border opacity-50 hover:opacity-100')}>
                    {emoji}
                  </button>
                ))}
              </div>
              <textarea value={moodNote} onChange={e => setMoodNote(e.target.value)}
                placeholder="Ada yang ingin diceritakan? (Opsional)"
                rows={3}
                className="w-full p-5 bg-rpg-black/50 border border-rpg-border focus:border-white/30 rounded-2xl outline-none text-base text-white placeholder:text-neutral-600 resize-none shadow-inner" />
              <button onClick={handleMoodSubmit} disabled={!moodEmoji || isGeneratingInitial}
                className="w-full py-5 bg-white text-black font-black text-sm rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-3 shadow-2xl shadow-white/10 uppercase tracking-widest">
                {isGeneratingInitial ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Mulai Hari Ini'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

