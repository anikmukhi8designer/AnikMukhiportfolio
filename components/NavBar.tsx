import React from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavBarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

const NavBar: React.FC<NavBarProps> = ({ isMenuOpen, setIsMenuOpen }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 mix-blend-difference text-white">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
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
    </header>
  );
};

export default NavBar;
