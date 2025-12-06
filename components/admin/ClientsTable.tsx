import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus, Link as LinkIcon, Image as ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react';

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const ClientsTable: React.FC = () => {
  const { clients, updateClient, deleteClient, addClient } = useData();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  const showStatus = (type: 'success' | 'error' | 'loading', message: string) => {
    setStatus({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleAddNew = async () => {
    try {
        showStatus('loading', 'Adding client to Database...');
        const newId = generateUUID();
        await addClient({
            id: newId,
            name: "New Client",
            url: "",
            logo: ""
        });
        showStatus('success', 'Client added successfully');
    } catch (e: any) {
        showStatus('error', 'Failed to add client');
    }
  };

  const handleUpdate = async (id: string, data: any) => {
      try {
          await updateClient(id, data);
          // Optional: Don't show success on every keystroke, maybe only on blur or specific actions
          // For now we assume optimistic update handles UI, real error handles toast
      } catch (e) {
          showStatus('error', 'Failed to save changes');
      }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Delete this client?")) return;
      try {
          showStatus('loading', 'Deleting client...');
          await deleteClient(id);
          showStatus('success', 'Client deleted');
      } catch (e) {
          showStatus('error', 'Failed to delete client');
      }
  };

  const handleUpdateLogo = (id: string) => {
      const url = prompt("Enter Logo URL:");
      if (url) {
          showStatus('loading', 'Updating logo...');
          handleUpdate(id, { logo: url })
             .then(() => showStatus('success', 'Logo updated'))
             .catch(() => showStatus('error', 'Failed to update logo'));
      }
  };

  return (
    <div className="space-y-6 relative">
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
                      onChange={(e) => handleUpdate(client.id, { name: e.target.value })}
                      placeholder="e.g. Google"
                    />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <input 
                            className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0 placeholder:text-neutral-300 text-xs transition-colors focus:bg-neutral-50 px-1 rounded"
                            value={client.url || ''}
                            onChange={(e) => handleUpdate(client.id, { url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <button 
                        onClick={() => handleDelete(client.id)}
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