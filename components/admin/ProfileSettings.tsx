import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus, Trash2, Loader2, Check, Database, AlertTriangle, Wifi, ExternalLink } from 'lucide-react';

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

  // Helper to run connection test
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

  useEffect(() => {
    setLocalConfig(config);
    setLocalSocials(socials);
    setDeployHook(localStorage.getItem('vercel_deploy_hook') || '');
    
    // Auto-check connection on mount to show status immediately
    testConnection();
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
    // Generate UUID for the new social link
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
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700 flex items-center gap-2 font-medium animate-in fade-in slide-in-from-top-1">
                <Check className="w-4 h-4"/>
                {connectionMsg}
            </div>
        )}
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
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Introduction Text</label>
                <textarea 
                    value={localConfig.heroDescription || ""}
                    onChange={(e) => handleConfigChange('heroDescription', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none resize-none"
                />
            </div>
        </div>
      </section>

      {/* Social Links Configuration */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
            <h3 className="text-lg font-medium">Social Links</h3>
            <button 
                onClick={handleAddSocial}
                className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
            >
                <Plus className="w-3 h-3" /> Add Link
            </button>
        </div>
        
        <div className="space-y-4">
            {localSocials.map((social, index) => (
                <div key={social.id || index} className="flex flex-col md:flex-row gap-4 p-4 bg-white border border-neutral-200 rounded-lg shadow-sm">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase">Platform</label>
                        <input 
                            type="text" 
                            value={social.platform}
                            onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:bg-white focus:border-neutral-400"
                            placeholder="e.g. Twitter"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                         <label className="text-xs font-bold text-neutral-500 uppercase">URL</label>
                         <input 
                            type="text" 
                            value={social.url}
                            onChange={(e) => handleSocialChange(index, 'url', e.target.value)}
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:bg-white focus:border-neutral-400"
                            placeholder="https://..."
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                         <label className="text-xs font-bold text-neutral-500 uppercase">Label (Visible)</label>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={social.label}
                                onChange={(e) => handleSocialChange(index, 'label', e.target.value)}
                                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:bg-white focus:border-neutral-400"
                                placeholder="@username"
                            />
                            <button 
                                onClick={() => handleDeleteSocial(index)}
                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors self-end"
                                title="Remove Link"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                    </div>
                </div>
            ))}
            {localSocials.length === 0 && (
                <div className="text-center py-6 text-neutral-400 text-sm bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                    No social links added yet.
                </div>
            )}
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
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Resume URL</label>
                <input 
                    type="text" 
                    value={localConfig.resumeUrl}
                    onChange={(e) => handleConfigChange('resumeUrl', e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                />
            </div>
        </div>
      </section>

      {/* Deploy Hook */}
      <section className="space-y-6">
         <h3 className="text-lg font-medium border-b border-neutral-200 pb-2">Deploy Automation</h3>
         <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-neutral-700 flex items-center gap-2">
                    <Wifi className="w-3 h-3" /> Vercel Deploy Hook (Optional)
                </label>
                <a href="https://vercel.com/docs/deployments/deploy-hooks" target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 flex items-center gap-1 hover:underline">
                    Get Hook URL <ExternalLink className="w-3 h-3"/>
                </a>
            </div>
            <input 
                type="password"
                value={deployHook}
                onChange={(e) => setDeployHook(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                placeholder="https://api.vercel.com/v1/integrations/deploy/..."
            />
            <p className="text-xs text-neutral-500">
                Trigger a site rebuild automatically when you click "Sync Data".
            </p>
         </div>
      </section>

    </div>
  );
};

export default ProfileSettings;