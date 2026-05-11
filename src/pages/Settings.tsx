import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Trash2, LogOut, Mail, AlertTriangle, CheckCircle, ArrowLeft, Loader2, Info, Brain, Dumbbell, Coins, BookOpen, Users, Sparkles, Flame, Target, Zap, ChevronDown, X, Book, Palette
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

interface SettingsProps {
  userId: string;
  initialName: string;
  email: string;
  nameChangeCount: number;
  lastNameChange: string | null;
  onUpdateName: (newName: string) => Promise<void>;
  onLogout: () => void;
  onBack: () => void;
  setPage: (page: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  userId, initialName, email, nameChangeCount, lastNameChange, onUpdateName, onLogout, onBack, setPage
}) => {
  const { theme, setTheme } = useStore();
  const [name, setName] = useState(initialName);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Sync with prop if it changes externally
  React.useEffect(() => {
    setName(initialName);
  }, [initialName]);

  // Cooldown calculation
  const getCooldown = () => {
    if (nameChangeCount < 3 || !lastNameChange) return 0;
    const lastDate = new Date(lastNameChange);
    if (isNaN(lastDate.getTime())) return 0;
    
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffDays = diffMs / (1000 * 3600 * 24);
    
    if (diffDays < 3) {
      return Math.ceil(3 - diffDays);
    }
    return 0;
  };
  const cooldownDays = getCooldown();
  const isLocked = cooldownDays > 0;

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleUpdateProfile = async () => {
    if (name === initialName) return;
    setIsUpdatingName(true);
    try {
      await onUpdateName(name);
      setMessage({ type: 'success', text: 'Nama berhasil diperbarui!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui nama.' });
    } finally {
      setIsUpdatingName(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };


  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== email) return;
    setIsDeleting(true);
    try {
      // Hapus semua data terkait user dari setiap tabel
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) throw new Error('User tidak ditemukan');

      // 1. Hapus data dependen terlebih dahulu
      await supabase.from('chat_logs').delete().eq('user_id', userId);
      await supabase.from('stat_history').delete().eq('user_id', userId);
      await supabase.from('character_profile').delete().eq('user_id', userId);
      await supabase.from('arutha_mail').delete().eq('user_id', userId);

      // 2. Hapus profil utama
      const { error } = await supabase.from('arutha_user').delete().eq('supabase_id', uid);
      if (error) throw error;

      // 3. Sign out
      await supabase.auth.signOut();
      onLogout();
    } catch (error: any) {
      alert("Gagal menghapus akun: " + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-rpg-black text-rpg-text pb-32 pt-24 md:pt-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-10">
          <button onClick={onBack} className="p-3 bg-rpg-border/5 border border-rpg-border rounded-2xl hover:bg-rpg-border/10 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-rpg-text">Settings</h1>
            <p className="text-sm text-rpg-text/70">Kelola akun dan preferensi aplikasi Anda.</p>
          </div>
        </header>

        {/* Global Feedback Message */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={cn(
                "p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold shadow-lg mb-8",
                message.type === 'success' ? "bg-jiwa/10 border-jiwa/20 text-jiwa" : "bg-red-500/10 border-red-500/20 text-red-500"
              )}
            >
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          
          {/* LEFT COLUMN: Account & Preferences */}
          <div className="space-y-8">
            {/* Account Section */}
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rpg-text/60 flex items-center gap-2 px-2">
                <User className="w-4 h-4" /> Account Profile
              </h3>
              <div className="glass-panel p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-xs font-bold text-rpg-text/60 uppercase">Display Name</label>
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={isLocked ? 'locked' : 'available'}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md", 
                          isLocked ? "text-red-500 bg-red-500/10" : "text-jiwa bg-jiwa/10")}
                      >
                        {isLocked ? `COOLDOWN: ${cooldownDays} HARI` : `${Math.max(0, 3 - nameChangeCount)} SISA PERUBAHAN`}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      disabled={isLocked}
                      placeholder={isLocked ? "Nama terkunci..." : "Masukkan nama baru"}
                      className="flex-1 bg-rpg-border/5 border border-rpg-border rounded-xl px-4 py-3 text-base outline-none focus:border-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingName || name === initialName || isLocked}
                      className="px-6 py-3 bg-rpg-primary text-rpg-primary-text font-black text-sm rounded-xl hover:scale-105 disabled:opacity-50 transition-all shrink-0 sm:w-auto w-full"
                    >
                      {isUpdatingName ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAVE'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {isLocked && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] text-red-400/60 font-medium ml-1"
                      >
                        Fitur ganti nama sedang dikunci. Anda dapat mengganti nama kembali dalam <span className="font-black text-red-500">{cooldownDays} hari</span>.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-rpg-text/60 uppercase ml-1">Email Address</label>
                  <div className="flex items-center gap-3 bg-rpg-border/5 border border-rpg-border rounded-xl px-4 py-3 opacity-80">
                    <Mail className="w-5 h-5 text-rpg-text/60" />
                    <span className="text-base text-rpg-text font-medium">{email}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rpg-text/60 flex items-center gap-2 px-2">
                <Bell className="w-4 h-4" /> Preferences
              </h3>
              <div className="glass-panel p-6 space-y-4">
                <ToggleItem label="Push Notifications" desc="Pengingat quest harian di HP." defaultChecked />
                <ToggleItem label="Sound Effects" desc="Efek suara saat quest selesai." defaultChecked />
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Visual Identity */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rpg-text/60 flex items-center gap-2 px-2">
                <Palette className="w-4 h-4" /> Gaya Visual (Semesta)
              </h3>
              <div className="glass-panel p-6 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'VOID', name: 'Void Dark', desc: 'RPG Klasik', color: 'bg-black border-zinc-800 text-zinc-100', activeBorder: 'border-jiwa' },
                    { id: 'DIVINE', name: 'Divine Light', desc: 'Kesan Suci', color: 'bg-white border-amber-200 text-zinc-900', activeBorder: 'border-amber-500' },
                    { id: 'CYBER', name: 'Cyber Neon', desc: 'Futuristik', color: 'bg-[#0a0a0a] border-cyan-900/50 text-cyan-400', activeBorder: 'border-cyan-400' },
                    { id: 'EMERALD', name: 'Emerald Forest', desc: 'Mistik Alam', color: 'bg-[#020a06] border-emerald-900/50 text-emerald-400', activeBorder: 'border-emerald-500' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={cn(
                        "p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group flex items-center justify-between",
                        theme === t.id ? cn("ring-4 ring-opacity-20", t.activeBorder, theme === 'VOID' ? 'ring-jiwa/20' : theme === 'DIVINE' ? 'ring-amber-500/20' : theme === 'CYBER' ? 'ring-cyan-400/20' : 'ring-emerald-500/20') : "border-rpg-border/30 hover:border-rpg-text/20",
                        t.color
                      )}
                    >
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t.id}</p>
                        <p className="text-sm font-black italic leading-tight">{t.name}</p>
                        <p className="text-[9px] opacity-60 mt-1 uppercase font-bold tracking-widest">{t.desc}</p>
                      </div>
                      
                      {theme === t.id ? (
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2", t.activeBorder)}>
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-current opacity-10" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="p-4 bg-rpg-border/5 rounded-xl border border-rpg-border/50">
                  <p className="text-[10px] text-rpg-text/60 italic text-center leading-relaxed">
                    "Warna semesta mencerminkan kondisi jiwamu. Pilih aura yang paling beresonansi denganmu."
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Danger Zone - Spans Full Width at Bottom */}
        <div className="mt-12 pt-12 border-t border-rpg-border/50">
          <section className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2 px-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={onLogout}
                className="flex items-center gap-4 p-6 bg-rpg-card border border-rpg-border rounded-[24px] hover:bg-red-500/5 hover:border-red-500/20 transition-all group"
              >
                <div className="p-4 bg-rpg-border/5 text-rpg-text/40 group-hover:text-red-500 transition-colors rounded-2xl">
                  <LogOut className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="block text-base font-black uppercase tracking-widest">Logout</span>
                  <span className="text-[10px] font-bold text-rpg-text/40">Keluar dari dimensi Arutha saat ini.</span>
                </div>
              </button>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-4 p-6 bg-red-500/5 border border-red-500/10 rounded-[24px] hover:bg-red-500/10 hover:border-red-500/30 transition-all group"
              >
                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="block text-base font-black text-red-500 uppercase tracking-widest">Hapus Akun</span>
                  <span className="text-[10px] font-bold text-red-500/60">Tindakan permanen, data pahlawan akan musnah.</span>
                </div>
              </button>
            </div>
          </section>
        </div>

      {/* Mobile Info Bottom Sheet */}
      <AnimatePresence>
        {showInfoModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-rpg-card border-t border-rpg-border rounded-t-[32px] max-h-[85vh] flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-rpg-border/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-jiwa/10 rounded-xl">
                    <Info className="w-5 h-5 text-jiwa" />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-widest text-rpg-text/80">Informasi</h3>
                </div>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="p-2 bg-rpg-border/5 rounded-full hover:bg-rpg-border/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto hide-scrollbar">
                <div className="space-y-6 py-4">
                  <div className="glass-panel p-6 border-jiwa/20 bg-jiwa/5">
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Semua informasi aplikasi, panduan bermain, dan penjelasan 5 Dimensi kini telah dipindahkan ke <span className="text-jiwa font-bold">Arutha Codex</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowInfoModal(false);
                      setPage('CODEX');
                    }}
                    className="w-full py-5 bg-rpg-primary text-rpg-primary-text rounded-2xl font-black italic tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(var(--rpg-primary-rgb),0.2)] flex items-center justify-center gap-3"
                  >
                    <Book className="w-5 h-5" />
                    BUKA CODEX
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-panel p-8 text-center space-y-6 border-red-500/20 shadow-2xl shadow-red-500/10"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-rpg-text">Hapus Akun Anda?</h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Tindakan ini **permanen**. Seluruh level, XP, dan riwayat quest Anda akan dihapus dan tidak bisa dikembalikan.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Ketik email Anda untuk mengonfirmasi: <br/>
                  <span className="text-rpg-text font-mono mt-1 block">{email}</span>
                </p>
                <input 
                  type="text" 
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="Ketik email Anda di sini..."
                  className="w-full bg-rpg-black border border-red-500/20 rounded-xl px-4 py-3 text-center text-sm outline-none focus:border-red-500 transition-all"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-rpg-border/5 border border-rpg-border rounded-xl text-sm font-black hover:bg-rpg-border/10 transition-all"
                >
                  BATAL
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== email}
                  className="flex-1 py-4 bg-red-600 text-rpg-text rounded-xl text-sm font-black hover:bg-red-700 transition-all disabled:opacity-20 shadow-lg shadow-red-600/20"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'HAPUS PERMANEN'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
};

const ToggleItem = ({ label, desc, defaultChecked }: { label: string, desc: string, defaultChecked?: boolean }) => {
  const [enabled, setEnabled] = useState(defaultChecked || false);
  return (
    <div className="flex items-center justify-between p-2">
      <div className="space-y-0.5">
        <p className="text-base font-bold text-rpg-text">{label}</p>
        <p className="text-xs text-rpg-text/60">{desc}</p>
      </div>
      <button 
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "w-12 h-6 rounded-full p-1 transition-all duration-300 relative",
          enabled ? "bg-jiwa shadow-[0_0_10px_rgba(167,139,250,0.4)]" : "bg-rpg-border/10"
        )}
      >
        <div className={cn(
          "w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
          enabled ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  );
};


