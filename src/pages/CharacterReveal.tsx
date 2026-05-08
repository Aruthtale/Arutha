import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { type CharacterAnalysis } from '../lib/gemini';

interface CharacterRevealProps {
  analysis: CharacterAnalysis;
  onContinue: () => void;
}

export const CharacterReveal: React.FC<CharacterRevealProps> = ({ analysis, onContinue }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState(0);
  // Phase 0: Personality type reveal
  // Phase 1: Stats radar chart
  // Phase 2: Character summary + starter quest

  useEffect(() => {
    setIsMounted(true);
    const timers = [
      setTimeout(() => setPhase(1), 2500),
      setTimeout(() => setPhase(2), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const chartData = [
    { subject: 'Jiwa', A: analysis.stats.JIWA, fullMark: 100 },
    { subject: 'Raga', A: analysis.stats.RAGA, fullMark: 100 },
    { subject: 'Harta', A: analysis.stats.HARTA, fullMark: 100 },
    { subject: 'Ilmu', A: analysis.stats.ILMU, fullMark: 100 },
    { subject: 'Karma', A: analysis.stats.KARMA, fullMark: 100 },
  ];

  const statColors: Record<string, string> = {
    JIWA: 'text-jiwa',
    RAGA: 'text-raga',
    HARTA: 'text-harta',
    ILMU: 'text-ilmu',
    KARMA: 'text-karma',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-rpg-black relative overflow-hidden pt-24">
      {/* Background effects */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute w-[600px] h-[600px] bg-jiwa/30 blur-[180px] rounded-full"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute w-[500px] h-[500px] bg-ilmu/20 blur-[150px] rounded-full translate-x-32"
      />

      <div className="relative z-10 max-w-2xl w-full space-y-12">
        {/* Phase 0: Personality Type */}
        <AnimatePresence>
          {phase >= 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-jiwa" />
                <span className="text-[8px] md:text-[10px] font-black tracking-[0.4em] text-neutral-500 uppercase">Karakter Terdeteksi</span>
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-ilmu" />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl md:text-8xl font-black tracking-tighter bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent italic"
              >
                {analysis.personality_type}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-lg md:text-2xl font-medium text-neutral-400"
              >
                {analysis.personality_title}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="text-xs md:text-sm text-neutral-600 max-w-xs md:max-w-md mx-auto"
              >
                {analysis.personality_desc}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 1: Stats Chart */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-panel p-6 md:p-8 bg-gradient-to-b from-rpg-card/80 to-rpg-black/40 min-h-[350px] md:min-h-[400px]"
            >
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 text-center mb-4">
                Distribusi Stat Awal
              </h3>
              <div className="w-full relative block min-h-[250px]">
                {isMounted && (
                  <ResponsiveContainer width="100%" aspect={1} minWidth={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#888', fontSize: 11, fontWeight: 'bold' }} 
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Player"
                      dataKey="A"
                      stroke="#A78BFA"
                      fill="#A78BFA"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                )}
              </div>
              
              {/* Stat Bars */}
              <div className="grid grid-cols-5 gap-2 md:gap-3 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-rpg-border">
                {Object.entries(analysis.stats).map(([key, value]) => (
                  <div key={key} className="text-center space-y-1">
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className={cn("text-lg md:text-2xl font-black", statColors[key])}
                    >
                      {value}
                    </motion.span>
                    <p className="text-[8px] md:text-[10px] font-mono font-bold text-neutral-600 tracking-wider">{key}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: Summary + Quest + CTA */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 md:space-y-8"
            >
              {/* Character Summary */}
              <div className="glass-panel p-6 md:p-8 border-l-4 border-l-jiwa">
                <p className="text-base md:text-xl leading-relaxed text-neutral-300 italic">
                  "{analysis.character_summary}"
                </p>
              </div>

              {/* Starter Quest */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "glass-panel p-5 md:p-6 border-l-4",
                  analysis.starter_quest.stat === 'JIWA' && "border-l-jiwa",
                  analysis.starter_quest.stat === 'RAGA' && "border-l-raga",
                  analysis.starter_quest.stat === 'HARTA' && "border-l-harta",
                  analysis.starter_quest.stat === 'ILMU' && "border-l-ilmu",
                  analysis.starter_quest.stat === 'KARMA' && "border-l-karma",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3 h-3 md:w-4 md:h-4 text-harta" />
                  <span className="text-[8px] md:text-[10px] font-black tracking-[0.2em] text-neutral-500 uppercase">Quest Pertamamu</span>
                </div>
                <h4 className="text-base md:text-lg font-bold mb-1">{analysis.starter_quest.title}</h4>
                <p className="text-xs md:text-sm text-neutral-400">{analysis.starter_quest.desc}</p>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center pt-2 md:pt-4"
              >
                <button
                  onClick={onContinue}
                  className="w-full sm:w-auto px-10 py-4 md:px-12 md:py-5 bg-white text-black font-black rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group shadow-[0_0_40px_rgba(255,255,255,0.25)] text-xs md:text-sm"
                >
                  MULAI PETUALANGAN
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
