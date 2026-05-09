import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, ShieldCheck, RefreshCw, Star, Trash2, ArrowLeft, Search, 
  ExternalLink, TrendingUp, AlertTriangle, ArrowUpCircle, Eye, X, Brain
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
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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
      .eq('supabase_id', userId); // Use supabase_id for safer policy match
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, last_name_change: null, name_change_count: 0 } : u));
    }
    setActionLoading(null);
  };

  const handleAddXp = async (userId: string, currentXp: number, currentLevel: number) => {
    setActionLoading(userId + '-xp');
    const bonusXp = 500;
    let nextXp = currentXp + bonusXp;
    let nextLevel = currentLevel;

    if (nextXp >= currentLevel * 1000) {
      nextXp -= (currentLevel * 1000);
      nextLevel += 1;
    }

    const { error } = await supabase
      .from('arutha_user')
      .update({ xp: nextXp, level: nextLevel })
      .eq('supabase_id', userId); // Use supabase_id for safer policy match
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, xp: nextXp, level: nextLevel } : u));
    }
    setActionLoading(null);
  };

  const handleLevelUp = async (userId: string, currentLevel: number) => {
    setActionLoading(userId + '-lvl');
    const { error } = await supabase
      .from('arutha_user')
      .update({ level: currentLevel + 1 })
      .eq('supabase_id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.supabase_id === userId ? { ...u, level: currentLevel + 1 } : u));
    }
    setActionLoading(null);
  };

  const handleDeleteUser = async (userId: string, supabaseId: string) => {
    if (!window.confirm("Yakin ingin menghapus data user ini secara permanen dari Arutha? (Catatan: Ini tidak akan menghapus akun Google mereka)")) return;
    setActionLoading(userId + '-delete');
    
    // Attempt to delete cascade
    await supabase.from('character_profile').delete().eq('user_id', userId);
    await supabase.from('stat_history').delete().eq('user_id', userId);
    
    // Add .select() so we can check if it actually deleted a row
    const { data, error } = await supabase.from('arutha_user').delete().eq('supabase_id', supabaseId).select();
    
    if (error) {
      alert("Gagal menghapus user: " + error.message);
    } else if (!data || data.length === 0) {
      alert("Gagal: RLS (Row Level Security) Supabase memblokir tindakan ini. Akun Anda tidak memiliki izin (bukan Service Role / Admin) untuk menghapus data user lain.");
    } else {
      setUsers(users.filter(u => u.id !== userId));
    }
    setActionLoading(null);
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Users className="text-ilmu" />} label="Total Players" value={users.length} />
          <StatCard icon={<TrendingUp className="text-raga" />} label="Active Sessions" value={users.filter(u => u.username).length} />
          <StatCard icon={<Star className="text-harta" />} label="High Levels" value={users.filter(u => u.level > 5).length} />
          <StatCard icon={<AlertTriangle className="text-karma" />} label="Reports" value={0} />
        </div>

        {/* User Table */}
        <div className="glass-panel overflow-hidden border-white/5">
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
                            variant="warning"
                          />
                          <AdminButton 
                            icon={<ArrowUpCircle className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-lvl' && "animate-spin")} />} 
                            label="+LVL" 
                            onClick={() => handleLevelUp(user.supabase_id, user.level)}
                            variant="info"
                          />
                          <AdminButton 
                            icon={<RefreshCw className={cn("w-3.5 h-3.5", actionLoading === user.supabase_id + '-reset' && "animate-spin")} />} 
                            label="Reset" 
                            onClick={() => handleResetCooldown(user.supabase_id)}
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
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all active:scale-95",
        variantStyles[variant]
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};
