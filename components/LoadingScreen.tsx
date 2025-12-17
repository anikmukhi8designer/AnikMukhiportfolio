import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Duration matches the animation time + small buffer
    const timer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] bg-black flex items-center justify-center overflow-hidden"
      exit={{ 
        opacity: 0,
        transition: { duration: 0.8, ease: "easeInOut" } 
      }}
    >
        <div className="w-full max-w-7xl px-8 relative">
            <svg viewBox="0 0 1200 300" className="w-full h-auto text-white overflow-visible">
                
                {/* Start Node: White Square */}
                <motion.rect
                    x="0" y="145" width="10" height="10" fill="currentColor"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />

                {/* Path 1: Main Flow (Straight -> Curve Down -> Up -> Straight) */}
                <motion.path
                    d="M 15 150 L 300 150 C 450 150 500 250 650 250 C 800 250 850 150 1000 150 L 1150 150"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                        duration: 2.2, 
                        ease: [0.16, 1, 0.3, 1], // Expo ease for sleek feel
                        delay: 0.2 
                    }}
                />

                {/* Path 2: Diverging Flow (Splits and Re-joins/Crosses) */}
                <motion.path
                    d="M 300 150 C 450 150 500 50 650 50 C 800 50 850 150 1000 150"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.5 }} // Lower opacity for secondary path
                    transition={{ 
                        duration: 2.2, 
                        ease: [0.16, 1, 0.3, 1], 
                        delay: 0.2 
                    }}
                />

                {/* Path 3: Branching Off (Upwards at the end) */}
                <motion.path
                    d="M 900 150 C 950 150 1000 100 1050 50"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ 
                        duration: 1.5, 
                        ease: "easeOut", 
                        delay: 1 
                    }}
                />

                {/* Arrow Head: Main Path */}
                <motion.path
                    d="M 1140 140 L 1150 150 L 1140 160"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.2, duration: 0.4 }}
                />

                {/* Arrow Head: Branching Path */}
                <motion.path
                    d="M 1040 55 L 1050 50 L 1045 65"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ opacity: 0, x: -5, y: 5 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ delay: 2.3, duration: 0.4 }}
                />

            </svg>
        </div>
    </motion.div>
  );
};

export default LoadingScreen;