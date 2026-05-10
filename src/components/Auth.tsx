import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { LogIn, UserPlus, Chrome, Mail, Lock, User as UserIcon, Calendar, VenusAndMars } from 'lucide-react';
import { cn } from '../lib/utils';

export const Auth: React.FC<{ initialIsRegister?: boolean }> = ({ initialIsRegister = false }) => {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    usia: '',
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
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
              usia: parseInt(formData.usia),
              gender: formData.gender
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
    <div className="w-full max-w-md mx-auto p-6 md:p-8 glass-panel border border-rpg-border shadow-[0_0_50px_rgba(255,255,255,0.05)] transition-all duration-300">
      <div className="mb-6 md:mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight italic uppercase">
          {isRegister ? 'Join Guild' : 'Welcome Back'}
        </h2>
        <p className="text-neutral-400 font-medium text-[10px] md:text-xs tracking-[0.2em] uppercase">
          {isRegister ? 'Create your character' : 'Sign in to your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Username"
              required
              className="w-full pl-12 pr-4 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border focus:border-white rounded-xl md:rounded-2xl outline-none transition-all text-white placeholder:text-neutral-600 text-sm md:text-base"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
        )}

        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border focus:border-white rounded-xl md:rounded-2xl outline-none transition-all text-white placeholder:text-neutral-600 text-sm md:text-base"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border focus:border-white rounded-xl md:rounded-2xl outline-none transition-all text-white placeholder:text-neutral-600 text-sm md:text-base"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        {isRegister && (
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
              <input
                type="number"
                placeholder="Usia"
                required
                className="w-full pl-12 pr-4 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border focus:border-white rounded-xl md:rounded-2xl outline-none transition-all text-white placeholder:text-neutral-600 text-sm md:text-base"
                value={formData.usia}
                onChange={(e) => setFormData({ ...formData, usia: e.target.value })}
              />
            </div>
            <div className="relative group">
              <VenusAndMars className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
              <select
                className="w-full pl-12 pr-4 py-3 md:py-4 bg-rpg-black/50 border border-rpg-border focus:border-white rounded-xl md:rounded-2xl outline-none transition-all text-white appearance-none text-sm md:text-base"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male" className="bg-rpg-card">Male</option>
                <option value="Female" className="bg-rpg-card">Female</option>
                <option value="Other" className="bg-rpg-card">Other</option>
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 md:py-4 bg-white hover:bg-neutral-200 text-black font-black rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
        >
          {isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
          {loading ? 'Processing...' : (isRegister ? 'CREATE CHARACTER' : 'ENTER WORLD')}
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
        className="w-full flex items-center justify-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-white/10 text-white font-black rounded-xl md:rounded-2xl border border-white/20 hover:border-white hover:bg-white/20 transition-all active:scale-[0.98] shadow-lg shadow-black/20 group text-sm md:text-base"
      >
        <Chrome className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform" />
        <span className="tracking-wide">CONTINUE WITH GOOGLE</span>
      </button>

      <p className="mt-6 md:mt-8 text-center text-xs md:text-sm font-medium text-neutral-500">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-white hover:underline font-bold"
        >
          {isRegister ? 'Sign In' : 'Register'}
        </button>
      </p>
    </div>
  );
};
