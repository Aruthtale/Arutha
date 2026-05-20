import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ArrowRight,
  TrendingUp,
  Heart,
  Shield,
  Users,
  Sparkles,
  Lock,
  Scan,
  BookOpen,
  Activity,
  Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Session } from '@supabase/supabase-js';
import { Leaderboard } from './Leaderboard';

interface LandingProps {
  session: Session | null;
  hasProfile: boolean;
  setPage: (page: any) => void;
}

export const Landing: React.FC<LandingProps> = ({ session, hasProfile, setPage }) => {
  const leaderboardRef = React.useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [activeObject, setActiveObject] = React.useState(0);
  const objects = [
    { icon: <BookOpen className="w-16 h-16" />, label: 'Knowledge' },
    { icon: <Activity className="w-16 h-16" />, label: 'Vitality' },
    { icon: <Camera className="w-16 h-16" />, label: 'Proof' },
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveObject((prev) => (prev + 1) % objects.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToLeaderboard = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCtaClick = () => {
    if (!session) {
      setPage('REGISTER');
    } else if (hasProfile) {
      setPage('DASHBOARD');
    } else {
      setPage('ONBOARDING');
    }
  };
  return (
    <div className="min-h-screen bg-rpg-black selection:bg-jiwa/30 font-sans text-rpg-text">
      <div className="noise-overlay" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        
        {/* THE SOUL ORB - Aesthetic Anchor */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 90, 180, 270, 360],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="relative w-[90vw] h-[90vw] max-w-[900px] max-h-[900px]"
          >
            {/* Core Glow */}
            <div className="absolute inset-0 bg-jiwa/10 blur-[150px] rounded-full animate-pulse" />
            {/* Rotating Particles */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-ilmu rounded-full blur-sm shadow-[0_0_30px_#60A5FA]" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-raga rounded-full blur-sm shadow-[0_0_20px_#4ADE80]" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 mb-10"
        >
          <img 
            src="/Arutha.png" 
            alt="Arutha Logo" 
            className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-[2.5rem] shadow-[0_0_80px_rgba(167,139,250,0.2)] border border-rpg-border/50" 
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-6xl mx-auto px-4"
        >
          <h1 className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[14rem] font-serif font-black tracking-tighter leading-[0.8] mb-6 select-none uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            Arutha
          </h1>
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-serif italic text-rpg-text/60 mb-10 tracking-tight leading-tight">
            Your Life, <span className="text-rpg-text underline decoration-jiwa/50 decoration-2 md:decoration-4 underline-offset-[4px] md:underline-offset-[10px]">Legendary.</span>
          </h2>

          <div className="max-w-2xl mx-auto space-y-6 mb-12">
            <p className="text-lg sm:text-xl md:text-2xl text-rpg-text/60 font-light leading-relaxed italic font-serif px-2">
              "The only game truly worth playing is <span className="text-rpg-text/90 font-medium border-b border-rpg-border/50">your own life.</span>"
            </p>
            <div className="flex items-center justify-center gap-4 opacity-50">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white/30" />
              <span className="text-[10px] font-black tracking-[0.5em] uppercase">Soul Sync Enabled</span>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white/30" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8">
            <button
              onClick={handleCtaClick}
              className="w-full sm:w-auto px-10 md:px-16 py-4 md:py-6 bg-rpg-primary text-rpg-primary-text font-black rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group shadow-[0_0_60px_rgba(255,255,255,0.15)] text-sm md:text-base"
            >
              {(session && hasProfile) ? 'KE DASHBOARD' : 'MULAI PETUALANGAN'} 
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={scrollToLeaderboard}
              className="group relative py-2"
            >
              <span className="text-[10px] md:text-sm font-black tracking-[0.3em] md:tracking-[0.4em] uppercase text-rpg-text/40 group-hover:text-rpg-text transition-colors">
                Global Ranking
              </span>
              <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-rpg-text group-hover:w-full transition-all duration-300" />
            </button>
          </div>
        </motion.div>

        {/* Floating Stat Hints */}
        <div className="absolute bottom-20 left-10 hidden lg:block text-left opacity-40 hover:opacity-100 transition-opacity">
          <div className="text-[10px] font-black text-jiwa uppercase tracking-widest mb-1 font-sans">Dimensi 01</div>
          <div className="text-3xl font-serif italic text-rpg-text">Soul Alignment</div>
        </div>
        <div className="absolute top-40 right-20 hidden lg:block text-right opacity-40 hover:opacity-100 transition-opacity">
          <div className="text-[10px] font-black text-harta uppercase tracking-widest mb-1 font-sans">Dimensi 03</div>
          <div className="text-3xl font-serif italic text-rpg-text">Wealth Strategy</div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-rpg-text/20 flex flex-col items-center gap-3"
        >
          <div className="w-[1px] h-16 bg-gradient-to-b from-rpg-border to-transparent" />
        </motion.div>
      </section>

      {/* Asymmetric Info Section */}
      <section className="max-w-7xl mx-auto px-6 py-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 space-y-10"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold leading-none">
              Melihat <br />
              <span className="text-rpg-text/40 italic text-3xl sm:text-4xl md:text-5xl">Yang Tak Terlihat.</span>
            </h2>
            <p className="text-xl md:text-2xl text-rpg-text/80 leading-relaxed font-medium font-sans">
              Kami membagi hidupmu menjadi 5 dimensi teknis. AI kami menganalisis pola harianmu dan memberikan quest yang relevan untuk menaikkan stat ini secara organik.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'JIWA', color: 'text-jiwa', border: 'border-jiwa/20', bg: 'bg-jiwa/5', desc: 'Mental Clarity' },
                { name: 'RAGA', color: 'text-raga', border: 'border-raga/20', bg: 'bg-raga/5', desc: 'Physical Power' },
                { name: 'HARTA', color: 'text-harta', border: 'border-harta/20', bg: 'bg-harta/5', desc: 'Financial Logic' },
                { name: 'ILMU', color: 'text-ilmu', border: 'border-ilmu/20', bg: 'bg-ilmu/5', desc: 'Knowledge' },
                { name: 'KARMA', color: 'text-karma', border: 'border-karma/20', bg: 'bg-karma/5', desc: 'Social Impact' },
              ].map((d, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={cn("p-6 rounded-2xl border backdrop-blur-md transition-all group relative overflow-hidden", d.border, d.bg)}
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                     <Sparkles className={cn("w-4 h-4", d.color)} />
                  </div>
                  <div className={cn("text-xs font-black tracking-[0.3em] mb-2 font-sans", d.color)}>{d.name}</div>
                  <div className="text-rpg-text text-lg font-serif italic">{d.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="lg:col-span-7 relative">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              className="relative aspect-square glass-panel border-rpg-border/50 overflow-hidden group rounded-[3rem]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-jiwa/5 via-transparent to-ilmu/5" />
              
              {/* HUD Accents */}
              <div className="absolute top-8 left-8 border-l border-t border-rpg-border/50 w-8 h-8" />
              <div className="absolute bottom-8 right-8 border-r border-b border-rpg-border/50 w-8 h-8" />
              
              <div className="absolute inset-0 p-8 md:p-16 flex items-center justify-center">
                {isMounted && (
                  <RadarChart width={280} height={280} cx="50%" cy="50%" outerRadius="80%" data={[
                    { subject: 'JIWA', A: 85 }, { subject: 'RAGA', A: 70 }, { subject: 'HARTA', A: 50 }, { subject: 'ILMU', A: 95 }, { subject: 'KARMA', A: 65 },
                  ]}>
                    <PolarGrid stroke="#333" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontWeight: '900', letterSpacing: '0.2em' }} />
                    <Radar name="Status" dataKey="A" stroke="var(--rpg-primary)" fill="var(--rpg-primary)" fillOpacity={0.1} strokeWidth={2} />
                  </RadarChart>
                )}
              </div>

              {/* Phase Badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
                <h3 className="text-9xl font-serif font-black uppercase tracking-tighter">RPG</h3>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 bg-neutral-900 border border-rpg-border/50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl backdrop-blur-2xl z-20"
            >
              <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-jiwa animate-ping" />
                <span className="text-[8px] md:text-[10px] font-black text-neutral-500 tracking-[0.4em] uppercase">System Status</span>
              </div>
              <div className="text-[8px] md:text-[10px] font-black text-neutral-400 mb-1 uppercase tracking-widest">Current Phase</div>
              <div className="text-2xl md:text-4xl font-serif font-bold italic text-rpg-text flex items-center gap-2 md:gap-3">
                Ascension <span className="text-jiwa">I</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Section - Asymmetric Bento */}
      <section className="max-w-7xl mx-auto px-6 py-40 space-y-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold leading-none">
            Senjata Untuk <br />
            <span className="text-neutral-400 italic text-3xl sm:text-4xl md:text-5xl">Pemenang Hidup.</span>
          </h2>
          <p className="max-w-md text-base md:text-lg text-neutral-300 font-medium leading-relaxed font-sans">
            Setiap fitur dirancang untuk membangun kebiasaan yang tidak hanya membuatmu produktif, tapi juga berkuasa atas takdirmu.
          </p>
        </div>

        {/* NEW SECTION: THE AI SYNERGY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-ilmu/10 border border-ilmu/20 rounded-full">
              <Zap className="w-4 h-4 text-ilmu" />
              <span className="text-[10px] font-black tracking-widest text-ilmu uppercase">The Arbiter</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-serif font-bold italic text-rpg-text leading-tight">
              AI Powered <br />Character Growth.
            </h3>
            <p className="text-lg text-neutral-400 leading-relaxed">
              The Arbiter tidak hanya memberikan quest, ia mempelajari kebiasaanmu. Mengubah setiap tindakan nyata—mulai dari menabung hingga olahraga—menjadi Experience Points yang meningkatkan status dimensimu.
            </p>
            <ul className="space-y-4">
              {['Personalized Quest Generation', 'Zodiac-Based Identity Scaling', 'Real-Life Proof Verification'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-neutral-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-ilmu shadow-[0_0_10px_#3B82F6]" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-jiwa/10 border border-jiwa/20 rounded-full">
              <Heart className="w-4 h-4 text-jiwa" />
              <h3 className="font-black italic tracking-wider text-rpg-text text-lg">Soul Guard</h3>
            </div>
            <h3 className="text-4xl md:text-5xl font-serif font-bold italic text-rpg-text leading-tight">
              A Sanctuary for <br />Your Inner Peace.
            </h3>
            <p className="text-lg text-neutral-400 leading-relaxed">
              Di Arutha, ambisi tidak boleh menghancurkan jiwa. Soul Guard adalah pendamping emosionalmu, mendeteksi tanda-tanda stres dan memberikan "Recovery Missions" untuk mencegah burnout.
            </p>
            <ul className="space-y-4">
              {['Emotional State Detection', 'Zero-Burnout Policy', 'Empathetic AI Consultation'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-neutral-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-jiwa shadow-[0_0_10px_#A855F7]" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-2 gap-6 min-h-fit lg:min-h-[800px]">
          <motion.div whileHover={{ y: -10 }} className="lg:col-span-8 lg:row-span-1 glass-panel p-8 md:p-12 bg-gradient-to-br from-white/5 to-transparent flex flex-col justify-between min-h-[300px]">
            <TrendingUp className="w-12 h-12 text-raga" />
            <div>
              <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-rpg-text">Daily Quest AI</h3>
              <p className="text-neutral-400 max-w-md text-lg md:text-xl font-sans font-medium leading-tight">Misi harian yang di-generate berdasarkan profil psikologismu. Bukan sekadar to-do list, tapi jalan menuju evolusi nyata.</p>
            </div>
          </motion.div>
          
          <motion.div whileHover={{ y: -10 }} className="lg:col-span-4 lg:row-span-1 glass-panel p-8 md:p-12 bg-jiwa/5 border-rpg-border/50 flex flex-col justify-end min-h-[300px]">
            <Heart className="w-10 h-10 text-jiwa mb-8" />
            <h3 className="text-xl md:text-2xl font-bold mb-2 uppercase tracking-tighter font-sans text-rpg-text">Mind Check</h3>
            <p className="text-neutral-400 text-sm md:text-base font-sans font-medium">Kami memonitor kesehatan mentalmu di balik setiap pencapaian materi.</p>
          </motion.div>
          
          <motion.div whileHover={{ y: -10 }} className="lg:col-span-4 lg:row-span-1 glass-panel p-8 md:p-12 bg-harta/5 border-harta/10 flex flex-col justify-end min-h-[300px]">
            <Shield className="w-10 h-10 text-harta mb-8" />
            <h3 className="text-xl md:text-2xl font-bold mb-2 uppercase tracking-tighter font-sans">Anti-P2W</h3>
            <p className="text-neutral-500 text-sm font-sans">Kemajuan diukur dari disiplin harian dan pembuktian aksi, bukan saldo bank.</p>
          </motion.div>
          
          <motion.div whileHover={{ y: -10 }} className="lg:col-span-8 lg:row-span-1 glass-panel p-8 md:p-12 bg-gradient-to-tr from-jiwa/10 to-transparent flex flex-col md:flex-row gap-12 items-center min-h-[350px] relative overflow-hidden group">
            {/* The Scanner Animation */}
            <div className="relative w-48 h-48 flex-shrink-0">
              <div className="absolute inset-0 border-2 border-jiwa/20 rounded-3xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeObject}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.2, y: -10 }}
                    className="flex flex-col items-center gap-4 text-jiwa/40"
                  >
                    <motion.div
                      animate={{ rotateY: [0, 360] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      {objects[activeObject].icon}
                    </motion.div>
                    <span className="text-[10px] font-black tracking-widest uppercase">{objects[activeObject].label}...</span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Scanning Line */}
              <motion.div
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-jiwa to-transparent shadow-[0_0_15px_#A855F7] z-10"
              />
              
              {/* Corner HUD Accents */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-jiwa/40" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-jiwa/40" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="px-3 py-1 bg-jiwa/20 border border-jiwa/30 rounded-full flex items-center gap-2">
                  <Scan className="w-3 h-3 text-jiwa" />
                  <span className="text-[10px] font-black text-jiwa uppercase tracking-widest">Reality Verified</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-500">
                  <Lock className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Zero-Storage</span>
                </div>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-rpg-text">The Arbiter's Proof</h3>
              <p className="text-neutral-400 max-w-md text-base md:text-lg font-sans leading-relaxed">
                Buktikan aksimu melalui pindaian AI. Kami menganalisis bukti visual dan konteks aktivitasmu secara ephemeral untuk memastikan setiap XP didapat dari usaha nyata.
              </p>
            </div>

            {/* Decorative Background HUD */}
            <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:opacity-10 transition-opacity">
               <Scan className="w-64 h-64 text-jiwa" />
            </div>
          </motion.div>
        </div>

        {/* Global Leaderboard Preview */}
        <div ref={leaderboardRef} className="scroll-mt-40">
          <div className="text-center mb-20 space-y-4">
             <div className="text-[10px] font-black text-jiwa tracking-[0.5em] uppercase font-sans">The Pantheon</div>
             <h2 className="text-6xl font-serif font-bold italic">Top Players</h2>
          </div>
          <Leaderboard isPreview={true} onJoin={() => setPage('REGISTER')} />
        </div>

        <div className="relative py-40 flex flex-col items-center">
           <div className="absolute inset-0 bg-jiwa/5 blur-[150px] rounded-full" />
           <h2 className="text-5xl md:text-8xl font-serif font-bold mb-12 text-center leading-none z-10">
             Tulis Ulang <br />
             <span className="italic text-neutral-500">Takdirmu.</span>
           </h2>
           <button onClick={handleCtaClick} className="relative z-10 px-16 py-6 bg-rpg-primary text-rpg-primary-text font-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-2xl font-sans">
             MULAILAH SEKARANG
           </button>
        </div>
      </section>

      <footer className="py-20 border-t border-rpg-border/50 text-center">
        <p className="text-[10px] font-black tracking-[0.5em] text-neutral-700 uppercase font-sans">© 2026 Aruthtale Studios</p>
      </footer>
    </div>
  );
};
