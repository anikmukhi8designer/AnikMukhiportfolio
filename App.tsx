import React, { useState, useEffect, useRef } from 'react';
import './index.css'; // Import the new Design System
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
import LoadingScreen from './components/LoadingScreen';
import WaterRippleEffect, { WaterRippleRef } from './components/WaterRippleEffect';
import { SOCIALS } from './data';
import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// CMS Imports
import { DataProvider, useData } from './contexts/DataContext';
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/admin/Dashboard';
import BlockEditor from './components/admin/BlockEditor';

const AdminRoute = () => {
    // Check localStorage for persisted session
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
        return localStorage.getItem('cms_authenticated') === 'true';
    });
    
    const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const { projects, updateProject } = useData();

    if (!isAdminLoggedIn) {
        return <AdminLogin onLogin={() => {
            localStorage.setItem('cms_authenticated', 'true');
            setIsAdminLoggedIn(true);
        }} />;
    }

    if (currentView === 'editor' && editingProjectId) {
        const projectToEdit = projects.find(p => p.id === editingProjectId);
        if (projectToEdit) {
            return (
                <BlockEditor 
                    project={projectToEdit} 
                    onSave={(updated) => {
                        updateProject(updated.id, updated);
                        // Optional: stay on page or go back
                    }}
                    onBack={() => {
                        setEditingProjectId(null);
                        setCurrentView('dashboard');
                    }}
                />
            );
        }
    }

    return (
        <Dashboard 
            onLogout={() => { 
                localStorage.removeItem('cms_authenticated');
                setIsAdminLoggedIn(false); 
                window.location.hash = '';
                window.location.reload();
            }}
            onEditProject={(id) => {
                setEditingProjectId(id);
                setCurrentView('editor');
            }}
        />
    );
};

const AppContent: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Parallax Animations for Hero
  const { scrollY } = useScroll();
  const heroTextY = useTransform(scrollY, [0, 500], [0, 150]); // Text moves slower
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]); // Fade out

  // Ripple Ref
  const rippleRef = useRef<WaterRippleRef>(null);

  const handleRippleHover = (e: React.MouseEvent) => {
      if (rippleRef.current) {
          rippleRef.current.trigger(e.clientX, e.clientY);
      }
  };

  useEffect(() => {
    if (window.location.hash === '#admin') {
      setIsAdminMode(true);
      setIsLoading(false); // No loader for admin
    }
    const handleHashChange = () => {
        if (window.location.hash === '#admin') setIsAdminMode(true);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isAdminMode) {
      return <AdminRoute />;
  }
  
  // Public Portfolio Route
  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white cursor-none">
      
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      {/* Custom Cursor (Hidden on Touch Devices via CSS) */}
      <CustomCursor />
      <ScrollToTop />

      {/* Navigation System */}
      <NavBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      
      <SplitNavPanel 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onProjectClick={setSelectedProject}
      />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="min-h-[90vh] flex flex-col justify-center px-4 md:px-8 max-w-screen-xl mx-auto relative overflow-hidden group">
          
          {/* Colorful Ripple Background */}
          <WaterRippleEffect ref={rippleRef} />

          {/* Main Content with Parallax */}
          <motion.div 
            style={{ y: heroTextY, opacity: heroOpacity }}
            className="relative z-10"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 60 }}
              animate={!isLoading ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              onMouseMove={handleRippleHover}
              className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter max-w-6xl mb-12 relative z-10 leading-[0.9] cursor-default"
            >
              Product Designer <br />
              <span className="text-neutral-400">& Creative Dev.</span>
            </motion.h1>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={!isLoading ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-12 items-start max-w-2xl"
            >
                <div onMouseMove={handleRippleHover} className="cursor-default">
                    <p className="text-lg md:text-2xl text-neutral-600 leading-relaxed max-w-xl">
                    Building digital products that blend aesthetics with function. Currently crafting experiences in San Francisco.
                    </p>
                </div>
                
                <a 
                    href="#work" 
                    onMouseMove={handleRippleHover}
                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-500 transition-colors z-20"
                >
                    Explore Work <ArrowDown className="w-4 h-4 animate-bounce" />
                </a>
            </motion.div>
          </motion.div>
        </section>

        {/* Clients Section */}
        <ClientsSection />

        {/* Work Section */}
        <WorkSection onProjectClick={setSelectedProject} />

        {/* Experience Section */}
        <div id="experience">
          <ExperienceSection />
        </div>

        {/* Skills Section */}
        <SkillsSection />

      </main>

      {/* Footer */}
      <footer id="contact" className="py-24 bg-neutral-900 text-neutral-400">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Let's build something great.</h2>
              <a href="mailto:hello@example.com" className="text-2xl md:text-3xl font-medium text-white border-b border-white/30 hover:border-white pb-2 transition-colors">
                hello@mukhianik.com
              </a>
            </div>
            <div className="flex flex-col justify-end items-start md:items-end gap-4">
              {SOCIALS.map(social => (
                <a key={social.platform} href={social.url} className="text-lg hover:text-white transition-colors">
                  {social.platform}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-sm border-t border-neutral-800 pt-8">
            <p>&copy; {new Date().getFullYear()} Mukhi Anik. All rights reserved.</p>
            <div className="flex gap-4">
                <p>Designed with New Genre Principles.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Case Study Modal */}
      <Modal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    </div>
  );
};

const App: React.FC = () => {
    return (
        <DataProvider>
            <AppContent />
        </DataProvider>
    );
};

export default App;