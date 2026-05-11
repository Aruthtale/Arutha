import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, Star, ArrowLeft, Loader2, Sparkles, Zap, Brain, Dumbbell, Coins, BookOpen, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, getDimensionColor } from '../lib/utils';

interface LeaderboardEntry {
  id: string;
  profileId: string;
  name: string;
  level: number;
  xp: number;
  jiwa: number;
  raga: number;
  harta: number;
  ilmu: number;
  karma: number;
  avatar_url?: string;
}

interface LeaderboardProps {
  currentUserId?: string;
  onBack?: () => void;
  isPreview?: boolean;
  onJoin?: () => void;
}

type SortCategory = 'OVERALL' | 'JIWA' | 'RAGA' | 'HARTA' | 'ILMU' | 'KARMA';

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserId, onBack, isPreview = false, onJoin }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<SortCategory>('OVERALL');

  useEffect(() => {
    fetchLeaderboard();
  }, [category]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('arutha_user')
        .select(`
          id, username, level, xp,
          character_profile(jiwa, raga, harta, ilmu, karma, id, created_at)
        `)
        .order(category === 'OVERALL' ? 'level' : 'id', { ascending: false });

      if (category === 'OVERALL') {
        query = query.order('xp', { ascending: false });
      }

      const { data, error } = await query.limit(isPreview ? 3 : 50);

      if (error) throw error;

      // Map and filter users who have at least one profile
      const formatted = data
        .filter((user: any) => user.character_profile && user.character_profile.length > 0)
        .map((user: any) => {
          // Get the latest profile (in case there are multiple)
          const latestProfile = [...user.character_profile].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          return {
            id: user.id,
            profileId: latestProfile.id,
            name: user.username,
            avatar_url: undefined,
            level: user.level,
            xp: user.xp,
            jiwa: latestProfile.jiwa || 0,
            raga: latestProfile.raga || 0,
            harta: latestProfile.harta || 0,
            ilmu: latestProfile.ilmu || 0,
            karma: latestProfile.karma || 0
          };
        });

      // If sorting by dimension, we need to re-sort after getting latest profile
      if (category !== 'OVERALL') {
        formatted.sort((a: any, b: any) => (b[category.toLowerCase()] || 0) - (a[category.toLowerCase()] || 0));
      }

      setEntries(formatted.slice(0, isPreview ? 3 : 20));
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories: { id: SortCategory; label: string; icon: any; color: string }[] = [
    { id: 'OVERALL', label: 'Overall', icon: Trophy, color: 'text-white' },
    { id: 'JIWA', label: 'Jiwa', icon: Brain, color: 'text-jiwa' },
    { id: 'RAGA', label: 'Raga', icon: Dumbbell, color: 'text-raga' },
    { id: 'HARTA', label: 'Harta', icon: Coins, color: 'text-harta' },
    { id: 'ILMU', label: 'Ilmu', icon: BookOpen, color: 'text-ilmu' },
    { id: 'KARMA', label: 'Karma', icon: Heart, color: 'text-karma' },
  ];

  const getRankIcon = (index: number) => {
    if (index === 0) return (
      <div className="relative">
        <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400/40 animate-pulse" />
        <div className="absolute inset-0 blur-lg bg-yellow-400/20" />
      </div>
    );
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300 fill-slate-300/20" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600 fill-amber-600/20" />;
    return <span className="text-xs font-black text-neutral-600 group-hover:text-neutral-400 transition-colors">#{index + 1}</span>;
  };

  return (
    <div className={cn(
      "text-white",
      isPreview ? "py-10" : "min-h-screen bg-rpg-black pb-32 pt-24 md:pt-20"
    )}>
      {/* Background Decor */}
      {!isPreview && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-jiwa/5 blur-[120px] rounded-full -mr-40 -mt-40" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-ilmu/5 blur-[120px] rounded-full -ml-40 -mb-40" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
        {!isPreview && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
              <button onClick={onBack} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">Hall of Fame</h1>
                <p className="text-[10px] font-black tracking-[0.4em] text-neutral-500 uppercase mt-2">Pahlawan Terpilih Arutha</p>
              </div>
              <div className="w-11" /> {/* Spacer */}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2",
                    category === cat.id
                      ? "bg-white/10 border-white/20 shadow-xl"
                      : "bg-white/5 border-white/5 opacity-50 hover:opacity-100"
                  )}
                >
                  <cat.icon className={cn("w-5 h-5", cat.color)} />
                  <span className="text-[8px] font-black tracking-widest uppercase">{cat.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {isPreview && (
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">Leaderboard </h2>
            <p className="text-[9px] font-black tracking-[0.3em] text-neutral-500 uppercase mt-2">Mereka yang konsisten melampaui batas</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-jiwa" />
              <p className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">Membuka Gulungan Takdir...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.profileId || `${entry.id}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "glass-panel p-5 flex items-center gap-5 border-l-4 group transition-all relative overflow-hidden",
                    entry.id === currentUserId ? "border-jiwa bg-jiwa/5" : "border-transparent",
                    index === 0 && "border-yellow-400 bg-yellow-400/[0.03] shadow-[0_20px_50px_rgba(250,204,21,0.05)] scale-[1.03]",
                    index === 1 && "border-slate-300 bg-slate-300/[0.03] scale-[1.02]",
                    index === 2 && "border-amber-600 bg-amber-600/[0.03] scale-[1.01]"
                  )}
                >
                  {/* Highlight Glow for Top 1 */}
                  {index === 0 && (
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-400/[0.05] to-transparent pointer-events-none" />
                  )}

                  <div className="w-10 flex items-center justify-center shrink-0 z-10">
                    {getRankIcon(index)}
                  </div>

                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-white/5 border flex items-center justify-center overflow-hidden shrink-0 transition-all z-10",
                    index === 0 ? "border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]" : 
                    index === 1 ? "border-slate-300/50" :
                    index === 2 ? "border-amber-600/50" : "border-white/10 group-hover:border-jiwa/30"
                  )}>
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className={cn(
                        "w-5 h-5",
                        index === 0 ? "text-yellow-400" : 
                        index === 1 ? "text-slate-300" :
                        index === 2 ? "text-amber-600" : "text-neutral-700"
                      )} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-black italic text-lg truncate flex items-center gap-2">
                      {entry.name}
                      {entry.id === currentUserId && (
                        <span className="px-2 py-0.5 bg-jiwa text-black text-[8px] font-black rounded-full uppercase not-italic">YOU</span>
                      )}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Level {entry.level}</span>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-harta" />
                        <span className="text-[10px] font-black text-neutral-400">{entry.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-4">
                    {category !== 'OVERALL' && (
                      <div className="text-right">
                        <span className={cn("text-xl font-black italic", categories.find(c => c.id === category)?.color)}>
                          {entry[category.toLowerCase() as keyof LeaderboardEntry]}%
                        </span>
                      </div>
                    )}
                    <div className="w-px h-10 bg-white/5" />
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-neutral-600 uppercase tracking-[0.2em]">Rank</span>
                      <span className="text-lg font-black font-mono">#{index + 1}</span>
                    </div>
                  </div>

                  {/* Mobile specific category stat */}
                  <div className="sm:hidden text-right">
                    {category !== 'OVERALL' ? (
                      <span className={cn("text-lg font-black italic", categories.find(c => c.id === category)?.color)}>
                        {entry[category.toLowerCase() as keyof LeaderboardEntry]}%
                      </span>
                    ) : (
                      <span className="text-lg font-black">#{index + 1}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer Note */}
        {!isPreview ? (
          <div className="mt-12 p-8 border-2 border-dashed border-white/5 rounded-[32px] text-center opacity-40">
            <p className="text-[10px] font-black tracking-widest uppercase leading-loose">
              "Takhta ini hanya untuk mereka yang konsisten menaklukkan <br /> dimensi diri setiap hari."
            </p>
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-6">
            <p className="text-[10px] font-black tracking-widest uppercase opacity-30 italic">
              Dan ratusan pahlawan lainnya...
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onJoin}
              className="px-10 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
            >
              Lihat Seluruh Peringkat
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
