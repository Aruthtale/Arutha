import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail as MailIcon, ArrowLeft, Megaphone, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export const Mail = ({ userId, onBack }: { userId: string, onBack: () => void }) => {
  const [mails, setMails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadMailCount, setLastMailSeenAt } = useStore();

  useEffect(() => {
    cleanupOldMails();
    fetchMails();
  }, []);

  // Auto-delete mail yang sudah lebih dari 3 hari
  const cleanupOldMails = async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    await supabase
      .from('arutha_mail')
      .delete()
      .lt('created_at', threeDaysAgo.toISOString());
  };

  const fetchMails = async () => {
    setLoading(true);

    // Ambil tanggal registrasi user untuk filter
    const { data: userData } = await supabase
      .from('arutha_user')
      .select('created_at')
      .eq('id', userId)
      .single();

    const userCreatedAt = userData?.created_at;

    // Query mail: hanya yang dikirim SETELAH user mendaftar
    let query = supabase
      .from('arutha_mail')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    // Filter: akun baru tidak bisa lihat mail lama
    if (userCreatedAt) {
      query = query.gte('created_at', userCreatedAt);
    }

    const { data, error } = await query;

    if (data && !error) {
      setMails(data);
      
      // Otomatis tandai semua pesan personal sebagai terbaca
      const unreadPersonal = data.filter(m => m.user_id && !m.is_read);
      if (unreadPersonal.length > 0) {
        const ids = unreadPersonal.map(m => m.id);
        await supabase
          .from('arutha_mail')
          .update({ is_read: true })
          .in('id', ids);
        
        setMails(prev => prev.map(m => m.user_id ? { ...m, is_read: true } : m));
      }

      // Simpan timestamp "terakhir buka Kotak Surat"
      const now = new Date().toISOString();
      localStorage.setItem(`arutha_mail_seen_${userId}`, now);
      setLastMailSeenAt(now);
      setUnreadMailCount(0);
    }
    setLoading(false);
  };

  // Hitung sisa waktu sebelum mail expired
  const getTimeLeft = (createdAt: string) => {
    const expiry = new Date(createdAt);
    expiry.setDate(expiry.getDate() + 3);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return 'Kedaluwarsa';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours >= 24) return `${Math.floor(hours / 24)} hari lagi`;
    return `${hours} jam lagi`;
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen pb-32">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase">Kotak Surat</h1>
            <p className="text-jiwa text-sm tracking-widest uppercase font-bold mt-1">Pesan dari Semesta</p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-neutral-500 py-20 animate-pulse font-bold tracking-widest">MEMUAT PESAN...</div>
      ) : mails.length === 0 ? (
        <div className="text-center text-neutral-500 py-20 glass-panel rounded-3xl border border-white/5">
          <MailIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-bold tracking-widest uppercase">Kotak Surat Kosong</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {mails.map((mail, idx) => {
              const isGlobal = !mail.user_id;
              return (
                <motion.div
                  key={mail.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-6 rounded-3xl border transition-all relative overflow-hidden group",
                    isGlobal 
                      ? "bg-gradient-to-br from-amber-500/10 to-rpg-card border-amber-500/20" 
                      : "bg-rpg-card/50 border-white/5"
                  )}
                >
                  {isGlobal && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />
                  )}
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={cn(
                      "p-3 rounded-2xl shrink-0 shadow-inner",
                      isGlobal ? "bg-amber-500/20 text-amber-500 border border-amber-500/20" : 
                      "bg-jiwa/10 text-jiwa border border-jiwa/20"
                    )}>
                      {isGlobal ? <Megaphone className="w-6 h-6" /> : <MailIcon className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-1">
                        <h3 className="font-black italic tracking-wider text-white text-lg">
                          {isGlobal ? "PENGUMUMAN GLOBAL" : "PESAN PRIBADI"}
                        </h3>
                        <span className="text-xs text-neutral-500 font-mono">
                          {new Date(mail.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-neutral-300 leading-relaxed">{mail.message}</p>
                      <div className="flex items-center gap-1.5 mt-3 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        <span>Kedaluwarsa {getTimeLeft(mail.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
