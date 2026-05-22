import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { LogIn, UserPlus, Chrome, Mail, Lock, User as UserIcon, Calendar, VenusAndMars } from 'lucide-react';
import { cn } from '../lib/utils';
import { getZodiacFromDate } from '../lib/zodiacs';

export const Auth: React.FC<{ initialIsRegister?: boolean }> = ({ initialIsRegister = false }) => {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    day: '',
    month: '',
    year: '',
    gender: 'Other'
  });

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Capacitor.isNativePlatform() 
            ? 'com.aruthtale.arutha://login-callback' 
            : window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (!formData.day || !formData.month || !formData.year) {
          alert('Mohon lengkapi tanggal lahir Anda.');
          setLoading(false);
          return;
        }
        const birthDateStr = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;
        const dateObj = new Date(birthDateStr);
        const today = new Date();
        let usiaNum = today.getFullYear() - dateObj.getFullYear();
        const m = today.getMonth() - dateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dateObj.getDate())) usiaNum--;
        const zodiacData = getZodiacFromDate(parseInt(formData.day), parseInt(formData.month));
        const zodiacName = zodiacData ? zodiacData.name : 'Unknown';

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              usia: usiaNum,
              gender: formData.gender,
              birth_date: birthDateStr,
              zodiac: zodiacName
            }
          }
        });
        if (error) throw error;
        alert('Check your email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 md:p-8 glass-panel border border-rpg-border/50 shadow-[0_0_50px_rgba(255,255,255,0.05)] transition-all duration-300">
      <div className="mb-6 md:mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-rpg-text mb-2 tracking-tight italic uppercase">
          {isRegister ? 'Join Guild' : 'Welcome Back'}
        </h2>
        <p className="text-neutral-400 font-medium text-[10px] md:text-xs tracking-[0.2em] uppercase">
          {isRegister ? 'Create your character' : 'Sign in to your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-rpg-text transition-colors" />
            <input
              type="text"
              placeholder="Username"
              required
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border/50 focus:border-rpg-primary rounded-xl md:rounded-2xl outline-none transition-all text-rpg-text placeholder:text-neutral-600 text-sm md:text-base"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
        )}

        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-rpg-text transition-colors" />
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border/50 focus:border-rpg-primary rounded-xl md:rounded-2xl outline-none transition-all text-rpg-text placeholder:text-neutral-600 text-sm md:text-base"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-rpg-text transition-colors" />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border/50 focus:border-rpg-primary rounded-xl md:rounded-2xl outline-none transition-all text-rpg-text placeholder:text-neutral-600 text-sm md:text-base"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        {isRegister && (
          <>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Tanggal Lahir
            </label>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <select
                required
                className="w-full px-3 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border/50 focus:border-rpg-primary rounded-xl md:rounded-2xl outline-none transition-all text-rpg-text appearance-none text-center font-bold text-sm md:text-base"
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              >
                <option value="" disabled className="bg-rpg-card">Tgl</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i+1} value={String(i+1)} className="bg-rpg-card">{i+1}</option>
                ))}
              </select>
              <select
                required
                className="w-full px-3 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border/50 focus:border-rpg-primary rounded-xl md:rounded-2xl outline-none transition-all text-rpg-text appearance-none text-center font-bold text-sm md:text-base"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              >
                <option value="" disabled className="bg-rpg-card">Bln</option>
                {["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"].map((m, i) => (
                  <option key={i+1} value={String(i+1)} className="bg-rpg-card">{m}</option>
                ))}
              </select>
              <select
                required
                className="w-full px-3 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border/50 focus:border-rpg-primary rounded-xl md:rounded-2xl outline-none transition-all text-rpg-text appearance-none text-center font-bold text-sm md:text-base"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              >
                <option value="" disabled className="bg-rpg-card">Tahun</option>
                {Array.from({ length: 100 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={String(year)} className="bg-rpg-card">{year}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            <div className="relative group">
              <VenusAndMars className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-rpg-text transition-colors pointer-events-none" />
              <select
                className="w-full pl-12 pr-10 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border/50 focus:border-rpg-primary rounded-xl md:rounded-2xl outline-none transition-all text-rpg-text appearance-none text-sm md:text-base cursor-pointer"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male" className="bg-rpg-card">Male</option>
                <option value="Female" className="bg-rpg-card">Female</option>
                <option value="Other" className="bg-rpg-card">Other</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 md:gap-4 py-3 md:py-4 bg-rpg-primary text-rpg-primary-text rounded-xl md:rounded-2xl font-black tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-rpg-primary/10 text-sm md:text-base"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-rpg-primary-text/30 border-t-rpg-primary-text rounded-full animate-spin" />
          ) : (
            isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />
          )}
          {loading ? 'PROCESSING...' : (isRegister ? 'CREATE CHARACTER' : 'ENTER WORLD')}
        </button>
      </form>

      <div className="my-6 md:my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-rpg-border" />
        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">OR</span>
        <div className="h-px flex-1 bg-rpg-border" />
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-white/10 text-rpg-text font-black rounded-xl md:rounded-2xl border border-white/20 hover:border-white hover:bg-white/20 transition-all active:scale-[0.98] shadow-lg shadow-black/20 group text-sm md:text-base"
      >
        <Chrome className="w-5 h-5 md:w-6 md:h-6 text-rpg-text group-hover:scale-110 transition-transform" />
        <span className="tracking-wide">CONTINUE WITH GOOGLE</span>
      </button>

      <p className="mt-6 md:mt-8 text-center text-xs md:text-sm font-medium text-neutral-500">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-rpg-text hover:underline font-bold"
        >
          {isRegister ? 'Sign In' : 'Register'}
        </button>
      </p>
    </div>
  );
};
