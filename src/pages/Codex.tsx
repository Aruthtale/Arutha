import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Book, Sparkles, Shield, Zap, Brain, Dumbbell, Coins, Users, BookOpen, 
  Info, HelpCircle, Star, TrendingUp, AlertTriangle, RefreshCcw, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TALENTS } from '../lib/talents';
import codexData from '../data/codex.json';
import archetypeData from '../data/archetypes.json';
import { ZODIACS } from '../lib/zodiacs';

// Icon resolver — maps JSON string keys to React components
const ICON_MAP: Record<string, React.ReactNode> = {
  Brain: <Brain className="w-5 h-5" />,
  Dumbbell: <Dumbbell className="w-5 h-5" />,
  Coins: <Coins className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5 text-jiwa" />,
  Zap: <Zap className="w-5 h-5 text-amber-500" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-jiwa" />,
  Sparkles: <Sparkles className="w-5 h-5 text-purple-500" />,
  AlertTriangle: <AlertTriangle className="w-5 h-5 text-raga" />,
  RefreshCcw: <RefreshCcw className="w-5 h-5 text-ilmu" />,
  Info: <Info className="w-5 h-5" />,
};

const resolveIcon = (key: string, className?: string) => {
  const base = ICON_MAP[key];
  if (!base) return <HelpCircle className="w-5 h-5" />;
  if (className) return React.cloneElement(base as React.ReactElement<any>, { className });
  return base;
};

interface CodexProps {
  onBack: () => void;
}

export const Codex: React.FC<CodexProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<'PANDUAN' | 'DIMENSI' | 'BAKAT' | 'HUKUM' | 'ARKETIPE' | 'MISTIK' | 'ZODIAK'>('PANDUAN');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const DIMENSIONS = codexData.dimensions;
  const RULES = codexData.rules;
  const MYSTIC_ITEMS = codexData.mysticItems;
  const ARCHETYPES = archetypeData;

  const categories = [
    { id: 'PANDUAN', label: 'Panduan Arutha', icon: <Info className="w-4 h-4" /> },
    { id: 'DIMENSI', label: 'Sistem Dimensi', icon: <Brain className="w-4 h-4" /> },
    { id: 'MISTIK', label: 'Mistik & Soul', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'BAKAT', label: 'Katalog Bakat', icon: <Book className="w-4 h-4" /> },
    { id: 'ARKETIPE', label: 'Daftar Arketipe', icon: <Users className="w-4 h-4" /> },
    { id: 'ZODIAK', label: 'Rasi Bintang', icon: <Star className="w-4 h-4 text-amber-400" /> },
    { id: 'HUKUM', label: 'Hukum Semesta', icon: <Shield className="w-4 h-4" /> }
  ];

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-rpg-black text-rpg-text p-4 md:p-6 pb-32 pt-24 md:pt-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6">
          <button onClick={onBack} className="p-3 bg-rpg-card border border-rpg-border rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-3 group self-start">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black tracking-widest">KEMBALI</span>
          </button>
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-end gap-3 text-jiwa mb-1">
              <Book className="w-5 h-5" />
              <span className="text-xs font-black tracking-[0.4em] uppercase">The Divine Encyclopedia</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter">ARUTHA CODEX</h2>
          </div>
        </header>

        {/* DROPDOWN SELECTOR */}
        <div className="relative z-40">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-5 bg-rpg-card border border-rpg-border rounded-2xl shadow-xl hover:border-white/20 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rpg-border/5 flex items-center justify-center text-jiwa">
                {currentCategory?.icon}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-rpg-text/40 uppercase tracking-widest">Kategori</p>
                <p className="text-lg font-black italic text-rpg-text tracking-tight">{currentCategory?.label}</p>
              </div>
            </div>
            <ChevronDown className={cn("w-6 h-6 text-rpg-text/40 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 p-2 bg-rpg-black border border-rpg-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden"
              >
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id as any);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                      activeCategory === cat.id ? "bg-rpg-primary text-rpg-primary-text" : "text-rpg-text/60 hover:bg-rpg-border/5 hover:text-rpg-text"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", activeCategory === cat.id ? "bg-rpg-primary-text/10" : "bg-rpg-border/5")}>
                      {cat.icon}
                    </div>
                    <span className="text-sm font-black italic">{cat.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONTENT AREA */}
        <main className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeCategory === 'PANDUAN' && (
              <motion.div
                key="panduan"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="glass-panel p-8 md:p-12 space-y-12">
                  {/* Intro */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-jiwa/10 rounded-2xl">
                        <Sparkles className="w-6 h-6 text-jiwa" />
                      </div>
                      <h4 className="text-xl md:text-2xl font-black text-rpg-text italic">Apa itu Arutha?</h4>
                    </div>
                    <p className="text-base text-rpg-text/80 leading-relaxed font-medium">
                      Arutha adalah platform pengembangan diri berbasis RPG yang didukung oleh kecerdasan buatan (AI). 
                      Setiap hari, Anda akan menerima <span className="text-rpg-text font-black italic">misi harian</span> yang disesuaikan secara personal 
                      berdasarkan profil psikologis, usia, dan kebutuhan Anda. Selesaikan misi untuk menaikkan statistik dimensi dan naik level!
                    </p>
                  </div>

                  {/* Cara Bermain */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-2xl">
                        <Star className="w-6 h-6 text-amber-500" />
                      </div>
                      <h4 className="text-xl md:text-2xl font-black text-rpg-text italic">Cara Bermain</h4>
                    </div>
                    <div className="grid gap-4">
                      {[
                        { step: 1, text: 'Buka Dashboard dan lihat <span class="text-rpg-text font-bold">Misi Harian</span> yang telah disiapkan AI khusus untuk Anda.' },
                        { step: 2, text: 'Kerjakan misi di dunia nyata, lalu tekan <span class="text-rpg-text font-bold">"Buktikan Quest"</span> dan tuliskan bukti atau catatan Anda.' },
                        { step: 3, text: 'AI akan <span class="text-rpg-text font-bold">memverifikasi</span> jawaban Anda. Jika lolos, Anda mendapatkan XP dan statistik dimensi meningkat!' },
                      ].map(s => (
                        <div key={s.step} className="flex items-start gap-4 p-5 bg-rpg-border/5 border border-rpg-border/50 rounded-2xl">
                          <span className="w-8 h-8 flex items-center justify-center bg-jiwa/20 text-jiwa font-black rounded-lg shrink-0">{s.step}</span>
                          <p className="text-sm text-rpg-text/80 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: s.text }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fitur Utama */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-raga/10 rounded-2xl">
                        <Zap className="w-6 h-6 text-raga" />
                      </div>
                      <h4 className="text-xl md:text-2xl font-black text-rpg-text italic">Fitur Utama Semesta</h4>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-4 p-5 bg-rpg-border/5 border border-rpg-border/50 rounded-2xl group hover:border-jiwa/30 transition-all">
                        <Shield className="w-6 h-6 text-jiwa shrink-0" />
                        <p className="text-sm text-rpg-text/80 font-medium leading-relaxed">
                          <span className="text-rpg-text font-black italic block mb-1">VERIFIKASI AI</span>
                          Setiap bukti quest diverifikasi oleh AI untuk menjaga integritas dan kejujuran progres Anda.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-rpg-border/5 border border-rpg-border/50 rounded-2xl group hover:border-harta/30 transition-all">
                        <TrendingUp className="w-6 h-6 text-harta shrink-0" />
                        <p className="text-sm text-rpg-text/80 font-medium leading-relaxed">
                          <span className="text-rpg-text font-black italic block mb-1">STREAK SYSTEM</span>
                          Selesaikan quest setiap hari tanpa putus untuk membangun momentum dan mendapatkan bonus XP yang melimpah.
                        </p>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-rpg-border/5 border border-rpg-border/50 rounded-2xl group hover:border-ilmu/30 transition-all">
                        <Sparkles className="w-6 h-6 text-ilmu shrink-0" />
                        <p className="text-sm text-rpg-text/80 font-medium leading-relaxed">
                          <span className="text-rpg-text font-black italic block mb-1">ORACLE AI</span>
                          Setiap hari Anda menerima pesan motivasi dan ramalan pertumbuhan yang dipersonalisasi khusus untuk kondisi jiwa Anda.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-rpg-border/50 text-center">
                    <p className="text-[10px] font-black tracking-[0.4em] text-neutral-600 uppercase">Arutha v1.0.0 · Divine Evolution Edition</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeCategory === 'DIMENSI' && (
              <motion.div
                key="dimensi"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {DIMENSIONS.map(dim => (
                  <div key={dim.id} className={cn("glass-panel p-8 border-l-4 space-y-4 flex flex-col justify-between h-full", dim.border, dim.bg)}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-lg", dim.bg, dim.color)}>
                          {resolveIcon(dim.iconKey, 'w-6 h-6')}
                        </div>
                        <h3 className={cn("text-xl font-black italic", dim.color)}>{dim.name}</h3>
                      </div>
                      <p className="text-rpg-text/80 leading-relaxed font-medium">{dim.desc}</p>
                    </div>
                    <div className="pt-6 border-t border-rpg-border/50 mt-auto">
                      <p className="text-[10px] font-black text-jiwa uppercase tracking-[0.3em] mb-3">Contoh Aktivitas</p>
                      <p className="text-base italic text-rpg-text/90 leading-relaxed font-medium">{dim.examples}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeCategory === 'BAKAT' && (
              <motion.div
                key="bakat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="col-span-full relative overflow-hidden glass-panel p-10 bg-gradient-to-br from-jiwa/20 via-jiwa/5 to-transparent border-jiwa/30">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Book className="w-32 h-32 rotate-12" />
                  </div>
                  <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
                    <p className="text-[10px] font-black text-jiwa uppercase tracking-[0.5em]">Katalog Bakat</p>
                    <h3 className="text-2xl md:text-3xl font-black italic text-rpg-text leading-tight">
                      Sistem Bakat (Talents)
                    </h3>
                    <p className="text-sm md:text-base text-rpg-text/80 font-medium leading-relaxed">
                      Bakat adalah anugerah pasif yang memberikan keuntungan permanen untuk progres dimensimu. <br/><br/>
                      <span className="text-amber-400 font-black tracking-widest uppercase text-[11px] drop-shadow-md">Bagaimana Cara Mendapatkannya?</span><br/>
                      <span className="inline-block mt-2">
                        Bakat dapat diperoleh dengan <strong>menyelesaikan Misi Spesial</strong>, <strong>menjaga Streak Harian</strong>, atau sebagai <strong>drop langka (Gacha)</strong> saat melakukan refleksi dengan Soul Guard. Semakin aktif dirimu, semakin besar peluang memicu *Awakening* Bakat Legendary!
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TALENTS.sort((a, b) => {
                    const order = { 'Common': 0, 'Uncommon': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4 };
                    return order[b.rarity] - order[a.rarity];
                  }).map(t => (
                    <div key={t.id} className={cn(
                      "p-6 rounded-3xl border bg-rpg-card transition-all group hover:border-white/20 shadow-xl",
                      t.rarity === 'Legendary' ? 'border-amber-500/30 shadow-amber-500/5' :
                      t.rarity === 'Epic' ? 'border-purple-500/30 shadow-purple-500/5' :
                      t.rarity === 'Rare' ? 'border-blue-500/30 shadow-blue-500/5' :
                      t.rarity === 'Uncommon' ? 'border-green-500/30 shadow-green-500/5' :
                      'border-rpg-border/50'
                    )}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                          t.rarity === 'Legendary' ? 'bg-amber-500 text-black' :
                          t.rarity === 'Epic' ? 'bg-purple-500 text-rpg-text' :
                          t.rarity === 'Rare' ? 'bg-blue-500 text-rpg-text' :
                          t.rarity === 'Uncommon' ? 'bg-green-500 text-rpg-text' :
                          'bg-neutral-800 text-neutral-400'
                        )}>
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <span className={cn(
                          "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm border",
                          t.rarity === 'Legendary' ? 'bg-amber-500 text-black border-amber-400' :
                          t.rarity === 'Epic' ? 'bg-purple-500 text-rpg-text border-purple-400' :
                          t.rarity === 'Rare' ? 'bg-blue-500 text-rpg-text border-blue-400' :
                          t.rarity === 'Uncommon' ? 'bg-green-500 text-rpg-text border-green-400' :
                          'bg-rpg-border/5 text-neutral-500 border-rpg-border'
                        )}>
                          {t.rarity}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-rpg-text group-hover:text-jiwa transition-colors mb-2 tracking-tight">{t.name}</h4>
                      <p className="text-sm text-rpg-text/60 font-medium leading-relaxed">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeCategory === 'ARKETIPE' && (
              <motion.div
                key="arketipe"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {ARCHETYPES.map((arch, i) => (
                  <div key={i} className={cn("glass-panel p-8 border transition-all group flex flex-col h-full", arch.border, arch.bg)}>
                    <h3 className={cn("text-lg font-black italic mb-3 tracking-tight", arch.color)}>{arch.title}</h3>
                    <p className="text-sm text-rpg-text/80 leading-relaxed font-medium">{arch.desc}</p>
                  </div>
                ))}
                <div className="col-span-full p-8 bg-jiwa/5 rounded-3xl border border-dashed border-jiwa/20 text-center">
                  <p className="text-[10px] font-black text-jiwa uppercase tracking-[0.2em]">Sistem MBTI x Arutha</p>
                  <p className="text-xs italic text-neutral-500 mt-2">Masih banyak arketipe lainnya yang akan terungkap seiring perkembangan karaktermu.</p>
                </div>
              </motion.div>
            )}

            {activeCategory === 'HUKUM' && (
              <motion.div
                key="hukum"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {RULES.map((rule, i) => (
                  <div key={i} className={cn(
                    "glass-panel p-8 flex flex-col gap-6 group hover:bg-white/[0.02] transition-all h-full border border-rpg-border/50",
                    i === 0 && "md:col-span-2 bg-gradient-to-r from-jiwa/10 to-transparent"
                  )}>
                    <div className="w-14 h-14 rounded-2xl bg-rpg-border/5 border border-rpg-border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      {resolveIcon(rule.iconKey)}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-black italic text-rpg-text leading-tight">{rule.title}</h3>
                      <p className="text-base text-rpg-text/70 leading-relaxed font-medium">{rule.desc}</p>
                    </div>
                  </div>
                ))}

                <div className="p-8 bg-gradient-to-r from-jiwa/10 to-ilmu/10 rounded-3xl border border-rpg-border/50 text-center mt-12">
                  <p className="text-xs font-black text-rpg-text/40 uppercase tracking-[0.3em] mb-4">Misi Arutha</p>
                  <p className="text-base italic text-rpg-text/90">
                    "Membantumu menjadi versi terbaik dari dirimu sendiri melalui disiplin yang menyenangkan."
                  </p>
                </div>
              </motion.div>
            )}

            {activeCategory === 'MISTIK' && (
              <motion.div
                key="mistik"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {MYSTIC_ITEMS.map((item, i) => (
                  <div key={i} className={cn("glass-panel p-8 border transition-all hover:bg-white/[0.02]", item.border, item.bg)}>
                    <div className="flex items-start gap-6">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg", item.bg, item.color)}>
                        {resolveIcon(item.iconKey)}
                      </div>
                      <div className="space-y-2">
                        <h3 className={cn("text-xl font-black italic tracking-tight", item.color)}>{item.title}</h3>
                        <p className="text-rpg-text/80 leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeCategory === 'ZODIAK' && (
              <motion.div
                key="zodiak"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="glass-panel p-8 md:p-12 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10 border-rpg-border text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                  <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                      <Star className="w-10 h-10 text-amber-400" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black italic">Sistem Rasi Bintang</h3>
                    <p className="text-sm md:text-base text-rpg-text/70 leading-relaxed font-medium">
                      Takdirmu tertulis di antara bintang-bintang. Setiap Zodiak membawa elemen alam dan <span className="text-rpg-text font-black italic">Blessing</span> unik yang mempercepat pertumbuhan dimensimu.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ZODIACS.map((z) => (
                    <div key={z.id} className="glass-panel p-8 border border-rpg-border/50 hover:border-white/20 transition-all group overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                        <span className="text-8xl font-black">{z.icon}</span>
                      </div>
                      
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-rpg-border",
                            z.element === 'FIRE' ? 'bg-red-500/20 text-red-400' :
                            z.element === 'EARTH' ? 'bg-green-500/20 text-green-400' :
                            z.element === 'AIR' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          )}>
                            {z.icon}
                          </div>
                          <div>
                            <h4 className="text-xl font-black italic tracking-tight">{z.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                z.element === 'FIRE' ? 'border-red-500/30 text-red-400' :
                                z.element === 'EARTH' ? 'border-green-500/30 text-green-400' :
                                z.element === 'AIR' ? 'border-blue-500/30 text-blue-400' :
                                'border-purple-500/30 text-purple-400'
                              )}>
                                {z.element}
                              </span>
                              <span className="text-[9px] font-bold text-rpg-text/40 uppercase tracking-widest">
                                {z.startDay}/{z.startMonth} - {z.endDay}/{z.endMonth}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-rpg-text/70 leading-relaxed font-medium">
                          {z.description}
                        </p>

                        <div className="pt-6 border-t border-rpg-border/50 space-y-3">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Divine Blessing: {z.buff}</span>
                          </div>
                          <p className="text-xs font-bold text-rpg-text/70 italic bg-rpg-border/5 p-3 rounded-xl border border-rpg-border/50">
                            "{z.rpgEffect}"
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};
