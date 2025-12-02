import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Simulate loading time based on "resources"
    // In a real app, you might tie this to document.readyState or specific asset loading
    const duration = 2000; // 2 seconds total load time
    const intervalTime = 20;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setCount((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Cleanup and trigger complete
    const timeout = setTimeout(() => {
       clearInterval(timer);
       setCount(100);
       setTimeout(onComplete, 800); // Slight delay after 100% before lifting curtain
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-[#1a1a1a] flex flex-col items-center justify-center text-white overflow-hidden"
      initial={{ y: 0 }}
      exit={{ 
        y: "-100%", 
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
      }}
    >
        <div className="w-full max-w-md px-8">
            <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold uppercase tracking-widest text-neutral-500">
                    Mukhi Anik
                </span>
                <span className="text-6xl md:text-8xl font-bold tabular-nums leading-none">
                    {Math.round(count)}%
                </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-[1px] bg-neutral-800 relative overflow-hidden">
                <motion.div 
                    className="absolute left-0 top-0 bottom-0 bg-white"
                    style={{ width: `${count}%` }}
                />
            </div>
            
            <div className="mt-4 flex justify-between text-xs text-neutral-500 font-mono">
                <span>LOADING EXPERIENCE</span>
                <span className="animate-pulse">PLEASE WAIT</span>
            </div>
        </div>
    </motion.div>
  );
};

export default LoadingScreen;