import React, { useRef, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus, Upload, Loader2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

// Manually define Vite env types since vite/client is missing
declare global {
  interface ImportMetaEnv {
    VITE_GITHUB_OWNER?: string;
    VITE_GITHUB_REPO?: string;
    VITE_GITHUB_TOKEN?: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const ClientsTable: React.FC = () => {
  const { clients, updateClient, deleteClient, addClient } = useData();
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);

  const handleAddNew = () => {
    const newId = `client-${Date.now()}`;
    addClient({
      id: newId,
      name: "New Client",
      url: "",
      logo: ""
    });
  };

  const triggerUpload = (clientId: string) => {
    setUploadingForId(clientId);
    fileInputRef.current?.click();
  };

  const processUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingForId) return;

    setIsUploading(true);
    
    try {
        const storedGit = localStorage.getItem('cms_git_config');
        let gitConfig = storedGit ? JSON.parse(storedGit) : null;
        
        if (!gitConfig && import.meta.env.VITE_GITHUB_TOKEN) {
            gitConfig = {
                owner: import.meta.env.VITE_GITHUB_OWNER,
                repo: import.meta.env.VITE_GITHUB_REPO,
                token: import.meta.env.VITE_GITHUB_TOKEN
            };
        }

        let finalUrl = '';

        if (gitConfig && gitConfig.owner && gitConfig.repo && gitConfig.token) {
            try {
                const { owner, repo, token } = gitConfig;
                const reader = new FileReader();
                await new Promise<void>((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const base64Content = (reader.result as string).split(',')[1];
                            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
                            const filename = `client-${Date.now()}-${cleanName}`;
                            const path = `public/uploads/clients/${filename}`;
                            
                            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `token ${token}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    message: `CMS Client Logo Upload: ${cleanName}`,
                                    content: base64Content
                                })
                            });

                            if (res.ok) {
                                finalUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            } catch (err) {
                console.warn("GitHub upload failed, falling back to Base64", err);
            }
        }

        if (!finalUrl) {
            const reader = new FileReader();
            finalUrl = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
        }

        updateClient(uploadingForId, { logo: finalUrl });

    } catch (error) {
        console.error("Upload error", error);
        alert("Failed to upload image.");
    } finally {
        setIsUploading(false);
        setUploadingForId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/png,image/svg+xml,image/jpeg"
        onChange={processUpload}
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Clients & Collaborations ({clients.length})</h3>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold w-16 text-center">Logo</th>
                <th className="px-6 py-4 font-semibold w-1/3">Client Name</th>
                <th className="px-6 py-4 font-semibold w-1/3">Website</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <button 
                        onClick={() => triggerUpload(client.id)}
                        disabled={isUploading && uploadingForId === client.id}
                        className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200 overflow-hidden hover:border-neutral-400 transition-colors group relative"
                        title="Upload Logo"
                    >
                        {isUploading && uploadingForId === client.id ? (
                             <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                        ) : client.logo ? (
                            <>
                                <img src={client.logo} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                    <Upload className="w-4 h-4"/>
                                </div>
                            </>
                        ) : (
                             <ImageIcon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
                        )}
                    </button>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <input 
                      className="bg-transparent border-none p-0 font-bold text-neutral-900 w-full focus:ring-0 placeholder:text-neutral-300"
                      value={client.name}
                      onChange={(e) => updateClient(client.id, { name: e.target.value })}
                      placeholder="e.g. Google"
                    />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <input 
                            className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0 placeholder:text-neutral-300 text-xs"
                            value={client.url || ''}
                            onChange={(e) => updateClient(client.id, { url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <button 
                        onClick={() => deleteClient(client.id)}
                        className="text-neutral-400 hover:text-red-600 p-2"
                        title="Delete Client"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientsTable;