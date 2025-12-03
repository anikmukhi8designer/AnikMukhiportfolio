import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Briefcase, LogOut, Wrench, Users, Radio, RefreshCw, UserCircle, Check, AlertCircle, History, ExternalLink, Clock } from 'lucide-react';
import WorkTable from './WorkTable';
import ExperienceTable from './ExperienceTable';
import SkillsTable from './SkillsTable';
import ClientsTable from './ClientsTable';
import ProfileSettings from './ProfileSettings';
import VersionHistory from './VersionHistory';
import { useData } from '../../contexts/DataContext';
import { SyncLogEntry } from '../../types';

interface DashboardProps {
  onLogout: () => void;
  onEditProject: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onEditProject }) => {
  const [activeTab, setActiveTab] = useState<'work' | 'experience' | 'skills' | 'clients' | 'settings' | 'history' | 'sync_logs'>('work');
  const { resetData, refreshAllClients, lastUpdated, getSyncHistory, latestPreviewUrl } = useData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Sync Logs
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);

  useEffect(() => {
      // Fetch logs on mount
      getSyncHistory().then(setSyncLogs);
  }, []);

  const handleBroadcast = async () => {
    setSyncStatus('syncing');
    setErrorMessage('');
    try {
        await refreshAllClients();
        setSyncStatus('success');
        // Note: The browser will redirect, so this might not even be seen
    } catch (e: any) {
        console.error(e);
        setSyncStatus('error');
        setErrorMessage(e.message || "Sync Failed");
        setTimeout(() => {
            setSyncStatus('idle');
            setErrorMessage('');
        }, 5000);
    }
  };

  const formatDate = (iso: string) => {
      return new Date(iso).toLocaleString();
  };

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
                    onClick={handleBroadcast}
                    disabled={syncStatus === 'syncing' || syncStatus === 'success'}
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm min-w-[120px] justify-center ${
                        syncStatus === 'syncing'
                        ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                        : syncStatus === 'success'
                        ? 'bg-green-50 text-green-600 border border-green-200'
                        : syncStatus === 'error'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800'
                    }`}
                    title="Fetch latest data from GitHub"
                >
                    {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {syncStatus === 'success' && <Check className="w-3 h-3" />}
                    {syncStatus === 'error' && <AlertCircle className="w-3 h-3" />}
                    {syncStatus === 'idle' && <Radio className="w-3 h-3" />}
                    
                    <span className="hidden md:inline">
                        {syncStatus === 'syncing' ? 'Syncing...' : 
                        syncStatus === 'success' ? 'Synced!' : 
                        syncStatus === 'error' ? 'Failed' : 
                        'Sync Data'}
                    </span>
                </button>
                {/* Error Tooltip */}
                {errorMessage && (
                    <div className="absolute top-full right-0 mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700 whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-1">
                        {errorMessage}
                    </div>
                )}
            </div>

            <div className="h-6 w-px bg-neutral-200"></div>

            <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden">
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
                onClick={() => setActiveTab('sync_logs')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'sync_logs' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Clock className="w-4 h-4" /> Sync History
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'history' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <History className="w-4 h-4" /> Version History
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'work' && <WorkTable onEdit={onEditProject} />}
        {activeTab === 'experience' && <ExperienceTable />}
        {activeTab === 'skills' && <SkillsTable />}
        {activeTab === 'clients' && <ClientsTable />}
        {activeTab === 'settings' && <ProfileSettings />}
        {activeTab === 'history' && <VersionHistory />}
        
        {/* Sync History Table */}
        {activeTab === 'sync_logs' && (
             <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Sync History ({syncLogs.length})</h3>
                    <button onClick={() => getSyncHistory().then(setSyncLogs)} className="text-sm flex items-center gap-2 text-neutral-500 hover:text-neutral-900">
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                </div>
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
                    {syncLogs.length === 0 ? (
                        <div className="p-12 text-center text-neutral-400">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No sync logs found. Click "Sync Data" to create one.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {syncLogs.map((log) => (
                                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-full">
                                            <Radio className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-neutral-900 text-sm">
                                                Manual Sync
                                            </h4>
                                            <div className="text-xs text-neutral-500 mt-1">
                                                by {log.author} • {formatDate(log.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                    <a 
                                        href={log.previewUrl} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        View Preview <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>
        )}

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center text-sm text-neutral-500 gap-4">
            <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Data persists to src/data.json in your GitHub repo.
            </p>
            <button onClick={resetData} className="text-red-500 hover:text-red-700 underline text-xs">
                Reset DB to Demo Data
            </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
