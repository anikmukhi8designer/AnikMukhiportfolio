
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, LogOut, Wrench, Users, RefreshCw, UserCircle, Check, AlertCircle, Loader2, Rocket, UploadCloud, Copy, X } from 'lucide-react';
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
  const { resetData, syncData, triggerDeploy, projects, reloadContent, verifyConnection, isLoading, isSaving } = useData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const checkTables = async () => {
        try {
            const { error } = await supabase.from('projects').select('id').limit(1);
            if (error && error.code === '42P01') {
                setShowSqlModal(true);
            }
        } catch (e) {
            console.error(e);
        }
    };
    checkTables();
  }, []);

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

  const handleSync = async () => {
    if (isSaving || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    setErrorMessage('');
    
    try {
        await syncData("Manual Sync from Admin Dashboard");
        setSyncStatus('success');
        await reloadContent();
        setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (e: any) {
        console.error("Sync Error:", e);
        setSyncStatus('error');
        setErrorMessage(e.message || "Database Sync Failed.");
        setTimeout(() => {
            setSyncStatus('idle');
            setErrorMessage('');
        }, 5000);
    }
  };

  const handleDeploy = async () => {
      setDeployStatus('deploying');
      try {
          await triggerDeploy();
          setDeployStatus('success');
          setTimeout(() => setDeployStatus('idle'), 3000);
      } catch (e: any) {
          setDeployStatus('error');
          setErrorMessage("Deploy failed. Check settings.");
          setTimeout(() => {
            setDeployStatus('idle');
            setErrorMessage('');
        }, 3000);
      }
  };

  const setupSQL = `-- 1. CREATE TABLES (Multi-User Ready)
create table if not exists projects (
  id text primary key, 
  user_id uuid default auth.uid(), 
  title text, 
  client text, 
  roles text[], 
  description text, 
  year int, 
  "heroImage" text, 
  thumb text, 
  tags text[], 
  link text, 
  "githubRepoUrl" text, 
  published boolean default false, 
  images text[], 
  content jsonb, 
  created_at timestamptz default now()
);

create table if not exists experience (
  id text primary key, 
  user_id uuid default auth.uid(),
  role text, 
  company text, 
  period text, 
  description text, 
  published boolean default false, 
  "order" int default 0, 
  created_at timestamptz default now()
);

create table if not exists clients (
  id text primary key, 
  user_id uuid default auth.uid(),
  name text, 
  logo text, 
  url text, 
  "order" int default 0, 
  created_at timestamptz default now()
);

create table if not exists skills (
  id text primary key, 
  user_id uuid default auth.uid(),
  title text, 
  items jsonb, 
  "order" int default 0, 
  created_at timestamptz default now()
);

create table if not exists config (
  id int primary key default 1, 
  user_id uuid default auth.uid(),
  "resumeUrl" text, 
  email text, 
  "heroHeadline" text, 
  "heroSubheadline" text, 
  "heroDescription" text, 
  created_at timestamptz default now()
);

create table if not exists socials (
  id text primary key, 
  user_id uuid default auth.uid(),
  platform text, 
  url text, 
  label text, 
  "order" int default 0, 
  created_at timestamptz default now()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
alter table projects enable row level security;
alter table experience enable row level security;
alter table clients enable row level security;
alter table skills enable row level security;
alter table config enable row level security;
alter table socials enable row level security;

-- 3. DROP EXISTING POLICIES
drop policy if exists "Public read projects" on projects;
drop policy if exists "Auth team write projects" on projects;

-- 4. CREATE POLICIES
create policy "Public read projects" on projects for select using (true);
create policy "Public read experience" on experience for select using (true);
create policy "Public read clients" on clients for select using (true);
create policy "Public read skills" on skills for select using (true);
create policy "Public read config" on config for select using (true);
create policy "Public read socials" on socials for select using (true);

create policy "Auth team write projects" on projects for all to authenticated using (true) with check (true);
create policy "Auth team write experience" on experience for all to authenticated using (true) with check (true);
create policy "Auth team write clients" on clients for all to authenticated using (true) with check (true);
create policy "Auth team write skills" on skills for all to authenticated using (true) with check (true);
create policy "Auth team write config" on config for all to authenticated using (true) with check (true);
create policy "Auth team write socials" on socials for all to authenticated using (true) with check (true);

-- 5. SEED INITIAL CONFIG DATA
insert into config (id, email, "heroHeadline", "heroSubheadline", "heroDescription") 
values (1, 'hello@mukhianik.com', 'Product Designer', '& Creative Dev.', 'Building digital products that blend aesthetics with function. Currently crafting experiences in San Francisco.') 
on conflict (id) do nothing;
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

  const getButtonContent = () => {
    if (isSaving || syncStatus === 'syncing') {
        return (
            <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden md:inline">Backing up...</span>
            </>
        );
    }
    if (syncStatus === 'success') {
        return (
            <>
                <Check className="w-3 h-3" />
                <span className="hidden md:inline">Synced!</span>
            </>
        );
    }
    if (syncStatus === 'error') {
        return (
            <>
                <AlertCircle className="w-3 h-3" />
                <span className="hidden md:inline">Sync Failed</span>
            </>
        );
    }
    return (
        <>
            <UploadCloud className="w-3 h-3" />
            <span className="hidden md:inline">Backup to GitHub</span>
        </>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <AnimatePresence>
          {(syncStatus === 'success' || syncStatus === 'error') && (
              <motion.div 
                  initial={{ opacity: 0, y: -20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: -20, x: '-50%' }}
                  className={`fixed top-8 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl ${
                      syncStatus === 'error' ? 'bg-red-600 text-white' : 'bg-neutral-900 text-white'
                  }`}
              >
                  {syncStatus === 'error' ? <AlertCircle className="w-5 h-5 text-white" /> : <Check className="w-5 h-5 text-green-400" />}
                  <div className="flex flex-col">
                      <span className="text-sm font-bold">{syncStatus === 'error' ? 'Sync Failed' : 'Backed up to GitHub'}</span>
                      <span className={`text-xs ${syncStatus === 'error' ? 'text-white/80' : 'text-neutral-400'}`}>
                          {syncStatus === 'error' ? errorMessage : 'Repository synced successfully.'}
                      </span>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

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
                            <h3 className="text-lg font-bold text-neutral-900">Database Setup Required</h3>
                            <p className="text-xs text-neutral-500 mt-1">Run this script in your Supabase SQL editor to create the necessary tables.</p>
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
                            onClick={() => setShowSqlModal(false)}
                            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-bold hover:bg-neutral-800"
                          >
                              Close
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
            <button 
                onClick={handleRefresh}
                className="p-2 text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                title="Refresh Data"
            >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button 
                onClick={handleDeploy}
                disabled={deployStatus === 'deploying'}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 transition-colors"
            >
                {deployStatus === 'deploying' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Rocket className="w-3 h-3" />}
                <span className="hidden lg:inline">Deploy Site</span>
            </button>

            <button 
                onClick={handleSync}
                disabled={isSaving || syncStatus === 'syncing'}
                className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm min-w-[120px] justify-center ${
                    (isSaving || syncStatus === 'syncing')
                    ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                    : syncStatus === 'success'
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : syncStatus === 'error'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800'
                }`}
                title="Backup Data"
            >
                {getButtonContent()}
            </button>

            <div className="h-6 w-px bg-neutral-200 mx-2"></div>

            <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden flex flex-col">
        {!connectionError && projects.length === 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                        <Rocket className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-blue-900">Database is Empty</h3>
                        <p className="text-blue-700/80 text-sm leading-relaxed max-w-md">
                            Would you like to populate it with the demo portfolio content?
                        </p>
                    </div>
                </div>
                <button 
                    onClick={resetData}
                    className="whitespace-nowrap px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Seed Demo Data
                </button>
            </div>
        )}

        <div className="flex overflow-x-auto pb-1 mb-8 bg-neutral-200/50 p-1 rounded-xl w-full md:w-fit scrollbar-hide">
            <button 
                onClick={() => setActiveTab('work')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'work' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <LayoutDashboard className="w-4 h-4" /> Projects
            </button>
            <button 
                onClick={() => setActiveTab('experience')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'experience' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Briefcase className="w-4 h-4" /> Experience
            </button>
            <button 
                onClick={() => setActiveTab('skills')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'skills' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Wrench className="w-4 h-4" /> Skills
            </button>
            <button 
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'clients' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Users className="w-4 h-4" /> Clients
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'settings' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <UserCircle className="w-4 h-4" /> Settings
            </button>
        </div>

        {activeTab === 'work' && <WorkTable onEdit={onEditProject} />}
        {activeTab === 'experience' && <ExperienceTable />}
        {activeTab === 'skills' && <SkillsTable />}
        {activeTab === 'clients' && <ClientsTable />}
        {activeTab === 'settings' && <ProfileSettings />}

        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center text-sm text-neutral-500 gap-4">
            <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                System active
            </p>
            <button onClick={resetData} className="text-red-500 hover:text-red-700 underline text-xs">
                Reset Database
            </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
