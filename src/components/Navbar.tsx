import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface NavbarProps {
  session: Session | null;
  onNavigate: (page: any) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ session, onNavigate, currentPage }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-center pointer-events-none">
      <nav className="w-full max-w-7xl flex items-center justify-between px-6 py-3 glass-panel border-white/10 bg-rpg-black/40 backdrop-blur-xl shadow-2xl pointer-events-auto">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate('LANDING')}
        >
          <div className="w-8 h-8 bg-gradient-to-tr from-jiwa to-ilmu rounded-lg flex items-center justify-center shadow-lg shadow-jiwa/20 group-hover:rotate-12 transition-transform">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-black tracking-widest text-lg bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">ARUTHA</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {!session ? (
            <>
              <button 
                onClick={() => onNavigate('LOGIN')}
                className={`px-4 py-2 text-xs md:text-sm font-bold tracking-widest transition-all rounded-full hover:bg-white/5 ${
                  currentPage === 'LOGIN' ? 'text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                LOGIN
              </button>
              <button 
                onClick={() => onNavigate('REGISTER')}
                className="px-6 py-2.5 text-xs md:text-sm font-black tracking-widest bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                REGISTER
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('DASHBOARD')}
                className={`px-4 py-2 text-xs md:text-sm font-bold tracking-widest transition-all rounded-full hover:bg-white/5 ${
                  currentPage === 'DASHBOARD' ? 'text-white' : 'text-neutral-500 hover:text-white'
                }`}
              >
                DASHBOARD
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-jiwa to-ilmu p-[1px]">
                <div className="w-full h-full rounded-full bg-rpg-black flex items-center justify-center text-[10px] font-black">
                  P1
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};
