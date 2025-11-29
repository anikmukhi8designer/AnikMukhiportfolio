import React, { useState, useEffect } from 'react';
import { Project } from './types';
import WorkSection from './components/WorkSection';
import ExperienceSection from './components/ExperienceSection';
import ClientsSection from './components/ClientsSection';
import Modal from './components/Modal';
import NavBar from './components/NavBar';
import SplitNavPanel from './components/SplitNavPanel';
import { SOCIALS } from './data';
import { ArrowDown } from 'lucide-react';

// CMS Imports
import { DataProvider } from './contexts/DataContext';
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/admin/Dashboard';

const AppContent: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Simple Hash Routing for CMS Simulation
  const [route, setRoute] = useState(window.location.hash || '#home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#home');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Admin Routes
  if (route === '#admin') {
    if (!isAdminLoggedIn) {
        return <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />;
    }
    return <Dashboard onLogout={() => { setIsAdminLoggedIn(false); window.location.hash = '#home'; }} />;
  }
  
  // Public Portfolio Route
  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* Navigation System */}
      <NavBar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      
      <SplitNavPanel 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onProjectClick={setSelectedProject}
      />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="min-h-[85vh] flex flex-col justify-center px-4 md:px-8 max-w-screen-xl mx-auto relative">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter max-w-5xl mb-8">
            Product Designer & <br />
            <span className="text-neutral-400">Creative Developer.</span>
          </h1>
          <p className="text-lg md:text-2xl text-neutral-600 max-w-2xl leading-relaxed">
            I help startups and established companies build digital products that look good and work even better. Currently based in San Francisco.
          </p>
          <div className="mt-12">
            <a href="#work" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">
              Scroll for work <ArrowDown className="w-4 h-4 animate-bounce" />
            </a>
          </div>

          {/* Hidden Admin Access (Shortcut: append #admin to URL or click this footer link) */}
        </section>

        {/* Work Section */}
        <WorkSection onProjectClick={setSelectedProject} />

        {/* Clients Section */}
        <ClientsSection />

        {/* Experience Section */}
        <div id="experience">
          <ExperienceSection />
        </div>
      </main>

      {/* Footer */}
      <footer id="contact" className="py-24 bg-neutral-900 text-neutral-400">
        <div className="max-w-screen-xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Let's build something great together.</h2>
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
                <p>Designed & Built with React + Tailwind.</p>
                <a href="#admin" className="opacity-50 hover:opacity-100 transition-opacity">CMS</a>
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
