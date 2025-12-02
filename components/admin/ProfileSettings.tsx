import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus, Trash2, Loader2, Check } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { config, socials, updateConfig, updateSocials, isSaving } = useData();
  
  // Local state to prevent rapid context updates while typing
  const [localConfig, setLocalConfig] = useState(config);
  const [localSocials, setLocalSocials] = useState(socials);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Sync with context on mount (or if external update happens)
  useEffect(() => {
    setLocalConfig(config);
    setLocalSocials(socials);
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
      updateConfig(localConfig);
      updateSocials(localSocials);
      setHasChanges(false);
      setJustSaved(true);
      
      // Reset success message after 3s
      setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div className="space-y-12 max-w-4xl pb-24">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
          <button 
            onClick={saveChanges}
            disabled={!hasChanges && !isSaving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                hasChanges 
                ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                : justSaved 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : justSaved ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : justSaved ? 'Saved' : 'Save Changes'}
          </button>
      </div>

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