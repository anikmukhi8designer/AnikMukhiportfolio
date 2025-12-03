import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, Variants } from 'framer-motion';

const CustomCursor: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  
  // Mouse position
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth physics for the movement
  const springConfig = { damping: 20, stiffness: 450, mass: 0.5 };
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
            target.tagName.toLowerCase() === 'input' || 
            target.tagName.toLowerCase() === 'textarea' || 
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
      height: 20,
      width: 20,
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    hover: {
      height: 48,
      width: 48,
      x: "-50%",
      y: "-50%",
      opacity: 1,
    },
    click: {
      height: 16,
      width: 16,
      x: "-50%",
      y: "-50%",
    }
  };

  return (
    <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full hidden md:block mix-blend-difference bg-white"
        style={{
            left: cursorXSpring,
            top: cursorYSpring,
        }}
        variants={variants}
        animate={isClicked ? 'click' : isHovered ? 'hover' : 'default'}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
    />
  );
};

export default CustomCursor;