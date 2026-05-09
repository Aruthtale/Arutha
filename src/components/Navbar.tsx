import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, User, Map, ShieldAlert, Contact2, Mail, Trophy, Book, Settings } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { cn, getDimensionRank } from '../lib/utils';
import { isAdmin } from '../lib/config';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  session: Session | null;
  userName: string;
  onNavigate: (page: any) => void;
  currentPage: string;
  stats?: { JIWA: number; RAGA: number; HARTA: number; ILMU: number; KARMA: number };
}

export const Navbar: React.FC<NavbarProps> = ({ session, userName, onNavigate, currentPage, stats }) => {
  const avgStats = stats ? Object.values(stats).reduce((a, b) => a + b, 0) / 5 : 0;
  const currentRank = getDimensionRank(avgStats);
  const { dbUserId, unreadMailCount, setUnreadMailCount, mailToast, setMailToast, lastMailSeenAt } = useStore();
  const prevCountRef = useRef(-1);
  const isFirstPoll = useRef(true);

  // Load lastMailSeenAt from localStorage on init
  useEffect(() => {
    if (!dbUserId) return;
    const saved = localStorage.getItem(`arutha_mail_seen_${dbUserId}`);
    if (saved && !lastMailSeenAt) {
      useStore.getState().setLastMailSeenAt(saved);
    }
  }, [dbUserId]);

  useEffect(() => {
    if (!dbUserId) return;
    const fetchUnread = async () => {
      // Ambil tanggal registrasi user
      const { data: userData } = await supabase
        .from('arutha_user')
        .select('created_at')
        .eq('id', dbUserId)
        .single();
      const userCreatedAt = userData?.created_at;

      // Batas: 3 hari yang lalu
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const cutoff = threeDaysAgo.toISOString();

      // Gunakan tanggal registrasi ATAU 3 hari lalu (yang mana lebih baru)
      const minDate = userCreatedAt && userCreatedAt > cutoff ? userCreatedAt : cutoff;

      // 1. Pesan personal yang belum dibaca (dan masih dalam 3 hari)
      const { count: personalCount } = await supabase
        .from('arutha_mail')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', dbUserId)
        .eq('is_read', false)
        .gte('created_at', minDate);
      
      // 2. Pesan global yang lebih baru dari terakhir user buka Kotak Surat
      const seenAt = useStore.getState().lastMailSeenAt || localStorage.getItem(`arutha_mail_seen_${dbUserId}`);
      let globalUnread = 0;
      
      // Ambil global mail yang lebih baru dari seenAt DAN minDate
      const globalCutoff = seenAt && seenAt > minDate ? seenAt : minDate;
      
      const { count } = await supabase
        .from('arutha_mail')
        .select('id', { count: 'exact', head: true })
        .is('user_id', null)
        .gt('created_at', globalCutoff);
      globalUnread = count || 0;

      const total = (personalCount || 0) + globalUnread;
      
      // Detect NEW mail → show toast (skip on first load)
      if (!isFirstPoll.current && total > prevCountRef.current && prevCountRef.current >= 0) {
        setMailToast('📬 Kamu mendapat surat baru!');
        setTimeout(() => setMailToast(null), 4000);
      }
      isFirstPoll.current = false;
      prevCountRef.current = total;
      setUnreadMailCount(total);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [dbUserId, lastMailSeenAt]);

  return (
    <>
      {/* Desktop Left Sidebar */}
      <nav className="hidden md:flex fixed top-0 left-0 bottom-0 w-[280px] z-50 bg-rpg-black/95 border-r border-white/5 flex-col justify-between py-8">
        
        <div className="flex flex-col items-center w-full px-6">
          {/* Logo Section */}
          <button
            onClick={() => onNavigate('LANDING')}
            className="flex flex-col items-center gap-4 hover:opacity-80 transition-opacity mb-10 w-full"
          >
            <div className="w-24 h-24 rounded-full border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] p-1 relative">
              <div className="absolute inset-0 rounded-full border border-neutral-600/30 m-1" />
              <img src="/Arutha.png" alt="Arutha Logo" className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-black tracking-[0.2em] text-neutral-200">ARUTHA</span>
              {session && (
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">
                  {userName}
                </span>
              )}
            </div>
          </button>

          {/* Navigation Links */}
          {session && (
            <div className="flex flex-col gap-2 w-full">
              <SidebarPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid className="w-4 h-4" />} label="Home" />
              <SidebarPill active={currentPage === 'LEADERBOARD'} onClick={() => onNavigate('LEADERBOARD')} icon={<Trophy className="w-4 h-4 text-harta" />} label="Hall of Fame" />
              <SidebarPill active={currentPage === 'CODEX'} onClick={() => onNavigate('CODEX')} icon={<Book className="w-4 h-4 text-jiwa" />} label="Codex" />
              <SidebarPill active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<Contact2 className="w-4 h-4" />} label="Profile" />
              <SidebarPill active={currentPage === 'SETTINGS'} onClick={() => onNavigate('SETTINGS')} icon={<User className="w-4 h-4" />} label="Settings" />
              {isAdmin(session.user.email) && (
                <SidebarPill active={currentPage === 'ADMIN'} onClick={() => onNavigate('ADMIN')} icon={<ShieldAlert className="w-4 h-4 text-jiwa" />} label="Admin" />
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Rank & Icons */}
        {session && stats && (
          <div className="px-6 space-y-6">
            <div className="glass-panel p-5 border border-white/10 bg-gradient-to-br from-jiwa/20 via-transparent to-ilmu/10 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-jiwa/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <p className="text-[10px] font-black tracking-[0.3em] text-jiwa/70 uppercase mb-2">Ascension Phase</p>
              <h3 className="text-xl font-black tracking-tighter text-white italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                {currentRank === 'DISCIPLE' ? 'ASCENSION I' : currentRank}
              </h3>
              <div className="mt-3 flex justify-center gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === 1 ? "bg-jiwa shadow-[0_0_8px_rgba(236,72,153,0.8)]" : "bg-white/10")} />
                ))}
              </div>
            </div>
            
            <div className="flex justify-center items-center gap-4 mt-6">
              <button 
                onClick={() => onNavigate('MAIL')} 
                className={cn(
                  "p-3 rounded-2xl transition-all relative group flex items-center justify-center",
                  currentPage === 'MAIL' ? "bg-white/10 text-jiwa shadow-inner" : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                )}
              >
                <Mail className="w-5 h-5" />
                {unreadMailCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-jiwa text-black text-[10px] font-black rounded-full px-1 shadow-[0_0_10px_rgba(236,72,153,0.6)] animate-bounce">
                    {unreadMailCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Top Navbar - Mobile Only */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-rpg-black/60 backdrop-blur-3xl border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('LANDING')} 
            className="flex items-center gap-4 active:scale-95 transition-transform"
          >
            <div className="relative">
              <img src="/Arutha.png" alt="Arutha Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg border border-white/10" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-jiwa/20 to-transparent pointer-events-none" />
            </div>
            <div className="flex flex-col items-start leading-tight text-left">
              <span className="text-xl font-black tracking-tighter text-white italic">ARUTHA</span>
              {session && (
                <span className="text-[9px] font-black text-jiwa uppercase tracking-[0.2em] line-clamp-1 max-w-[120px] opacity-80">
                  {userName}
                </span>
              )}
            </div>
          </button>
          {session ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate('MAIL')}
                className={cn(
                  "w-10 h-10 rounded-xl transition-all active:scale-90 flex items-center justify-center shadow-lg relative",
                  currentPage === 'MAIL' ? "bg-jiwa text-black shadow-jiwa/20" : "text-neutral-400 bg-white/5 border border-white/10 hover:bg-white/10"
                )}
              >
                <Mail className="w-4 h-4" />
                {unreadMailCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-jiwa text-black text-[9px] font-black rounded-full px-0.5 shadow-[0_0_8px_rgba(236,72,153,0.6)]">
                    {unreadMailCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => onNavigate('SETTINGS')}
                className={cn(
                  "w-10 h-10 rounded-xl transition-all active:scale-90 flex items-center justify-center shadow-lg",
                  currentPage === 'SETTINGS' ? "bg-jiwa text-black shadow-jiwa/20" : "text-neutral-400 bg-white/5 border border-white/10 hover:bg-white/10"
                )}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => onNavigate('LOGIN')} className="text-xs font-bold text-neutral-400 px-3 py-2">Login</button>
              <button onClick={() => onNavigate('REGISTER')} className="px-6 py-2.5 text-xs font-black bg-white text-black rounded-full shadow-2xl hover:scale-105 transition-transform">Register</button>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      {session && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-rpg-black/90 backdrop-blur-2xl border-t border-white/10 px-4 pb-[env(safe-area-inset-bottom)] pt-2">
          <div className="flex items-center justify-around py-2">
            <MobileNavPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid />} label="Home" />
            <MobileNavPill active={currentPage === 'LEADERBOARD'} onClick={() => onNavigate('LEADERBOARD')} icon={<Trophy className="text-harta" />} label="Hall" />
            <MobileNavPill active={currentPage === 'CODEX'} onClick={() => onNavigate('CODEX')} icon={<Book className="text-jiwa" />} label="Codex" />
            <MobileNavPill active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<Contact2 />} label="Profile" />
            {isAdmin(session.user.email) && (
              <MobileNavPill active={currentPage === 'ADMIN'} onClick={() => onNavigate('ADMIN')} icon={<ShieldAlert className="text-jiwa" />} label="Admin" />
            )}
          </div>
        </nav>
      )}

      {/* Floating Mail Toast Notification */}
      <AnimatePresence>
        {mailToast && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="fixed top-24 md:top-6 left-1/2 -translate-x-1/2 z-[200] cursor-pointer"
            onClick={() => { setMailToast(null); onNavigate('MAIL'); }}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-jiwa/90 to-jiwa/70 backdrop-blur-xl text-black font-black italic rounded-2xl shadow-[0_10px_40px_rgba(236,72,153,0.4)] flex items-center gap-3 border border-white/20">
              <Mail className="w-5 h-5" />
              <span className="text-sm tracking-wide">{mailToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const SidebarPill = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-black tracking-widest uppercase transition-all w-full text-left group',
      active 
        ? 'bg-white/10 text-white border border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.2)]' 
        : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5 border border-transparent'
    )}
  >
    <div className={cn("transition-transform group-active:scale-90", active && "text-white")}>
      {icon}
    </div>
    <span>{label}</span>
  </button>
);

const MobileNavPill = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex flex-col items-center justify-center gap-1.5 w-16 transition-all active:scale-75',
      active ? 'text-white' : 'text-neutral-500'
    )}
  >
    <div className={cn(
      "flex items-center justify-center w-10 h-10 rounded-2xl transition-all shadow-inner",
      active ? "bg-white/15 scale-110 shadow-white/5" : "bg-transparent"
    )}>
      {React.cloneElement(icon as React.ReactElement<any>, { 
        className: cn("w-5 h-5", active ? "stroke-[2.5px]" : "stroke-[2px]") 
      })}
    </div>
    <span className={cn(
      "text-[9px] font-black uppercase tracking-widest transition-all",
      active ? "opacity-100" : "opacity-40"
    )}>{label}</span>
  </button>
);
