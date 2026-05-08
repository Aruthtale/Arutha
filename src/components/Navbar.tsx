import React from 'react';
import { LayoutGrid, User, Map } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { cn } from '../lib/utils';

interface NavbarProps {
  session: Session | null;
  onNavigate: (page: any) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ session, onNavigate, currentPage }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-rpg-black/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">

        {/* Logo */}
        <button
          onClick={() => onNavigate('LANDING')}
          className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity"
        >
          <img src="/logo.jpg" alt="Arutha Logo" className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-lg font-black tracking-tight text-white hidden sm:inline">Arutha</span>
        </button>

        {/* Center Nav Pills */}
        {session && (
          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-full border border-white/10">
            <NavPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid className="w-5 h-5" />} label="Home" />
            <NavPill active={false} onClick={() => {}} icon={<Map className="w-5 h-5" />} label="Quests" />
            <NavPill active={currentPage === 'SETTINGS'} onClick={() => onNavigate('SETTINGS')} icon={<User className="w-5 h-5" />} label="Settings" />
          </div>
        )}

        {/* Right: Avatar / Login */}
        <div className="shrink-0">
          {!session ? (
            <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('LOGIN')} className="px-5 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-all">
                Login
              </button>
              <button onClick={() => onNavigate('REGISTER')} className="px-6 py-2.5 text-sm font-black bg-white text-black rounded-full hover:scale-105 transition-all">
                Register
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('SETTINGS')}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-jiwa to-ilmu p-[2px] hover:scale-110 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-rpg-black flex items-center justify-center text-sm font-black text-white">
                {session.user.email?.[0].toUpperCase()}
              </div>
            </button>
          )}
        </div>

      </div>
    </nav>
  );
};

const NavPill = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all',
      active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-neutral-400 hover:text-white hover:bg-white/10'
    )}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);
