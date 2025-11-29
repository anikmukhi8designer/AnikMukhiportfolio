import React, { useState } from 'react';
import { LayoutDashboard, Briefcase, LogOut, CheckCircle } from 'lucide-react';
import WorkTable from './WorkTable';
import ExperienceTable from './ExperienceTable';
import { useData } from '../../contexts/DataContext';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'work' | 'experience'>('work');
  const { resetData } = useData();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = () => {
    setIsPublishing(true);
    // Simulate API call delay
    setTimeout(() => {
        setIsPublishing(false);
        alert("Changes published to live site successfully!");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* CMS Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-bold text-neutral-900 text-lg">New Genre CMS</span>
            <div className="h-4 w-px bg-neutral-300"></div>
            <span className="text-sm text-neutral-500 font-medium">Administrator</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
                {isPublishing ? 'Publishing...' : (
                    <>
                        <CheckCircle className="w-4 h-4" /> Publish Changes
                    </>
                )}
            </button>
            <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-neutral-200/50 p-1 rounded-xl w-fit">
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
        </div>

        {/* Tab Content */}
        {activeTab === 'work' ? <WorkTable /> : <ExperienceTable />}

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex justify-between items-center text-sm text-neutral-500">
            <p>Changes are saved locally to your browser until you clear cache.</p>
            <button onClick={resetData} className="text-red-500 hover:text-red-700 underline">
                Reset to Demo Data
            </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
