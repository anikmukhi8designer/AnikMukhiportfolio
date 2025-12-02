import React, { useState } from 'react';
import { LayoutDashboard, Briefcase, LogOut, Wrench, Users, Radio, RefreshCw } from 'lucide-react';
import WorkTable from './WorkTable';
import ExperienceTable from './ExperienceTable';
import SkillsTable from './SkillsTable';
import ClientsTable from './ClientsTable';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../supabaseClient';

interface DashboardProps {
  onLogout: () => void;
  onEditProject: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onEditProject }) => {
  const [activeTab, setActiveTab] = useState<'work' | 'experience' | 'skills' | 'clients'>('work');
  const { resetData, refreshAllClients, lastUpdated } = useData();
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    await refreshAllClients();
    // Keep animation active for a moment to give feedback
    setTimeout(() => setIsBroadcasting(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* CMS Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-neutral-900 text-lg">New Genre CMS</span>
          </div>
          
          <div className="flex items-center gap-6">
            
            {/* Sync Status Text */}
            <div className="text-right flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Repository Status
                </span>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${lastUpdated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-bold ${lastUpdated ? 'text-neutral-900' : 'text-neutral-500'}`}>
                        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not Updated'}
                    </span>
                </div>
            </div>

            <button 
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                    isBroadcasting 
                    ? 'bg-neutral-100 text-neutral-400 border border-neutral-200' 
                    : 'bg-neutral-900 text-white border border-neutral-900 hover:bg-neutral-800'
                }`}
                title="Force update on all visitor screens"
            >
                {isBroadcasting ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                    <Radio className="w-3 h-3" />
                )}
                {isBroadcasting ? 'Updating...' : 'Update Repository'}
            </button>

            <div className="h-6 w-px bg-neutral-200"></div>

            <button onClick={handleLogout} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 bg-neutral-200/50 p-1 rounded-xl w-fit">
            <button 
                onClick={() => setActiveTab('work')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'work' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <LayoutDashboard className="w-4 h-4" /> Projects
            </button>
            <button 
                onClick={() => setActiveTab('experience')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'experience' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Briefcase className="w-4 h-4" /> Experience
            </button>
            <button 
                onClick={() => setActiveTab('skills')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'skills' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Wrench className="w-4 h-4" /> Skills
            </button>
            <button 
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'clients' 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
                <Users className="w-4 h-4" /> Clients
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'work' && <WorkTable onEdit={onEditProject} />}
        {activeTab === 'experience' && <ExperienceTable />}
        {activeTab === 'skills' && <SkillsTable />}
        {activeTab === 'clients' && <ClientsTable />}

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex justify-between items-center text-sm text-neutral-500">
            <p className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Changes sync instantly across all devices.
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