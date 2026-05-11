import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { User, Calendar, VenusAndMars, Save, Loader2, Star } from 'lucide-react';
import { getZodiacFromDate } from '../lib/zodiacs';

interface CompleteGoogleProfileProps {
  userId: string;
  initialUsername: string;
  onComplete: (data: { username: string; usia: number; gender: string; birthDate: string; zodiac: string }) => void;
}

export const CompleteGoogleProfile: React.FC<CompleteGoogleProfileProps> = ({ userId, initialUsername, onComplete }) => {
  const [formData, setFormData] = useState({
    username: initialUsername,
    gender: '',
    day: '',
    month: '',
    year: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.day || !formData.month || !formData.year || !formData.gender) {
      alert("Mohon lengkapi data diri Anda.");
      return;
    }
    setLoading(true);

    try {
      const birthDateStr = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;
      const dateObj = new Date(birthDateStr);
      
      // Hitung Umur otomatis
      const today = new Date();
      let usiaNum = today.getFullYear() - dateObj.getFullYear();
      const m = today.getMonth() - dateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dateObj.getDate())) {
        usiaNum--;
      }
      
      // Hitung Zodiak
      const day = parseInt(formData.day);
      const month = parseInt(formData.month);
      const zodiacData = getZodiacFromDate(day, month);
      const zodiacName = zodiacData ? zodiacData.name : 'Unknown';

      const { error } = await supabase
        .from('arutha_user')
        .update({
          username: formData.username,
          usia: usiaNum,
          gender: formData.gender,
          birth_date: birthDateStr,
          zodiac: zodiacName
        })
        .eq('id', userId);

      if (error) throw error;
      
      onComplete({ 
        username: formData.username, 
        usia: usiaNum, 
        gender: formData.gender,
        birthDate: birthDateStr,
        zodiac: zodiacName
      });
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

          <div className="relative group">
            <VenusAndMars className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-jiwa transition-colors" />
            <select
              required
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 focus:border-jiwa rounded-2xl outline-none transition-all text-white appearance-none"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="" disabled className="bg-rpg-card">Pilih Gender</option>
              <option value="Male" className="bg-rpg-card">Laki-laki</option>
              <option value="Female" className="bg-rpg-card">Perempuan</option>
              <option value="Other" className="bg-rpg-card">Lainnya</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2">Time of Arrival (Birth Date)</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative group">
                <select
                  required
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 focus:border-jiwa rounded-2xl outline-none transition-all text-white appearance-none text-center font-bold"
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                >
                  <option value="" disabled className="bg-rpg-card">Tanggal</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i+1} value={i+1} className="bg-rpg-card">{i+1}</option>
                  ))}
                </select>
              </div>
              <div className="relative group">
                <select
                  required
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 focus:border-jiwa rounded-2xl outline-none transition-all text-white appearance-none text-center font-bold"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                >
                  <option value="" disabled className="bg-rpg-card">Bulan</option>
                  {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                    <option key={i+1} value={i+1} className="bg-rpg-card">{m}</option>
                  ))}
                </select>
              </div>
              <div className="relative group">
                <select
                  required
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 focus:border-jiwa rounded-2xl outline-none transition-all text-white appearance-none text-center font-bold"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                >
                  <option value="" disabled className="bg-rpg-card">Tahun</option>
                  {Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year} className="bg-rpg-card">{year}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.day || !formData.month || !formData.year || !formData.gender}
            className="w-full py-5 mt-6 bg-jiwa text-white font-black rounded-2xl hover:bg-jiwa/80 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-jiwa/20 group"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            <span className="tracking-widest">{loading ? 'SYNCING DATA...' : 'INITIALIZE PROFILE'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
