import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import { Project } from './types';
import WorkSection from './components/WorkSection';
import ExperienceSection from './components/ExperienceSection';
import ClientsSection from './components/ClientsSection';
import SkillsSection from './components/SkillsSection';
import Modal from './components/Modal';
import NavBar from './components/NavBar';
import SplitNavPanel from './components/SplitNavPanel';
import CustomCursor from './components/CustomCursor';
import ScrollToTop from './components/ScrollToTop';
import WaterRippleEffect, { WaterRippleRef } from './components/WaterRippleEffect';
import { ArrowDown, Save, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { DataProvider, useData } from './contexts/DataContext';
import { toast, Toaster } from 'sonner';

const OnPageEditorBar = () => {
    const { hasUnsavedChanges, isSaving, saveAllData, discardChanges, isEditMode } = useData();
    
    if (!isEditMode || !hasUnsavedChanges) return null;

    const handleConfirmUpdate = async () => {
        const confirm = window.confirm("PUSH UPDATES TO LIVE SITE?\n\nThis will synchronize your visual edits with the GitHub repository. Changes will be visible to all users immediately.");
        if (confirm) {
            try {
                await saveAllData("User Update: Content refreshed via On-Page Editor");
                toast.success("Site successfully updated!");
            } catch (e: any) {
                toast.error("Sync failed: " + e.message);
            }
        }
    };

    return (
        <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] w-[90vw] max-w-2xl"
        >
            <div className="bg-neutral-900 border border-white/10 text-white p-4 md:p-6 rounded-2xl shadow-2xl flex items-center justify-between gap-6 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center animate-pulse">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold uppercase tracking-widest">Unsaved Visual Edits</p>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest">Changes are local only</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={discardChanges}
                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleConfirmUpdate}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Confirm & Update Live
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const AppContent: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { config, updateConfigInMemory, isEditMode, socials } = useData();
  const rippleRef = useRef<WaterRippleRef>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const { scrollY } = useScroll();
  const heroTextY = useTransform(scrollY, [0, 500], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
      rippleRef.current?.trigger(e.clientX, e.clientY);
  };

  return (
    <div 
      className={`min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-primary-foreground cursor-none ${isEditMode ? 'pt-16' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <Toaster position="top-center" richColors />
      <CustomCursor />
      <ScrollToTop />
      <OnPageEditorBar />

      <NavBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
      <SplitNavPanel isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onProjectClick={setSelectedProject} />

      <main className="relative z-10">
        <section className="min-h-[90vh] flex flex-col justify-center px-4 md:px-6 max-w-screen-2xl mx-auto border-x border-border/30 relative">
          
          {/* Subtle Background Interaction */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-40">
            <WaterRippleEffect ref={rippleRef} />
          </div>

          <motion.div style={{ y: heroTextY }} className="relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6 flex items-center gap-4">
                <div className="h-px w-12 bg-primary"></div>
                <span className="text-xs uppercase tracking-widest text-primary font-bold">
                    {isEditMode ? 'On-Page Editor Active' : 'Product Design Studio'}
                </span>
            </motion.div>

            <div className="relative group">
                {isEditMode ? (
                    <textarea 
                        value={config.heroHeadline}
                        onChange={(e) => updateConfigInMemory({ heroHeadline: e.target.value })}
                        className="w-full bg-transparent border-none p-0 text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter mb-4 leading-[0.9] focus:ring-0 resize-none text-foreground"
                        rows={2}
                    />
                ) : (
                    <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter mb-8 leading-[0.9] text-foreground">
                        {config.heroHeadline} <br />
                        <span className="text-muted-foreground">{config.heroSubheadline}</span>
                    </h1>
                )}
            </div>

            <div className="max-w-xl">
                {isEditMode ? (
                    <textarea 
                        value={config.heroDescription}
                        onChange={(e) => updateConfigInMemory({ heroDescription: e.target.value })}
                        className="w-full bg-neutral-100/50 dark:bg-neutral-900/50 p-6 text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 border-l-2 border-primary focus:ring-0 outline-none resize-none"
                        rows={4}
                    />
                ) : (
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 border-l-2 border-primary/50 pl-6">
                        {config.heroDescription}
                    </p>
                )}
                
                <a href="#work" className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors group">
                    <span className="w-8 h-8 flex items-center justify-center border border-border rounded-full group-hover:border-primary transition-colors">
                        <ArrowDown className="w-4 h-4 group-hover:animate-bounce" />
                    </span>
                    Scroll to Explore
                </a>
            </div>
          </motion.div>
        </section>

        <ClientsSection />
        <WorkSection onProjectClick={setSelectedProject} />
        <ExperienceSection />
        <SkillsSection />
      </main>

      <footer id="contact" className="py-24 border-t border-border bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tighter leading-none">Let's build<br/>something great.</h2>
              <a href={`mailto:${config.email}`} className="text-2xl md:text-3xl font-bold text-primary hover:text-foreground transition-colors underline decoration-2 underline-offset-8 decoration-border hover:decoration-primary">
                {config.email}
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-widest text-muted-foreground border-t border-border pt-8">
            <p>&copy; {new Date().getFullYear()} Mukhi Anik. All rights reserved.</p>
            <p className="font-mono">Built with New Genre Principles</p>
          </div>
        </div>
      </footer>

      <Modal project={selectedProject} onClose={() => setSelectedProject(null)} onProjectClick={setSelectedProject} />
    </div>
  );
};

const App: React.FC = () => (
    <DataProvider>
        <AppContent />
    </DataProvider>
);

export default App;