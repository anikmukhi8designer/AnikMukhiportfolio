import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Edit2, Trash2, Plus } from 'lucide-react';

const ExperienceTable: React.FC = () => {
  const { experience, updateExperience, deleteExperience, addExperience } = useData();

  const handleAddNew = () => {
    const newId = `exp-${Date.now()}`;
    addExperience({
      id: newId,
      role: "Role Title",
      company: "Company Name",
      period: "2024 — Present",
      description: "Description of responsibilities...",
      published: false
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Work History ({experience.length})</h3>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" /> Add Experience
        </button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Period</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {experience.map((exp) => (
                <tr key={exp.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => updateExperience(exp.id, { published: !exp.published })}
                      className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold w-fit ${
                        exp.published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {exp.published ? 'Live' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      className="bg-transparent border-none p-0 font-medium text-neutral-900 w-full focus:ring-0"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                     <input 
                      className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0"
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0"
                      value={exp.period}
                      onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-neutral-400">
                      <button className="hover:text-neutral-900"><Edit2 className="w-4 h-4" /></button>
                      <button 
                        onClick={() => deleteExperience(exp.id)}
                        className="hover:text-red-600"
                      ><Trash2 className="w-4 h-4" /></button>
                    </div>
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

export default ExperienceTable;
