import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Save, Plus, Trash2, Github, Linkedin, Mail, Twitter } from 'lucide-react';

const ProfileSettings: React.FC = () => {
  const { config, socials, updateConfig, updateSocials } = useData();
  
  // Local state to manage form fields before saving to context if needed, 
  // but for simplicity we'll update context directly which auto-saves to GitHub.
  
  const handleSocialChange = (index: number, field: keyof typeof socials[0], value: string) => {
    const newSocials = [...socials];
    newSocials[index] = { ...newSocials[index], [field]: value };
    updateSocials(newSocials);
  };

  const handleAddSocial = () => {
    const newSocials = [...socials, { platform: "New Platform", url: "", label: "Link Label" }];
    updateSocials(newSocials);
  };

  const handleDeleteSocial = (index: number) => {
    const newSocials = socials.filter((_, i) => i !== index);
    updateSocials(newSocials);
  };

  return (
    <div className="space-y-12 max-w-4xl">
      
      {/* General Configuration */}
      <section className="space-y-6">
        <h3 className="text-lg font-medium border-b border-neutral-200 pb-2">General Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700">Contact Email</label>
                <input 
                    type="email" 
                    value={config.email}
                    onChange={(e) => updateConfig({ email: e.target.value })}
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
                        value={config.resumeUrl}
                        onChange={(e) => updateConfig({ resumeUrl: e.target.value })}
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
                    {socials.map((social, index) => (
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
            {socials.length === 0 && (
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