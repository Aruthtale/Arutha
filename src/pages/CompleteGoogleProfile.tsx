import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { User, Calendar, VenusAndMars, Save, Loader2 } from 'lucide-react';

interface CompleteGoogleProfileProps {
  userId: string;
  initialUsername: string;
  onComplete: (data: { username: string; usia: number; gender: string }) => void;
}

export const CompleteGoogleProfile: React.FC<CompleteGoogleProfileProps> = ({ userId, initialUsername, onComplete }) => {
  const [formData, setFormData] = useState({
    username: initialUsername,
    usia: '',
    gender: 'Male'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.usia) return;
    setLoading(true);

    try {
      const usiaNum = parseInt(formData.usia);
      const { error } = await supabase
        .from('arutha_user')
        .update({
          username: formData.username,
          usia: usiaNum,
          gender: formData.gender
        })
        .eq('id', userId);

      if (error) throw error;
      
      onComplete({ username: formData.username, usia: usiaNum, gender: formData.gender });
    } catch (err: any) {
      alert("Gagal menyimpan profil: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rpg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-jiwa/10 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tight mb-2">COMPLETE PROFILE</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Satu langkah lagi! Beritahu kami sedikit tentang diri Anda agar AI Arutha dapat menyesuaikan petualangan dan analisis psikologis khusus untuk Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-jiwa transition-colors" />
            <input
              type="text"
              required
              placeholder="Username"
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-jiwa rounded-2xl outline-none transition-all text-white placeholder:text-neutral-600"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-jiwa transition-colors" />
              <input
                type="number"
                required
                min="1"
                placeholder="Umur (Tahun)"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-jiwa rounded-2xl outline-none transition-all text-white placeholder:text-neutral-600"
                value={formData.usia}
                onChange={(e) => setFormData({ ...formData, usia: e.target.value })}
              />
            </div>
            <div className="relative group">
              <VenusAndMars className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-jiwa transition-colors" />
              <select
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-jiwa rounded-2xl outline-none transition-all text-white appearance-none"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male" className="bg-rpg-card">Laki-laki</option>
                <option value="Female" className="bg-rpg-card">Perempuan</option>
                <option value="Other" className="bg-rpg-card">Lainnya</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.usia}
            className="w-full py-4 mt-4 bg-jiwa text-white font-black rounded-2xl hover:bg-jiwa/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-jiwa/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? 'MENYIMPAN...' : 'LANJUTKAN'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
