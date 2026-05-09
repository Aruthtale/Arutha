import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Book, Sparkles, Shield, Zap, Brain, Dumbbell, Coins, Users, BookOpen, 
  Info, HelpCircle, Star, TrendingUp, AlertTriangle, RefreshCcw, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TALENTS } from '../lib/talents';

interface CodexProps {
  onBack: () => void;
}

export const Codex: React.FC<CodexProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<'DIMENSI' | 'BAKAT' | 'HUKUM' | 'ARKETIPE'>('DIMENSI');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const DIMENSIONS = [
    { 
      id: 'JIWA', 
      name: 'DIMENSI JIWA', 
      desc: 'Berfokus pada kesehatan mental, ketenangan batin, dan kesadaran diri.',
      examples: 'Meditasi, journaling, berdoa, atau sekadar diam tanpa gadget.',
      icon: <Brain />, color: 'text-jiwa', bg: 'bg-jiwa/10', border: 'border-jiwa/20'
    },
    { 
      id: 'RAGA', 
      name: 'DIMENSI RAGA', 
      desc: 'Berfokus pada kesehatan fisik, kekuatan tubuh, dan nutrisi.',
      examples: 'Olahraga, makan sehat, minum air putih cukup, tidur teratur.',
      icon: <Dumbbell />, color: 'text-raga', bg: 'bg-raga/10', border: 'border-raga/20'
    },
    { 
      id: 'HARTA', 
      name: 'DIMENSI HARTA', 
      desc: 'Berfokus pada kemandirian finansial, manajemen aset, dan produktivitas ekonomi.',
      examples: 'Mencatat pengeluaran, menabung, belajar investasi, mencari penghasilan tambahan.',
      icon: <Coins />, color: 'text-harta', bg: 'bg-harta/10', border: 'border-harta/20'
    },
    { 
      id: 'ILMU', 
      name: 'DIMENSI ILMU', 
      desc: 'Berfokus pada pengembangan intelektual, keterampilan baru, dan wawasan.',
      examples: 'Membaca buku, kursus online, belajar bahasa baru, riset topik menarik.',
      icon: <BookOpen />, color: 'text-ilmu', bg: 'bg-ilmu/10', border: 'border-ilmu/20'
    },
    { 
      id: 'KARMA', 
      name: 'DIMENSI KARMA', 
      desc: 'Berfokus pada hubungan sosial, kontribusi masyarakat, dan kebaikan tanpa pamrih.',
      examples: 'Membantu teman, sedekah, kerja bakti, memberikan pujian tulus.',
      icon: <Users />, color: 'text-karma', bg: 'bg-karma/10', border: 'border-karma/20'
    }
  ];

  const RULES = [
    {
      title: "Hukum Semesta & Fitur Utama",
      desc: "Prinsip-prinsip dasar dan fitur utama yang mengatur perjalananmu di dunia Arutha.",
      icon: <Shield className="w-5 h-5 text-jiwa" />
    },
    {
      title: "Daily Refresh (1x Sehari)",
      desc: "Setiap hari, kamu hanya mendapatkan satu kali kesempatan untuk me-refresh daftar misimu. Gunakan dengan bijak!",
      icon: <Zap className="w-5 h-5 text-amber-500" />
    },
    {
      title: "Sistem Progresi (XP)",
      desc: "Setiap misi yang berhasil diverifikasi akan memberikan Experience Points (XP). Kumpulkan XP untuk naik level.",
      icon: <TrendingUp className="w-5 h-5 text-jiwa" />
    },
    {
      title: "Evolusi Karakter (30 Hari)",
      desc: "Setiap 30 hari sekali, Arutha akan melakukan evaluasi mendalam terhadap progresmu. Ini adalah saat di mana arketipe kepribadianmu bisa berevolusi.",
      icon: <Sparkles className="w-5 h-5 text-purple-500" />
    },
    {
      title: "Bimbingan AI Arutha",
      desc: "Gunakan fitur chat dengan AI Arutha untuk konsultasi mengenai progres, tips harian, atau sekadar motivasi saat kamu merasa jenuh.",
      icon: <Brain className="w-5 h-5 text-blue-500" />
    },
    {
      title: "Hukum Decay (Kelelahan)",
      desc: "Jika kamu mengabaikan satu dimensi terlalu lama, statistik dimensi tersebut akan menurun secara otomatis.",
      icon: <AlertTriangle className="w-5 h-5 text-raga" />
    },
    {
      title: "Misi Pemulihan",
      desc: "Gunakan Misi Pemulihan untuk mengembalikan statistik yang turun drastis akibat Decay.",
      icon: <RefreshCcw className="w-5 h-5 text-ilmu" />
    }
  ];

  const ARCHETYPES = [
    // Analysts (Purple)
    { title: "INTJ (The Architect)", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", desc: "Pemikir strategis dengan rencana untuk segalanya. Fokus pada efisiensi dan logika jangka panjang." },
    { title: "INTP (The Logician)", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", desc: "Inovator kreatif dengan haus akan pengetahuan. Selalu menganalisis pola dan sistem." },
    { title: "ENTJ (The Commander)", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", desc: "Pemimpin yang berani dan bertekad kuat. Ahli dalam mengorganisir sumber daya untuk mencapai visi." },
    { title: "ENTP (The Debater)", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", desc: "Pemikir cerdas dan penasaran yang tidak bisa menahan tantangan intelektual. Pendobrak status quo." },
    
    // Diplomats (Green)
    { title: "INFJ (The Advocate)", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", desc: "Idealis yang mistis dan berprinsip. Memiliki misi untuk memberikan dampak positif bagi dunia." },
    { title: "INFP (The Mediator)", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", desc: "Orang yang puitis, baik hati, dan altruistik. Selalu setia pada nilai-nilai batiniah mereka." },
    { title: "ENFJ (The Protagonist)", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", desc: "Pemimpin yang karismatik dan inspiratif. Mampu memotivasi orang lain menuju visi bersama." },
    { title: "ENFP (The Campaigner)", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", desc: "Jiwa bebas yang antusias dan kreatif. Selalu menemukan alasan untuk tersenyum dalam segala situasi." },

    // Sentinels (Blue)
    { title: "ISTJ (The Logistician)", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", desc: "Individu yang praktis dan mengutamakan fakta. Sangat bisa diandalkan dan menjunjung tinggi tradisi." },
    { title: "ISFJ (The Defender)", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", desc: "Pelindung yang sangat berdedikasi dan hangat. Selalu siap membela orang-orang yang mereka cintai." },
    { title: "ESTJ (The Executive)", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", desc: "Administrator yang tak tertandingi. Sangat ahli dalam mengelola hal-hal dan orang-orang secara tertib." },
    { title: "ESFJ (The Consul)", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", desc: "Orang yang sangat peduli dan sosial. Berfokus pada menciptakan harmoni di lingkungan mereka." },

    // Explorers (Yellow)
    { title: "ISTP (The Virtuoso)", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "Eksperimen yang berani dan praktis. Ahli dalam menggunakan segala jenis alat dan teknik." },
    { title: "ISFP (The Adventurer)", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "Artis yang fleksibel dan menawan. Selalu siap untuk menjelajahi dan mencoba hal-hal baru." },
    { title: "ESTP (The Entrepreneur)", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "Orang yang cerdas, energik, dan sangat perseptif. Menikmati hidup di tepi jurang bahaya." },
    { title: "ESFP (The Entertainer)", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "Orang yang spontan, energik, dan antusias. Membuat hidup terasa seperti pesta yang tak berakhir." }
  ];

  const categories = [
    { id: 'DIMENSI', label: 'Sistem Dimensi', icon: <Brain className="w-4 h-4" /> },
    { id: 'BAKAT', label: 'Katalog Bakat', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'ARKETIPE', label: 'Daftar Arketipe', icon: <Users className="w-4 h-4" /> },
    { id: 'HUKUM', label: 'Hukum Semesta', icon: <Shield className="w-4 h-4" /> }
  ];

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-rpg-black text-white p-4 md:p-6 pb-32 pt-24 md:pt-8">
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
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-jiwa">
                {currentCategory?.icon}
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Kategori</p>
                <p className="text-lg font-black italic text-white tracking-tight">{currentCategory?.label}</p>
              </div>
            </div>
            <ChevronDown className={cn("w-6 h-6 text-neutral-500 transition-transform duration-300", isDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 5, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-2 p-2 bg-rpg-black border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden"
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
                      activeCategory === cat.id ? "bg-white text-black" : "text-neutral-400 hover:bg-white/5"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", activeCategory === cat.id ? "bg-black/10" : "bg-white/5")}>
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
                          {React.cloneElement(dim.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                        </div>
                        <h3 className={cn("text-xl font-black italic", dim.color)}>{dim.name}</h3>
                      </div>
                      <p className="text-neutral-300 leading-relaxed font-medium">{dim.desc}</p>
                    </div>
                    <div className="pt-6 border-t border-white/5 mt-auto">
                      <p className="text-[10px] font-black text-jiwa uppercase tracking-[0.3em] mb-3">Contoh Aktivitas</p>
                      <p className="text-base italic text-neutral-300 leading-relaxed font-medium">{dim.examples}</p>
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
                    <p className="text-[10px] font-black text-jiwa uppercase tracking-[0.5em]">Misi Arutha</p>
                    <h3 className="text-2xl md:text-3xl font-black italic text-white leading-tight">
                      "Membantumu menjadi versi terbaik dari dirimu sendiri melalui disiplin yang menyenangkan."
                    </h3>
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
                      'border-white/5'
                    )}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                          t.rarity === 'Legendary' ? 'bg-amber-500 text-black' :
                          t.rarity === 'Epic' ? 'bg-purple-500 text-white' :
                          t.rarity === 'Rare' ? 'bg-blue-500 text-white' :
                          t.rarity === 'Uncommon' ? 'bg-green-500 text-white' :
                          'bg-neutral-800 text-neutral-400'
                        )}>
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <span className={cn(
                          "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm border",
                          t.rarity === 'Legendary' ? 'bg-amber-500 text-black border-amber-400' :
                          t.rarity === 'Epic' ? 'bg-purple-500 text-white border-purple-400' :
                          t.rarity === 'Rare' ? 'bg-blue-500 text-white border-blue-400' :
                          t.rarity === 'Uncommon' ? 'bg-green-500 text-white border-green-400' :
                          'bg-white/5 text-neutral-500 border-white/10'
                        )}>
                          {t.rarity}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white group-hover:text-jiwa transition-colors mb-2 tracking-tight">{t.name}</h4>
                      <p className="text-sm text-neutral-400 font-medium leading-relaxed">{t.desc}</p>
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
                    <p className="text-sm text-neutral-300 leading-relaxed font-medium">{arch.desc}</p>
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
                    "glass-panel p-8 flex flex-col gap-6 group hover:bg-white/[0.02] transition-all h-full border border-white/5",
                    i === 0 && "md:col-span-2 bg-gradient-to-r from-jiwa/10 to-transparent"
                  )}>
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      {rule.icon}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-black italic text-white leading-tight">{rule.title}</h3>
                      <p className="text-base text-neutral-400 leading-relaxed font-medium">{rule.desc}</p>
                    </div>
                  </div>
                ))}

                <div className="p-8 bg-gradient-to-r from-jiwa/10 to-ilmu/10 rounded-3xl border border-white/5 text-center mt-12">
                  <p className="text-xs font-black text-neutral-500 uppercase tracking-[0.3em] mb-4">Misi Arutha</p>
                  <p className="text-base italic text-neutral-300">
                    "Membantumu menjadi versi terbaik dari dirimu sendiri melalui disiplin yang menyenangkan."
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};
