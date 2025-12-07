import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, LogOut, Wrench, Users, RefreshCw, UserCircle, Check, AlertCircle, Loader2, Rocket, Database, UploadCloud, Copy, X } from 'lucide-react';
import WorkTable from './WorkTable';
import ExperienceTable from './ExperienceTable';
import SkillsTable from './SkillsTable';
import ClientsTable from './ClientsTable';
import ProfileSettings from './ProfileSettings';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [connectionStatusMsg, setConnectionStatusMsg] = useState('');

  useEffect(() => {
      reloadContent();
      verifyConnection().then(result => {
          if (!result.success) {
              setConnectionError(result.message);
              setConnectionStatusMsg('');
          } else {
              setConnectionError(null);
              // Store the detailed success message (e.g. "Connected. Projects found: 3")
              setConnectionStatusMsg(result.message);
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
        // Reload content to ensure frontend is in sync with backend state if needed
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

  // Robust SQL that can be re-run safely
  const setupSQL = `-- 1. CREATE TABLES
create table if not exists projects (
  id text primary key, 
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
  name text, 
  logo text, 
  url text, 
  "order" int default 0, 
  created_at timestamptz default now()
);

create table if not exists skills (
  id text primary key, 
  title text, 
  items jsonb, 
  "order" int default 0, 
  created_at timestamptz default now()
);

create table if not exists config (
  id int primary key default 1, 
  "resumeUrl" text, 
  email text, 
  "heroHeadline" text, 
  "heroSubheadline" text, 
  "heroDescription" text, 
  created_at timestamptz default now()
);

create table if not exists socials (
  id text primary key, 
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

-- 3. DROP EXISTING POLICIES (To prevent conflict errors on re-run)
drop policy if exists "Public read projects" on projects;
drop policy if exists "Auth all projects" on projects;
drop policy if exists "Enable insert for authenticated users only" on projects;

drop policy if exists "Public read experience" on experience;
drop policy if exists "Auth all experience" on experience;

drop policy if exists "Public read clients" on clients;
drop policy if exists "Auth all clients" on clients;

drop policy if exists "Public read skills" on skills;
drop policy if exists "Auth all skills" on skills;

drop policy if exists "Public read config" on config;
drop policy if exists "Auth all config" on config;

drop policy if exists "Public read socials" on socials;
drop policy if exists "Auth all socials" on socials;

-- 4. CREATE POLICIES (Public Read, Admin Write)
-- Allow anyone to read data
create policy "Public read projects" on projects for select using (true);
create policy "Public read experience" on experience for select using (true);
create policy "Public read clients" on clients for select using (true);
create policy "Public read skills" on skills for select using (true);
create policy "Public read config" on config for select using (true);
create policy "Public read socials" on socials for select using (true);

-- Allow authenticated users (Admin) to do everything (Insert, Update, Delete)
create policy "Auth all projects" on projects for all to authenticated using (true) with check (true);
create policy "Auth all experience" on experience for all to authenticated using (true) with check (true);
create policy "Auth all clients" on clients for all to authenticated using (true) with check (true);
create policy "Auth all skills" on skills for all to authenticated using (true) with check (true);
create policy "Auth all config" on config for all to authenticated using (true) with check (true);
create policy "Auth all socials" on socials for all to authenticated using (true) with check (true);

-- Explicit Insert Policy for clarity
create policy "Enable insert for authenticated users only" on projects for insert to authenticated with check (true);

-- 5. SEED INITIAL CONFIG DATA (To prevent empty config errors)
-- Config
insert into config (id, email, "heroHeadline", "heroSubheadline", "heroDescription") 
values (1, 'hello@mukhianik.com', 'Product Designer', '& Creative Dev.', 'Building digital products that blend aesthetics with function. Currently crafting experiences in San Francisco.') 
on conflict (id) do nothing;

-- Projects (Ravens PDF Content + Others)
delete from projects where id in ('ravens-tablet-2024', 'fintech-dashboard-2024', 'apex-logistics-2023');

insert into projects (id, title, client, roles, description, year, "heroImage", thumb, tags, published, content)
values 
('ravens-tablet-2024', 'Stadium Suite Tablet', 'Baltimore Ravens', ARRAY['UX Architecture', 'UI Design', 'Wireframing'], 'A premium in-suite digital experience allowing guests to control the TV, order food, and request assistance.', 2024, 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop', ARRAY['Tablet App', 'Hospitality', 'Sports Tech'], true, 
'[
  {"id": "1", "type": "h2", "content": "Introduction"},
  {"id": "2", "type": "paragraph", "content": "The Baltimore Ravens Stadium Suite Tablet Experience was designed to enhance the luxury suite environment by offering guests an intuitive digital platform. This tablet enables users to control suite amenities including TV, food and beverage ordering, valet services, merchandise shopping, and service assistance—all from a single interface."},
  {"id": "3", "type": "h2", "content": "Project Overview"},
  {"id": "4", "type": "paragraph", "content": "The goal was to upgrade traditional, manual suite services with a premium digital solution. The platform had to provide real-time control, seamless navigation, and a visually polished appearance aligned with the Baltimore Ravens brand identity."},
  {"id": "5", "type": "h2", "content": "Problem Statement"},
  {"id": "6", "type": "paragraph", "content": "Guests often encountered delays ordering food, controlling the TV, or requesting support. These interruptions affected the premium experience expected in a luxury stadium suite."},
  {"id": "7", "type": "h2", "content": "Objective"},
  {"id": "8", "type": "paragraph", "content": "Create a unified, easy-to-use tablet interface enabling users to manage entertainment, suite services, and amenities conveniently without needing staff assistance for basic tasks."},
  {"id": "9", "type": "h2", "content": "Target Users"},
  {"id": "10", "type": "paragraph", "content": "The system primarily serves VIP guests, corporate clients, and season ticket holders who value convenience and expect a high-end digital environment."},
  {"id": "11", "type": "h2", "content": "Role & Responsibilities"},
  {"id": "12", "type": "paragraph", "content": "As the UI/UX designer, I was responsible for the complete design process—research, interaction design, user flows, wireframes, and final high-fidelity UI development."},
  {"id": "13", "type": "h2", "content": "Research Insights"},
  {"id": "14", "type": "paragraph", "content": "Based on interviews and competitive analysis, users needed: Fast navigation, Minimal steps, High-contrast UI, Modern interface."},
  {"id": "15", "type": "h2", "content": "UI Design"},
  {"id": "20", "type": "paragraph", "content": "The final UI employs a dark, modern theme with the Baltimore Ravens signature purple accents. Visual elements are large and bold, optimized for visibility from various seating angles."}
]'::jsonb
),
('fintech-dashboard-2024', 'Nova Financial', 'Nova Inc.', ARRAY['Product Design', 'Design System'], 'A comprehensive dashboard for modern financial tracking.', 2024, 'https://picsum.photos/id/1/1200/800', 'https://picsum.photos/id/1/800/600', ARRAY['Fintech', 'SaaS', 'Dashboard'], true, '[]'::jsonb),
('apex-logistics-2023', 'Apex Logistics', 'Apex Global', ARRAY['Product Design', 'UX Research'], 'Real-time logistics tracking platform for global supply chains.', 2023, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop', ARRAY['SaaS', 'B2B', 'Logistics'], true, 
'[
  {"id": "1", "type": "h2", "content": "Overview"},
  {"id": "2", "type": "paragraph", "content": "Apex Global manages thousands of shipments daily. Their existing tools were fragmented, leading to operational inefficiencies. We built a unified dashboard to centralize tracking."},
  {"id": "3", "type": "h2", "content": "Key Features"},
  {"id": "4", "type": "paragraph", "content": "• Real-time map visualization of assets • Automated delay risk alerts • One-click document generation"},
  {"id": "5", "type": "image", "content": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop", "caption": "Shipment Detail View"}
]'::jsonb);

-- Experience
delete from experience;
insert into experience (id, role, company, period, description, published, "order")
values
('senior-pd-2023', 'Senior Product Designer', 'TechFlow Systems', '2023 — Present', 'Leading the design system team and overseeing core product UX.', true, 0),
('pd-2021', 'Product Designer', 'Creative Studio X', '2021 — 2023', 'Worked on various client projects ranging from fintech to healthcare.', true, 1);

-- Clients
delete from clients;
insert into clients (id, name, "order")
values
('ravens', 'Baltimore Ravens', 0),
('c1', 'Nova Inc.', 1),
('c2', 'Lumina Fashion', 2),
('c3', 'Syntax Labs', 3),
('c4', 'Pulse Health', 4),
('c6', 'TechFlow', 5),
('c8', 'Google', 6),
('c9', 'Airbnb', 7);

-- Skills
delete from skills;
insert into skills (id, title, items, "order")
values
('s1', 'Design', '[{"name": "Figma", "image": "https://cdn.brandfetch.io/figma.com/w/200/h/200"}, {"name": "Adobe", "image": "https://cdn.brandfetch.io/adobe.com/w/200/h/200"}, {"name": "Framer", "image": "https://cdn.brandfetch.io/framer.com/w/200/h/200"}]'::jsonb, 0);

-- Socials
delete from socials;
insert into socials (id, platform, url, label, "order")
values
('twitter-link', 'Twitter', 'https://twitter.com', '@mukhi_anik', 0),
('linkedin-link', 'LinkedIn', 'https://linkedin.com', 'Mukhi Anik', 1);`;

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
      {/* Toast Notification */}
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

      {/* SQL Setup Modal */}
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
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                  >
                      <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-bold text-neutral-900">Database Setup (Fix RLS Errors)</h3>
                            <p className="text-xs text-neutral-500">Run this SQL in your Supabase Dashboard to enable saving.</p>
                          </div>
                          <button onClick={() => setShowSqlModal(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                              <X className="w-5 h-5 text-neutral-500" />
                          </button>
                      </div>
                      <div className="p-6 bg-neutral-50">
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
                      <div className="p-6 bg-white flex justify-end gap-3">
                          <a 
                            href="https://supabase.com/dashboard/project/_/sql" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg text-sm font-medium text-neutral-700"
                          >
                              Open Supabase SQL Editor
                          </a>
                          <button 
                            onClick={() => setShowSqlModal(false)}
                            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-bold hover:bg-neutral-800"
                          >
                              Done
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* CMS Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-neutral-900 text-base md:text-lg truncate flex items-center gap-2">
                <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
                Mukhi Anik
            </span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Status Indicators */}
            <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Database Status
                </span>
                <div className="flex items-center gap-1.5" title={connectionStatusMsg}>
                    <div className={`w-2 h-2 rounded-full ${!connectionError ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-bold ${!connectionError ? 'text-neutral-900' : 'text-neutral-500'}`}>
                        {!connectionError ? (connectionStatusMsg || 'Connected') : 'Error'}
                    </span>
                </div>
            </div>
            
            <button
                onClick={() => setShowSqlModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors"
                title="View Setup SQL Script"
            >
                <Database className="w-3 h-3" /> Setup DB
            </button>

            {/* Action Buttons */}
            <button 
                onClick={handleRefresh}
                className="p-2 text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors"
                title="Refresh Data from Database"
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
                disabled={isSaving || syncStatus === 'syncing' || !!connectionError}
                className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm min-w-[120px] justify-center ${
                    (isSaving || syncStatus === 'syncing')
                    ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                    : syncStatus === 'success'
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : syncStatus === 'error'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800'
                }`}
                title="Backup current data to GitHub repository"
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

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden flex flex-col">
        
        {/* Error Banner */}
        {connectionError && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
                 <div className="p-2 bg-red-100 rounded-lg text-red-600">
                     <AlertCircle className="w-5 h-5" />
                 </div>
                 <div>
                     <h3 className="text-sm font-bold text-red-800 mb-1">Database Error</h3>
                     <p className="text-sm text-red-600 mb-3">{connectionError}</p>
                 </div>
             </div>
        )}

        {/* Empty State Banner - Prompt to Seed */}
        {!connectionError && projects.length === 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-blue-900">Database is Empty</h3>
                        <p className="text-blue-700/80 text-sm leading-relaxed max-w-md">
                            It looks like you just set up the database. 
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

        {/* Tabs - Scrollable on mobile */}
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

        {/* Tab Content */}
        {activeTab === 'work' && <WorkTable onEdit={onEditProject} />}
        {activeTab === 'experience' && <ExperienceTable />}
        {activeTab === 'skills' && <SkillsTable />}
        {activeTab === 'clients' && <ClientsTable />}
        {activeTab === 'settings' && <ProfileSettings />}

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center text-sm text-neutral-500 gap-4">
            <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Real-time connection active
            </p>
            <button onClick={resetData} className="text-red-500 hover:text-red-700 underline text-xs">
                Hard Reset Database (Dev Only)
            </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;