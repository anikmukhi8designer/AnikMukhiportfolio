
import React, { useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavBarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ isMenuOpen, setIsMenuOpen, theme, toggleTheme }) => {
  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border pointer-events-auto"
    >
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <a href="#" className="text-sm font-bold tracking-widest uppercase text-foreground z-50">
          Mukhi Anik
        </a>
        
        <div className="flex items-center gap-4 z-50">
          {/* Theme Toggle */}
          <button
              onClick={toggleTheme}
              className="p-2 border border-transparent hover:border-border hover:bg-secondary transition-all"
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
                          <Moon className="w-4 h-4" />
                      </motion.div>
                  ) : (
                      <motion.div
                          key="sun"
                          initial={{ rotate: 90, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          exit={{ rotate: -90, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                      >
                          <Sun className="w-4 h-4" />
                      </motion.div>
                  )}
              </AnimatePresence>
          </button>

          {/* Menu Toggle */}
          <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
          >
              <span className="hidden sm:block">{isMenuOpen ? 'Close' : 'Menu'}</span>
              <div className="w-8 h-8 flex items-center justify-center border border-border bg-background">
                <AnimatePresence mode='wait'>
                    {isMenuOpen ? (
                        <motion.div
                            key="close"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <X className="w-4 h-4" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="menu"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                        >
                            <Menu className="w-4 h-4" />
                        </motion.div>
                    )}
                </AnimatePresence>
              </div>
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default NavBar;
