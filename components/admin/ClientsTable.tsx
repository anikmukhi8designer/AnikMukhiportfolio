import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

const ClientsTable: React.FC = () => {
  const { clients, updateClient, deleteClient, addClient } = useData();

  const handleAddNew = () => {
    const newId = self.crypto.randomUUID();
    addClient({
      id: newId,
      name: "New Client",
      url: "",
      logo: ""
    });
  };

  const handleUpdateLogo = (id: string) => {
      const url = prompt("Enter Logo URL:");
      if (url) updateClient(id, { logo: url });
  };

  return (
    <div className="space-y-6">
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