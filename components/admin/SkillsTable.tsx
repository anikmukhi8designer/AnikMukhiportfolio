import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus, X, Check, Link as LinkIcon } from 'lucide-react';
import { ICON_KEYS, SkillIcon } from '../SkillIcons';

const SkillsTable: React.FC = () => {
  const { skills, updateSkill, deleteSkill, addSkill } = useData();
  
  // State for the "Add Item" form
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('Default'); // Fallback icon
  const [newItemImage, setNewItemImage] = useState(''); // Uploaded image URL

  const handleAddNewCategory = () => {
    const newId = `skill-${Date.now()}`;
    addSkill({
      id: newId,
      title: "New Category",
      items: []
    });
  };

  const handleAddItem = (categoryId: string) => {
    if (!newItemName.trim()) return;
    const category = skills.find(s => s.id === categoryId);
    if (!category) return;

    const updatedItems = [...category.items, { 
        name: newItemName, 
        icon: newItemImage ? undefined : newItemIcon, 
        image: newItemImage 
    }];
    updateSkill(categoryId, { items: updatedItems });
    
    // Reset form
    setNewItemName('');
    setNewItemIcon('Default');
    setNewItemImage('');
    setAddingToId(null);
  };

  const handleDeleteItem = (categoryId: string, itemIndex: number) => {
     const category = skills.find(s => s.id === categoryId);
     if (!category) return;
     const updatedItems = category.items.filter((_, idx) => idx !== itemIndex);
     updateSkill(categoryId, { items: updatedItems });
  };

  const handleSetImage = () => {
      const url = prompt("Enter URL for Icon (SVG/PNG):");
      if (url) setNewItemImage(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Skills & Tools ({skills.length} Categories)</h3>
        <button 
          onClick={handleAddNewCategory}
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
                <th className="px-6 py-4 font-semibold w-2/3">Items</th>
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
                     <div className="flex flex-wrap gap-2 mb-2">
                        {skill.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-full border border-neutral-200 group">
                                <div className="w-4 h-4 text-neutral-500 flex items-center justify-center overflow-hidden rounded-full">
                                    {item.image ? (
                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <SkillIcon icon={item.icon || 'Default'} className="w-full h-full" />
                                    )}
                                </div>
                                <span className="text-neutral-700 font-medium">{item.name}</span>
                                <button 
                                    onClick={() => handleDeleteItem(skill.id, idx)}
                                    className="ml-1 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                     </div>

                     {/* Add Item Interface */}
                     {addingToId === skill.id ? (
                        <div className="flex items-center gap-2 mt-2 bg-white border border-neutral-300 rounded-lg p-1 w-fit animate-in fade-in slide-in-from-left-4 duration-200">
                            
                            {/* Upload Button */}
                            <button 
                                onClick={handleSetImage}
                                className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-500 transition-colors overflow-hidden border border-neutral-200"
                                title="Set Icon URL"
                            >
                                {newItemImage ? (
                                    <img src={newItemImage} className="w-full h-full object-cover" alt="preview" />
                                ) : (
                                    <LinkIcon className="w-4 h-4" />
                                )}
                            </button>

                            {/* Fallback Icon Selector (Only shown if no image) */}
                            {!newItemImage && (
                                <select 
                                    value={newItemIcon}
                                    onChange={(e) => setNewItemIcon(e.target.value)}
                                    className="text-xs bg-neutral-50 border-none rounded focus:ring-0 py-1.5 w-24"
                                >
                                    {ICON_KEYS.map(key => <option key={key} value={key}>{key}</option>)}
                                </select>
                            )}

                            {/* Name Input */}
                            <input 
                                autoFocus
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="Skill Name"
                                className="text-xs border-none focus:ring-0 w-32 py-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddItem(skill.id);
                                    if (e.key === 'Escape') setAddingToId(null);
                                }}
                            />
                            <button onClick={() => handleAddItem(skill.id)} className="p-1 hover:bg-green-100 rounded text-green-600"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setAddingToId(null)} className="p-1 hover:bg-red-100 rounded text-red-600"><X className="w-4 h-4"/></button>
                        </div>
                     ) : (
                        <button 
                            onClick={() => {
                                setAddingToId(skill.id);
                                setNewItemName('');
                                setNewItemIcon('Default');
                                setNewItemImage('');
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-neutral-900 mt-2 px-2 py-1 rounded hover:bg-neutral-100 w-fit transition-colors"
                        >
                            <Plus className="w-3 h-3" /> Add Item
                        </button>
                     )}
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