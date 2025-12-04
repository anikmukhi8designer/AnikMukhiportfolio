import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, LogOut, Wrench, Users, Radio, RefreshCw, UserCircle, Check, AlertCircle, History, ExternalLink, Clock, Loader2, AlertTriangle, Settings as SettingsIcon, GitBranch, List } from 'lucide-react';
import WorkTable from './WorkTable';
import ExperienceTable from './ExperienceTable';
import SkillsTable from './SkillsTable';
import ClientsTable from './ClientsTable';
import ProfileSettings from './ProfileSettings';
import VersionHistory from './VersionHistory';
import SyncLogs from './SyncLogs';
import { useData } from '../../contexts/DataContext';
import { SyncLogEntry } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  onLogout: () => void;
  onEditProject: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onEditProject }) => {
  const [activeTab, setActiveTab] = useState<'work' | 'experience' | 'skills' | 'clients' | 'settings' | 'history' | 'sync_logs'>('work');
  const { resetData, syncData, lastUpdated, latestPreviewUrl, verifyConnection, isLoading, error, branch } = useData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
      verifyConnection().then(result => {
          if (!result.success) {
              setConnectionError(result.message);
              if (result.message.includes("Missing")) {
                  setActiveTab('settings');
              }
          } else {
              setConnectionError(null);
          }
      });
  }, []);

  const handleSync = async () => {
    setSyncStatus('syncing');
    setErrorMessage('');
    try {
        await syncData("Manual Sync from Admin Dashboard");
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e: any) {
        console.error("Sync Error:", e);
        setSyncStatus('error');
        setErrorMessage(e.message || "Sync Failed");
        setTimeout(() => {
            setSyncStatus('idle');
            setErrorMessage('');
        }, 5000);
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen bg-neutral-100 flex items-center justify-center flex-col gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-neutral-400" />
              <p className="text-neutral-500 text-sm font-medium">Connecting to Repository...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* CMS Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {latestPreviewUrl ? (
                <a 
                    href={latestPreviewUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 font-bold text-blue-600 hover:text-blue-800 text-base md:text-lg truncate transition-colors"
                >
                    Update URL <ExternalLink className="w-4 h-4" />
                </a>
            ) : (
                <span className="font-bold text-neutral-900 text-base md:text-lg truncate">New Genre CMS</span>
            )}
            
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-500 border border-neutral-200" title="Connected Branch">
                <GitBranch className="w-3 h-3" /> {branch}
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            
            {/* Sync Status Text */}
            <div className="text-right flex flex-col items-end">
                <span className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    GitHub Status
                </span>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${lastUpdated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`hidden md:block text-xs font-bold ${lastUpdated ? 'text-neutral-900' : 'text-neutral-500'}`}>
                        {lastUpdated ? `Synced ${lastUpdated.toLocaleTimeString()}` : 'Not Synced'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col items-end relative">
                <button 
                    onClick={handleSync}
                    disabled={syncStatus === 'syncing' || syncStatus === 'success' || !!connectionError}
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm min-w-[120px] justify-center ${
                        syncStatus === 'syncing'
                        ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                        : syncStatus === 'success'
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : syncStatus === 'error' || connectionError
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800'
                    }`}
                >
                    {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {syncStatus === 'success' && <Check className="w-3 h-3" />}
                    {(syncStatus === 'error' || connectionError) && <AlertCircle className="w-3 h-3" />}
                    {syncStatus === 'idle' && !connectionError && <Radio className="w-3 h-3" />}
                    
                    <span className="hidden md:inline">
                        {syncStatus === 'syncing' ? 'Syncing...' : 
                        syncStatus === 'success' ? 'Synced!' : 
                        syncStatus === 'error' ? 'Failed' : 
                        connectionError ? 'Config Error' :
                        'Sync Data'}
                    </span>
                </button>
                {/* Error Tooltip */}
                <AnimatePresence>
                {errorMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-full right-0 mt-2 p-3 bg-red-100 border border-red-200 rounded-lg text-xs text-red-700 whitespace-nowrap z-50 shadow-lg min-w-[200px] flex items-center gap-2"
                    >
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0"/>
                        <span>{errorMessage}</span>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-neutral-200"></div>

            <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden flex flex-col">
        
        {/* Connection Error Banner */}
        {connectionError && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                 <div className="p-2 bg-red-100 rounded-lg text-red-600">
                     <AlertCircle className="w-5 h-5" />
                 </div>
                 <div>
                     <h3 className="text-sm font-bold text-red-800 mb-1">Configuration Error</h3>
                     <p className="text-sm text-red-600 mb-3">{connectionError}</p>
                     <button 
                        onClick={() => setActiveTab('settings')}
                        className="text-xs font-bold bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                     >
                         <SettingsIcon className="w-3 h-3" /> Fix in Settings
                     </button>
                 </div>
             </div>
        )}

        {/* Tabs - Scrollable on mobile */}
        <div className="flex overflow-x-auto pb-1 mb-8 bg-neutral-200/50 p-1 rounded-xl w-full md:w-fit scrollbar-hide">
            <button 
                onClick={() => setActiveTab('work')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'work' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <LayoutDashboard className="w-4 h-4" /> Projects
            </button>
            <button 
                onClick={() => setActiveTab('experience')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'experience' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Briefcase className="w-4 h-4" /> Experience
            </button>
            <button 
                onClick={() => setActiveTab('skills')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'skills' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Wrench className="w-4 h-4" /> Skills
            </button>
            <button 
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'clients' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Users className="w-4 h-4" /> Clients
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'settings' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <UserCircle className="w-4 h-4" /> Settings
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'history' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <History className="w-4 h-4" /> History
            </button>
            <button 
                onClick={() => setActiveTab('sync_logs')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'sync_logs' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <List className="w-4 h-4" /> Logs
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'work' && <WorkTable onEdit={onEditProject} />}
        {activeTab === 'experience' && <ExperienceTable />}
        {activeTab === 'skills' && <SkillsTable />}
        {activeTab === 'clients' && <ClientsTable />}
        {activeTab === 'settings' && <ProfileSettings />}
        {activeTab === 'history' && <VersionHistory />}
        {activeTab === 'sync_logs' && <SyncLogs />}

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center text-sm text-neutral-500 gap-4">
            <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Connected to {branch} branch.
            </p>
            <button onClick={resetData} className="text-red-500 hover:text-red-700 underline text-xs">
                Reset to Demo Data
            </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
