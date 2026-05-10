import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Auth } from '../components/Auth';

interface RegisterProps {
  onBack: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start md:justify-center p-6 bg-rpg-black relative overflow-y-auto overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ilmu/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.button 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack} 
        className="fixed top-6 left-6 z-50 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-white font-bold text-sm flex items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all shadow-xl backdrop-blur-md group"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
        Back to Home
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full flex justify-center py-12 md:py-20 mt-16 md:mt-0"
      >
        <Auth initialIsRegister={true} />
      </motion.div>
    </div>
  );
};
