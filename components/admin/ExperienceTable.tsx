import React, { useRef, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Edit2, Trash2, Plus, GripVertical } from 'lucide-react';

const ExperienceTable: React.FC = () => {
  const { experience, updateExperience, deleteExperience, addExperience, reorderExperience } = useData();
  
  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleAddNew = () => {
    // Generate UUID
    const newId = self.crypto.randomUUID();
    
    addExperience({
      id: newId,
      role: "Role Title",
      company: "Company Name",
      period: "2024 — Present",
      description: "Description of responsibilities...",
      published: true // Default to live
    });
  };

  const onDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    dragItem.current = index;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnter = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    dragOverItem.current = index;
  };

  const onDragEnd = () => {
    const dragIndex = dragItem.current;
    const dragOverIndex = dragOverItem.current;

    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
        const _experience = [...experience];
        const draggedItemContent = _experience[dragIndex];
        
        // Remove the dragged item
        _experience.splice(dragIndex, 1);
        // Insert at new position
        _experience.splice(dragOverIndex, 0, draggedItemContent);
        
        reorderExperience(_experience);
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
    setIsDragging(false);
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
                <th className="px-4 py-4 font-semibold w-12 text-center">#</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold w-1/4">Role & Company</th>
                <th className="px-6 py-4 font-semibold">Period</th>
                <th className="px-6 py-4 font-semibold w-1/3">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {experience.map((exp, index) => (
                <tr 
                    key={exp.id} 
                    draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragEnter={(e) => onDragEnter(e, index)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`transition-colors ${isDragging ? 'cursor-grabbing' : ''} hover:bg-neutral-50`}
                >
                  <td className="px-4 py-4 text-center">
                     <div 
                        className="cursor-grab active:cursor-grabbing p-2 text-neutral-300 hover:text-neutral-900 flex justify-center rounded hover:bg-neutral-200/50 transition-colors"
                        title="Drag to reorder"
                     >
                        <GripVertical className="w-5 h-5" />
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
                  <td className="px-6 py-4 align-top space-y-3">
                     <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Role</label>
                        <input 
                            className="bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 rounded px-2 py-1 text-neutral-900 font-bold w-full text-sm transition-colors focus:outline-none"
                            value={exp.role}
                            onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                            placeholder="e.g. Senior Designer"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Company</label>
                        <input 
                            className="bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 rounded px-2 py-1 text-neutral-700 w-full text-sm transition-colors focus:outline-none"
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                            placeholder="e.g. TechFlow"
                        />
                     </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <input 
                      className="bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 rounded px-2 py-1 text-neutral-600 w-full text-sm transition-colors focus:outline-none"
                      value={exp.period}
                      onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                      placeholder="e.g. 2023 - Present"
                    />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <textarea 
                        className="w-full bg-neutral-50 border border-transparent hover:border-neutral-200 focus:border-neutral-300 focus:bg-white rounded p-3 text-sm text-neutral-600 leading-relaxed resize-y focus:outline-none transition-colors min-h-[100px]"
                        value={exp.description || ''}
                        onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                        placeholder="Description of responsibilities..."
                    />
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <button 
                        onClick={() => deleteExperience(exp.id)}
                        className="text-neutral-400 hover:text-red-600 p-2 rounded hover:bg-red-50 transition-colors"
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