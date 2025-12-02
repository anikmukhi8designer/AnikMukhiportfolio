import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, Variants } from 'framer-motion';

const CustomCursor: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  
  // Mouse position
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth physics for the movement
  const springConfig = { damping: 20, stiffness: 400, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    // Global Hover Detection
    const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInteractive = 
            target.tagName.toLowerCase() === 'a' || 
            target.tagName.toLowerCase() === 'button' || 
            target.closest('a') || 
            target.closest('button') ||
            target.classList.contains('cursor-pointer');
            
        setIsHovered(!!isInteractive);
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  // Animation Variants
  const variants: Variants = {
    default: {
      height: 12,
      width: 12,
      backgroundColor: "#ffffff",
      x: "-50%",
      y: "-50%",
      opacity: 1,
      mixBlendMode: "difference"
    },
    hover: {
      height: 64,
      width: 64,
      backgroundColor: "#ffffff",
      x: "-50%",
      y: "-50%",
      opacity: 1,
      mixBlendMode: "difference"
    },
    click: {
      height: 8,
      width: 8,
      backgroundColor: "#ffffff",
      x: "-50%",
      y: "-50%",
      mixBlendMode: "difference"
    }
  };

  return (
    <>
        {/* Main Cursor Dot */}
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full hidden md:block"
            style={{
                left: cursorXSpring,
                top: cursorYSpring,
            }}
            variants={variants}
            animate={isClicked ? 'click' : isHovered ? 'hover' : 'default'}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
        />
        
        {/* Optional: Second following ring for extra flair - also using difference mode */}
        <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full border border-white mix-blend-difference hidden md:block"
            style={{
                left: cursorXSpring,
                top: cursorYSpring,
            }}
            animate={{
                width: isHovered ? 0 : 40,
                height: isHovered ? 0 : 40,
                x: "-50%",
                y: "-50%",
                opacity: isHovered ? 0 : 1
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.05 }}
        />
    </>
  );
};

export default CustomCursor;