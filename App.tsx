import React, { useState, useEffect } from 'react';
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
import LoadingScreen from './components/LoadingScreen';
import InteractiveGradient from './components/InteractiveGradient';
import RefreshHandler from './components/RefreshHandler';
import { ArrowDown, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// CMS Imports
import { DataProvider, useData } from './contexts/DataContext';
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/admin/Dashboard';
import BlockEditor from './components/admin/BlockEditor';
import UpdatePassword from './components/admin/UpdatePassword';
import { supabase } from './src/supabaseClient'; 

const AdminRoute = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [isRecovery, setIsRecovery] = useState(false);
    const { projects, updateProject } = useData();

    // Check Auth via Supabase Client
    const checkAuth = async () => {
        try {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
                setUser(data.session.user);
            } else {
                setUser(null);
            }
        } catch (e) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
        
        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovery(true);
            }

            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setIsRecovery(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                 <div className="w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isRecovery) {
        return <UpdatePassword onComplete={() => setIsRecovery(false)} />;
    }

    if (!user) {
        return <AdminLogin onLogin={checkAuth} />;
    }

    if (currentView === 'editor' && editingProjectId) {
        const projectToEdit = projects.find(p => p.id === editingProjectId);
        if (projectToEdit) {
            return (
                <BlockEditor 
                    project={projectToEdit} 
                    onSave={(updated) => {
                        updateProject(updated.id, updated);
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
            onLogout={handleLogout}
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const { socials, config } = useData();

  // Parallax Animations
  const { scrollY } = useScroll();
  const heroTextY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    // Check Routes
    if (window.location.hash === '#admin' || window.location.hash.startsWith('#admin/')) {
      setIsAdminMode(true);
      setIsLoading(false);
    } else if (window.location.pathname === '/preview') {
        setIsPreviewMode(true);
    }

    const handleHashChange = () => {
        if (window.location.hash === '#admin' || window.location.hash.startsWith('#admin/')) {
            setIsAdminMode(true);
        }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isAdminMode) {
      return <AdminRoute />;
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 font-sans selection:bg-neutral-900 dark:selection:bg-white selection:text-white dark:selection:text-black cursor-none relative transition-colors duration-500 gradient-bg">
      
      <RefreshHandler />

      {isPreviewMode && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-orange-500 text-white px-6 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-4 h-4" />
              Preview Mode
              <a href="/#admin" className="ml-2 underline opacity-80 hover:opacity-100">Back to Admin</a>
          </div>
      )}

      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      <InteractiveGradient />
      <CustomCursor />
      <ScrollToTop />

      <NavBar 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <SplitNavPanel 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onProjectClick={setSelectedProject}
      />

      <main className="pt-20 relative z-10">
        <section className="min-h-[90vh] flex flex-col justify-center px-4 md:px-8 max-w-screen-xl mx-auto relative overflow-hidden group">
          
          <motion.div 
            style={{ y: heroTextY, opacity: heroOpacity }}
            className="relative z-10"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 60 }}
              animate={!isLoading ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter max-w-6xl mb-12 relative z-10 leading-[0.9] cursor-default text-neutral-900 dark:text-white"
            >
              {config.heroHeadline || "Product Designer"} <br />
              <span className="text-neutral-400 dark:text-neutral-600 transition-colors">{config.heroSubheadline || "& Creative Dev."}</span>
            </motion.h1>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={!isLoading ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-12 items-start max-w-2xl"
            >
                <div className="cursor-default">
                    <p className="text-lg md:text-2xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl transition-colors">
                    {config.heroDescription || "Building digital products that blend aesthetics with function. Currently crafting experiences in San Francisco."}
                    </p>
                </div>
                
                <a 
                    href="#work" 
                    onClick={(e) => handleSmoothScroll(e, 'work')}
                    className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-white hover:text-neutral-500 dark:hover:text-neutral-300 transition-colors z-20"
                >
                    Explore Work <ArrowDown className="w-4 h-4 animate-bounce" />
                </a>
            </motion.div>
          </motion.div>
        </section>

        <ClientsSection />

        <WorkSection onProjectClick={setSelectedProject} />

        <div id="experience">
          <ExperienceSection />
        </div>

        <SkillsSection />

      </main>

      <footer id="contact" className="py-24 bg-neutral-900 dark:bg-black text-neutral-400 relative z-10 transition-colors duration-500">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Let's build something great.</h2>
              <a href={`mailto:${config.email}`} className="text-2xl md:text-3xl font-medium text-white border-b border-white/30 hover:border-white pb-2 transition-colors">
                {config.email}
              </a>
            </div>
            <div className="flex flex-col justify-end items-start md:items-end gap-4">
              {socials.map((social, index) => (
                <a key={`${social.platform}-${index}`} href={social.url} className="text-lg hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">
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