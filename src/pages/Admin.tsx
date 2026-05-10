import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, ShieldCheck, RefreshCw, Star, Trash2, ArrowLeft, Search, 
  ExternalLink, TrendingUp, AlertTriangle, ArrowUpCircle, Eye, X, Brain,
  Megaphone, Gift, RotateCcw, Send, Mail as MailIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface UserData {
  id: string;
  supabase_id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  name_change_count: number;
  last_name_change: string | null;
  usia: number | null;
  gender: string | null;
  created_at: string;
}

interface AdminProps {
  onBack: () => void;
}

export const Admin: React.FC<AdminProps> = ({ onBack }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Modal State
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'prompt' | 'alert';
    action: (val?: string) => void;
    variant: 'danger' | 'warning' | 'success' | 'info';
    placeholder?: string;
    inputType?: 'text' | 'number';
  } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('arutha_user')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const handleResetCooldown = async (userId: string) => {
    setActionLoading(userId + '-reset');
    const { error } = await supabase
      .from('arutha_user')
      .update({ last_name_change: null, name_change_count: 0 })
      .eq('supabase_id', userId);
    
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, last_name_change: null, name_change_count: 0 } : u));
    }
    setActionLoading(null);
  };

  const handleGiveReward = (userId: string, currentXp: number, currentLevel: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Berikan Reward XP',
      message: 'Masukkan jumlah XP yang ingin diberikan kepada pemain ini:',
      type: 'prompt',
      variant: 'success',
      placeholder: 'Contoh: 500',
      inputType: 'number',
      action: async (val?: string) => {
        const bonusXp = parseInt(val || '0');
        if (isNaN(bonusXp) || bonusXp <= 0) return;

        setActionLoading(userId + '-reward');
        let nextXp = currentXp + bonusXp;
        let nextLevel = currentLevel;

        while (nextXp >= nextLevel * 1000) {
          nextXp -= (nextLevel * 1000);
          nextLevel += 1;
        }

        const { error } = await supabase
          .from('arutha_user')
          .update({ xp: nextXp, level: nextLevel })
          .eq('supabase_id', userId);
        
        if (!error) {
          setUsers(prev => prev.map(u => u.supabase_id === userId ? { ...u, xp: nextXp, level: nextLevel } : u));
          setConfirmModal({
            isOpen: true, title: 'Berhasil', message: `Berhasil memberikan ${bonusXp} XP!`, type: 'alert', variant: 'success', action: () => {}
          });
        } else {
          setConfirmModal({
            isOpen: true, title: 'Gagal', message: error.message, type: 'alert', variant: 'danger', action: () => {}
          });
        }
        setActionLoading(null);
      }
    });
  };

  const handleResetLevel = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Level & XP',
      message: 'Yakin ingin mereset level dan XP user ini ke 1? Semua bakat akan terkunci kembali karena kehilangan level.',
      type: 'confirm',
      variant: 'danger',
      action: async () => {
        setActionLoading(userId + '-reset-lvl');
        const { error } = await supabase
          .from('arutha_user')
          .update({ level: 1, xp: 0 })
          .eq('supabase_id', userId);
        
        if (!error) {
          setUsers(prev => prev.map(u => u.supabase_id === userId ? { ...u, level: 1, xp: 0 } : u));
        }
        setActionLoading(null);
      }
    });
  };

  const handleLevelUp = async (userId: string, currentLevel: number) => {
    setActionLoading(userId + '-lvl');
    const { error } = await supabase
      .from('arutha_user')
      .update({ level: currentLevel + 1 })
      .eq('supabase_id', userId);
    
    if (!error) {
      setUsers(prev => prev.map(u => u.supabase_id === userId ? { ...u, level: currentLevel + 1 } : u));
    }
    setActionLoading(null);
  };

  const handleDeleteUser = (userId: string, supabaseId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus User Permanen',
      message: 'Yakin ingin menghapus data user ini secara permanen dari Arutha? (Catatan: Ini tidak akan menghapus akun Google mereka)',
      type: 'confirm',
      variant: 'danger',
      action: async () => {
        setActionLoading(userId + '-delete');
        
        await supabase.from('character_profile').delete().eq('user_id', userId);
        await supabase.from('stat_history').delete().eq('user_id', userId);
        
        const { data, error } = await supabase.from('arutha_user').delete().eq('supabase_id', supabaseId).select();
        
        if (error) {
          setConfirmModal({
            isOpen: true, title: 'Error', message: "Gagal menghapus user: " + error.message, type: 'alert', variant: 'danger', action: () => {}
          });
        } else if (!data || data.length === 0) {
          setConfirmModal({
            isOpen: true, title: 'Akses Ditolak', message: "Gagal: RLS (Row Level Security) Supabase memblokir tindakan ini. Anda bukan Service Role.", type: 'alert', variant: 'danger', action: () => {}
          });
        } else {
          setUsers(prev => prev.filter(u => u.id !== userId));
        }
        setActionLoading(null);
      }
    });
  };

  const handleViewProfile = async (user: UserData) => {
    setSelectedUser(user);
    setLoadingProfile(true);
    setUserProfile(null);
    const { data } = await supabase
      .from('character_profile')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data[0]) {
      setUserProfile(data[0]);
    }
    setLoadingProfile(false);
  };

  const handleSendMail = (userId: string, username: string) => {
    setConfirmModal({
      isOpen: true,
      title: `Kirim Pesan ke ${username}`,
      message: `Tulis pesan khusus/rahasia untuk ${username}:`,
      type: 'prompt',
      variant: 'info',
      placeholder: 'Tulis pesan...',
      inputType: 'text',
      action: async (val?: string) => {
        if (!val?.trim()) return;
        setActionLoading(userId + '-mail');
        const { error } = await supabase
          .from('arutha_mail')
          .insert([{ user_id: userId, message: val, is_read: false }]);
          
        if (error) {
          setConfirmModal({
            isOpen: true, title: 'Gagal', message: error.message, type: 'alert', variant: 'danger', action: () => {}
          });
        } else {
          setConfirmModal({
            isOpen: true, title: 'Terkirim', message: `Pesan berhasil dikirim ke ${username}!`, type: 'alert', variant: 'success', action: () => {}
          });
        }
        setActionLoading(null);
      }
    });
  };

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    setConfirmModal({
      isOpen: true,
      title: 'Pengumuman Global',
      message: 'Kirim pengumuman ini ke seluruh pengguna sekarang?',
      type: 'confirm',
      variant: 'warning',
      action: async () => {
        setIsBroadcasting(true);
        const { error } = await supabase
          .from('arutha_mail')
          .insert([{ user_id: null, message: broadcastMessage, is_read: false }]);
          
        if (error) {
          setConfirmModal({
            isOpen: true,
            title: 'Gagal',
            message: "Gagal mengirim pengumuman. Pastikan tabel 'arutha_mail' (id, user_id, message, is_read, created_at) sudah dibuat di Supabase. Error: " + error.message,
            type: 'alert',
            variant: 'danger',
            action: () => {}
          });
        } else {
          setConfirmModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Pengumuman berhasil dikirim ke Kotak Surat seluruh pengguna!',
            type: 'alert',
            variant: 'success',
            action: () => {}
          });
          setBroadcastMessage('');
        }
        setIsBroadcasting(false);
      }
    });
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-rpg-black text-white p-4 md:p-8 pb-32 pt-24 md:pt-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-rpg-card p-6 md:p-8 rounded-[32px] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-jiwa" />
                <h1 className="text-2xl font-black italic tracking-tight">Admin Sanctum</h1>
              </div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search players..."
                className="w-full pl-12 pr-4 py-3 bg-rpg-black/50 border border-white/5 rounded-2xl outline-none focus:border-jiwa/30 transition-all text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={fetchUsers} className="p-3 bg-jiwa/10 text-jiwa rounded-2xl hover:bg-jiwa/20 transition-all">
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
          </div>
        </header>

        {/* Global Broadcast */}
        <div className="bg-gradient-to-r from-jiwa/10 to-transparent border border-jiwa/20 p-6 rounded-[24px] space-y-4">
          <div className="flex items-center gap-2 text-jiwa">
            <Megaphone className="w-5 h-5" />
            <h2 className="text-lg font-black italic tracking-tight">Kirim Pengumuman Global</h2>
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <input 
              type="text" 
              placeholder="Tulis pesan pengumuman untuk Kotak Surat seluruh pemain..."
              className="flex-1 px-4 py-3 bg-rpg-black/50 border border-white/5 rounded-xl outline-none focus:border-jiwa/30 transition-all text-sm"
              value={broadcastMessage}
              onChange={e => setBroadcastMessage(e.target.value)}
            />
            <button 
              onClick={handleBroadcast}
              disabled={isBroadcasting || !broadcastMessage.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-jiwa text-black font-black italic uppercase rounded-xl hover:bg-jiwa/90 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <Send className={cn("w-4 h-4", isBroadcasting && "animate-pulse")} />
              <span>Kirim ke Kotak Surat</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="text-ilmu" />} label="Total Players" value={users.length} />
          <StatCard icon={<TrendingUp className="text-raga" />} label="Active Sessions" value={users.filter(u => u.username).length} />
          <StatCard icon={<Star className="text-harta" />} label="High Levels" value={users.filter(u => u.level > 5).length} />
          <StatCard icon={<AlertTriangle className="text-karma" />} label="Reports" value={0} />
        </div>

        {/* User List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-500">Player Registry</h2>
            <span className="text-[10px] font-bold text-jiwa bg-jiwa/10 px-3 py-1 rounded-full uppercase tracking-widest">
              {filteredUsers.length} Players
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block glass-panel overflow-hidden border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4">Profile</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Cooldown</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {filteredUsers.map((user) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        key={user.id} 
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-jiwa/20 to-ilmu/20 flex items-center justify-center font-black text-jiwa shrink-0">
                              {user.username?.[0].toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white line-clamp-1">{user.username || 'Anonymous'}</p>
                              <p className="text-[10px] text-neutral-500 font-medium line-clamp-1">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {user.usia ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white capitalize">{user.gender || 'Unknown'}</span>
                              <span className="text-[10px] text-neutral-500">{user.usia} Tahun</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-neutral-600 italic">No Data</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter">LVL</span>
                              <span className="font-black text-white italic">{user.level}</span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter">XP</span>
                              <span className="font-bold text-harta text-xs">{user.xp}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {user.last_name_change ? (
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black rounded uppercase w-fit">Locked</span>
                              <span className="text-[9px] text-neutral-500 font-mono italic">
                                {new Date(user.last_name_change).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 bg-raga/10 text-raga text-[8px] font-black rounded uppercase w-fit">Available</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <AdminButton 
                              icon={<Eye className="w-3.5 h-3.5" />} 
                              label="View" 
                              onClick={() => handleViewProfile(user)}
                              variant="info"
                            />
                            <AdminButton 
                              icon={<MailIcon className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-mail' && "animate-spin")} />} 
                              label="Mail" 
                              onClick={() => handleSendMail(user.supabase_id, user.username || user.email)}
                              variant="info"
                            />
                            <AdminButton 
                              icon={<Gift className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-reward' && "animate-spin")} />} 
                              label="+XP" 
                              onClick={() => handleGiveReward(user.supabase_id, user.xp, user.level)}
                              variant="success"
                            />
                            <AdminButton 
                              icon={<RotateCcw className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-reset-lvl' && "animate-spin")} />} 
                              label="Reset" 
                              onClick={() => handleResetLevel(user.supabase_id)}
                              variant="danger"
                            />
                            <AdminButton 
                              icon={<ArrowUpCircle className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-lvl' && "animate-spin")} />} 
                              label="+LVL" 
                              onClick={() => handleLevelUp(user.supabase_id, user.level)}
                              variant="warning"
                            />
                            <AdminButton 
                              icon={<Trash2 className={cn("w-3.5 h-3.5", actionLoading === user.id + '-delete' && "animate-spin")} />} 
                              label="Del" 
                              onClick={() => handleDeleteUser(user.id, user.supabase_id)}
                              variant="danger"
                            />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            <AnimatePresence>
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-rpg-card border border-white/5 rounded-3xl p-5 space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-jiwa/20 to-ilmu/20 flex items-center justify-center font-black text-jiwa shrink-0">
                        {user.username?.[0].toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{user.username || 'Anonymous'}</p>
                        <p className="text-[10px] text-neutral-500 font-medium truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-tighter block">LVL</span>
                      <span className="font-black text-white italic text-lg leading-none">{user.level}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                    <div>
                      <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-1">XP Points</span>
                      <span className="text-xs font-bold text-harta">{user.xp} XP</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest block mb-1">Status</span>
                      {user.last_name_change ? (
                        <span className="text-[9px] text-red-400 font-bold uppercase italic">Cooldown Active</span>
                      ) : (
                        <span className="text-[9px] text-raga font-bold uppercase italic">Verified</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <AdminButton 
                      icon={<Eye className="w-3.5 h-3.5" />} 
                      label="View" 
                      onClick={() => handleViewProfile(user)}
                      variant="info"
                    />
                    <AdminButton 
                      icon={<MailIcon className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-mail' && "animate-spin")} />} 
                      label="Mail" 
                      onClick={() => handleSendMail(user.supabase_id, user.username || user.email)}
                      variant="info"
                    />
                    <AdminButton 
                      icon={<Gift className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-reward' && "animate-spin")} />} 
                      label="+XP" 
                      onClick={() => handleGiveReward(user.supabase_id, user.xp, user.level)}
                      variant="success"
                    />
                    <AdminButton 
                      icon={<ArrowUpCircle className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-lvl' && "animate-spin")} />} 
                      label="+LVL" 
                      onClick={() => handleLevelUp(user.supabase_id, user.level)}
                      variant="warning"
                    />
                    <AdminButton 
                      icon={<RotateCcw className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-reset-lvl' && "animate-spin")} />} 
                      label="Reset" 
                      onClick={() => handleResetLevel(user.supabase_id)}
                      variant="danger"
                    />
                    <AdminButton 
                      icon={<Trash2 className={cn("w-3.5 h-3.5", actionLoading === user.id + '-delete' && "animate-spin")} />} 
                      label="Del" 
                      onClick={() => handleDeleteUser(user.id, user.supabase_id)}
                      variant="danger"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-rpg-card border border-white/10 rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-jiwa/20 to-ilmu/20 flex items-center justify-center font-black text-jiwa text-xl">
                    {selectedUser.username?.[0].toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg">{selectedUser.username}</h3>
                    <p className="text-xs text-neutral-500 font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-neutral-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 hide-scrollbar">
                {loadingProfile ? (
                  <div className="py-12 flex flex-col items-center justify-center text-neutral-500">
                    <RefreshCw className="w-8 h-8 animate-spin mb-4 text-jiwa" />
                    <p className="text-sm font-bold uppercase tracking-widest">Loading Profile...</p>
                  </div>
                ) : userProfile ? (
                  <>
                    <div className="glass-panel p-6 border-jiwa/20 bg-jiwa/5 relative overflow-hidden">
                      <Brain className="absolute -right-4 -bottom-4 w-32 h-32 text-jiwa opacity-5" />
                      <div className="relative z-10">
                        <span className="text-[10px] font-black text-jiwa uppercase tracking-[0.3em] bg-jiwa/10 px-3 py-1 rounded-full">
                          {userProfile.personality_type}
                        </span>
                        <h4 className="text-2xl font-black text-white mt-4 mb-2">{userProfile.personality_title}</h4>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                          {userProfile.personality_desc}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Dimension Stats</h5>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <StatBox label="JIWA" value={userProfile.jiwa} color="text-jiwa" bg="bg-jiwa/10" border="border-jiwa/20" />
                        <StatBox label="RAGA" value={userProfile.raga} color="text-raga" bg="bg-raga/10" border="border-raga/20" />
                        <StatBox label="HARTA" value={userProfile.harta} color="text-harta" bg="bg-harta/10" border="border-harta/20" />
                        <StatBox label="ILMU" value={userProfile.ilmu} color="text-ilmu" bg="bg-ilmu/10" border="border-ilmu/20" />
                        <StatBox label="KARMA" value={userProfile.karma} color="text-karma" bg="bg-karma/10" border="border-karma/20" />
                      </div>
                    </div>

                    <div className="glass-panel p-5 bg-white/5 space-y-2">
                      <h5 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Character Summary</h5>
                      <p className="text-sm text-neutral-300 italic">"{userProfile.character_summary}"</p>
                    </div>
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-neutral-500">
                    <AlertTriangle className="w-8 h-8 mb-4 text-red-500/50" />
                    <p className="text-sm font-bold uppercase tracking-widest">No Profile Data Found</p>
                    <p className="text-xs text-neutral-600 mt-2">User has not completed the personality test.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action/Confirm Modal */}
      <AnimatePresence>
        {confirmModal && confirmModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-rpg-card border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                {confirmModal.variant === 'danger' && <AlertTriangle className="w-6 h-6 text-red-500" />}
                {confirmModal.variant === 'success' && <Gift className="w-6 h-6 text-green-500" />}
                {confirmModal.variant === 'warning' && <Megaphone className="w-6 h-6 text-amber-500" />}
                {confirmModal.variant === 'info' && <ShieldCheck className="w-6 h-6 text-blue-500" />}
                <h3 className="font-black text-lg text-white">{confirmModal.title}</h3>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">{confirmModal.message}</p>
              
              {confirmModal.type === 'prompt' && (
                confirmModal.inputType === 'text' ? (
                  <textarea
                    id="modal-prompt-input"
                    placeholder={confirmModal.placeholder}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-jiwa/50 mt-2 resize-none"
                    autoFocus
                  />
                ) : (
                  <input
                    type="number"
                    id="modal-prompt-input"
                    placeholder={confirmModal.placeholder}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-jiwa/50 mt-2 font-mono"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (document.getElementById('modal-prompt-input') as HTMLInputElement).value;
                        setConfirmModal(null);
                        if (val) confirmModal.action(val);
                      }
                    }}
                  />
                )
              )}

              <div className="flex justify-end gap-3 mt-4">
                {confirmModal.type !== 'alert' && (
                  <button 
                    onClick={() => setConfirmModal(null)}
                    className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
                  >
                    Batal
                  </button>
                )}
                <button 
                  onClick={() => {
                    let val;
                    if (confirmModal.type === 'prompt') {
                      val = (document.getElementById('modal-prompt-input') as HTMLInputElement)?.value;
                    }
                    setConfirmModal(null);
                    if (confirmModal.type !== 'prompt' || val) {
                      confirmModal.action(val);
                    }
                  }}
                  className={cn(
                    "px-6 py-2 text-xs font-black rounded-xl text-black uppercase tracking-wider transition-all",
                    confirmModal.variant === 'danger' ? "bg-red-500 hover:bg-red-400" :
                    confirmModal.variant === 'success' ? "bg-green-500 hover:bg-green-400" :
                    confirmModal.variant === 'warning' ? "bg-amber-500 hover:bg-amber-400" :
                    "bg-blue-500 hover:bg-blue-400"
                  )}
                >
                  {confirmModal.type === 'alert' ? 'OK' : 'Konfirmasi'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatBox = ({ label, value, color, bg, border }: any) => (
  <div className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border", bg, border)}>
    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">{label}</span>
    <span className={cn("text-xl font-black", color)}>{value}</span>
  </div>
);

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) => (
  <div className="bg-rpg-card border border-white/5 p-5 rounded-[24px] space-y-2">
    <div className="p-2 bg-white/5 w-fit rounded-lg">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black italic">{value}</p>
    </div>
  </div>
);

const AdminButton = ({ icon, label, onClick, variant }: { icon: React.ReactNode, label: string, onClick: () => void, variant: 'warning' | 'success' | 'danger' | 'info' }) => {
  const variantStyles = {
    warning: "bg-harta/10 text-harta hover:bg-harta/20",
    success: "bg-raga/10 text-raga hover:bg-raga/20",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    info: "bg-ilmu/10 text-ilmu hover:bg-ilmu/20"
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 px-4 py-2.5 sm:px-3 sm:py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all active:scale-95",
        variantStyles[variant]
      )}
    >
      {icon}
      <span className="sm:inline">{label}</span>
    </button>
  );
};
