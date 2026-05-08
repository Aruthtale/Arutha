import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Sparkles, Star, LayoutDashboard, Users, Map, Brain, Dumbbell, Coins, BookOpen, TrendingUp, Clock, Target, ArrowRight, Shield, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

type Dimension = 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA';

interface Stats {
  JIWA: number; RAGA: number; HARTA: number; ILMU: number; KARMA: number;
}

interface Quest {
  id: string; title: string; desc: string; stat: Dimension; xp: number; completed: boolean;
}

interface DashboardProps {
  name: string; level: number; xp: number; stats: Stats; quests: Quest[]; analysis: any;
  completeQuest: (id: string, note: string) => Promise<{ success: boolean; feedback: string }>;
  handleLogout: () => void;
  addXp: (amount: number, stat?: Dimension) => void;
  onReOnboard: () => void;
  onRefreshQuests: () => void;
  isRefreshing: boolean;
  lastEvolutionDate: string | null;
  refreshCount: number;
  setPage: (page: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  name, level, xp, stats, quests, analysis, completeQuest, handleLogout, onReOnboard, onRefreshQuests, isRefreshing, lastEvolutionDate, refreshCount, setPage 
}) => {
  const [view, setView] = useState<'DASHBOARD' | 'DIMENSION'>('DASHBOARD');
  const [currentDimension, setCurrentDimension] = useState<Dimension | null>(null);
  const [activeQuestInput, setActiveQuestInput] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{success: boolean, text: string} | null>(null);

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
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-12 pb-32 pt-24 text-white">
        <header className="flex items-center gap-6">
          <button onClick={() => setView('DASHBOARD')} className="p-3 bg-rpg-card border border-rpg-border rounded-2xl"><LayoutDashboard className="w-6 h-6" /></button>
          <div>
            <div className="flex items-center gap-2 mb-1"><span className={cn(active.color)}>{active.icon}</span><span className="text-xs font-mono font-bold text-neutral-500 uppercase">{currentDimension}</span></div>
            <h2 className="text-3xl font-bold">{active.title}</h2>
          </div>
        </header>
        <section className="glass-panel p-8 space-y-6">
          <p className="text-lg text-neutral-400">{active.desc}</p>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
            <h4 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-ilmu" /> Aktivitas Baru</h4>
            <p className="text-sm text-neutral-500 italic">Selesaikan quest harian untuk meningkatkan stat ini secara otomatis.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-12 pb-24 pt-24 text-white">
      <AnimatePresence>
        {activeQuestInput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-rpg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel p-6 md:p-8 max-w-lg w-full space-y-6 border-jiwa/20 shadow-2xl shadow-jiwa/10">
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic">Buktikan Keberhasilanmu</h3>
                <p className="text-sm text-neutral-400">AI akan menganalisis catatanmu untuk memverifikasi kejujuran progresmu.</p>
              </div>
              <textarea value={userNote} onChange={(e) => setUserNote(e.target.value)} placeholder="Apa yang kamu pelajari? Bagaimana rasanya? (Tulis minimal 1-2 kalimat)..." className="w-full h-40 p-4 bg-rpg-black border border-rpg-border rounded-xl focus:border-jiwa outline-none transition-all text-white resize-none" />
              {verificationFeedback && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={cn("p-4 rounded-xl text-sm font-bold flex items-center gap-3", verificationFeedback.success ? "bg-jiwa/10 text-jiwa border border-jiwa/20" : "bg-karma/10 text-karma border border-karma/20")}>
                  {verificationFeedback.success ? <Star className="w-4 h-4" /> : <Shield className="w-4 h-4" />} {verificationFeedback.text}
                </motion.div>
              )}
              <div className="flex gap-4">
                <button onClick={() => { setActiveQuestInput(null); setUserNote(''); setVerificationFeedback(null); }} disabled={isVerifying} className="flex-1 py-4 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-black tracking-widest hover:bg-neutral-800">BATAL</button>
                <button onClick={() => handleQuestSubmit(activeQuestInput)} disabled={isVerifying || userNote.length < 5} className="flex-1 py-4 bg-white text-black rounded-xl text-xs font-black tracking-widest hover:scale-[1.02] flex items-center justify-center gap-2">
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "KIRIM BUKTI"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-[28px] bg-gradient-to-tr from-jiwa to-ilmu rotate-3 flex items-center justify-center font-black text-2xl shadow-xl shadow-jiwa/20">
              {name.substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] font-black px-2 py-1 rounded-md border-2 border-rpg-black">LVL {level}</div>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">{name}</h1>
            <div className="mt-2 h-1.5 w-40 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white" initial={{ width: 0 }} animate={{ width: `${(xp / (level * 1000)) * 100}%` }} />
            </div>
            <p className="mt-1 text-[8px] font-mono text-neutral-500 uppercase tracking-tighter">XP {xp} / {level * 1000}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onReOnboard} 
            disabled={!canEvolve} 
            className={cn(
              "flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2",
              canEvolve 
                ? "bg-jiwa/10 text-jiwa border border-jiwa/20 hover:bg-jiwa/20" 
                : "bg-white/5 text-neutral-600 border border-white/5 cursor-not-allowed opacity-50"
            )}
          >
            <Sparkles className="w-3 h-3" />
            {canEvolve ? 'EVOLUSI KARAKTER' : `EVOLUSI: ${daysLeft} HARI LAGI`}
          </button>
          <button onClick={onRefreshQuests} disabled={isRefreshing || refreshCount >= 1} className={cn("flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2", refreshCount >= 1 ? "bg-white/5 text-neutral-600 border border-white/5" : "bg-white text-black hover:scale-105 shadow-lg shadow-white/5")}>
            <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} /> 
            {refreshCount >= 1 ? 'LIMIT REFRESH' : 'REFRESH QUEST'}
          </button>
          <button onClick={handleLogout} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-red-500/10 hover:border-red-500/20 transition-all group">
            <LogOut className="w-5 h-5 text-neutral-500 group-hover:text-red-500" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {analysis && (
            <section className="glass-panel p-6 md:p-8 bg-gradient-to-r from-rpg-card to-jiwa/5 border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Sparkles className="w-24 h-24 text-jiwa" /></div>
              <div className="relative z-10 space-y-2">
                <h2 className="text-xl md:text-2xl font-black italic text-white/90">{analysis.personality_title}</h2>
                <p className="text-neutral-400 max-w-2xl text-xs md:text-sm leading-relaxed italic">"{analysis.character_summary}"</p>
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2"><Target className="w-4 h-4" /> Daily Quests</h3>
              <span className="text-[9px] font-black px-2 py-1 bg-white/5 rounded-full text-neutral-600 border border-white/5 uppercase">Progress {quests.filter(q => q.completed).length}/{quests.length}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quests && quests.length > 0 ? (
                quests.map(quest => (
                  <div key={quest.id} className={cn("p-5 glass-panel border-l-4 transition-all relative overflow-hidden group", quest.completed ? "opacity-60 border-neutral-800" : "hover:border-rpg-border border-l-jiwa", quest.stat === 'JIWA' && "border-l-jiwa", quest.stat === 'RAGA' && "border-l-raga", quest.stat === 'HARTA' && "border-l-harta", quest.stat === 'ILMU' && "border-l-ilmu", quest.stat === 'KARMA' && "border-l-karma")}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold text-neutral-400">+{quest.xp} XP</span>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10 text-neutral-500 uppercase">{quest.stat}</span>
                      </div>
                      {quest.completed && <Star className="w-4 h-4 text-harta fill-harta" />}
                    </div>
                    <h4 className={cn("font-bold mb-1 text-sm md:text-base", quest.completed ? "text-neutral-500" : "text-white")}>{quest.title}</h4>
                    <p className="text-[10px] md:text-xs text-neutral-500 leading-relaxed mb-6 line-clamp-2">{quest.desc}</p>
                    {!quest.completed ? (
                      <button onClick={() => setActiveQuestInput(quest.id)} className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 uppercase">SELESAIKAN <ArrowRight className="w-3 h-3" /></button>
                    ) : (
                      <div className="text-[9px] font-black text-neutral-600 tracking-widest flex items-center gap-2 uppercase"><Shield className="w-3 h-3 text-jiwa" /> Quest Selesai</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full glass-panel p-12 text-center space-y-4 border-dashed border-white/5">
                  <div className="p-4 bg-white/5 rounded-full w-fit mx-auto"><Target className="w-8 h-8 text-neutral-700" /></div>
                  <p className="text-xs text-neutral-600 italic">Belum ada quest harian. Klik refresh untuk memanggil quest baru.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass-panel p-6 md:p-8 bg-gradient-to-b from-rpg-card to-rpg-black/60 flex flex-col items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-6 md:mb-8 w-full text-center">Stat Distribution</h3>
            <div className="w-full h-[280px] md:h-[320px] relative block">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100} debounce={50}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Player" dataKey="A" stroke="#A78BFA" fill="#A78BFA" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2"><Map className="w-4 h-4" /> Dimensions</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { name: 'JIWA', icon: <Brain />, color: 'text-jiwa', bg: 'bg-jiwa/10' },
                { name: 'RAGA', icon: <Dumbbell />, color: 'text-raga', bg: 'bg-raga/10' },
                { name: 'HARTA', icon: <Coins />, color: 'text-harta', bg: 'bg-harta/10' },
                { name: 'ILMU', icon: <BookOpen />, color: 'text-ilmu', bg: 'bg-ilmu/10' },
                { name: 'KARMA', icon: <Users />, color: 'text-karma', bg: 'bg-karma/10' },
              ].map((dim) => (
                <button key={dim.name} onClick={() => { setCurrentDimension(dim.name as Dimension); setView('DIMENSION'); }} className="group flex flex-col p-4 glass-panel hover:border-white/20 transition-all text-left relative overflow-hidden">
                  <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity", dim.bg)} />
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("p-2 rounded-xl", dim.bg, dim.color)}>{dim.icon}</span>
                    <TrendingUp className="w-4 h-4 text-neutral-800" />
                  </div>
                  <span className="text-[10px] font-black mb-1 tracking-tighter text-neutral-500 uppercase">{dim.name}</span>
                  <div className="flex items-center justify-between">
                    <div className="h-1 flex-1 bg-neutral-900 rounded-full mr-4 overflow-hidden">
                      <motion.div className={cn("h-full", dim.bg.replace('/10', ''))} initial={{ width: 0 }} animate={{ width: `${stats[dim.name as Dimension]}%` }} />
                    </div>
                    <span className="text-[10px] font-mono font-bold">{stats[dim.name as Dimension]}%</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 flex items-center gap-8 md:gap-10 shadow-2xl border-white/5 ring-1 ring-white/10 z-40">
        <button onClick={() => setView('DASHBOARD')} className={cn("transition-all hover:scale-110", view === 'DASHBOARD' ? "text-white" : "text-neutral-600")}><LayoutDashboard className="w-5 h-5 md:w-6 md:h-6" /></button>
        <button onClick={() => setPage('PROFILE')} className="text-neutral-600 hover:text-white transition-all hover:scale-110"><Users className="w-5 h-5 md:w-6 md:h-6" /></button>
        <div className="w-px h-6 bg-neutral-800" />
        <button onClick={() => setView('DASHBOARD')} className="text-neutral-600 hover:text-white transition-all hover:scale-110"><Sparkles className="w-5 h-5 md:w-6 md:h-6" /></button>
      </nav>
    </div>
  );
};
