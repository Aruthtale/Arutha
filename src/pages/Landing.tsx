import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  Heart, 
  Shield, 
  Users 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Session } from '@supabase/supabase-js';

interface LandingProps {
  session: Session | null;
  setPage: (page: any) => void;
}

export const Landing: React.FC<LandingProps> = ({ session, setPage }) => {
  return (
    <div className="min-h-screen bg-rpg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1] 
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-jiwa/20 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1] 
            }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/4 w-[45vw] h-[45vw] bg-raga/20 blur-[150px] rounded-full"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 mb-8 bg-gradient-to-tr from-jiwa to-ilmu rounded-[28px] rotate-12 flex items-center justify-center shadow-2xl shadow-jiwa/20 relative z-10"
        >
          <Zap className="w-10 h-10 text-white fill-white" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10"
        >
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent italic">
            ARUTHA
          </h1>
          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-neutral-400 font-light leading-relaxed mb-12">
            "Satu-satunya permainan yang benar-benar berharga adalah <span className="text-white font-medium">hidupmu sendiri.</span>"
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-4 relative z-10"
        >
          <button
            onClick={() => setPage(session ? 'DASHBOARD' : 'REGISTER')}
            className="px-12 py-5 bg-white text-black font-black rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            {session ? 'KE DASHBOARD' : 'MULAI PETUALANGAN'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-12 py-5 bg-rpg-card border border-rpg-border text-white font-bold rounded-full hover:bg-neutral-800 transition-all">
            LIHAT LEADERBOARD
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-neutral-600 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] font-black tracking-[0.3em] uppercase">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-neutral-600 to-transparent" />
        </motion.div>
      </section>

      {/* Grid Preview Section */}
      <section className="max-w-7xl mx-auto px-6 py-32 space-y-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-jiwa/10 border border-jiwa/20 text-jiwa text-xs font-black tracking-widest uppercase">
              The 5 Dimensions
            </div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              Visualisasi <br /> <span className="text-neutral-500">Potensi Dirimu.</span>
            </h2>
            <p className="text-lg text-neutral-400 leading-relaxed max-w-md">
              Kami membagi hidupmu menjadi 5 dimensi teknis. AI kami menganalisis pola harianmu dan memberikan quest yang relevan untuk menaikkan stat ini secara organik.
            </p>
            <div className="space-y-4 pt-4">
              {[
                { name: 'JIWA', color: 'text-jiwa', desc: 'Mentalitas & Ketenangan' },
                { name: 'RAGA', color: 'text-raga', desc: 'Vitalitas & Kekuatan Fisik' },
                { name: 'HARTA', color: 'text-harta', desc: 'Keuangan & Strategi Aset' },
                { name: 'ILMU', color: 'text-ilmu', desc: 'Kecerdasan & Literasi' },
                { name: 'KARMA', color: 'text-karma', desc: 'Sosial & Dampak Komunitas' },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-default">
                  <div className={cn("w-2 h-2 rounded-full", d.color.replace('text', 'bg'))} />
                  <span className={cn("font-black tracking-tighter w-20 transition-all group-hover:pl-2", d.color)}>{d.name}</span>
                  <span className="text-sm text-neutral-600">— {d.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-jiwa/20 to-ilmu/20 blur-[100px] rounded-full opacity-50" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-10 relative z-10 border-white/10 shadow-2xl"
            >
              <div className="w-full h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'Jiwa', A: 80 },
                    { subject: 'Raga', A: 65 },
                    { subject: 'Harta', A: 45 },
                    { subject: 'Ilmu', A: 90 },
                    { subject: 'Karma', A: 60 },
                  ]}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                    <Radar
                      name="Typical Level 10 Player"
                      dataKey="A"
                      stroke="#A78BFA"
                      fill="#A78BFA"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 pt-8 border-t border-rpg-border flex justify-between items-center">
                 <div className="text-xs font-mono text-neutral-500">XP PROGRESSION</div>
                 <div className="flex gap-1">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={cn("w-8 h-1 rounded-full", i < 3 ? "bg-white" : "bg-rpg-border")} />
                   ))}
                 </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Feature Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel p-10 flex flex-col justify-end min-h-[300px] bg-gradient-to-br from-rpg-card to-raga/5 border-white/5">
             <TrendingUp className="w-12 h-12 text-raga mb-6" />
             <h3 className="text-3xl font-bold mb-4">Daily Quest AI</h3>
             <p className="text-neutral-400 max-w-md">Quest harian yang di-generate berdasarkan mood dan kondisi finansialmu hari ini. Bukan sekadar to-do list, tapi path menuju level up.</p>
          </div>
          <div className="glass-panel p-10 flex flex-col justify-end bg-gradient-to-br from-rpg-card to-jiwa/5 border-white/5">
             <Heart className="w-12 h-12 text-jiwa mb-6" />
             <h3 className="text-2xl font-bold mb-4">Mind Check</h3>
             <p className="text-neutral-400 text-sm italic">"Kami peduli pada apa yang tidak terlihat di character sheet."</p>
          </div>
          <div className="glass-panel p-10 flex flex-col justify-end bg-gradient-to-br from-rpg-card to-harta/5 border-white/5">
             <Shield className="w-12 h-12 text-harta mb-6" />
             <h3 className="text-2xl font-bold mb-4">Anti-Pay-to-Win</h3>
             <p className="text-neutral-400 text-sm">Harta diukur dari kemampuan mengelola, bukan seberapa banyak yang kamu miliki.</p>
          </div>
          <div className="md:col-span-2 glass-panel p-10 flex flex-col justify-end bg-gradient-to-br from-rpg-card to-ilmu/5 border-white/5">
             <Users className="w-12 h-12 text-ilmu mb-6" />
             <h3 className="text-3xl font-bold mb-4">Guild System</h3>
             <p className="text-neutral-400 max-w-md">Bergabung dengan "Guild" di kotamu. Selesaikan quest party bareng teman-teman nyata untuk bonus stat KARMA.</p>
          </div>
        </div>

        {/* Testimonial / Vision */}
        <div className="text-center py-20 px-6 glass-panel border-rpg-border/50 bg-white/5">
           <h2 className="text-4xl md:text-5xl font-bold mb-8 italic">"Jadikan realita sebagai taman bermainmu."</h2>
           <button 
             onClick={() => setPage('ONBOARDING')}
             className="text-white font-black underline underline-offset-8 hover:text-jiwa transition-colors"
            >
             MULAI ANALISIS PROFIL SEKARANG
           </button>
        </div>
      </section>

      <footer className="py-20 border-t border-rpg-border text-center text-neutral-600">
        <p className="text-xs font-mono tracking-widest uppercase">© 2026 Aruthtale</p>
      </footer>
    </div>
  );
};
