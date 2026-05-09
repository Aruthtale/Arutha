import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, ShieldCheck, RefreshCw, Star, Trash2, ArrowLeft, Search, 
  ExternalLink, TrendingUp, AlertTriangle
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

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-rpg-black text-white p-4 md:p-8 pb-32 pt-28 md:pt-32">
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
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-jiwa/20 to-ilmu/20 flex items-center justify-center font-black text-jiwa">
                            {user.username?.[0].toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{user.username || 'Anonymous'}</p>
                            <p className="text-[10px] text-neutral-500 font-medium">{user.email}</p>
                          </div>
                        </div>
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
                          <span className="px-2 py-0.5 bg-raga/10 text-raga text-[8px] font-black rounded uppercase">Available</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AdminButton 
                            icon={<RefreshCw className={cn("w-3.5 h-3.5", actionLoading === user.id + '-reset' && "animate-spin")} />} 
                            label="Reset" 
                            onClick={() => handleResetCooldown(user.supabase_id)}
                            variant="warning"
                          />
                          <AdminButton 
                            icon={<Star className="w-3.5 h-3.5" />} 
                            label="+500 XP" 
                            onClick={() => handleAddXp(user.supabase_id, user.xp, user.level)}
                            variant="success"
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
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: number | string }) => (
  <div className="bg-rpg-card border border-white/5 p-5 rounded-[24px] space-y-2">
    <div className="p-2 bg-white/5 w-fit rounded-lg">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black italic">{value}</p>
    </div>
  </div>
);

const AdminButton = ({ icon, label, onClick, variant }: { icon: React.ReactNode, label: string, onClick: () => void, variant: 'warning' | 'success' }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all active:scale-95",
      variant === 'warning' ? "bg-harta/10 text-harta hover:bg-harta/20" : "bg-raga/10 text-raga hover:bg-raga/20"
    )}
  >
    {icon}
    {label}
  </button>
);
