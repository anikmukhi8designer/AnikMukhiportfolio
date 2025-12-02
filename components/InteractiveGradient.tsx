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
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-[1]">
      
      {/* Top Left - Stronger Violet/Indigo */}
      <motion.div 
        style={{ x: x1, y: y1 }}
        className="absolute -top-[15%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-violet-400/40 via-indigo-400/40 to-transparent blur-[100px] will-change-transform"
      />
      
      {/* Bottom Right - Stronger Blue/Cyan */}
      <motion.div 
        style={{ x: x2, y: y2 }}
        className="absolute top-[20%] -right-[15%] w-[80%] h-[80%] rounded-full bg-gradient-to-bl from-blue-400/40 via-cyan-300/40 to-transparent blur-[90px] will-change-transform"
      />

      {/* Center/Dynamic Accent - Pink/Purple */}
      <motion.div
        style={{ 
            x: useTransform(smoothX, [0, 1], [-30, 30]),
            y: useTransform(smoothY, [0, 1], [-30, 30]),
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full bg-fuchsia-400/30 blur-[120px]"
      />

    </div>
  );
};

export default InteractiveGradient;