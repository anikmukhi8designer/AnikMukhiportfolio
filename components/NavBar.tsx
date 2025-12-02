import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

interface NavBarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const NavBar: React.FC<NavBarProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { scrollY, scrollYProgress } = useScroll();
  const [lastScrollY, setLastScrollY] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY;
    setLastScrollY(latest);

    // If menu is open, always keep navbar visible
    if (isMenuOpen) {
      setIsVisible(true);
      return;
    }

    // Show if near top
    if (latest < 50) {
      setIsVisible(true);
      return;
    }

    // Hide if scrolling down, Show if scrolling up
    if (latest > previous && latest > 50) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  });

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 mix-blend-difference text-white pointer-events-none"
    >
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between pointer-events-auto relative">
        <a href="#" className="text-lg font-bold tracking-tight z-50">
          Mukhi Anik
        </a>
        
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="group relative flex items-center gap-2 z-50 text-sm font-medium uppercase tracking-widest hover:opacity-70 transition-opacity"
        >
          <span className="hidden sm:block">{isMenuOpen ? 'Close' : 'Menu'}</span>
          <div className="relative w-8 h-8 flex items-center justify-center">
             <AnimatePresence mode='wait'>
                {isMenuOpen ? (
                    <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <X className="w-6 h-6" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Menu className="w-6 h-6" />
                    </motion.div>
                )}
             </AnimatePresence>
          </div>
        </button>
      </div>

      {/* Scroll Progress Bar */}
      <motion.div 
        className="absolute bottom-0 left-0 h-[2px] bg-white origin-left"
        style={{ scaleX: scrollYProgress, width: '100%' }}
      />
    </motion.header>
  );
};

export default NavBar;