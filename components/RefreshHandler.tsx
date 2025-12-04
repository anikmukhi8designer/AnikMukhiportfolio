import React from 'react';
import { useData } from '../contexts/DataContext';
import { RefreshCw, ArrowUpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RefreshHandler: React.FC = () => {
  const { hasNewVersion, reloadContent } = useData();

  return (
    <AnimatePresence>
      {hasNewVersion && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-neutral-900 text-white px-6 py-3 rounded-full shadow-2xl cursor-pointer hover:bg-black transition-colors"
          onClick={reloadContent}
        >
          <div className="relative">
             <RefreshCw className="w-5 h-5 animate-spin-slow" />
             <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-neutral-900"></div>
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-bold">New Update Available</span>
             <span className="text-[10px] text-neutral-400">Click to refresh content</span>
          </div>
          <ArrowUpCircle className="w-5 h-5 text-neutral-500" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RefreshHandler;