import React, { useState } from 'react';
import { LayoutDashboard, Briefcase, LogOut, CheckCircle, Settings, X } from 'lucide-react';
import WorkTable from './WorkTable';
import ExperienceTable from './ExperienceTable';
import { useData } from '../../contexts/DataContext';

interface DashboardProps {
  onLogout: () => void;
  onEditProject: (projectId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout, onEditProject }) => {
  const [activeTab, setActiveTab] = useState<'work' | 'experience'>('work');
  const { resetData } = useData();
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newCreds, setNewCreds] = useState({ email: '', password: '' });

  const handlePublish = () => {
    setIsPublishing(true);
    // Simulate API call delay
    setTimeout(() => {
        setIsPublishing(false);
        alert("Changes published to live site successfully!");
    }, 1000);
  };

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreds.email || !newCreds.password) {
        alert("Please fill in both fields.");
        return;
    }
    
    localStorage.setItem('cms_credentials', JSON.stringify(newCreds));
    alert('Credentials updated successfully. Please login with your new details.');
    setShowSettings(false);
    onLogout();
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
            <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                title="Settings"
            >
                <Settings className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors" title="Logout">
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
        {activeTab === 'work' ? (
          <WorkTable onEdit={onEditProject} />
        ) : (
          <ExperienceTable />
        )}

        {/* Footer Actions */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex justify-between items-center text-sm text-neutral-500">
            <p>Changes are saved locally to your browser until you clear cache.</p>
            <button onClick={resetData} className="text-red-500 hover:text-red-700 underline">
                Reset to Demo Data
            </button>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-900">CMS Settings</h3>
                    <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-neutral-400 hover:text-neutral-900"/></button>
                </div>
                <form onSubmit={handleUpdateCredentials} className="p-6 space-y-4">
                    <div className="p-4 bg-yellow-50 text-yellow-800 text-xs rounded-lg mb-4">
                        Warning: Updating these credentials only affects this browser. If you clear your cache, it will reset to defaults.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-900 mb-2">New Email</label>
                        <input 
                            type="email" 
                            required
                            value={newCreds.email}
                            onChange={e => setNewCreds({...newCreds, email: e.target.value})}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-neutral-900 mb-2">New Password</label>
                        <input 
                            type="password" 
                            required
                            value={newCreds.password}
                            onChange={e => setNewCreds({...newCreds, password: e.target.value})}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="w-full py-3 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors">
                            Update Credentials
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;