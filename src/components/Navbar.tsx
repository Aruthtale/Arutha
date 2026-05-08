import React from 'react';
import { Zap, LayoutGrid, User, LogIn } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface NavbarProps {
  session: Session | null;
  onNavigate: (page: any) => void;
  currentPage: string;
}

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-full transition-all text-[10px] md:text-sm font-medium ${
      active ? 'bg-white text-black' : 'text-neutral-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export const Navbar: React.FC<NavbarProps> = ({ session, onNavigate, currentPage }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between pointer-events-auto">
        <button 
          onClick={() => onNavigate('LANDING')} 
          className="text-xl md:text-2xl font-black tracking-tighter hover:opacity-80 transition-all flex items-center gap-2 group"
        >
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg group-hover:rotate-12 transition-transform text-base md:text-lg">A</div>
          <span className="hidden sm:inline">ARUTHA</span>
        </button>

        {session && (
          <div className="flex items-center gap-1 sm:gap-2 p-1.5 glass-panel rounded-full neo-blur">
            <NavButton active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid className="w-4 h-4" />} label="Home" />
            <NavButton active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<User className="w-4 h-4" />} label="Profile" />
          </div>
        )}

        <div className="flex items-center gap-2">
          {!session ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigate('LOGIN')}
                className="p-2 text-neutral-400 hover:text-white transition-all sm:hidden"
              >
                <LogIn className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onNavigate('LOGIN')}
                className="hidden sm:block px-4 py-2 text-xs font-bold tracking-widest text-neutral-400 hover:text-white transition-all"
              >
                LOGIN
              </button>
              <button 
                onClick={() => onNavigate('REGISTER')}
                className="px-5 py-2 text-xs font-black tracking-widest bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg shadow-white/10"
              >
                <span className="sm:inline hidden">REGISTER</span>
                <span className="sm:hidden">JOIN</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-jiwa to-ilmu p-[1px] cursor-pointer hover:scale-110 transition-transform flex items-center justify-center" 
                onClick={() => onNavigate('PROFILE')}
              >
                <div className="w-full h-full rounded-full bg-rpg-black flex items-center justify-center text-[10px] font-black text-white">
                  {session.user.email?.[0].toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
