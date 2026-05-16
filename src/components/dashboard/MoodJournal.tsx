import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Smile, Frown, Meh, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';

interface MoodEntry {
  id: string;
  mood: number; // 1-5
  note: string;
  date: string;
  created_at: string;
}

interface MoodJournalProps {
  userId: string;
}

const MOODS = [
  { val: 1, emoji: '😔', label: 'Berat', color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  { val: 2, emoji: '😕', label: 'Lesu',  color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { val: 3, emoji: '😐', label: 'Biasa', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { val: 4, emoji: '😊', label: 'Baik',  color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  { val: 5, emoji: '🤩', label: 'Luar Biasa', color: 'text-jiwa',  bg: 'bg-jiwa/10',       border: 'border-jiwa/30' },
];

function getMoodConfig(val: number) {
  return MOODS.find(m => m.val === val) ?? MOODS[2];
}

export const MoodJournal: React.FC<MoodJournalProps> = ({ userId }) => {
  const theme = useStore(state => state.theme);
  const isLight = theme === 'DIVINE';

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [todayDone, setTodayDone] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('arutha_mood_journal')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(7);

      if (error) throw error;

      if (data) {
        setEntries(data);
        setTodayDone(data.some((e: any) => e.date === today));
      }
    } catch (_) {
      // Fallback to localStorage if error or table missing
      const cached = JSON.parse(localStorage.getItem(`arutha_mood_${userId}`) || '[]');
      setEntries(cached.slice(0, 7));
      setTodayDone(cached.some((e: MoodEntry) => e.date === today));
    } finally {
      setIsLoading(false);
    }
  }, [userId, today]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!selectedMood || isSubmitting) return;
    setIsSubmitting(true);

    const entry = {
      user_id: userId,
      mood: selectedMood,
      note: note.trim(),
      date: today,
    };

    try {
      const { data, error } = await supabase
        .from('arutha_mood_journal')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setEntries(prev => [data as MoodEntry, ...prev].slice(0, 7));
      }
    } catch (_) {
      // Fallback to localStorage
      const localEntry: MoodEntry = {
        id: crypto.randomUUID(),
        mood: selectedMood,
        note: note.trim(),
        date: today,
        created_at: new Date().toISOString()
      };
      const cached = JSON.parse(localStorage.getItem(`arutha_mood_${userId}`) || '[]');
      cached.unshift(localEntry);
      localStorage.setItem(`arutha_mood_${userId}`, JSON.stringify(cached.slice(0, 30)));
      setEntries(prev => [localEntry, ...prev].slice(0, 7));
    }

    setTodayDone(true);
    setIsAdding(false);
    setSelectedMood(null);
    setNote('');
    setIsSubmitting(false);
  };

  const avgMood = entries.length > 0
    ? entries.reduce((s, e) => s + e.mood, 0) / entries.length
    : 0;

  const avgConfig = getMoodConfig(Math.round(avgMood));

  return (
    <section className={cn(
      "glass-panel p-6 border transition-all duration-500 space-y-4",
      isLight ? "bg-white border-neutral-200 shadow-xl" : "bg-rpg-card border-rpg-border/30"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-ilmu" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rpg-text/60">Mood Journal</h3>
        </div>
        {!todayDone && !isAdding && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ilmu/10 border border-ilmu/20 rounded-xl text-ilmu text-[10px] font-black hover:bg-ilmu/20 transition-all"
          >
            <Plus className="w-3 h-3" />
            Catat Hari Ini
          </motion.button>
        )}
      </div>

      {/* Weekly average pill */}
      {entries.length > 0 && (
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border', avgConfig.bg, avgConfig.border)}>
          <span className="text-lg">{avgConfig.emoji}</span>
          <div>
            <p className={cn('text-[9px] font-black uppercase tracking-widest', avgConfig.color)}>Rata-rata 7 Hari</p>
            <p className="text-xs font-black text-rpg-text">{avgConfig.label}</p>
          </div>
          {/* Spark line */}
          <div className="ml-auto flex items-end gap-0.5 h-6">
            {entries.slice().reverse().map((e, i) => {
              const h = (e.mood / 5) * 24;
              const cfg = getMoodConfig(e.mood);
              return (
                <div key={i} title={`${e.date}: ${getMoodConfig(e.mood).label}`}
                  className={cn('w-2 rounded-sm opacity-70', cfg.bg.replace('/10', '/60'))}
                  style={{ height: `${h}px`, backgroundColor: 'currentColor' }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Add entry form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              <p className="text-xs font-black text-rpg-text/60 uppercase tracking-widest">Mood kamu hari ini?</p>
              <div className="flex justify-between gap-1">
                {MOODS.map(m => (
                  <button
                    key={m.val}
                    onClick={() => setSelectedMood(m.val)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-all border',
                      selectedMood === m.val 
                        ? cn(m.bg, m.border, 'scale-110') 
                        : isLight ? 'border-transparent hover:bg-neutral-100' : 'border-transparent hover:bg-white/5'
                    )}
                  >
                    <span className="text-xl">{m.emoji}</span>
                    <span className={cn('text-[8px] font-black uppercase', selectedMood === m.val ? m.color : 'text-rpg-text/40')}>{m.label}</span>
                  </button>
                ))}
              </div>

              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Catatan singkat (opsional)..."
                rows={2}
                maxLength={200}
                className={cn(
                  "w-full border rounded-xl px-3 py-2.5 text-xs text-rpg-text resize-none focus:outline-none transition-colors",
                  isLight 
                    ? "bg-neutral-50 border-neutral-200 placeholder-neutral-400 focus:border-ilmu" 
                    : "bg-rpg-black/50 border-rpg-border placeholder-rpg-text/30 focus:border-ilmu/50"
                )}
              />

              <div className="flex gap-2">
                <button onClick={() => { setIsAdding(false); setSelectedMood(null); setNote(''); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all border",
                    isLight 
                      ? "text-neutral-500 border-neutral-200 hover:bg-neutral-100" 
                      : "text-rpg-text/40 border-rpg-border hover:bg-rpg-border/10"
                  )}>
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedMood || isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-[10px] font-black bg-ilmu/20 text-ilmu border border-ilmu/30 hover:bg-ilmu/30 disabled:opacity-40 transition-all"
                >
                  {isSubmitting ? '...' : 'Simpan'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today done state */}
      {todayDone && !isAdding && (
        <div className={cn("flex items-center gap-2", isLight ? "text-green-600/80" : "text-green-400/60")}>
          <Star className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Sudah tercatat hari ini</span>
        </div>
      )}

      {/* Recent entries */}
      {!isLoading && entries.length > 0 && (
        <div className="space-y-2">
          {entries.slice(0, 3).map(e => {
            const cfg = getMoodConfig(e.mood);
            const date = new Date(e.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
            return (
              <div key={e.id} className={cn(
                "flex items-start gap-4 p-3 rounded-xl border transition-colors",
                isLight ? "bg-neutral-50 border-neutral-200" : "bg-rpg-border/5 border-rpg-border/30"
              )}>
                <span className="text-xl shrink-0 mt-0.5">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn('text-[10px] font-black uppercase tracking-widest', cfg.color)}>{cfg.label}</span>
                    <span className="text-[9px] font-bold text-rpg-text/30 uppercase">{date}</span>
                  </div>
                  {e.note && <p className={cn("text-[11px] leading-relaxed font-medium", isLight ? "text-neutral-600" : "text-rpg-text/80")}>{e.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-6 bg-rpg-border/10 rounded-lg animate-pulse" />)}
        </div>
      )}
    </section>
  );
};
