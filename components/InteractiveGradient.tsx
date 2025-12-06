import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const InteractiveGradient: React.FC = () => {
  // Mouse position as percentage (0 to 1)
  const mouseX = useMotionValue(0.5); 
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 50, mass: 0.8 }; // Floaty but responsive
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Layer 1: Parallax background (moves opposite)
  const x1 = useTransform(smoothX, [0, 1], [-50, 50]);
  const y1 = useTransform(smoothY, [0, 1], [-50, 50]);

  // Layer 2: Foreground (moves with mouse)
  const x2 = useTransform(smoothX, [0, 1], [30, -30]);
  const y2 = useTransform(smoothY, [0, 1], [30, -30]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth);
      mouseY.set(e.clientY / innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      
      {/* 
         Enhanced Gradient Blobs 
         Dark mode: deeper colors, lower opacity to merge with dark bg
      */}
      
      {/* Top Left: Deep Indigo/Purple */}
      <motion.div 
        style={{ x: x1, y: y1 }}
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-transparent dark:from-indigo-900/20 dark:via-purple-900/10 blur-[120px]"
      />
      
      {/* Bottom Right: Cyan/Blue */}
      <motion.div 
        style={{ x: x2, y: y2 }}
        className="absolute top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-tl from-cyan-500/30 via-blue-500/30 to-transparent dark:from-cyan-900/20 dark:via-blue-900/10 blur-[120px]"
      />

      {/* Center Dynamic: Pink/Fuchsia Accent */}
      <motion.div
        style={{ 
            x: useTransform(smoothX, [0, 1], [-20, 20]),
            y: useTransform(smoothY, [0, 1], [-20, 20]),
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-pink-500/20 dark:bg-pink-900/10 blur-[100px]"
      />

    </div>
  );
};

export default InteractiveGradient;