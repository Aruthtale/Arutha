import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Shield, Star, Zap, Award, Target, TrendingUp, Heart, Brain, Dumbbell, Coins, BookOpen, Users, Clock, History, Medal, Sparkles
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { cn, getDimensionRank } from '../lib/utils';
import { TALENTS } from '../lib/talents';
import { supabase } from '../lib/supabase';
import { ZODIACS } from '../lib/zodiacs';

interface Stats {
  JIWA: number; RAGA: number; HARTA: number; ILMU: number; KARMA: number;
}

interface ProfileProps {
  name: string;
  level: number;
  xp: number;
  stats: Stats;
  analysis: any;
  onBack: () => void;
  talents: string[];
  statHistory?: any[];
  zodiac?: string;
  usia?: number;
  userId: string;
}

export const Profile: React.FC<ProfileProps> = ({ userId, name, level, xp, stats, analysis, onBack, talents, statHistory, zodiac, usia }) => {
  const [reflections, setReflections] = React.useState<any[]>([]);
  const [isLoadingReflections, setIsLoadingReflections] = React.useState(true);
  
  const zodiacInfo = React.useMemo(() => {
    if (!zodiac) return null;
    return ZODIACS.find(z => z.id === zodiac.toLowerCase() || z.name.toLowerCase() === zodiac.toLowerCase());
  }, [zodiac]);

  React.useEffect(() => {
    const fetchReflections = async () => {
      if (!userId) return;
      setIsLoadingReflections(true);
      try {
        const { data, error } = await supabase
          .from('dimension_reflections')
          .select('reflection_text, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        if (data) setReflections(data);
      } catch (err) {
        console.error("Error fetching reflections:", err);
      } finally {
        setIsLoadingReflections(false);
      }
    };
    fetchReflections();
  }, [userId]);

  const achievements = React.useMemo(() => [
    { title: "Langkah Pertama", desc: "Menyelesaikan quest perdana", icon: <Zap className="w-4 h-4" />, color: "bg-jiwa/20 text-jiwa" },
    { title: "Integritas Tinggi", desc: "Lulus verifikasi AI 5 kali berturut-turut", icon: <Shield className="w-4 h-4" />, color: "bg-raga/20 text-raga" },
    { title: "Pelajar Tekun", desc: "Mencapai level 70 di dimensi ILMU", icon: <BookOpen className="w-4 h-4" />, color: "bg-ilmu/20 text-ilmu" },
  ], []);

  const RPG_ATTRIBUTES = React.useMemo(() => [
    { id: 'JIWA', label: 'Spirit', val: stats.JIWA, icon: <Brain />, color: 'text-jiwa', bg: 'bg-jiwa/10' },
    { id: 'RAGA', label: 'Vitality', val: stats.RAGA, icon: <Dumbbell />, color: 'text-raga', bg: 'bg-raga/10' },
    { id: 'HARTA', label: 'Fortune', val: stats.HARTA, icon: <Coins />, color: 'text-harta', bg: 'bg-harta/10' },
    { id: 'ILMU', label: 'Wisdom', val: stats.ILMU, icon: <BookOpen />, color: 'text-ilmu', bg: 'bg-ilmu/10' },
    { id: 'KARMA', label: 'Empathy', val: stats.KARMA, icon: <Users />, color: 'text-karma', bg: 'bg-karma/10' },
  ], [stats]);

  const IconBox = ({ icon, className, size = "w-4 h-4" }: { icon: React.ReactElement, className?: string, size?: string }) => (
    <div className={cn("p-2 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", className)}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: size })}
    </div>
  );

  return (
    <div className="min-h-screen bg-rpg-black text-rpg-text p-4 md:p-6 pb-32 pt-28 md:pt-12">
      <div className="max-w-5xl mx-auto space-y-16 md:space-y-20">
        
        {/* HEADER NAVIGATION */}
        <header className="flex items-center justify-between">
          <button onClick={onBack} className="p-3 bg-rpg-card border border-rpg-border rounded-2xl hover:bg-rpg-border/20 transition-all flex items-center gap-3 group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-rpg-text" />
            <span className="text-xs md:text-sm font-black tracking-widest text-rpg-text">DASHBOARD</span>
          </button>
          <div className="text-right">
            <p className="text-xs font-black tracking-[0.4em] text-jiwa uppercase">Character Ledger</p>
            <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter text-rpg-text">CHARACTER SHEET</h2>
          </div>
        </header>

        {/* HERO PROFILE CARD */}
        <section className="relative rounded-[40px] bg-gradient-to-br from-rpg-card to-rpg-black border border-rpg-border/50 p-8 md:p-12 shadow-2xl group">
          <div className="absolute inset-0 rounded-[40px] overflow-hidden pointer-events-none">
            <div className={cn(
              "absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] rounded-full -mr-32 -mt-32 transition-colors duration-1000",
              stats.JIWA >= 70 ? "bg-jiwa/20" : 
              stats.ILMU >= 70 ? "bg-ilmu/20" : 
              stats.RAGA >= 70 ? "bg-raga/20" : "bg-rpg-border/5"
            )} />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-ilmu/5 blur-[120px] rounded-full opacity-50" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="relative shrink-0 -mt-20 md:mt-0">
              <div className="w-32 h-32 md:w-44 md:h-44 rounded-[48px] bg-gradient-to-tr from-jiwa via-ilmu to-raga rotate-6 flex items-center justify-center font-black text-4xl md:text-6xl shadow-2xl shadow-jiwa/20 border-4 border-rpg-black relative">
                <span className="drop-shadow-2xl">{name.substring(0, 2).toUpperCase()}</span>
                <div className="absolute -bottom-2 md:-bottom-4 -right-2 md:-right-4 bg-rpg-primary text-rpg-primary-text px-3 md:px-4 py-1 md:py-2 rounded-xl md:rounded-2xl font-black text-xs md:text-lg border-[3px] md:border-4 border-rpg-black shadow-xl">
                  LVL {level}
                </div>
              </div>
            </div>

            <div className="text-center md:text-left space-y-4 flex-1 w-full">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-3 md:gap-5 flex-wrap justify-center md:justify-start">
                  <h3 className="text-2xl md:text-5xl font-black italic tracking-tighter text-rpg-text uppercase leading-none break-all">{name}</h3>
                  <div className="flex gap-2 items-center">
                    {zodiacInfo && (
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full border backdrop-blur-md",
                        zodiacInfo.element === 'FIRE' ? 'border-red-500/40 bg-red-500/10 text-red-500' :
                        zodiacInfo.element === 'EARTH' ? 'border-green-500/40 bg-green-500/10 text-green-500' :
                        zodiacInfo.element === 'AIR' ? 'border-blue-500/40 bg-blue-500/10 text-blue-500' :
                        'border-purple-500/40 bg-purple-500/10 text-purple-500'
                      )}>
                        <span className="text-sm md:text-lg">{zodiacInfo.icon}</span>
                        <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">{zodiacInfo.name}</span>
                      </div>
                    )}
                    <div className="px-3 py-1 md:px-4 md:py-1.5 bg-jiwa text-white text-[8px] md:text-[10px] font-black rounded-full tracking-widest uppercase shadow-lg shadow-jiwa/20 whitespace-nowrap border border-white/20">
                      {(() => {
                        const entries = Object.entries(stats || {});
                        if (entries.length === 0) return 'UNKNOWN ENTITY';
                        const sorted = entries.sort((a,b) => (b[1] as number) - (a[1] as number));
                        const topStat = sorted[0][0];
                        const titles: Record<string, string> = {
                          JIWA: 'SOUL ASCENDANT',
                          RAGA: 'VITALITY PARAGON',
                          HARTA: 'FORTUNE TYCOON',
                          ILMU: 'WISDOM SAGE',
                          KARMA: 'DESTINY WEAVER'
                        };
                        return titles[topStat] || 'UNKNOWN ENTITY';
                      })()}
                    </div>
                  </div>
                </div>

                {usia && (
                  <p className="text-xs md:text-sm font-bold text-rpg-text/40 uppercase tracking-[0.2em]">
                    {usia} Years Old • <span className="text-rpg-text/60">{analysis?.personality_type || "TRAVELLER"}</span>
                  </p>
                )}

                <p className="text-jiwa/80 font-black italic text-lg md:text-2xl tracking-tight leading-tight">
                  {analysis?.personality_title || "The Unwritten Legend"}
                </p>
              </div>

              <div className="w-full max-w-md space-y-3 pt-6 mx-auto md:mx-0">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-1 px-1">
                  <span className="text-[9px] md:text-xs font-black text-rpg-text/60 uppercase tracking-[0.3em]">Experience Points</span>
                  <span className="text-base md:text-lg font-mono font-black text-rpg-text">
                    {xp} <span className="text-rpg-text/50 text-xs md:text-sm">/ {level * 1000}</span>
                  </span>
                </div>
                <div className="h-3 md:h-4 w-full bg-rpg-black/50 rounded-full overflow-hidden p-0.5 md:p-1 border border-rpg-border">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-jiwa to-ilmu rounded-full shadow-[0_0_15px_rgba(var(--color-jiwa),0.4)]"
                    initial={{ width: 0 }} 
                    animate={{ width: `${(xp / (level * 1000)) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE ATTRIBUTES & ACHIEVEMENTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          
          <div className="space-y-8">
            {/* ATTRIBUTES LIST */}
            <section className="glass-panel p-6 md:p-10 space-y-8">
              <div className="flex items-center gap-3">
                <Medal className="w-5 h-5 md:w-6 md:h-6 text-rpg-text/60" />
                <h3 className="text-[10px] md:text-xs font-black tracking-[0.3em] text-rpg-text/60 uppercase">CORE ATTRIBUTES</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {RPG_ATTRIBUTES.map(attr => (
                  <div key={attr.label} className="space-y-3 group">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-3">
                        <IconBox icon={attr.icon} className={cn(attr.bg, attr.color)} size="w-5 h-5" />
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-black tracking-widest text-rpg-text">{attr.label}</span>
                          <span className={cn("text-[9px] font-black tracking-widest opacity-80", attr.color)}>
                            {getDimensionRank(attr.val)}
                          </span>
                        </div>
                      </div>
                      <span className="text-lg md:text-xl font-black italic text-rpg-text">{attr.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-rpg-border/10 rounded-full overflow-hidden">
                      <motion.div 
                        className={cn("h-full rounded-full shadow-[0_0_10px_currentColor]", attr.color.replace('text-', 'bg-'))} 
                        initial={{ width: 0 }} 
                        animate={{ width: `${attr.val}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* AI CHRONICLE */}
            <section className="glass-panel p-8 md:p-10 border-l-4 border-l-jiwa bg-jiwa/5 space-y-6">
              <div className="flex items-center gap-3 text-jiwa">
                <Brain className="w-6 h-6" />
                <h3 className="text-[10px] font-black tracking-[0.4em] uppercase">Chronicle of Identity</h3>
              </div>
              <div className="space-y-4">
                <p className="text-xl md:text-2xl text-rpg-text/80 font-bold italic leading-tight">
                  "{analysis?.character_summary || "Your legend is yet to be written. Complete quests to manifest your destiny."}"
                </p>
                <div className="w-12 h-1.5 bg-jiwa/30 rounded-full" />
                <p className="text-sm text-rpg-text/70 leading-relaxed max-w-2xl">
                  Based on your activity patterns, you show a strong affinity for the <span className="text-jiwa font-black">SOUL</span> dimension. Continue to develop other dimensions to achieve perfect equilibrium.
                </p>
              </div>
            </section>

            {/* UNLOCKED TALENTS COLLECTION */}
            <section className="glass-panel p-8 md:p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-jiwa" />
                  <h3 className="text-xs font-black tracking-[0.3em] text-rpg-text/60 uppercase">TALENT COLLECTION ({talents.length})</h3>
                </div>
              </div>
              
              {talents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {talents.map(id => {
                    const t = TALENTS.find(talent => talent.id === id);
                    if (!t) return null;
                    return (
                      <div key={id} className={cn(
                        "p-4 rounded-2xl border flex items-center gap-4 group hover:scale-[1.02] transition-all",
                        t.rarity === 'Legendary' ? 'bg-amber-500/5 border-amber-500/10' :
                        t.rarity === 'Epic' ? 'bg-purple-500/5 border-purple-500/10' :
                        t.rarity === 'Rare' ? 'bg-blue-500/5 border-blue-500/10' :
                        t.rarity === 'Uncommon' ? 'bg-green-500/5 border-green-500/10' :
                        'bg-rpg-border/5 border-rpg-border'
                      )}>
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                          t.rarity === 'Legendary' ? 'bg-amber-500 text-black' :
                          t.rarity === 'Epic' ? 'bg-purple-500 text-rpg-text' :
                          t.rarity === 'Rare' ? 'bg-blue-500 text-rpg-text' :
                          t.rarity === 'Uncommon' ? 'bg-green-500 text-rpg-text' :
                          'bg-neutral-800 text-neutral-400'
                        )}>
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-rpg-text">{t.name}</h4>
                            <span className={cn(
                              "text-[8px] px-1.5 py-0.5 rounded font-black uppercase",
                              t.rarity === 'Legendary' ? 'bg-amber-500/20 text-amber-500' :
                              t.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-500' :
                              t.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-500' :
                              t.rarity === 'Uncommon' ? 'bg-green-500/20 text-green-500' :
                              'bg-white/10 text-neutral-500'
                            )}>
                              {t.rarity}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 font-medium mt-0.5 line-clamp-1">{t.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-rpg-border/50 rounded-3xl">
                  <p className="text-sm font-black text-neutral-600 uppercase tracking-widest italic">No talents awakened yet</p>
                  <p className="text-[10px] text-neutral-700 mt-2">Increase your level to unlock hidden potential</p>
                </div>
              )}
            </section>

            {/* STAT EVOLUTION CHART */}
            <section className="glass-panel p-8 md:p-10 space-y-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-neutral-400" />
                <h3 className="text-xs font-black tracking-[0.3em] text-neutral-400 uppercase">STATISTIC EVOLUTION (Last 30 Days)</h3>
              </div>
              <div className="w-full h-[250px] bg-white/[0.02] rounded-2xl border border-rpg-border/50 p-4">
                {statHistory && statHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={200}>
                    <LineChart data={statHistory}>
                      <XAxis 
                        dataKey="created_at" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
                        tickFormatter={(val) => {
                          const date = new Date(val);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Line type="monotone" dataKey="jiwa" stroke="#A855F7" strokeWidth={3} dot={{ r: 4, fill: '#A855F7' }} activeDot={{ r: 6 }} name="JIWA" />
                      <Line type="monotone" dataKey="raga" stroke="#22C55E" strokeWidth={3} dot={{ r: 4, fill: '#22C55E' }} activeDot={{ r: 6 }} name="RAGA" />
                      <Line type="monotone" dataKey="harta" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} activeDot={{ r: 6 }} name="HARTA" />
                      <Line type="monotone" dataKey="ilmu" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} name="ILMU" />
                      <Line type="monotone" dataKey="karma" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, fill: '#EC4899' }} activeDot={{ r: 6 }} name="KARMA" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-neutral-600 tracking-widest uppercase">
                    No Historical Data Found
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* SIDEBAR: ACHIEVEMENTS & HISTORY */}
          <div className="space-y-8">
            <section className="glass-panel p-8 space-y-8 bg-gradient-to-b from-rpg-card to-rpg-black">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-rpg-text/60" />
                <h3 className="text-sm font-black tracking-[0.2em] text-rpg-text/60 uppercase text-center">Hall of Fame</h3>
              </div>
              <div className="space-y-5">
                {achievements.map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 bg-rpg-border/5 border border-rpg-border/50 rounded-[24px] flex items-center gap-4 group hover:bg-rpg-border/10 transition-all cursor-default"
                  >
                    <IconBox icon={item.icon} className={item.color} size="w-6 h-6" />
                    <div>
                      <h4 className="text-sm md:text-base font-black tracking-widest text-rpg-text">{item.title}</h4>
                      <p className="text-[10px] md:text-xs text-rpg-text/60 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="w-full py-4 border-2 border-dashed border-rpg-border rounded-[24px] text-xs font-black text-rpg-text/40 tracking-widest hover:border-rpg-primary hover:text-rpg-primary transition-all uppercase">
                Unlock More
              </button>
            </section>

            {/* MEMORY ARCHIVE */}
            <section className="glass-panel p-6 space-y-4">
              <div className="flex items-center gap-2 text-neutral-400 mb-6">
                <History className="w-5 h-5" />
                <span className="text-xs font-black tracking-widest uppercase">Memory Archive</span>
              </div>
              <div className="space-y-6">
                {reflections.length > 0 ? reflections.map((ref, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-1.5 min-h-[40px] bg-jiwa/30 rounded-full group-hover:bg-jiwa transition-colors" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                        {new Date(ref.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs font-bold text-rpg-text/70 mt-1.5 leading-relaxed">
                        "{ref.reflection_text}"
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="flex gap-3 opacity-50">
                    <div className="w-1.5 h-10 bg-neutral-700 rounded-full" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-neutral-400">No memories found</p>
                      <p className="text-[10px] text-neutral-500 mt-1">Speak with the Soul Guard to record your journey.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

