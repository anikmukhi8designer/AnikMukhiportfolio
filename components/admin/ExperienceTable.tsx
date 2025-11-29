import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Edit2, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';

const ExperienceTable: React.FC = () => {
  const { experience, updateExperience, deleteExperience, addExperience, reorderExperience } = useData();

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

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === experience.length - 1)) return;
    const newItems = [...experience];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    reorderExperience(newItems);
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
                <th className="px-4 py-4 font-semibold w-16">Sort</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold w-1/4">Role & Company</th>
                <th className="px-6 py-4 font-semibold">Period</th>
                <th className="px-6 py-4 font-semibold w-1/3">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {experience.map((exp, index) => (
                <tr key={exp.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-4">
                     <div className="flex flex-col gap-1">
                        <button 
                            onClick={() => handleMove(index, 'up')} 
                            disabled={index === 0}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                        >
                            <ArrowUp className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={() => handleMove(index, 'down')} 
                            disabled={index === experience.length - 1}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 disabled:opacity-20"
                        >
                            <ArrowDown className="w-3 h-3" />
                        </button>
                     </div>
                  </td>
                  <td className="px-6 py-4 align-top">
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
                  <td className="px-6 py-4 align-top space-y-2">
                     <div>
                        <label className="text-xs text-neutral-400">Role</label>
                        <input 
                            className="bg-transparent border-none p-0 text-neutral-900 font-bold w-full focus:ring-0"
                            value={exp.role}
                            onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                            placeholder="e.g. Senior Designer"
                        />
                     </div>
                     <div>
                        <label className="text-xs text-neutral-400">Company</label>
                        <input 
                            className="bg-transparent border-none p-0 text-neutral-700 w-full focus:ring-0"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                            placeholder="e.g. TechFlow"
                        />
                     </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <input 
                      className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0"
                      value={exp.period}
                      onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                      placeholder="e.g. 2023 - Present"
                    />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <textarea 
                        className="w-full bg-neutral-50 border border-transparent hover:border-neutral-200 focus:border-neutral-300 focus:bg-white rounded p-2 text-xs text-neutral-600 leading-relaxed resize-y focus:ring-0 transition-colors"
                        value={exp.description || ''}
                        onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                        rows={3}
                        placeholder="Brief description of responsibilities..."
                    />
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <button 
                        onClick={() => deleteExperience(exp.id)}
                        className="text-neutral-400 hover:text-red-600 p-2"
                        title="Delete Experience"
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

export default ExperienceTable;