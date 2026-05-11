import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password berhasil diperbarui! Silakan login kembali.' });
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Gagal memperbarui password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-rpg-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-10 space-y-8 border-rpg-border/50"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-jiwa/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-jiwa" />
          </div>
          <h2 className="text-3xl font-black italic tracking-tight text-rpg-text">NEW PASSWORD</h2>
          <p className="text-sm text-neutral-400 uppercase tracking-widest font-bold">Masukkan password baru Anda</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-bold ${
            message.type === 'success' ? 'bg-jiwa/10 border-jiwa/20 text-jiwa' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {message?.type !== 'success' && (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-rpg-text transition-colors" />
              <input
                type="password"
                placeholder="Password Baru"
                required
                className="w-full pl-12 pr-4 py-4 bg-rpg-black/50 border border-rpg-border focus:border-white rounded-2xl outline-none transition-all text-rpg-text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-rpg-primary text-rpg-primary-text font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-white/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'UPDATE PASSWORD'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
