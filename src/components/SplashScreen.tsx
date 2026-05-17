import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const quotes = [
  "Menimbang berat jiwamu...",
  "Membuka gulungan takdir...",
  "Menghitung jejak karma...",
  "Menyinkronkan realita...",
  "Mempersiapkan arena kehidupan...",
  "Mencari sisa-sisa tekad...",
  "Menenun benang nasib..."
];

export const SplashScreen: React.FC<{ isReady: boolean }> = ({ isReady }) => {
  const [show, setShow] = useState(() => {
    const shown = sessionStorage.getItem('arutha_splash_shown');
    return !shown;
  });
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    if (isReady && show) {
      // Give it a small extra delay for smooth feel
      const timer = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem('arutha_splash_shown', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isReady, show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            scale: 1.1,
            filter: "blur(20px)",
            transition: { duration: 0.8, ease: "easeInOut" }
          }}
          className="fixed inset-0 z-[9999] bg-rpg-black flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Ambient Background Glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute w-[80vw] h-[80vw] bg-jiwa/10 blur-[120px] rounded-full"
          />

          <div className="relative flex flex-col items-center">
            {/* Logo with Glow Effect */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-jiwa/30 blur-[40px] rounded-full animate-pulse" />
              <img 
                src="/Arutha.png" 
                alt="Arutha" 
                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-[40px] relative z-10 border border-white/10 shadow-2xl"
              />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-rpg-text">ARUTHA</h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-rpg-text/20" />
                <span className="text-[10px] font-black tracking-[0.4em] text-rpg-text/40 uppercase">Aruthtale Chronicles</span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-rpg-text/20" />
              </div>
            </motion.div>

            {/* Quote / Loading Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-64 text-center"
            >
              <p className="text-[10px] font-black tracking-widest text-neutral-400 uppercase italic opacity-50 animate-pulse">
                {quote}
              </p>
              
              {/* Custom Loading Bar */}
              <div className="w-full h-[2px] bg-white/5 mt-4 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: isReady ? "0%" : "-20%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="w-full h-full bg-gradient-to-r from-transparent via-jiwa to-transparent shadow-[0_0_10px_rgba(167,139,250,0.5)]"
                />
              </div>
            </motion.div>
          </div>

          {/* Version Tag */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20">
            <span className="text-[8px] font-mono tracking-widest text-rpg-text uppercase">V 1.0.4 - THE AWAKENING</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
