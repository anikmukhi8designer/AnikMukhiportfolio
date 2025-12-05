import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, LogOut, Wrench, Users, RefreshCw, UserCircle, Check, AlertCircle, Loader2, Rocket, Database, UploadCloud } from 'lucide-react';
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
  
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Refresh data on mount to ensure we are fetching with authenticated permissions
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

  const handleSync = async () => {
    if (isSaving || syncStatus === 'syncing') return;

    setSyncStatus('syncing');
    setErrorMessage('');
    
    try {
        await syncData("Manual Sync from Admin Dashboard");
        setSyncStatus('success');
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
      {/* Toast Notification */}
      <AnimatePresence>
          {syncStatus === 'success' && (
              <motion.div 
                  initial={{ opacity: 0, y: -20, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: -20, x: '-50%' }}
                  className="fixed top-8 left-1/2 z-[100] flex items-center gap-3 bg-neutral-900 text-white px-6 py-4 rounded-full shadow-2xl"
              >
                  <Check className="w-5 h-5 text-green-400" />
                  <div className="flex flex-col">
                      <span className="text-sm font-bold">Backed up to GitHub</span>
                      <span className="text-xs text-neutral-400">Repository synced successfully.</span>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* CMS Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-neutral-900 text-base md:text-lg truncate flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                New Genre CMS
            </span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="text-right flex flex-col items-end">
                <span className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Database Status
                </span>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${!connectionError ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`hidden md:block text-xs font-bold ${!connectionError ? 'text-neutral-900' : 'text-neutral-500'}`}>
                        {!connectionError ? 'Connected' : 'Error'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={handleDeploy}
                    disabled={deployStatus === 'deploying'}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 transition-colors"
                >
                    {deployStatus === 'deploying' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Rocket className="w-3 h-3" />}
                    <span className="hidden lg:inline">Deploy Site</span>
                </button>

                <button 
                    onClick={handleSync}
                    disabled={syncStatus === 'syncing' || !!connectionError}
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm min-w-[120px] justify-center ${
                        syncStatus === 'syncing'
                        ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                        : syncStatus === 'success'
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : 'bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800'
                    }`}
                    title="Backup current data to GitHub repository"
                >
                    {syncStatus === 'syncing' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                    <span className="hidden md:inline">
                        {syncStatus === 'syncing' ? 'Backing up...' : 'Backup to GitHub'}
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