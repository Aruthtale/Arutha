import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { MAJOR_ARCANA } from '../../lib/tarotData';
import { supabase } from '../../lib/supabase';
import { generateWithFallback } from '../../lib/gemini';
import { cn } from '../../lib/utils';

interface DailyTarotWidgetProps {
  userId: string;
  stats: { JIWA: number; RAGA: number; HARTA: number; ILMU: number; KARMA: number };
  username: string;
}

const STORAGE_KEY_PREFIX = 'arutha_tarot_';

export const DailyTarotWidget: React.FC<DailyTarotWidgetProps> = ({ userId, stats, username }) => {
  const [card, setCard] = useState<typeof MAJOR_ARCANA[0] | null>(null);
  const [interpretation, setInterpretation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];
  const cacheKey = `${STORAGE_KEY_PREFIX}${userId}_${todayKey}`;

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setCard(MAJOR_ARCANA.find(c => c.id === parsed.cardId) ?? null);
        setInterpretation(parsed.interpretation);
        setIsFlipped(true);
        setHasDrawn(true);
      } catch (_) {}
    }
  }, [cacheKey]);

  const drawCard = useCallback(async () => {
    if (hasDrawn || isLoading) return;
    setIsLoading(true);

    const seed = parseInt(userId.replace(/\D/g, '').slice(0, 6) || '0') + new Date().getDate();
    const drawn = MAJOR_ARCANA[seed % MAJOR_ARCANA.length];
    setCard(drawn);

    try {
      const aiPrompt = `Kamu adalah oracle Arutha, penjaga ramalan dimensi RPG kehidupan.
Hari ini ${username} menarik kartu tarot: "${drawn.name}" — maknanya: "${drawn.meaning}"

Stats dimensi mereka:
- JIWA (Spiritual): ${stats.JIWA}%
- RAGA (Fisik): ${stats.RAGA}%  
- HARTA (Materi): ${stats.HARTA}%
- ILMU (Pengetahuan): ${stats.ILMU}%
- KARMA (Sosial): ${stats.KARMA}%

Berikan interpretasi 2-3 kalimat dalam bahasa Indonesia yang:
1. Menghubungkan makna kartu dengan dimensi terkuat/terlemah mereka
2. Memberi inspirasi untuk hari ini
3. Terasa mistis namun aplikatif, bukan klise
Langsung mulai kalimat tanpa pembuka atau nama kartu.`;

      // Build cache key for AI response
      const aiCacheKey = `tarot_interp_${drawn.id}_${todayKey}_${userId.slice(0, 8)}`;
      const ai = await generateWithFallback(aiPrompt, aiCacheKey, 24);
      setInterpretation(ai as string);

      localStorage.setItem(cacheKey, JSON.stringify({ cardId: drawn.id, interpretation: ai }));
    } catch (_) {
      const fallback = `${drawn.meaning} Biarkan energi ${drawn.name} membimbingmu hari ini — perhatikan tanda-tanda di sekitarmu.`;
      setInterpretation(fallback);
      localStorage.setItem(cacheKey, JSON.stringify({ cardId: drawn.id, interpretation: fallback }));
    }

    setIsLoading(false);
    setHasDrawn(true);
    setTimeout(() => setIsFlipped(true), 200);
  }, [userId, username, stats, hasDrawn, isLoading, cacheKey, todayKey]);

  return (
    <section className="glass-panel p-6 bg-gradient-to-br from-rpg-card via-jiwa/5 to-rpg-black border border-jiwa/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.08),transparent_60%)] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-jiwa animate-pulse" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-jiwa">Ramalan Hari Ini</h3>
        </div>

        {!hasDrawn ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={drawCard}
            disabled={isLoading}
            className="w-full py-8 rounded-2xl border-2 border-dashed border-jiwa/30 text-jiwa hover:border-jiwa/60 hover:bg-jiwa/5 transition-all flex flex-col items-center gap-3 group"
          >
            {isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <div className="text-3xl group-hover:scale-110 transition-transform">🃏</div>
                <span className="text-xs font-black tracking-widest uppercase opacity-70 group-hover:opacity-100">Tarik Kartu Hari Ini</span>
              </>
            )}
          </motion.button>
        ) : (
          <AnimatePresence>
            {card && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex gap-4 items-start">
                  {/* Card image */}
                  <div className="relative shrink-0 w-16 h-24 rounded-xl overflow-hidden border border-jiwa/30 shadow-lg shadow-jiwa/20">
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black tracking-[0.2em] text-jiwa/50 uppercase">Oracle Speaks</span>
                    </div>
                    <h4 className="text-base font-black text-rpg-text tracking-tight">{card.name}</h4>
                    <p className="text-[11px] text-rpg-text/40 font-bold uppercase tracking-tighter mt-0.5">{card.meaning}</p>
                  </div>
                </div>

                {/* AI Interpretation */}
                {interpretation ? (
                  <div className="bg-jiwa/5 border border-jiwa/10 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Sparkles className="w-6 h-6 text-jiwa" />
                    </div>
                    <p className="text-[12px] leading-[1.8] text-rpg-text/90 font-medium relative z-10">
                      "{interpretation}"
                    </p>
                  </div>
                ) : (
                  <div className="h-12 bg-jiwa/5 rounded-xl animate-pulse" />
                )}

                <p className="text-[9px] text-rpg-text/30 font-bold uppercase tracking-widest text-center">
                  Ramalan baru tersedia besok
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};
