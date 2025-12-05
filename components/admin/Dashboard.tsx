import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, LogOut, Wrench, Users, Radio, RefreshCw, UserCircle, Check, AlertCircle, History, ExternalLink, Clock, Loader2, AlertTriangle, Settings as SettingsIcon, GitBranch, List, X, Rocket } from 'lucide-react';
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
  const { resetData, syncData, triggerDeploy, lastUpdated, latestPreviewUrl, verifyConnection, isLoading, error, branch, isSaving } = useData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [missingHook, setMissingHook] = useState(false);

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
      // Check for hook
      setMissingHook(!localStorage.getItem('vercel_deploy_hook'));
  }, []);

  const handleSync = async () => {
    if (isSaving || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    setErrorMessage('');
    const startTime = Date.now();

    try {
        await syncData("Manual Sync from Admin Dashboard");
        
        // Ensure spinner shows for at least 800ms for UX
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) await new Promise(r => setTimeout(r, 800 - elapsed));
        
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (e: any) {
        console.error("Sync Error:", e);
        setSyncStatus('error');
        setErrorMessage(e.message || "Sync Failed. Check network connection.");
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
      {/* Toast Notification */}
      <AnimatePresence>
          {syncStatus === 'success' && (
              <motion.div 
                  initial={{ opacity: 0, y: -20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: -20, x: '-50%' }}
                  className="fixed top-8 left-1/2 z-50 flex items-center gap-3 bg-neutral-900 text-white px-6 py-4 rounded-full shadow-2xl"
              >
                  <Check className="w-5 h-5 text-green-400" />
                  <div className="flex flex-col">
                      <span className="text-sm font-bold">Sync Successful</span>
                      <span className="text-xs text-neutral-400">Updates pushed to GitHub.</span>
                  </div>
                  <button onClick={() => setSyncStatus('idle')} className="ml-4 p-1 hover:bg-white/10 rounded-full"><X className="w-4 h-4"/></button>
              </motion.div>
          )}
          {deployStatus === 'success' && (
              <motion.div 
                  initial={{ opacity: 0, y: -20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: -20, x: '-50%' }}
                  className="fixed top-8 left-1/2 z-50 flex items-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-full shadow-2xl"
              >
                  <Rocket className="w-5 h-5 text-white" />
                  <div className="flex flex-col">
                      <span className="text-sm font-bold">Deploy Triggered</span>
                      <span className="text-xs text-white/80">Vercel is rebuilding your site.</span>
                  </div>
              </motion.div>
          )}
          {(syncStatus === 'error' || errorMessage) && (
              <motion.div 
                  initial={{ opacity: 0, y: -20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: -20, x: '-50%' }}
                  className="fixed top-8 left-1/2 z-50 flex items-center gap-3 bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl"
              >
                  <AlertTriangle className="w-5 h-5 text-white" />
                  <div className="flex flex-col">
                      <span className="text-sm font-bold">Action Failed</span>
                      <span className="text-xs text-white/80">{errorMessage}</span>
                  </div>
                  <button onClick={() => setErrorMessage('')} className="ml-4 p-1 hover:bg-white/10 rounded-full"><X className="w-4 h-4"/></button>
              </motion.div>
          )}
      </AnimatePresence>

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

            <div className="flex items-center gap-2">
                {/* Deploy Button */}
                <button 
                    onClick={handleDeploy}
                    disabled={deployStatus === 'deploying' || missingHook}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                        missingHook 
                        ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed' 
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                    title={missingHook ? "Configure Deploy Hook in Settings first" : "Trigger Vercel Rebuild"}
                >
                    {deployStatus === 'deploying' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Rocket className="w-3 h-3" />}
                    <span className="hidden lg:inline">Deploy</span>
                </button>

                {/* Sync Button */}
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
                    {syncStatus === 'syncing' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {syncStatus === 'success' && <Check className="w-3 h-3" />}
                    {(syncStatus === 'error' || connectionError) && <AlertCircle className="w-3 h-3" />}
                    {syncStatus === 'idle' && !connectionError && <RefreshCw className="w-3 h-3" />}
                    
                    <span className="hidden md:inline">
                        {syncStatus === 'syncing' ? 'Syncing...' : 
                        syncStatus === 'success' ? 'Synced!' : 
                        syncStatus === 'error' ? 'Failed' : 
                        connectionError ? 'Config Error' :
                        'Sync Data'}
                    </span>
                </button>
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

        {/* Missing Hook Warning */}
        {!connectionError && missingHook && (
             <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                 <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                     <Rocket className="w-5 h-5" />
                 </div>
                 <div>
                     <h3 className="text-sm font-bold text-blue-800 mb-1">Enable Auto-Deploy</h3>
                     <p className="text-sm text-blue-600 mb-3">
                        Connect Vercel to automatically rebuild your site when you push changes. 
                     </p>
                     <button 
                        onClick={() => setActiveTab('settings')}
                        className="text-xs font-bold bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                     >
                         <SettingsIcon className="w-3 h-3" /> Configure Deploy Hook
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