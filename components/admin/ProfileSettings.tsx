import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus, Trash2, Loader2, Check, Github, Key, Database, Lock } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { config, socials, updateConfig, updateSocials, isSaving } = useData();
  
  // Local state to prevent rapid context updates while typing
  const [localConfig, setLocalConfig] = useState(config);
  const [localSocials, setLocalSocials] = useState(socials);
  
  // GitHub Config State
  const [ghConfig, setGhConfig] = useState({
      owner: '',
      repo: '',
      token: ''
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Sync with context and localStorage on mount
  useEffect(() => {
    setLocalConfig(config);
    setLocalSocials(socials);
    setGhConfig({
        owner: localStorage.getItem('github_owner') || '',
        repo: localStorage.getItem('github_repo') || '',
        token: localStorage.getItem('github_token') || '' // Read directly from storage
    });
  }, [config, socials]);

  const handleConfigChange = (field: keyof typeof config, value: string) => {
      setLocalConfig(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
      setJustSaved(false);
  };

  const handleGhChange = (field: keyof typeof ghConfig, value: string) => {
      setGhConfig(prev => ({ ...prev, [field]: value }));
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
    const newSocials = [...localSocials, { platform: "New Platform", url: "", label: "Link Label" }];
    setLocalSocials(newSocials);
    setHasChanges(true);
    setJustSaved(false);
  };

  const handleDeleteSocial = (index: number) => {
    const newSocials = localSocials.filter((_, i) => i !== index);
    setLocalSocials(newSocials);
    setHasChanges(true);
    setJustSaved(false);
  };

  const saveChanges = () => {
      // Save Data
      updateConfig(localConfig);
      updateSocials(localSocials);
      
      // Save GitHub Config
      // Note: We don't save token here if it's masked, but since we are showing the active session state
      // we mostly care about Repo Name updates here.
      localStorage.setItem('github_owner', ghConfig.owner);
      localStorage.setItem('github_repo', ghConfig.repo);
      
      setHasChanges(false);
      setJustSaved(true);
      
      // Reset success message after 3s
      setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div className="space-y-12 max-w-4xl pb-24">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center sticky top-0 bg-neutral-100 py-4 z-10 border-b border-neutral-200/50">
          <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
          <button 
            onClick={saveChanges}
            disabled={!hasChanges && !isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                hasChanges 
                ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                : justSaved 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : justSaved ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : justSaved ? 'Saved' : 'Save Changes'}
          </button>
      </div>

      {/* GitHub CMS Configuration */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
            <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                <Database className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-neutral-900">CMS Configuration</h3>
                <p className="text-xs text-neutral-500">Connected via Active Session.</p>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                    <Github className="w-3 h-3" /> Repository Owner
                </label>
                <input 
                    type="text" 
                    value={ghConfig.owner}
                    disabled
                    className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-500 cursor-not-allowed"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                    <Database className="w-3 h-3" /> Repository Name
                </label>
                <input 
                    type="text" 
                    value={ghConfig.repo}
                    onChange={(e) => handleGhChange('repo', e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-neutral-900 focus:bg-white focus:outline-none transition-all"
                    placeholder="e.g. portfolio"
                />
            </div>
            <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                    <Key className="w-3 h-3" /> Personal Access Token (PAT)
                </label>
                <div className="relative">
                    <input 
                        type="password"
                        value="********************************"
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-500 cursor-not-allowed"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[10px] text-neutral-400">
                    To change the token, please <button onClick={() => { localStorage.removeItem('github_token'); window.location.reload(); }} className="text-blue-600 hover:underline">logout</button> and authenticate again.
                </p>
            </div>
        </div>
      </section>

      {/* Hero Section Configuration */}
      <section className="space-y-6">
        <h3 className="text-lg font-medium border-b border-neutral-200 pb-2">Hero Section</h3>
        
        <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Headline</label>
                <input 
                    type="text" 
                    value={localConfig.heroHeadline || "Product Designer"}
                    onChange={(e) => handleConfigChange('heroHeadline', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="e.g. Product Designer"
                />
            </div>
            
             <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Subheadline (Accent)</label>
                <input 
                    type="text" 
                    value={localConfig.heroSubheadline || "& Creative Dev."}
                    onChange={(e) => handleConfigChange('heroSubheadline', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="e.g. & Creative Dev."
                />
                <p className="text-xs text-neutral-500">This text appears in a lighter gray color below or next to the main headline.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Introduction Text</label>
                <textarea 
                    value={localConfig.heroDescription || "Building digital products that blend aesthetics with function..."}
                    onChange={(e) => handleConfigChange('heroDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none resize-none"
                    placeholder="Brief intro text..."
                />
            </div>
        </div>
      </section>

      {/* General Configuration */}
      <section className="space-y-6">
        <h3 className="text-lg font-medium border-b border-neutral-200 pb-2">General Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Contact Email</label>
                <input 
                    type="email" 
                    value={localConfig.email}
                    onChange={(e) => handleConfigChange('email', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="hello@example.com"
                />
                <p className="text-xs text-neutral-500">Displayed in footer and navigation.</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Resume URL</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={localConfig.resumeUrl}
                        onChange={(e) => handleConfigChange('resumeUrl', e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                        placeholder="/resume.pdf or https://..."
                    />
                </div>
                <p className="text-xs text-neutral-500">Link used for the "Download Resume" button.</p>
            </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
             <h3 className="text-lg font-medium">Social Links</h3>
             <button 
                onClick={handleAddSocial}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-800"
             >
                <Plus className="w-3 h-3" /> Add Link
             </button>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs">
                    <tr>
                        <th className="px-6 py-4 font-semibold w-1/4">Platform</th>
                        <th className="px-6 py-4 font-semibold w-1/4">Label</th>
                        <th className="px-6 py-4 font-semibold w-1/3">URL</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                    {localSocials.map((social, index) => (
                        <tr key={index} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <input 
                                    className="bg-transparent border-none p-0 font-bold text-neutral-900 w-full focus:ring-0 placeholder:text-neutral-300"
                                    value={social.platform}
                                    onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
                                    placeholder="Platform Name"
                                />
                            </td>
                            <td className="px-6 py-4">
                                <input 
                                    className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0 placeholder:text-neutral-300"
                                    value={social.label}
                                    onChange={(e) => handleSocialChange(index, 'label', e.target.value)}
                                    placeholder="@handle"
                                />
                            </td>
                            <td className="px-6 py-4">
                                <input 
                                    className="bg-transparent border-none p-0 text-blue-600 w-full focus:ring-0 placeholder:text-neutral-300"
                                    value={social.url}
                                    onChange={(e) => handleSocialChange(index, 'url', e.target.value)}
                                    placeholder="https://..."
                                />
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => handleDeleteSocial(index)}
                                    className="text-neutral-400 hover:text-red-600 p-2"
                                    title="Delete Link"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {localSocials.length === 0 && (
                <div className="p-8 text-center text-neutral-400 text-sm">
                    No social links added yet.
                </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default ProfileSettings;