import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Bell, Trash2, LogOut, Mail, AlertTriangle, CheckCircle, ArrowLeft, Loader2, Info, Brain, Dumbbell, Coins, BookOpen, Users, Sparkles, Flame, Target, Zap, ChevronDown, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface SettingsProps {
  userId: string;
  initialName: string;
  email: string;
  nameChangeCount: number;
  lastNameChange: string | null;
  onUpdateName: (newName: string) => Promise<void>;
  onLogout: () => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  userId, initialName, email, nameChangeCount, lastNameChange, onUpdateName, onLogout, onBack 
}) => {
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
      // Logic hapus data di DB lewat RPC atau manual jika diperlukan
      // Untuk demo, kita langsung delete user via supabase (memerlukan service role atau lewat API kita)
      // Disini kita trigger logout dulu sebagai simulasi atau panggil API penghapusan
      alert("Permintaan penghapusan akun dikirim. Seluruh data Anda akan dihapus.");
      onLogout();
    } catch (error) {
      alert("Gagal menghapus akun.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-rpg-black text-white pb-32 pt-24 md:pt-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center gap-4 mb-10">
          <button onClick={onBack} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Settings</h1>
            <p className="text-sm text-neutral-500">Kelola akun dan preferensi aplikasi Anda.</p>
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
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2 px-2">
                <User className="w-4 h-4" /> Account Profile
              </h3>
              <div className="glass-panel p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-xs font-bold text-neutral-400 uppercase">Display Name</label>
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
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base outline-none focus:border-white/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingName || name === initialName || isLocked}
                      className="px-6 py-3 bg-white text-black font-black text-sm rounded-xl hover:scale-105 disabled:opacity-50 transition-all shrink-0 sm:w-auto w-full"
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
                  <label className="text-xs font-bold text-neutral-400 uppercase ml-1">Email Address</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 opacity-60">
                    <Mail className="w-5 h-5 text-neutral-500" />
                    <span className="text-base text-neutral-300 font-medium">{email}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2 px-2">
                <Bell className="w-4 h-4" /> Preferences
              </h3>
              <div className="glass-panel p-6 space-y-4">
                <ToggleItem label="Push Notifications" desc="Pengingat quest harian di HP." defaultChecked />
                <ToggleItem label="Sound Effects" desc="Efek suara saat quest selesai." defaultChecked />
              </div>
            </section>

            {/* Mobile Only: Info Button */}
            <button
              onClick={() => setShowInfoModal(true)}
              className="lg:hidden flex items-center justify-between w-full p-5 glass-panel border border-white/10 rounded-2xl hover:bg-white/5 transition-all group mt-4"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-jiwa/10 rounded-xl">
                  <Info className="w-5 h-5 text-jiwa" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-neutral-200">Informasi Aplikasi</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Panduan & penjelasan 5 Dimensi</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-neutral-500 group-hover:text-neutral-200 transition-colors" />
            </button>

            {/* Danger Zone */}
            <section className="space-y-4 pt-10 border-t border-white/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2 px-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-red-500/10 hover:border-red-500/20 transition-all group"
                >
                  <div className="p-3 bg-white/5 text-neutral-400 group-hover:text-red-500 transition-colors rounded-xl">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="text-base font-black">Logout</span>
                </button>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl hover:bg-red-500/20 hover:border-red-500/40 transition-all group"
                >
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="text-base font-black text-red-500">Hapus Akun</span>
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Informasi Aplikasi - Desktop only */}
          <div className="hidden lg:block space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2 px-2">
              <Info className="w-4 h-4" /> Informasi Aplikasi
            </h3>
            <AppInfoContent />
          </div>

        </div>
        {/* end grid */}

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
              className="fixed bottom-0 left-0 right-0 z-[101] bg-rpg-card border-t border-white/10 rounded-t-[32px] max-h-[85vh] flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-jiwa/10 rounded-xl">
                    <Info className="w-5 h-5 text-jiwa" />
                  </div>
                  <h3 className="text-base font-black uppercase tracking-widest text-neutral-200">Informasi</h3>
                </div>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto hide-scrollbar">
                <AppInfoContent />
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
                <h2 className="text-2xl font-black text-white">Hapus Akun Anda?</h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Tindakan ini **permanen**. Seluruh level, XP, dan riwayat quest Anda akan dihapus dan tidak bisa dikembalikan.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Ketik email Anda untuk mengonfirmasi: <br/>
                  <span className="text-white font-mono mt-1 block">{email}</span>
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
                  className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl text-sm font-black hover:bg-white/10 transition-all"
                >
                  BATAL
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== email}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl text-sm font-black hover:bg-red-700 transition-all disabled:opacity-20 shadow-lg shadow-red-600/20"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'HAPUS PERMANEN'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToggleItem = ({ label, desc, defaultChecked }: { label: string, desc: string, defaultChecked?: boolean }) => {
  const [enabled, setEnabled] = useState(defaultChecked || false);
  return (
    <div className="flex items-center justify-between p-2">
      <div className="space-y-0.5">
        <p className="text-base font-bold text-white">{label}</p>
        <p className="text-xs text-neutral-500">{desc}</p>
      </div>
      <button 
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "w-12 h-6 rounded-full p-1 transition-all duration-300 relative",
          enabled ? "bg-jiwa shadow-[0_0_10px_rgba(167,139,250,0.4)]" : "bg-white/10"
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

const AppInfoContent = () => {
  return (
    <div className="glass-panel p-6 md:p-8 space-y-8">
      {/* Intro */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-jiwa/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-jiwa" />
          </div>
          <h4 className="text-base font-black text-neutral-200">Apa itu Arutha?</h4>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Arutha adalah platform pengembangan diri berbasis RPG yang didukung oleh kecerdasan buatan (AI). 
          Setiap hari, Anda akan menerima <span className="text-neutral-200 font-bold">misi harian</span> yang disesuaikan secara personal 
          berdasarkan profil psikologis, usia, dan kebutuhan Anda. Selesaikan misi untuk menaikkan statistik dimensi dan naik level!
        </p>
      </div>

      {/* Cara Bermain */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-harta/10 rounded-xl">
            <Target className="w-5 h-5 text-harta" />
          </div>
          <h4 className="text-base font-black text-neutral-200">Cara Bermain</h4>
        </div>
        <div className="space-y-2 text-sm text-neutral-400">
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
            <span className="text-xs font-black text-jiwa bg-jiwa/10 px-2 py-1 rounded-lg shrink-0">1</span>
            <p>Buka Dashboard dan lihat <span className="text-neutral-200 font-bold">Misi Harian</span> yang telah disiapkan AI khusus untuk Anda.</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
            <span className="text-xs font-black text-jiwa bg-jiwa/10 px-2 py-1 rounded-lg shrink-0">2</span>
            <p>Kerjakan misi di dunia nyata, lalu tekan <span className="text-neutral-200 font-bold">"Buktikan Quest"</span> dan tuliskan bukti/catatan Anda.</p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
            <span className="text-xs font-black text-jiwa bg-jiwa/10 px-2 py-1 rounded-lg shrink-0">3</span>
            <p>AI akan <span className="text-neutral-200 font-bold">memverifikasi</span> jawaban Anda. Jika lolos, Anda mendapatkan XP dan statistik dimensi meningkat!</p>
          </div>
        </div>
      </div>

      {/* 5 Dimensi */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-ilmu/10 rounded-xl">
            <Zap className="w-5 h-5 text-ilmu" />
          </div>
          <h4 className="text-base font-black text-neutral-200">5 Dimensi Kehidupan</h4>
        </div>
        <div className="grid gap-3">
          {[
            { icon: <Brain className="w-4 h-4" />, name: 'JIWA', desc: 'Mentalitas & Ketenangan — Mengukur kesehatan mental, ketenangan batin, dan kecerdasan emosional Anda.', color: 'text-jiwa', bg: 'bg-jiwa/10' },
            { icon: <Dumbbell className="w-4 h-4" />, name: 'RAGA', desc: 'Vitalitas & Kekuatan Fisik — Mengukur aktivitas fisik, kesehatan tubuh, dan konsistensi olahraga Anda.', color: 'text-raga', bg: 'bg-raga/10' },
            { icon: <Coins className="w-4 h-4" />, name: 'HARTA', desc: 'Keuangan & Strategi Aset — Mengukur literasi keuangan, kebiasaan menabung, dan pengelolaan uang Anda.', color: 'text-harta', bg: 'bg-harta/10' },
            { icon: <BookOpen className="w-4 h-4" />, name: 'ILMU', desc: 'Kecerdasan & Literasi — Mengukur kebiasaan belajar, rasa ingin tahu, dan pengembangan pengetahuan Anda.', color: 'text-ilmu', bg: 'bg-ilmu/10' },
            { icon: <Users className="w-4 h-4" />, name: 'KARMA', desc: 'Sosial & Dampak Komunitas — Mengukur hubungan sosial, empati, dan kontribusi Anda terhadap lingkungan sekitar.', color: 'text-karma', bg: 'bg-karma/10' },
          ].map(dim => (
            <div key={dim.name} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div className={cn('p-2 rounded-lg shrink-0', dim.bg, dim.color)}>
                {dim.icon}
              </div>
              <div>
                <h5 className={cn('text-sm font-black tracking-widest', dim.color)}>{dim.name}</h5>
                <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">{dim.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fitur Utama */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-raga/10 rounded-xl">
            <Flame className="w-5 h-5 text-raga" />
          </div>
          <h4 className="text-base font-black text-neutral-200">Fitur Utama</h4>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <Shield className="w-4 h-4 text-jiwa shrink-0" />
            <p className="text-neutral-400"><span className="text-neutral-200 font-bold">Verifikasi AI</span> — Setiap bukti quest diverifikasi oleh AI untuk menjaga integritas progres Anda.</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <Flame className="w-4 h-4 text-harta shrink-0" />
            <p className="text-neutral-400"><span className="text-neutral-200 font-bold">Streak System</span> — Selesaikan quest setiap hari untuk membangun streak dan bonus XP.</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <Sparkles className="w-4 h-4 text-ilmu shrink-0" />
            <p className="text-neutral-400"><span className="text-neutral-200 font-bold">Oracle AI</span> — Setiap hari Anda menerima pesan motivasi yang dipersonalisasi oleh AI.</p>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="pt-4 border-t border-white/5 text-center">
        <p className="text-[10px] font-black tracking-[0.3em] text-neutral-600 uppercase">Arutha v1.0.0 · By AruThTale</p>
      </div>
    </div>
  );
};
