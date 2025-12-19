
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus, Trash2, Loader2, Check, Database, AlertTriangle, Wifi, ExternalLink, Globe, Search, Monitor, Info } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { config, socials, updateConfig, updateSocials, isSaving, verifyConnection } = useData();
  
  const [localConfig, setLocalConfig] = useState(config);
  const [localSocials, setLocalSocials] = useState(socials);
  const [deployHook, setDeployHook] = useState('');

  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  
  // Connection Test State
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMsg, setConnectionMsg] = useState('');

  useEffect(() => {
    setLocalConfig(config);
    setLocalSocials(socials);
    setDeployHook(localStorage.getItem('vercel_deploy_hook') || '');
  }, [config, socials]);

  const handleConfigChange = (field: keyof typeof config, value: string) => {
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
    setJustSaved(false);
  };

  const handleDeleteSocial = (index: number) => {
    const newSocials = localSocials.filter((_, i) => i !== index);
    setLocalSocials(newSocials);
    setHasChanges(true);
    setJustSaved(false);
  };

  const saveChanges = () => {
      updateConfig(localConfig);
      updateSocials(localSocials);
      
      if (deployHook) {
          localStorage.setItem('vercel_deploy_hook', deployHook);
      } else {
          localStorage.removeItem('vercel_deploy_hook');
      }
      
      setHasChanges(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
  };

  const testConnection = async () => {
      setConnectionStatus('testing');
      setConnectionMsg('');
      try {
        const result = await verifyConnection();
        if (result.success) {
            setConnectionStatus('success');
            setConnectionMsg(result.message);
        } else {
            setConnectionStatus('error');
            setConnectionMsg(result.message);
        }
      } catch(e) {
          setConnectionStatus('error');
      }
  };

  return (
    <div className="space-y-12 max-w-4xl pb-24 font-sans">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center sticky top-0 bg-neutral-100 py-4 z-10 border-b border-neutral-200/50">
          <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
          <button 
            onClick={saveChanges}
            disabled={!hasChanges && !isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                hasChanges 
                ? 'bg-neutral-900 text-white hover:bg-black' 
                : justSaved 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : justSaved ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : justSaved ? 'Saved' : 'Save Changes'}
          </button>
      </div>

      {/* Database Connection */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex justify-between items-start border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
                    <Database className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-neutral-900">Database Status</h3>
                    <p className="text-xs text-neutral-500">Connected via Supabase.</p>
                </div>
            </div>
            <button 
                onClick={testConnection}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded text-xs font-bold text-neutral-600 transition-colors"
            >
                {connectionStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wifi className="w-3 h-3"/>}
                Check Connection
            </button>
        </div>
        
        {connectionStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4"/>
                {connectionMsg}
            </div>
        )}
        {connectionStatus === 'success' && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4"/>
                {connectionMsg}
            </div>
        )}
      </section>

      {/* Hero & About Section Configuration */}
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
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm"
                    placeholder="e.g. Product Designer"
                />
            </div>
            
             <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Hero Subheadline (Accent)</label>
                <input 
                    type="text" 
                    value={localConfig.heroSubheadline || ""}
                    onChange={(e) => handleConfigChange('heroSubheadline', e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm"
                    placeholder="e.g. & Creative Dev."
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Hero Introduction</label>
                <textarea 
                    value={localConfig.heroDescription || ""}
                    onChange={(e) => handleConfigChange('heroDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm resize-none"
                    placeholder="Brief intro for the hero section..."
                />
            </div>

            {/* Experience Intro Edit */}
            <div className="space-y-2 pt-4 border-t border-neutral-50">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    Experience Intro Text
                    <Info className="w-3 h-3 text-neutral-300" title="The text starting with // in the experience section" />
                </label>
                <textarea 
                    value={localConfig.experienceIntro || ""}
                    onChange={(e) => handleConfigChange('experienceIntro', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm resize-none font-mono"
                    placeholder="Over the past 5 years, I've worked with..."
                />
                <p className="text-[10px] text-neutral-400 font-mono italic">// The text above will be prefixed with double slashes automatically.</p>
            </div>
        </div>
      </section>

      {/* SEO Section Configuration */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-neutral-400" /> Search Engine Optimization (SEO)
            </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Search Title (Meta Title)</label>
                    <input 
                        type="text" 
                        value={localConfig.seoTitle || ""}
                        onChange={(e) => handleConfigChange('seoTitle', e.target.value)}
                        className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm"
                        placeholder="Mukhi Anik | Portfolio"
                    />
                    <div className="flex justify-between">
                         <span className="text-[10px] text-neutral-400 uppercase font-bold">Characters: {localConfig.seoTitle?.length || 0}</span>
                         <span className={`text-[10px] uppercase font-bold ${localConfig.seoTitle?.length && localConfig.seoTitle.length > 60 ? 'text-red-500' : 'text-neutral-400'}`}>Recommended: &lt; 60</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Search Description (Meta Description)</label>
                    <textarea 
                        value={localConfig.seoDescription || ""}
                        onChange={(e) => handleConfigChange('seoDescription', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm resize-none"
                        placeholder="Write a clear summary for search results..."
                    />
                    <div className="flex justify-between">
                         <span className="text-[10px] text-neutral-400 uppercase font-bold">Characters: {localConfig.seoDescription?.length || 0}</span>
                         <span className={`text-[10px] uppercase font-bold ${localConfig.seoDescription?.length && localConfig.seoDescription.length > 160 ? 'text-red-500' : 'text-neutral-400'}`}>Recommended: &lt; 160</span>
                    </div>
                </div>
            </div>

            {/* Google Search Preview */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Google Search Preview</label>
                <div className="p-6 bg-white border border-neutral-100 rounded-xl shadow-inner space-y-1.5 font-sans cursor-default">
                    <div className="flex items-center gap-2 text-xs text-neutral-600 mb-1">
                        <div className="w-5 h-5 bg-neutral-100 rounded-full flex items-center justify-center text-[10px] font-bold">M</div>
                        <span>mukhianik.com › portfolio</span>
                    </div>
                    <h4 className="text-xl text-[#1a0dab] hover:underline transition-all line-clamp-1">
                        {localConfig.seoTitle || localConfig.heroHeadline || "Page Title Placeholder"}
                    </h4>
                    <p className="text-sm text-neutral-600 line-clamp-3 leading-relaxed">
                        {localConfig.seoDescription || localConfig.heroDescription || "This is a preview of how your page description will appear in search results. Start typing to see it update live."}
                    </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
                    <Search className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                        Optimizing your SEO titles and descriptions helps improve your site's visibility on Google and Bing, and controls what people see when you share your link on social media.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Social Links Configuration */}
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
                            className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded text-xs focus:outline-none focus:bg-white focus:border-neutral-300"
                            placeholder="Platform name..."
                        />
                        <input 
                            type="text" 
                            value={social.url}
                            onChange={(e) => handleSocialChange(index, 'url', e.target.value)}
                            className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded text-xs focus:outline-none focus:bg-white focus:border-neutral-300"
                            placeholder="https://..."
                        />
                        <input 
                            type="text" 
                            value={social.label}
                            onChange={(e) => handleSocialChange(index, 'label', e.target.value)}
                            className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded text-xs focus:outline-none focus:bg-white focus:border-neutral-300"
                            placeholder="Display text..."
                        />
                    </div>
                </div>
            ))}
            {localSocials.length === 0 && (
                <div className="col-span-2 text-center py-6 text-neutral-400 text-sm bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                    No social links added yet.
                </div>
            )}
        </div>
      </section>

      {/* General Configuration */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold border-b border-neutral-100 pb-4">General Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Contact Email</label>
                <input 
                    type="email" 
                    value={localConfig.email}
                    onChange={(e) => handleConfigChange('email', e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white text-sm transition-all"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Resume URL</label>
                <input 
                    type="text" 
                    value={localConfig.resumeUrl}
                    onChange={(e) => handleConfigChange('resumeUrl', e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white text-sm transition-all"
                />
            </div>
        </div>
      </section>

      {/* Deploy Hook */}
      <section className="space-y-6 bg-neutral-900 text-white p-8 rounded-2xl shadow-xl">
         <h3 className="text-lg font-bold flex items-center gap-2">
            <Wifi className="w-5 h-5 text-neutral-400" /> Deploy Automation
         </h3>
         <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                    Connect a Vercel Deploy Hook to automatically rebuild your site whenever you save changes.
                </p>
                <a href="https://vercel.com/docs/deployments/deploy-hooks" target="_blank" rel="noreferrer" className="text-[10px] text-neutral-400 flex items-center gap-1 hover:text-white underline">
                    Documentation <ExternalLink className="w-3 h-3"/>
                </a>
            </div>
            <div className="relative">
                <input 
                    type="password"
                    value={deployHook}
                    onChange={(e) => setDeployHook(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white focus:outline-none transition-all text-sm text-white placeholder:text-neutral-600"
                    placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                />
            </div>
         </div>
      </section>

    </div>
  );
};

export default ProfileSettings;
