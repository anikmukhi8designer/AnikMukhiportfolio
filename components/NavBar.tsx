import React, { useState, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

interface NavBarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const NavBar: React.FC<NavBarProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { scrollY, scrollYProgress } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    const current = latest;
    lastScrollY.current = current;

    // If menu is open, always keep navbar visible
    if (isMenuOpen) {
      if (!isVisible) setIsVisible(true);
      return;
    }

    // Always show if near top (threshold 50px)
    if (current < 50) {
      if (!isVisible) setIsVisible(true);
      return;
    }

    // Determine scroll direction
    const direction = current - previous;

    if (direction > 0) {
      // Scrolling down -> Hide
      if (isVisible) setIsVisible(false);
    } else if (direction < -5) { // Small threshold to prevent jitter
      // Scrolling up -> Show
      if (!isVisible) setIsVisible(true);
    }
  });

  return (
    <>
      <motion.header 
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-transparent text-neutral-900 pointer-events-none"
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
      </motion.header>

      {/* Scroll Progress Bar - Static at Top (independent of header visibility) */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-neutral-900 origin-left z-50 pointer-events-none"
        style={{ scaleX: scrollYProgress }}
      />
    </>
  );
};

export default NavBar;