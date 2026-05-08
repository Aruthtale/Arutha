import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Shield, Star, Zap, Award, Target, TrendingUp, Heart, Brain, Dumbbell, Coins, BookOpen, Users
} from 'lucide-react';
import { cn } from '../lib/utils';

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
}

export const Profile: React.FC<ProfileProps> = ({ name, level, xp, stats, analysis, onBack }) => {
  const achievements = [
    { title: "Langkah Pertama", desc: "Menyelesaikan quest perdana", icon: <Zap className="w-4 h-4" />, color: "bg-jiwa/20 text-jiwa" },
    { title: "Integritas Tinggi", desc: "Lulus verifikasi AI 5 kali berturut-turut", icon: <Shield className="w-4 h-4" />, color: "bg-raga/20 text-raga" },
    { title: "Pelajar Tekun", desc: "Mencapai level 70 di dimensi ILMU", icon: <BookOpen className="w-4 h-4" />, color: "bg-ilmu/20 text-ilmu" },
  ];

  return (
    <div className="min-h-screen bg-rpg-black text-white p-4 md:p-6 pb-32 pt-24">
      <div className="max-w-4xl mx-auto space-y-8 md:y-12">
        {/* Header Navigation */}
        <header className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 md:p-3 bg-rpg-card border border-rpg-border rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] md:text-xs font-black tracking-widest">KEMBALI</span>
          </button>
          <div className="text-right">
            <p className="text-[8px] md:text-[10px] font-black tracking-[0.3em] text-neutral-500 uppercase">Profile Arutha</p>
            <h2 className="text-lg md:text-xl font-bold italic">Character Sheet</h2>
          </div>
        </header>

        {/* Hero Profile Card */}
        <section className="relative glass-panel p-6 md:p-10 overflow-hidden bg-gradient-to-br from-rpg-card to-rpg-black border-white/5 shadow-2xl shadow-jiwa/5">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-48 h-48 md:w-64 md:h-64" /></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Avatar Visual */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] md:rounded-[40px] bg-gradient-to-tr from-jiwa via-ilmu to-raga rotate-6 flex items-center justify-center font-black text-3xl md:text-4xl shadow-2xl shadow-jiwa/30 border-2 md:border-4 border-rpg-black">
                {name.substring(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white text-black px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-sm border-2 md:border-4 border-rpg-black">
                LVL {level}
              </div>
            </div>

            <div className="text-center md:text-left space-y-3 w-full">
              <div className="flex flex-col md:flex-row items-center md:justify-start gap-2 md:gap-3">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{name}</h1>
                <span className="px-3 py-1 bg-jiwa/10 border border-jiwa/20 text-jiwa text-[10px] font-black rounded-lg uppercase tracking-[0.2em]">
                  {analysis?.personality_type || "UNKNOWN"}
                </span>
              </div>
              <p className="text-neutral-400 font-medium italic text-base md:text-lg">"{analysis?.personality_title || "New Traveler"}"</p>
              <div className="w-full md:w-80 mx-auto md:mx-0 space-y-2">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Progress XP</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-white">{xp}</span>
                    <span className="text-[10px] font-bold text-neutral-500">/ {level * 1000}</span>
                  </div>
                </div>
                <div className="h-3 w-full bg-neutral-900 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                  <motion.div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-jiwa via-ilmu to-jiwa bg-[length:200%_100%] animate-shimmer"
                    initial={{ width: 0 }} 
                    animate={{ width: `${(xp / (level * 1000)) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[10px] font-bold text-neutral-600 text-right uppercase tracking-tighter">
                  {Math.floor((xp / (level * 1000)) * 100)}% UNTIL NEXT LEVEL
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats & Dimension Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <section className="glass-panel p-6 md:p-8 space-y-6">
            <h3 className="text-[10px] font-black tracking-[0.3em] text-neutral-500 uppercase flex items-center gap-2">
              <Target className="w-4 h-4" /> Core Statistics
            </h3>
            <div className="space-y-5">
              {[
                { name: 'JIWA', val: stats.JIWA, color: 'bg-jiwa', icon: <Brain className="w-3 h-3" /> },
                { name: 'RAGA', val: stats.RAGA, color: 'bg-raga', icon: <Dumbbell className="w-3 h-3" /> },
                { name: 'HARTA', val: stats.HARTA, color: 'bg-harta', icon: <Coins className="w-3 h-3" /> },
                { name: 'ILMU', val: stats.ILMU, color: 'bg-ilmu', icon: <BookOpen className="w-3 h-3" /> },
                { name: 'KARMA', val: stats.KARMA, color: 'bg-karma', icon: <Users className="w-3 h-3" /> },
              ].map(s => (
                <div key={s.name} className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-neutral-400 tracking-widest flex items-center gap-2">{s.icon} {s.name}</span>
                    <span className="text-[10px] font-mono font-bold">{s.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                    <motion.div className={cn("h-full", s.color)} initial={{ width: 0 }} animate={{ width: `${s.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6 md:p-8 space-y-6 bg-gradient-to-b from-rpg-card to-rpg-black">
            <h3 className="text-[10px] font-black tracking-[0.3em] text-neutral-500 uppercase flex items-center gap-2">
              <Award className="w-4 h-4" /> Achievements
            </h3>
            <div className="space-y-4">
              {achievements.map((ach, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 group hover:border-white/10 transition-all">
                  <div className={cn("p-2.5 md:p-3 rounded-xl transition-transform group-hover:scale-110", ach.color)}>
                    {ach.icon}
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-bold">{ach.title}</h4>
                    <p className="text-[9px] md:text-[10px] text-neutral-500">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 border border-dashed border-neutral-800 rounded-2xl text-[10px] font-black text-neutral-600 tracking-widest hover:border-neutral-700 hover:text-neutral-500 transition-all uppercase">
              Lihat Semua
            </button>
          </section>
        </div>

        {/* Narrative Summary */}
        <section className="glass-panel p-6 md:p-8 border-l-4 border-l-jiwa bg-jiwa/5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-jiwa" />
            <span className="text-[10px] font-black tracking-[0.3em] text-neutral-500 uppercase">Analisis Psikologis AI</span>
          </div>
          <p className="text-base md:text-lg text-neutral-300 italic leading-relaxed">
            "{analysis?.character_summary || "Perjalanan Anda baru saja dimulai. Terus selesaikan quest harian untuk membangun narasi hidup yang lebih kuat."}"
          </p>
        </section>
      </div>
    </div>
  );
};
