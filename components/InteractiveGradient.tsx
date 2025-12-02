import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const InteractiveGradient: React.FC = () => {
  // Mouse position as percentage (0 to 1)
  const mouseX = useMotionValue(0.5); 
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 50, mass: 0.5 }; // Very floaty physics
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Map normalized mouse position to translation pixels
  // Layer 1: Moves opposite to mouse (Parallax depth)
  const x1 = useTransform(smoothX, [0, 1], [-60, 60]);
  const y1 = useTransform(smoothY, [0, 1], [-60, 60]);

  // Layer 2: Moves with mouse (Foreground feel)
  const x2 = useTransform(smoothX, [0, 1], [40, -40]);
  const y2 = useTransform(smoothY, [0, 1], [40, -40]);

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
      
      {/* Top Left - Enhanced Indigo/Purple Haze for visibility */}
      <motion.div 
        style={{ x: x1, y: y1 }}
        className="absolute -top-[20%] -left-[10%] w-[90%] h-[90%] rounded-full bg-gradient-to-br from-indigo-300/60 via-purple-300/40 to-transparent blur-[140px] opacity-80 mix-blend-multiply will-change-transform"
      />
      
      {/* Bottom Right - Enhanced Teal/Blue Haze */}
      <motion.div 
        style={{ x: x2, y: y2 }}
        className="absolute top-[10%] -right-[20%] w-[80%] h-[100%] rounded-full bg-gradient-to-bl from-blue-300/60 via-teal-300/30 to-transparent blur-[120px] opacity-80 mix-blend-multiply will-change-transform"
      />

      {/* Center/Dynamic Accent */}
      <motion.div
        style={{ 
            x: useTransform(smoothX, [0, 1], [-30, 30]),
            y: useTransform(smoothY, [0, 1], [-30, 30]),
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-fuchsia-200/50 blur-[100px] mix-blend-multiply opacity-60"
      />

    </div>
  );
};

export default InteractiveGradient;