import React, { useState, useRef } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

interface NavBarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ isMenuOpen, setIsMenuOpen, theme, toggleTheme }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { scrollY, scrollYProgress } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    const current = latest;
    lastScrollY.current = current;

    if (isMenuOpen) {
      if (!isVisible) setIsVisible(true);
      return;
    }

    if (current < 50) {
      if (!isVisible) setIsVisible(true);
      return;
    }

    const direction = current - previous;

    if (direction > 0) {
      if (isVisible) setIsVisible(false);
    } else if (direction < -5) {
      if (!isVisible) setIsVisible(true);
    }
  });

  return (
    <>
      <motion.header 
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-white/20 dark:border-white/5 text-neutral-900 dark:text-white pointer-events-none transition-all duration-300"
      >
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between pointer-events-auto relative">
          <a href="#" className="text-lg font-bold tracking-tight z-50">
            Mukhi Anik
          </a>
          
          <div className="flex items-center gap-6 z-50">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                <AnimatePresence mode="wait">
                    {theme === 'light' ? (
                        <motion.div
                            key="moon"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Moon className="w-5 h-5" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sun"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Sun className="w-5 h-5" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Menu Toggle */}
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="group relative flex items-center gap-2 text-sm font-medium uppercase tracking-widest hover:opacity-70 transition-opacity"
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
        </div>
      </motion.header>

      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 origin-left z-50 pointer-events-none"
        style={{ scaleX: scrollYProgress }}
      />
    </>
  );
};

export default NavBar;