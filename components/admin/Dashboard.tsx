
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, LogOut, Wrench, Users, RefreshCw, UserCircle, Check, AlertCircle, Loader2, Rocket, UploadCloud, Copy, X, Database } from 'lucide-react';
import WorkTable from './WorkTable';
import ExperienceTable from './ExperienceTable';
import SkillsTable from './SkillsTable';
import ClientsTable from './ClientsTable';
import ProfileSettings from './ProfileSettings';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../src/supabaseClient';

interface DashboardProps {
  onLogout: () => void;
  onEditProject: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onEditProject }) => {
  const [activeTab, setActiveTab] = useState<'work' | 'experience' | 'skills' | 'clients' | 'settings'>('work');
  const { resetData, syncData, triggerDeploy, projects, reloadContent, verifyConnection, isLoading, isSaving, isDbEmpty, error: dataError } = useData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // If DataContext reporting a column error, show modal
    if (dataError && (dataError.includes('titleSize') || dataError.includes('column'))) {
        setShowSqlModal(true);
    }
  }, [dataError]);

  useEffect(() => {
      reloadContent();
      verifyConnection().then(result => {
          if (!result.success) {
              setConnectionError(result.message);
          } else {
              setConnectionError(null);
          }
      });
  }, []);

  const handleRefresh = async () => {
      setIsRefreshing(true);
      await reloadContent();
      setTimeout(() => setIsRefreshing(false), 800);
  };

  const setupSQL = `-- 1. ENSURE COLUMNS EXIST IN PROJECTS TABLE
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "titleSize" INT DEFAULT 40;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "roles" TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "tags" TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "githubRepoUrl" TEXT;

-- 2. ENSURE OTHER TABLES EXIST
CREATE TABLE IF NOT EXISTS experience (
  id TEXT PRIMARY KEY, 
  user_id UUID DEFAULT auth.uid(),
  role TEXT, 
  company TEXT, 
  period TEXT, 
  description TEXT, 
  published BOOLEAN DEFAULT false, 
  "order" INT DEFAULT 0, 
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config (
  id INT PRIMARY KEY DEFAULT 1, 
  user_id UUID DEFAULT auth.uid(),
  "resumeUrl" TEXT, 
  email TEXT, 
  "heroHeadline" TEXT, 
  "heroSubheadline" TEXT, 
  "heroDescription" TEXT, 
  "experienceIntro" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "sectionOrder" TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE PUBLIC READ ACCESS (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE socials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access to projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to experience" ON experience FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to config" ON config FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public read-only access to socials" ON socials FOR SELECT USING (true);

-- 4. GRANT PERMISSIONS TO ANON AND AUTH ROLES
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
`;

  const copySQL = () => {
    navigator.clipboard.writeText(setupSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-neutral-100 flex items-center justify-center flex-col gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-neutral-400" />
              <p className="text-neutral-500 text-sm font-medium">Loading CMS...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <AnimatePresence>
          {showSqlModal && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSqlModal(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                  >
                      <div className="p-6 border-b border-neutral-200 flex justify-between items-center bg-white flex-shrink-0">
                          <div>
                            <h3 className="text-lg font-bold text-neutral-900">Database Repair</h3>
                            <p className="text-xs text-neutral-500 mt-1">Copy and run this in your Supabase SQL Editor to fix missing columns and permissions.</p>
                          </div>
                          <button onClick={() => setShowSqlModal(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                              <X className="w-5 h-5 text-neutral-500" />
                          </button>
                      </div>
                      <div className="p-6 bg-neutral-50 flex-grow overflow-auto">
                          <div className="relative">
                              <pre className="bg-neutral-900 text-neutral-300 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
                                  {setupSQL}
                              </pre>
                              <button 
                                onClick={copySQL}
                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white flex items-center gap-2 text-xs font-bold transition-colors"
                              >
                                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  {copied ? 'Copied!' : 'Copy SQL'}
                              </button>
                          </div>
                      </div>
                      <div className="p-6 bg-white flex justify-end gap-3 flex-shrink-0">
                          <button 
                            onClick={() => { setShowSqlModal(false); reloadContent(); }}
                            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-bold hover:bg-neutral-800"
                          >
                              I've Run the Script
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      <header className="bg-white border-b border-neutral-200 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-neutral-900 text-base md:text-lg truncate flex items-center gap-2">
                <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
                Mukhi Anik
            </span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setShowSqlModal(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                <Database className="w-3 h-3" /> Fix Schema & Permissions
            </button>
            <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col">
        {dataError && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                <div>
                    <h3 className="text-sm font-bold text-red-900">Database Sync Error</h3>
                    <p className="text-xs text-red-700 mt-1">{dataError}</p>
                    <button onClick={() => setShowSqlModal(true)} className="mt-2 text-xs font-bold underline text-red-800">Fix Now</button>
                </div>
             </div>
        )}

        <div className="flex overflow-x-auto pb-1 mb-8 bg-neutral-200/50 p-1 rounded-xl w-full md:w-fit">
            <button onClick={() => setActiveTab('work')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'work' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Work</button>
            <button onClick={() => setActiveTab('experience')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'experience' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Experience</button>
            <button onClick={() => setActiveTab('skills')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'skills' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Skills</button>
            <button onClick={() => setActiveTab('clients')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'clients' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Clients</button>
            <button onClick={() => setActiveTab('settings')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Settings</button>
        </div>

        {activeTab === 'work' && <WorkTable onEdit={onEditProject} />}
        {activeTab === 'experience' && <ExperienceTable />}
        {activeTab === 'skills' && <SkillsTable />}
        {activeTab === 'clients' && <ClientsTable />}
        {activeTab === 'settings' && <ProfileSettings />}
      </main>
    </div>
  );
};

export default Dashboard;
