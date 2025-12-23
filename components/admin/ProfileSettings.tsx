
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus, Trash2, Loader2, Check, Database, AlertTriangle, Wifi, ExternalLink, Globe, Search, Monitor, Info, Share2, ChevronUp, ChevronDown, Layout, Github, Key } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSettings: React.FC = () => {
  const { config, socials, updateConfig, updateSocials, saveAllData, isSaving } = useData();
  
  const [localConfig, setLocalConfig] = useState(config);
  const [localSocials, setLocalSocials] = useState(socials);
  
  // GitHub Settings (Stored in LocalStorage for the Admin session)
  const [ghToken, setGhToken] = useState(localStorage.getItem('github_token') || '');
  const [ghOwner, setGhOwner] = useState(localStorage.getItem('github_owner') || '');
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('github_repo') || '');

  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(config);
    setLocalSocials(socials);
  }, [config, socials]);

  const handleConfigChange = (field: keyof typeof config, value: any) => {
      setLocalConfig(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
      setJustSaved(false);
  };

  const handleSocialChange = (index: number, field: keyof typeof localSocials[0], value: string) => {
    const newSocials = [...localSocials];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setLocalSocials(newSocials);
    setHasChanges(true);
    setJustSaved(false);
  };

  const handleAddSocial = () => {
    const newId = self.crypto.randomUUID();
    const newSocials = [...localSocials, { id: newId, platform: "New Platform", url: "", label: "Link Label" }];
    setLocalSocials(newSocials);
    setHasChanges(true);
  };

  const handleDeleteSocial = (index: number) => {
    const newSocials = localSocials.filter((_, i) => i !== index);
    setLocalSocials(newSocials);
    setHasChanges(true);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const order = [...(localConfig.sectionOrder || ['clients', 'work', 'experience', 'skills'])];
    if (direction === 'up' && index > 0) {
      [order[index], order[index - 1]] = [order[index - 1], order[index]];
    } else if (direction === 'down' && index < order.length - 1) {
      [order[index], order[index + 1]] = [order[index + 1], order[index]];
    }
    handleConfigChange('sectionOrder', order);
  };

  const saveChanges = async () => {
      setError(null);
      
      // Save credentials first
      localStorage.setItem('github_token', ghToken);
      localStorage.setItem('github_owner', ghOwner);
      localStorage.setItem('github_repo', ghRepo);

      if (!ghToken || !ghOwner || !ghRepo) {
          toast.error("GitHub Credentials Required");
          setError("Please provide GitHub Owner, Repo, and a Personal Access Token to save changes.");
          return;
      }

      try {
          // Push local state to global context then save
          await updateConfig(localConfig);
          await updateSocials(localSocials);
          
          await saveAllData("Update site configuration");
          
          setHasChanges(false);
          setJustSaved(true);
          toast.success("Settings saved to GitHub");
          setTimeout(() => setJustSaved(false), 3000);
      } catch (e: any) {
          setError(e.message || "Failed to update settings.");
          toast.error("Save failed. Check console for details.");
      }
  };

  return (
    <div className="space-y-12 max-w-5xl pb-24 font-sans">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center sticky top-0 bg-neutral-100/80 backdrop-blur-md py-4 z-50 border-b border-neutral-200/50 -mx-4 px-4 md:-mx-8 md:px-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
            {error && <p className="text-[10px] text-red-600 font-bold mt-1 uppercase tracking-wider">{error}</p>}
          </div>
          <button 
            onClick={saveChanges}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                justSaved 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-900 text-white hover:bg-black'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : justSaved ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4" />}
            {isSaving ? 'Syncing...' : justSaved ? 'Saved' : 'Save & Publish'}
          </button>
      </div>

      {/* GitHub Connection */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
            <div className="p-2 bg-neutral-900 rounded-lg text-white">
                <Github className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-neutral-900">GitHub Storage</h3>
                <p className="text-xs text-neutral-500">Your site data is stored as JSON in your repository.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Repo Owner</label>
                <input 
                    type="text" value={ghOwner} onChange={e => setGhOwner(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                    placeholder="e.g. mukhianik"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Repo Name</label>
                <input 
                    type="text" value={ghRepo} onChange={e => setGhRepo(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                    placeholder="e.g. portfolio-site"
                />
            </div>
            <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" /> GitHub Personal Access Token (Classic)
                </label>
                <input 
                    type="password" value={ghToken} onChange={e => setGhToken(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-black outline-none"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-[10px] text-neutral-400">Needs <code>repo</code> scope to update <code>src/data.json</code>.</p>
            </div>
        </div>
      </section>

      {/* Experience Section Edit */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Monitor className="w-5 h-5 text-neutral-400" /> Site Content
        </h3>
        
        <div className="space-y-6 pt-4 border-t border-neutral-100">
            <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Hero Headline</label>
                <input 
                    type="text" 
                    value={localConfig.heroHeadline || ""}
                    onChange={(e) => handleConfigChange('heroHeadline', e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm"
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
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm resize-none font-mono"
                    placeholder="Over the past 5 years..."
                />
                <p className="text-[10px] text-neutral-400 font-mono italic">// The text above will be updated on your live site immediately after saving.</p>
            </div>
        </div>
      </section>

      {/* SEO Section */}
      <section className="space-y-6 bg-white p-8 rounded-xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Globe className="w-5 h-5 text-neutral-400" /> Search Optimization
        </h3>
        <div className="grid grid-cols-1 gap-6 pt-4 border-t border-neutral-100">
            <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Meta Title</label>
                <input 
                    type="text" 
                    value={localConfig.seoTitle || ""}
                    onChange={(e) => handleConfigChange('seoTitle', e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm"
                />
            </div>
            <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Meta Description</label>
                <textarea 
                    value={localConfig.seoDescription || ""}
                    onChange={(e) => handleConfigChange('seoDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 outline-none text-sm resize-none"
                />
            </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
            <h3 className="text-lg font-bold flex items-center gap-2">Social Channels</h3>
            <button 
                onClick={handleAddSocial}
                className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
            >
                <Plus className="w-3 h-3" /> Add Link
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localSocials.map((social, index) => (
                <div key={social.id || index} className="flex flex-col gap-3 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center">
                         <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{social.platform || "Platform"}</label>
                         <button 
                            onClick={() => handleDeleteSocial(index)}
                            className="p-1 text-neutral-300 hover:text-red-500 rounded transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            value={social.platform}
                            onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
                            className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded text-xs focus:outline-none"
                        />
                        <input 
                            type="text" 
                            value={social.url}
                            onChange={(e) => handleSocialChange(index, 'url', e.target.value)}
                            className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded text-xs focus:outline-none"
                        />
                    </div>
                </div>
            ))}
        </div>
      </section>

    </div>
  );
};

export default ProfileSettings;
