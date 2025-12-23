
import React, { useState } from 'react';
import { LogOut, RefreshCw, AlertCircle, Loader2, Github } from 'lucide-react';
import WorkTable from './WorkTable';
import ExperienceTable from './ExperienceTable';
import SkillsTable from './SkillsTable';
import ClientsTable from './ClientsTable';
import ProfileSettings from './ProfileSettings';
import { useData } from '../../contexts/DataContext';
import { Toaster } from 'sonner';

interface DashboardProps {
  onLogout: () => void;
  onEditProject: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onEditProject }) => {
  const [activeTab, setActiveTab] = useState<'work' | 'experience' | 'skills' | 'clients' | 'settings'>('work');
  const { reloadContent, isLoading, error: dataError } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await reloadContent();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      <Toaster position="top-center" richColors />
      
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-neutral-900 text-base md:text-lg truncate flex items-center gap-2">
              <img src="/favicon.svg" alt="Logo" className="w-6 h-6" />
              Admin Panel
            </span>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <Github className="w-3 h-3" /> GitHub Linked
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing || isLoading}
              className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors disabled:opacity-30"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-6 w-px bg-neutral-200"></div>
            <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-all">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col">
        {dataError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-900">Sync Error</h3>
              <p className="text-xs text-red-700 mt-1">{dataError}</p>
              <p className="text-[10px] text-red-500 mt-2 font-bold uppercase">Check your GitHub credentials in Settings.</p>
            </div>
          </div>
        )}

        <div className="flex overflow-x-auto pb-1 mb-8 bg-neutral-200/50 p-1 rounded-xl w-full md:w-fit">
          <button onClick={() => setActiveTab('work')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'work' ? 'bg-white shadow-sm' : 'text-neutral-900'}`}>Work</button>
          <button onClick={() => setActiveTab('experience')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'experience' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Experience</button>
          <button onClick={() => setActiveTab('skills')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'skills' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Skills</button>
          <button onClick={() => setActiveTab('clients')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'clients' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Clients</button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>Settings</button>
        </div>

        <div className="flex-grow">
          {activeTab === 'work' && <WorkTable onEdit={onEditProject} />}
          {activeTab === 'experience' && <ExperienceTable />}
          {activeTab === 'skills' && <SkillsTable />}
          {activeTab === 'clients' && <ClientsTable />}
          {activeTab === 'settings' && <ProfileSettings />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
