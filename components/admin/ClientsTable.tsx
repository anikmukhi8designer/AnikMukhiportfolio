import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus, Edit2 } from 'lucide-react';

const ClientsTable: React.FC = () => {
  const { clients, updateClient, deleteClient, addClient } = useData();

  const handleAddNew = () => {
    const newId = `client-${Date.now()}`;
    addClient({
      id: newId,
      name: "New Client",
      // Optional: logo or url could be added here
    });
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
                <th className="px-6 py-4 font-semibold w-full">Client Name</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <input 
                      className="bg-transparent border-none p-0 font-bold text-neutral-900 w-full focus:ring-0 placeholder:text-neutral-300"
                      value={client.name}
                      onChange={(e) => updateClient(client.id, { name: e.target.value })}
                      placeholder="e.g. Google"
                    />
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