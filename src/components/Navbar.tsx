import React from 'react';
import { LayoutGrid, User, Map, ShieldAlert, Contact2, Mail, Trophy } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { cn, getDimensionRank } from '../lib/utils';
import { isAdmin } from '../lib/config';

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
          <div className="flex flex-col gap-2 w-full">
            {session ? (
              <>
                <SidebarPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid className="w-4 h-4" />} label="Home" />
                <SidebarPill active={currentPage === 'LEADERBOARD'} onClick={() => onNavigate('LEADERBOARD')} icon={<Trophy className="w-4 h-4 text-harta" />} label="Hall of Fame" />
                <SidebarPill active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<Contact2 className="w-4 h-4" />} label="Profile" />
                <SidebarPill active={false} onClick={() => {}} icon={<Map className="w-4 h-4" />} label="Quests" />
                <SidebarPill active={currentPage === 'SETTINGS'} onClick={() => onNavigate('SETTINGS')} icon={<User className="w-4 h-4" />} label="Settings" />
                {isAdmin(session.user.email) && (
                  <SidebarPill active={currentPage === 'ADMIN'} onClick={() => onNavigate('ADMIN')} icon={<ShieldAlert className="w-4 h-4 text-jiwa" />} label="Admin" />
                )}
              </>
            ) : (
              <>
                <SidebarPill active={currentPage === 'LANDING'} onClick={() => onNavigate('LANDING')} icon={<LayoutGrid className="w-4 h-4" />} label="Landing" />
                <SidebarPill active={currentPage === 'LEADERBOARD'} onClick={() => onNavigate('LEADERBOARD')} icon={<Trophy className="w-4 h-4 text-harta" />} label="Hall of Fame" />
                <SidebarPill active={currentPage === 'LOGIN'} onClick={() => onNavigate('LOGIN')} icon={<User className="w-4 h-4" />} label="Login" />
              </>
            )}
          </div>
        </div>

        {/* Bottom Section: Rank & Icons */}
        {session && stats && (
          <div className="px-6 space-y-6">
            <div className="glass-panel p-4 border border-white/5 bg-gradient-to-b from-white/5 to-transparent text-center">
              <p className="text-[9px] font-black tracking-[0.2em] text-neutral-500 uppercase mb-2">Current Rank</p>
              <h3 className="text-lg font-black tracking-widest text-neutral-200">
                {currentRank}
              </h3>
            </div>
            
            <div className="flex justify-center items-center gap-4">
              <button className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors relative group">
                <Mail className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-jiwa rounded-full animate-pulse" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Top Navbar - Mobile Only */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-rpg-black/80 backdrop-blur-2xl border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('LANDING')} 
            className="flex items-center gap-3 active:scale-95 transition-transform"
          >
            <img src="/Arutha.png" alt="Arutha Logo" className="w-9 h-9 rounded-xl object-cover shadow-lg" />
            <div className="flex flex-col items-start leading-tight text-left">
              <span className="text-lg font-black tracking-tighter text-white italic">ARUTHA</span>
              {session && (
                <span className="text-[9px] font-black text-jiwa uppercase tracking-[0.2em] line-clamp-1 max-w-[120px]">
                  {userName}
                </span>
              )}
            </div>
          </button>
          {!session && (
            <div className="flex gap-3">
              <button onClick={() => onNavigate('LOGIN')} className="text-xs font-bold text-neutral-400 px-2">Login</button>
              <button onClick={() => onNavigate('REGISTER')} className="px-5 py-2 text-xs font-black bg-white text-black rounded-full shadow-xl">Register</button>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-rpg-black/90 backdrop-blur-2xl border-t border-white/10 px-4 pb-[env(safe-area-inset-bottom)] pt-2">
        <div className="flex items-center justify-around py-2">
          {session ? (
            <>
              <MobileNavPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid />} label="Home" />
              <MobileNavPill active={currentPage === 'LEADERBOARD'} onClick={() => onNavigate('LEADERBOARD')} icon={<Trophy className="text-harta" />} label="Hall" />
              <MobileNavPill active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<Contact2 />} label="Profile" />
              <MobileNavPill active={currentPage === 'SETTINGS'} onClick={() => onNavigate('SETTINGS')} icon={<User />} label="Settings" />
              {isAdmin(session.user.email) && (
                <MobileNavPill active={currentPage === 'ADMIN'} onClick={() => onNavigate('ADMIN')} icon={<ShieldAlert className="text-jiwa" />} label="Admin" />
              )}
            </>
          ) : (
            <>
              <MobileNavPill active={currentPage === 'LANDING'} onClick={() => onNavigate('LANDING')} icon={<LayoutGrid />} label="Landing" />
              <MobileNavPill active={currentPage === 'LEADERBOARD'} onClick={() => onNavigate('LEADERBOARD')} icon={<Trophy className="text-harta" />} label="Hall" />
              <MobileNavPill active={currentPage === 'LOGIN'} onClick={() => onNavigate('LOGIN')} icon={<User />} label="Login" />
            </>
          )}
        </div>
      </nav>
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
