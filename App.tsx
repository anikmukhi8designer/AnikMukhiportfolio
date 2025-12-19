
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
import { ArrowDown } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// Admin Imports
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/admin/Dashboard';
import BlockEditor from './components/admin/BlockEditor';
import { supabase } from './src/supabaseClient';

// Context
import { DataProvider, useData } from './contexts/DataContext';

const AdminRoot = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [editorProjectId, setEditorProjectId] = useState<string | null>(null);
  const { projects, updateProject, deleteProject } = useData();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <AdminLogin onLogin={() => {}} />;
  }

  if (view === 'editor' && editorProjectId) {
      const project = projects.find(p => p.id === editorProjectId);
      if (!project) return <div className="p-20 text-center font-mono">Loading Project...</div>;

      return (
        <BlockEditor 
            project={project} 
            onSave={async (updated) => {
                try {
                    // Rename logic: if the ID changed, delete the old record and create the new one
                    if (editorProjectId && updated.id !== editorProjectId) {
                        await deleteProject(editorProjectId);
                    }
                    await updateProject(updated.id, updated);
                    setView('dashboard');
                    setEditorProjectId(null);
                } catch (e: any) {
                    console.error("Save failed:", e);
                    throw e; // Rethrow so the editor can show the error
                }
            }} 
            onBack={() => {
                setView('dashboard');
                setEditorProjectId(null);
            }} 
        />
      );
  }

  return (
    <Dashboard 
        onLogout={() => supabase.auth.signOut()} 
        onEditProject={(id) => {
            setEditorProjectId(id);
            setView('editor');
        }} 
    />
  );
};

const AppContent: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    }
    return 'dark';
  });

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

  // ADVANCED SEO EFFECT
  useEffect(() => {
    const title = config.seoTitle || `${config.heroHeadline} | Mukhi Anik`;
    const description = config.seoDescription || config.heroDescription;
    const url = window.location.origin;
    const image = config.heroImage || '/og-image.jpg'; // Fallback to a static asset if hero is missing

    // 1. Basic Metadata
    document.title = title;
    
    const updateMeta = (name: string, content: string, attr = 'name') => {
        let el = document.querySelector(`meta[${attr}="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    };

    updateMeta('description', description);

    // 2. Open Graph (Facebook / LinkedIn)
    updateMeta('og:title', title, 'property');
    updateMeta('og:description', description, 'property');
    updateMeta('og:url', url, 'property');
    updateMeta('og:image', image, 'property');
    updateMeta('og:type', 'website', 'property');

    // 3. Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);

    // 4. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [config]);

  const { scrollY } = useScroll();
  const heroTextY = useTransform(scrollY, [0, 500], [0, 100]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-primary-foreground cursor-none">
      
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

      <main className="relative z-10">
        <section className="min-h-[90vh] flex flex-col justify-center px-4 md:px-6 max-w-screen-2xl mx-auto border-x border-border/50">
          
          <motion.div style={{ y: heroTextY }}>
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.8 }}
               className="mb-6 flex items-center gap-4"
            >
                <div className="h-px w-12 bg-primary"></div>
                <span className="text-xs uppercase tracking-widest text-primary font-bold">Portfolio {new Date().getFullYear()}</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter mb-8 leading-[0.9] text-foreground"
            >
              {config.heroHeadline || "Product Designer"} <br />
              <span className="text-muted-foreground">{config.heroSubheadline || "& Creative Dev."}</span>
            </motion.h1>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="max-w-xl"
            >
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 border-l-2 border-primary/50 pl-6">
                    {config.heroDescription || "Building digital products that blend aesthetics with function. Currently crafting experiences in San Francisco."}
                </p>
                
                <a 
                    href="#work" 
                    onClick={(e) => handleSmoothScroll(e, 'work')}
                    className="inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors group"
                >
                    <span className="w-8 h-8 flex items-center justify-center border border-border rounded-full group-hover:border-primary transition-colors">
                        <ArrowDown className="w-4 h-4 group-hover:animate-bounce" />
                    </span>
                    Scroll to Explore
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

      <footer id="contact" className="py-24 border-t border-border bg-background">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tighter">
                Let's build<br/>something great.
              </h2>
              <a href={`mailto:${config.email}`} className="text-2xl md:text-3xl font-bold text-primary hover:text-foreground transition-colors underline decoration-2 underline-offset-8 decoration-border hover:decoration-primary">
                {config.email}
              </a>
            </div>
            <div className="flex flex-col justify-end items-start md:items-end gap-6">
              {socials.map((social, index) => (
                <a 
                    key={`${social.platform}-${index}`} 
                    href={social.url} 
                    className="text-lg text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-bold" 
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                  {social.platform}
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-widest text-muted-foreground border-t border-border pt-8">
            <p>&copy; {new Date().getFullYear()} Mukhi Anik. All rights reserved.</p>
            <p>Designed with New Genre Principles.</p>
          </div>
        </div>
      </footer>

      <Modal 
        project={selectedProject} 
        onClose={() => setSelectedProject(null)} 
        onProjectClick={setSelectedProject}
      />
    </div>
  );
};

const App: React.FC = () => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const handleHashChange = () => {
            setIsAdmin(window.location.hash === '#admin');
        };
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <DataProvider>
            {isAdmin ? <AdminRoot /> : <AppContent />}
        </DataProvider>
    );
};

export default App;
