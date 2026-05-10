import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, disabled = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const y = useMotionValue(0);
  const controls = useAnimation();
  
  // Maximum pull distance
  const PULL_THRESHOLD = 80;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || window.scrollY > 0) return; // Only trigger at top
    (e.currentTarget as any)._startY = e.touches[0].pageY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || window.scrollY > 0 || isRefreshing) return;

    const touch = e.touches[0];
    const startY = (e.currentTarget as any)._startY || touch.pageY;
    (e.currentTarget as any)._startY = startY;

    const distance = touch.pageY - startY;
    if (distance > 0) {
      // Use a resistance factor so it gets harder to pull
      const resistance = 0.4;
      const dampedDistance = distance * resistance;
      y.set(Math.min(dampedDistance, PULL_THRESHOLD + 20));
      setPullProgress(Math.min(dampedDistance / PULL_THRESHOLD, 1));
      
      // Prevent browser default pull-to-refresh if we are handling it
      if (distance > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    const currentY = y.get();
    if (currentY >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      // Snap to threshold while refreshing
      await controls.start({ y: PULL_THRESHOLD, transition: { type: 'spring', stiffness: 300, damping: 30 } });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullProgress(0);
        await controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
      }
    } else {
      setPullProgress(0);
      await controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-x-hidden"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchStart={handleTouchStart}
    >
      {/* Pull Indicator */}
      <motion.div 
        style={{ y: useTransform(y, [0, PULL_THRESHOLD], [-40, 10]), opacity: useTransform(y, [0, PULL_THRESHOLD], [0, 1]) }}
        className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-2 shadow-2xl">
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : { rotate: pullProgress * 180 }}
            transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: 'spring' }}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'text-jiwa' : 'text-white/60'}`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        animate={controls}
        style={{ y }}
        className="w-full h-full min-h-screen"
      >
        {children}
      </motion.div>
    </div>
  );
};
