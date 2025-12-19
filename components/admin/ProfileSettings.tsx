
import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus, Trash2, Loader2, Check, Database, AlertTriangle, Wifi, ExternalLink, Globe, Search, Monitor, Info, Share2, ChevronUp, ChevronDown, Layout } from 'lucide-react';

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
    setJustSaved(false);
  };

  const handleDeleteSocial = (index: number) => {
    const newSocials = localSocials.filter((_, i) => i !== index);
    setLocalSocials(newSocials);
    setHasChanges(true);
    setJustSaved(false);
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

  const sectionLabels: Record<string, string> = {
    clients: 'Clients & Collaborations',
    work: 'Selected Work (Grid)',
    experience: 'Work History (Experience)',
    skills: 'Design & Tech (Skills)'
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
    <div className="space-y-12 max-w-5xl pb-24 font-sans">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center sticky top-0 bg-neutral-100/80 backdrop-blur-md py-4 z-50 border-b border-neutral-200/50 -mx-4 px-4 md:-mx-8 md:px-8">
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

      {/* Section Layout Manager */}
      <section className="space-y-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h3 className="text-lg font-bold flex items-center gap-2">
            <Layout className="w-5 h-5 text-neutral-400" /> Section Layout
        </h3>
        <p className="text-xs text-neutral-500">Arrange the sequence of sections on your homepage.</p>
        
        <div className="space-y-2 pt-2">
          {(localConfig.sectionOrder || ['clients', 'work', 'experience', 'skills']).map((sectionId, idx, arr) => (
            <div key={sectionId} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg group hover:border-neutral-900 transition-all">
              <span className="text-sm font-bold text-neutral-700">{sectionLabels[sectionId] || sectionId}</span>
              <div className="flex items-center gap-1">
                <button 
                  disabled={idx === 0}
                  onClick={() => moveSection(idx, 'up')}
                  className="p-1.5 text-neutral-400 hover:text-neutral-900 disabled:opacity-20 transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button 
                  disabled={idx === arr.length - 1}
                  onClick={() => moveSection(idx, 'down')}
                  className="p-1.5 text-neutral-400 hover:text-neutral-900 disabled:opacity-20 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
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
      <section className="space-y-6 bg-white p-8 rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-neutral-400" /> Search & Social Optimization
            </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* INPUTS */}
            <div className="space-y-8">
                <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      Meta Title
                      <span className={`text-[10px] ml-auto ${localConfig.seoTitle?.length && localConfig.seoTitle.length > 60 ? 'text-red-500' : 'text-neutral-400'}`}>
                        {localConfig.seoTitle?.length || 0} / 60
                      </span>
                    </label>
                    <input 
                        type="text" 
                        value={localConfig.seoTitle || ""}
                        onChange={(e) => handleConfigChange('seoTitle', e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm font-medium"
                        placeholder="Mukhi Anik | Product Designer"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      Meta Description
                      <span className={`text-[10px] ml-auto ${localConfig.seoDescription?.length && localConfig.seoDescription.length > 160 ? 'text-red-500' : 'text-neutral-400'}`}>
                        {localConfig.seoDescription?.length || 0} / 160
                      </span>
                    </label>
                    <textarea 
                        value={localConfig.seoDescription || ""}
                        onChange={(e) => handleConfigChange('seoDescription', e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all text-sm resize-none leading-relaxed"
                        placeholder="Brief summary for search engines..."
                    />
                </div>

                <div className="bg-blue-50/80 p-5 rounded-2xl flex gap-4 items-start border border-blue-100">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Search className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-[11px] text-blue-800/80 leading-relaxed font-medium">
                        Optimizing these tags directly influences your click-through rate (CTR) from Google results and the clarity of your brand when shared on social platforms.
                    </p>
                </div>
            </div>

            {/* PREVIEWS */}
            <div className="space-y-10">
                {/* Google Preview */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      <Search className="w-3 h-3" /> Google Search Preview
                    </div>
                    <div className="p-6 bg-white border border-neutral-100 rounded-2xl shadow-xl shadow-neutral-100/50 space-y-2 font-sans cursor-default group transition-all hover:border-neutral-200">
                        <div className="flex items-center gap-3 text-xs text-neutral-600 mb-2">
                            <div className="w-7 h-7 bg-neutral-100 rounded-full flex items-center justify-center text-[11px] font-bold border border-neutral-200">
                                M
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-medium text-neutral-900 leading-none">Mukhi Anik</span>
                                <span className="text-[11px] text-neutral-500 mt-0.5">mukhianik.com › portfolio</span>
                            </div>
                        </div>
                        <h4 className="text-[20px] text-[#1a0dab] group-hover:underline transition-all line-clamp-1 leading-tight mb-1">
                            {localConfig.seoTitle || localConfig.heroHeadline || "Mukhi Anik | Product Designer"}
                        </h4>
                        <p className="text-[14px] text-neutral-600 line-clamp-3 leading-snug">
                            {localConfig.seoDescription || localConfig.heroDescription || "Product designer building digital products that blend aesthetics with function. Specializing in SaaS, Fintech, and high-end web experiences."}
                        </p>
                    </div>
                </div>

                {/* Social Media Preview */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      <Share2 className="w-3 h-3" /> Social Share Card
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xl shadow-neutral-100/50 group transition-all">
                        <div className="aspect-[1.91/1] bg-neutral-100 relative overflow-hidden">
                            {config.heroImage ? (
                                <img src={config.heroImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="OG Preview" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Globe className="w-12 h-12 text-neutral-300 opacity-20" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-neutral-100 space-y-1">
                            <div className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">MUKHIANIK.COM</div>
                            <h5 className="text-sm font-bold text-neutral-900 line-clamp-1">
                                {localConfig.seoTitle || localConfig.heroHeadline || "Mukhi Anik | Product Designer"}
                            </h5>
                            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                                {localConfig.seoDescription || localConfig.heroDescription || "Portfolio of Mukhi Anik - Designer & Developer."}
                            </p>
                        </div>
                    </div>
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
