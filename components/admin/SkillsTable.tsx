import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus } from 'lucide-react';

const SkillsTable: React.FC = () => {
  const { skills, updateSkill, deleteSkill, addSkill } = useData();

  const handleAddNew = () => {
    const newId = `skill-${Date.now()}`;
    addSkill({
      id: newId,
      title: "New Category",
      items: ["Item 1", "Item 2"]
    });
  };

  const handleItemsChange = (id: string, value: string) => {
    // Split by comma and clean up whitespace
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    updateSkill(id, { items });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Skills & Tools ({skills.length} Categories)</h3>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Category Title</th>
                <th className="px-6 py-4 font-semibold w-2/3">Items (Comma separated)</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {skills.map((skill) => (
                <tr key={skill.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <input 
                      className="bg-transparent border-none p-0 font-bold text-neutral-900 w-full focus:ring-0 placeholder:text-neutral-300"
                      value={skill.title}
                      onChange={(e) => updateSkill(skill.id, { title: e.target.value })}
                      placeholder="e.g. Design"
                    />
                  </td>
                  <td className="px-6 py-4 align-top">
                     <textarea 
                      className="bg-transparent border-neutral-200 rounded p-2 text-neutral-600 w-full focus:ring-1 focus:ring-neutral-900 text-sm leading-relaxed"
                      rows={2}
                      defaultValue={skill.items.join(', ')}
                      onBlur={(e) => handleItemsChange(skill.id, e.target.value)}
                      placeholder="e.g. Figma, React, TypeScript"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">Separate items with commas</p>
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <button 
                        onClick={() => deleteSkill(skill.id)}
                        className="text-neutral-400 hover:text-red-600 p-2"
                        title="Delete Category"
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

export default SkillsTable;