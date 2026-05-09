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
          {session && (
            <div className="flex flex-col gap-2 w-full">
              <SidebarPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid className="w-4 h-4" />} label="Home" />
              <SidebarPill active={currentPage === 'LEADERBOARD'} onClick={() => onNavigate('LEADERBOARD')} icon={<Trophy className="w-4 h-4 text-harta" />} label="Hall of Fame" />
              <SidebarPill active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<Contact2 className="w-4 h-4" />} label="Profile" />
              <SidebarPill active={false} onClick={() => {}} icon={<Map className="w-4 h-4" />} label="Quests" />
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
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-rpg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate('LANDING')} className="flex items-center gap-2">
            <img src="/Arutha.png" alt="Arutha Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div className="flex flex-col items-start leading-none text-left">
              <span className="text-base font-black tracking-tighter text-neutral-200">ARUTHA</span>
              {session && (
                <span className="text-[9px] font-black text-jiwa uppercase tracking-widest mt-0.5 line-clamp-1 max-w-[120px]">
                  {userName}
                </span>
              )}
            </div>
          </button>
          {!session && (
            <div className="flex gap-2">
              <button onClick={() => onNavigate('LOGIN')} className="px-4 py-1.5 text-xs font-bold text-neutral-400">Login</button>
              <button onClick={() => onNavigate('REGISTER')} className="px-4 py-1.5 text-xs font-black bg-white text-black rounded-full">Register</button>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      {session && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-rpg-black/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around px-2 py-2">
            <MobileNavPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid />} label="Home" />
            <MobileNavPill active={currentPage === 'LEADERBOARD'} onClick={() => onNavigate('LEADERBOARD')} icon={<Trophy className="text-harta" />} label="Hall" />
            <MobileNavPill active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<Contact2 />} label="Profile" />
            <MobileNavPill active={currentPage === 'SETTINGS'} onClick={() => onNavigate('SETTINGS')} icon={<User />} label="Settings" />
            {isAdmin(session.user.email) && (
              <MobileNavPill active={currentPage === 'ADMIN'} onClick={() => onNavigate('ADMIN')} icon={<ShieldAlert className="text-jiwa" />} label="Admin" />
            )}
          </div>
        </nav>
      )}
    </>
  );
};

const SidebarPill = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all w-full text-left',
      active ? 'bg-white/10 text-white border border-white/10' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/5 border border-transparent'
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MobileNavPill = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex flex-col items-center justify-center gap-1 w-16 transition-all',
      active ? 'text-neutral-200' : 'text-neutral-500 hover:text-neutral-200'
    )}
  >
    <div className={cn(
      "flex items-center justify-center w-8 h-8 rounded-full transition-all",
      active ? "bg-white/20" : "bg-transparent"
    )}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
    </div>
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </button>
);
