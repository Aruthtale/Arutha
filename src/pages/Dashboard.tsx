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
  name, level, xp, stats, quests, analysis, completeQuest, handleLogout, addXp, onReOnboard, onRefreshQuests, isRefreshing, lastEvolutionDate, refreshCount, setPage 
}) => {
  const [view, setView] = useState<'DASHBOARD' | 'DIMENSION'>('DASHBOARD');
  const [currentDimension, setCurrentDimension] = useState<Dimension | null>(null);
  const [activeQuestInput, setActiveQuestInput] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{success: boolean, text: string} | null>(null);

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
    } finally {
      setIsVerifying(false);
    }
  };

  const getCooldownStatus = () => {
    if (!lastEvolutionDate) return { canEvolve: true, daysLeft: 0 };
    const lastDate = new Date(lastEvolutionDate);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return { canEvolve: diffDays >= 30, daysLeft: 30 - diffDays };
  };

  const { canEvolve, daysLeft } = getCooldownStatus();
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
      <div className="max-w-4xl mx-auto p-6 space-y-12 pb-32 pt-24">
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
            <button onClick={() => addXp(50, currentDimension)} className="w-full p-4 glass-panel border-rpg-border text-left hover:border-white/20 flex justify-between items-center group">Mulai Sesi <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-all" /></button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12 pb-24 pt-24 text-white">
      <AnimatePresence>
        {activeQuestInput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-rpg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-panel p-8 max-w-lg w-full space-y-6 border-jiwa/20 shadow-2xl shadow-jiwa/10">
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic">Buktikan Keberhasilanmu</h3>
                <p className="text-sm text-neutral-400">AI akan menganalisis catatanmu untuk memverifikasi kejujuran progresmu.</p>
              </div>
              <textarea value={userNote} onChange={(e) => setUserNote(e.target.value)} placeholder="Apa yang kamu pelajari? Bagaimana rasanya? (Tulis minimal 1-2 kalimat)..." className="w-full h-40 p-4 bg-rpg-black border border-rpg-border rounded-xl focus:border-jiwa outline-none transition-all text-white" />
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

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-jiwa to-ilmu rotate-3 flex items-center justify-center font-black text-2xl shadow-xl shadow-jiwa/20">{name.substring(0, 2).toUpperCase()}</div>
            <div className="absolute -bottom-2 -right-2 bg-white text-black text-xs font-black px-2 py-1 rounded-md border-2 border-rpg-black">LVL {level}</div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{name}</h1>
            <div className="flex flex-col gap-1 w-48">
              <div className="h-2 w-full bg-rpg-border rounded-full overflow-hidden"><motion.div className="h-full bg-white" initial={{ width: 0 }} animate={{ width: `${(xp / (level * 1000)) * 100}%` }} /></div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-tighter">XP {xp} / {level * 1000}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onReOnboard} disabled={!canEvolve} className="px-6 py-3 bg-rpg-card border border-rpg-border rounded-xl text-[10px] font-black tracking-widest hover:bg-neutral-800 disabled:opacity-30 flex items-center gap-2 group transition-all">
            <Sparkles className={cn("w-4 h-4", canEvolve ? "text-jiwa" : "text-neutral-600")} /> {canEvolve ? 'EVOLUSI KARAKTER' : `READY IN ${daysLeft}D`}
          </button>
          <button onClick={handleLogout} className="p-4 bg-rpg-card border border-rpg-border rounded-2xl hover:bg-neutral-800 transition-colors"><LogOut className="w-5 h-5 text-neutral-400" /></button>
        </div>
      </header>

      {analysis && (
        <section className="glass-panel p-8 bg-gradient-to-r from-rpg-card to-jiwa/5 border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles className="w-24 h-24 text-jiwa" /></div>
          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl font-black italic text-white/90">{analysis.personality_title}</h2>
            <p className="text-neutral-400 max-w-2xl text-sm leading-relaxed italic">"{analysis.character_summary}"</p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2"><Sparkles className="w-4 h-4 text-ilmu" /> Daily Quests</h3>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black px-2 py-1 bg-white/5 rounded-full text-neutral-500 border border-white/5 uppercase tracking-tighter">REFRESH {1 - refreshCount}/1</span>
                <button onClick={onRefreshQuests} disabled={isRefreshing || refreshCount >= 1} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-20 transition-all"><motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw className="w-4 h-4 text-neutral-400" /></motion.div></button>
              </div>
            </div>
            <div className="space-y-4">
              {quests && quests.length > 0 ? quests.map(quest => (
                <div key={quest.id} className={cn("w-full p-6 glass-panel border-l-4 transition-all relative overflow-hidden group", quest.completed ? "opacity-60 border-neutral-800" : "hover:border-rpg-border border-l-jiwa", quest.stat === 'JIWA' && "border-l-jiwa", quest.stat === 'RAGA' && "border-l-raga", quest.stat === 'HARTA' && "border-l-harta", quest.stat === 'ILMU' && "border-l-ilmu", quest.stat === 'KARMA' && "border-l-karma")}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-mono font-bold text-neutral-400">+{quest.xp} XP</span><span className="text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10 text-neutral-500 uppercase">{quest.stat}</span></div>
                    {quest.completed && <Star className="w-4 h-4 text-harta fill-harta" />}
                  </div>
                  <h4 className={cn("font-bold mb-1", quest.completed ? "text-neutral-500" : "text-white")}>{quest.title}</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed mb-6">{quest.desc}</p>
                  {!quest.completed ? (
                    <button onClick={() => setActiveQuestInput(quest.id)} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">SELESAIKAN <ArrowRight className="w-3 h-3" /></button>
                  ) : (
                    <div className="text-[10px] font-black text-neutral-600 tracking-widest flex items-center gap-2 uppercase"><Shield className="w-3 h-3 text-jiwa" /> Quest Berhasil</div>
                  )}
                </div>
              )) : (
                <div className="glass-panel p-12 text-center space-y-4 border-dashed">
                  <div className="p-4 bg-white/5 rounded-full w-fit mx-auto"><Target className="w-8 h-8 text-neutral-600" /></div>
                  <p className="text-sm text-neutral-500 italic">Belum ada quest harian. Klik refresh untuk mendapatkan quest baru.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-8">
          <section className="glass-panel p-8 bg-gradient-to-b from-rpg-card to-rpg-black/60 flex flex-col items-center justify-center min-h-[420px]">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 mb-8 w-full text-center">Stat Distribution</h3>
            <div className="w-full h-[320px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Player" dataKey="A" stroke="#fff" fill="#fff" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2"><Map className="w-4 h-4" /> Dimensions</h3>
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
                <div className="flex items-center justify-between mb-2"><span className={cn("p-2 rounded-xl", dim.bg, dim.color)}>{dim.icon}</span><TrendingUp className="w-4 h-4 text-neutral-800" /></div>
                <span className="text-xs font-black mb-1 tracking-tighter text-neutral-500">{dim.name}</span>
                <div className="flex items-center justify-between">
                  <div className="h-1 flex-1 bg-rpg-border rounded-full mr-4 overflow-hidden"><motion.div className={cn("h-full", dim.bg.replace('/10', ''))} initial={{ width: 0 }} animate={{ width: `${stats[dim.name as Dimension]}%` }} /></div>
                  <span className="text-xs font-mono font-bold">{stats[dim.name as Dimension]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel px-8 py-4 flex items-center gap-10 shadow-2xl border-white/5 ring-1 ring-white/10 z-40">
        <button onClick={() => setView('DASHBOARD')} className={cn("transition-all hover:scale-110", view === 'DASHBOARD' ? "text-white" : "text-neutral-600")}><LayoutDashboard className="w-6 h-6" /></button>
        <button onClick={() => setPage('PROFILE' as any)} className="text-neutral-600 hover:text-white transition-all hover:scale-110"><Users className="w-6 h-6" /></button>
        <div className="w-px h-6 bg-rpg-border" />
        <button className="text-neutral-600 hover:text-white transition-all hover:scale-110"><Sparkles className="w-6 h-6" /></button>
      </nav>
    </div>
  );
};
