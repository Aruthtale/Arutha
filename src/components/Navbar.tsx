import React from 'react';
import { LayoutGrid, User, Map, ShieldAlert, Contact2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { cn } from '../lib/utils';

interface NavbarProps {
  session: Session | null;
  userName: string;
  onNavigate: (page: any) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ session, userName, onNavigate, currentPage }) => {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-rpg-black/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">

          {/* Logo Section */}
          <button
            onClick={() => onNavigate('LANDING')}
            className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity"
          >
            <img src="/Arutha.png" alt="Arutha Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl object-cover shadow-lg border border-white/10" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-xl font-black tracking-tighter text-neutral-200">ARUTHA</span>
              {session && (
                <span className="text-[10px] font-bold text-harta uppercase tracking-[0.2em] mt-1 line-clamp-1 max-w-[120px] md:max-w-none">
                  {userName}
                </span>
              )}
            </div>
          </button>

          {/* Center Nav Pills - Desktop Only */}
          {session && (
            <div className="hidden sm:flex items-center gap-2 p-1.5 bg-white/5 rounded-full border border-white/10">
              <NavPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid className="w-5 h-5" />} label="Home" />
              <NavPill active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<Contact2 className="w-5 h-5" />} label="Profile" />
              <NavPill active={false} onClick={() => {}} icon={<Map className="w-5 h-5" />} label="Quests" />
              <NavPill active={currentPage === 'SETTINGS'} onClick={() => onNavigate('SETTINGS')} icon={<User className="w-5 h-5" />} label="Settings" />
              {session.user.email === 'aruthtale@gmail.com' && (
                <NavPill active={currentPage === 'ADMIN'} onClick={() => onNavigate('ADMIN')} icon={<ShieldAlert className="w-5 h-5 text-jiwa" />} label="Admin" />
              )}
            </div>
          )}

          {/* Right: Avatar / Login */}
          <div className="flex items-center gap-3 shrink-0">
            {session ? (
              <button
                onClick={() => onNavigate('PROFILE')}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-jiwa to-ilmu p-[2px] hover:scale-110 transition-transform hidden sm:block"
              >
                <div className="w-full h-full rounded-full bg-rpg-black flex items-center justify-center text-sm font-black text-neutral-200">
                  {session.user.email?.[0].toUpperCase()}
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => onNavigate('LOGIN')} className="hidden sm:block px-5 py-2 text-sm font-bold text-neutral-400 hover:text-white">
                  Login
                </button>
                <button onClick={() => onNavigate('REGISTER')} className="px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-black bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg">
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile Only */}
      {session && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-rpg-black/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around px-2 py-2">
            <MobileNavPill active={currentPage === 'DASHBOARD'} onClick={() => onNavigate('DASHBOARD')} icon={<LayoutGrid />} label="Home" />
            <MobileNavPill active={currentPage === 'PROFILE'} onClick={() => onNavigate('PROFILE')} icon={<Contact2 />} label="Profile" />
            <MobileNavPill active={false} onClick={() => {}} icon={<Map />} label="Quests" />
            <MobileNavPill active={currentPage === 'SETTINGS'} onClick={() => onNavigate('SETTINGS')} icon={<User />} label="Settings" />
            {session.user.email === 'aruthtale@gmail.com' && (
              <MobileNavPill active={currentPage === 'ADMIN'} onClick={() => onNavigate('ADMIN')} icon={<ShieldAlert className="text-jiwa" />} label="Admin" />
            )}
          </div>
        </nav>
      )}
    </>
  );
};

const NavPill = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all',
      active ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-neutral-400 hover:text-white hover:bg-white/10'
    )}
    title={label}
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
