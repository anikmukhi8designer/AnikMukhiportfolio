
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Loader2, Check, Github, Key, Info, Monitor, Globe, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSettings: React.FC = () => {
  const { config, socials, updateConfig, updateSocials, saveAllData, isSaving, error: syncError } = useData();
  
  const [localConfig, setLocalConfig] = useState(config);
  const [localSocials, setLocalSocials] = useState(socials);
  
  // GitHub Credentials
  const [ghToken, setGhToken] = useState(localStorage.getItem('github_token') || '');
  const [ghOwner, setGhOwner] = useState(localStorage.getItem('github_owner') || '');
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('github_repo') || '');

  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setLocalSocials(socials);
  }, [config, socials]);

  const handleConfigChange = (field: keyof typeof config, value: any) => {
      setLocalConfig(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
      setJustSaved(false);
  };

  const handleSave = async () => {
      if (!ghToken || !ghOwner || !ghRepo) {
          toast.error("GitHub credentials required in Settings.");
          return;
      }

      localStorage.setItem('github_token', ghToken);
      localStorage.setItem('github_owner', ghOwner);
      localStorage.setItem('github_repo', ghRepo);

      try {
          await updateConfig(localConfig);
          await updateSocials(localSocials);
          await saveAllData("Update profile settings via Admin Panel");
          
          setHasChanges(false);
          setJustSaved(true);
          toast.success("Changes pushed to GitHub successfully");
          setTimeout(() => setJustSaved(false), 3000);
      } catch (e: any) {
          toast.error(e.message || "Failed to save changes.");
      }
  };

  return (
    <div className="space-y-12 max-w-5xl pb-24 font-sans">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center sticky top-0 bg-neutral-100/80 backdrop-blur-md py-4 z-50 border-b border-neutral-200/50 -mx-4 px-4 md:-mx-8 md:px-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
            {syncError && <p className="text-[10px] text-red-600 font-bold mt-1 uppercase tracking-wider">{syncError}</p>}
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                justSaved 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-900 text-white hover:bg-black'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : justSaved ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4" />}
            {isSaving ? 'Pushing to GitHub...' : justSaved ? 'Live' : 'Save & Publish'}
          </button>
      </div>

      {/* GitHub Storage Config */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
            <div className="p-2 bg-neutral-900 rounded-lg text-white">
                <Github className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-neutral-900">GitHub Persistence</h3>
                <p className="text-xs text-neutral-500">Connect your repository to save changes forever.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Repo Owner</label>
                <input 
                    type="text" value={ghOwner} onChange={e => { setGhOwner(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                    placeholder="e.g. mukhianik"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Repo Name</label>
                <input 
                    type="text" value={ghRepo} onChange={e => { setGhRepo(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                    placeholder="e.g. portfolio"
                />
            </div>
            <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" /> Personal Access Token (Classic)
                </label>
                <input 
                    type="password" value={ghToken} onChange={e => { setGhToken(e.target.value); setHasChanges(true); }}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                    placeholder="ghp_xxxxxxxxxxxx"
                />
            </div>
        </div>
      </section>

      {/* Content Management */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Monitor className="w-5 h-5 text-neutral-400" /> Site Content
        </h3>
        
        <div className="grid grid-cols-1 gap-6 pt-4 border-t border-neutral-100">
            <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Hero Headline</label>
                <input 
                    type="text" 
                    value={localConfig.heroHeadline || ""}
                    onChange={(e) => handleConfigChange('heroHeadline', e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    Experience Intro Text
                    <Info className="w-3 h-3 text-neutral-300" />
                </label>
                <textarea 
                    value={localConfig.experienceIntro || ""}
                    onChange={(e) => handleConfigChange('experienceIntro', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono resize-none"
                    placeholder="Over the past 5 years..."
                />
                <p className="text-[10px] text-neutral-400 font-mono italic">// This text will be auto-prefixed with // in the Experience section.</p>
            </div>
        </div>
      </section>

      {/* Search & Social */}
      <section className="space-y-6 bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-neutral-400" /> Search Optimization
        </h3>
        <div className="grid grid-cols-1 gap-6 pt-4 border-t border-neutral-100">
            <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Meta Title</label>
                <input 
                    type="text" value={localConfig.seoTitle || ""}
                    onChange={(e) => handleConfigChange('seoTitle', e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm"
                />
            </div>
            <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Meta Description</label>
                <textarea 
                    value={localConfig.seoDescription || ""}
                    onChange={(e) => handleConfigChange('seoDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm resize-none"
                />
            </div>
        </div>
      </section>
    </div>
  );
};

export default ProfileSettings;
