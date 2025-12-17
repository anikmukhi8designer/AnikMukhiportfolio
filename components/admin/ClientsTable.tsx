import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus, Link as LinkIcon, Image as ImageIcon, Loader2, Check, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Client } from '../../types';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const ClientsTable: React.FC = () => {
  const { clients, updateClient, deleteClient, addClient } = useData();
  
  // Local State
  const [localClients, setLocalClients] = useState<Client[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize
  useEffect(() => {
      if (clients.length > 0 && localClients.length === 0 && !hasChanges) {
          setLocalClients(JSON.parse(JSON.stringify(clients)));
      }
  }, [clients]);

  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  const showStatus = (type: 'success' | 'error' | 'loading', message: string) => {
    setStatus({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleLocalUpdate = (id: string, data: Partial<Client>) => {
      setLocalClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      setHasChanges(true);
  };

  const handleLocalAdd = () => {
      const newId = generateUUID();
      const newClient = { id: newId, name: "New Client", url: "", logo: "" };
      setLocalClients(prev => [...prev, newClient]);
      setHasChanges(true);
  };

  const handleLocalDelete = (id: string) => {
      if(!confirm("Delete this client locally?")) return;
      setLocalClients(prev => prev.filter(c => c.id !== id));
      setHasChanges(true);
  };

  const handleUpdateLogo = (id: string) => {
      const url = prompt("Enter Logo URL:");
      if (url !== null) {
          handleLocalUpdate(id, { logo: url });
      }
  };

  const handleReset = () => {
      if (hasChanges && !confirm("Discard unsaved changes?")) return;
      setLocalClients(JSON.parse(JSON.stringify(clients)));
      setHasChanges(false);
      showStatus('success', 'Changes discarded');
  };

  const handleSaveChanges = async () => {
      setIsSaving(true);
      showStatus('loading', 'Saving changes...');
      
      try {
          const dbIds = clients.map(c => c.id);
          const localIds = localClients.map(c => c.id);
          
          // 1. Deletions
          const toDelete = dbIds.filter(id => !localIds.includes(id));
          for (const id of toDelete) {
              await deleteClient(id);
          }

          // 2. Updates / Adds
          for (let i = 0; i < localClients.length; i++) {
            const item = localClients[i];
            const original = clients.find(c => c.id === item.id);
            const itemWithOrder = { ...item, order: i };

            if (!original) {
                await addClient(itemWithOrder);
            } else if (JSON.stringify(original) !== JSON.stringify(itemWithOrder) || i !== clients.findIndex(c => c.id === item.id)) {
                await updateClient(item.id, itemWithOrder);
            }
          }

          setHasChanges(false);
          showStatus('success', 'All changes saved!');
      } catch (e: any) {
          console.error(e);
          showStatus('error', 'Failed to save changes');
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-medium">Clients & Collaborations ({localClients.length})</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
             <button 
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
                className="px-3 py-2 text-neutral-500 hover:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                title="Discard Changes"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
            <button 
                onClick={handleLocalAdd}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-all"
            >
                <Plus className="w-4 h-4" /> Add Client
            </button>
            <button 
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
                className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-all shadow-sm ${
                    hasChanges ? 'bg-neutral-900 hover:bg-black hover:shadow-lg' : 'bg-neutral-300 cursor-not-allowed'
                }`}
            >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
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
              {localClients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <button 
                        onClick={() => handleUpdateLogo(client.id)}
                        className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200 overflow-hidden hover:border-neutral-400 transition-colors group relative"
                        title="Set Logo URL"
                    >
                        {client.logo ? (
                            <img src={client.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                             <ImageIcon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
                        )}
                    </button>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <input 
                      className="bg-transparent border-none p-0 font-bold text-neutral-900 w-full focus:ring-0 placeholder:text-neutral-300 transition-colors focus:bg-neutral-50 px-1 rounded"
                      value={client.name}
                      onChange={(e) => handleLocalUpdate(client.id, { name: e.target.value })}
                      placeholder="e.g. Google"
                    />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <input 
                            className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0 placeholder:text-neutral-300 text-xs transition-colors focus:bg-neutral-50 px-1 rounded"
                            value={client.url || ''}
                            onChange={(e) => handleLocalUpdate(client.id, { url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <button 
                        onClick={() => handleLocalDelete(client.id)}
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

       {/* Status Toast */}
       {status.message && (
        <div className={`fixed bottom-8 right-8 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in z-[9999] border backdrop-blur-md ${
            status.type === 'error' ? 'bg-red-50/90 text-red-700 border-red-200' : 
            status.type === 'success' ? 'bg-green-50/90 text-green-700 border-green-200' : 
            'bg-neutral-900/90 text-white border-neutral-800'
        }`}>
            {status.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status.type === 'success' && <Check className="w-4 h-4" />}
            {status.type === 'error' && <AlertCircle className="w-4 h-4" />}
            <span className="pr-1">{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default ClientsTable;