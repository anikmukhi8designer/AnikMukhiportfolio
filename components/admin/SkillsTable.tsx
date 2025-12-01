import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus, X, Check, Link as LinkIcon, Search, Loader2 } from 'lucide-react';
import { ICON_KEYS, SkillIcon } from '../SkillIcons';

// Use the provided Brandfetch API Key
const BRANDFETCH_API_KEY = "xcgD6C-HsoohCTMkqg3DR0i9wYmaqUB2nVktAG16TWiSgYr32T7dDkfOVBVc-DXgPyODc3hx2IgCr0Y3urqLrA";

const SkillsTable: React.FC = () => {
  const { skills, updateSkill, deleteSkill, addSkill } = useData();
  
  // State for the "Add Item" form
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('Default');
  const [newItemImage, setNewItemImage] = useState('');
  
  // Brandfetch Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAddNewCategory = () => {
    const newId = self.crypto.randomUUID();
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
    resetForm();
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemIcon('Default');
    setNewItemImage('');
    setAddingToId(null);
    setSearchResults([]);
    setShowResults(false);
  };

  const handleDeleteItem = (categoryId: string, itemIndex: number) => {
     const category = skills.find(s => s.id === categoryId);
     if (!category) return;
     const updatedItems = category.items.filter((_, idx) => idx !== itemIndex);
     updateSkill(categoryId, { items: updatedItems });
  };

  const searchBrandfetch = async (query: string) => {
    if (!query) return;
    setIsSearching(true);
    setShowResults(true);

    try {
        const response = await fetch(`https://api.brandfetch.io/v2/search/${query}`, {
            headers: {
                'Authorization': `Bearer ${BRANDFETCH_API_KEY}`
            }
        });
        const data = await response.json();
        setSearchResults(data);
    } catch (error) {
        console.error("Brandfetch search error:", error);
    } finally {
        setIsSearching(false);
    }
  };

  const selectBrand = (brand: any) => {
      setNewItemName(brand.name);
      setNewItemImage(brand.icon);
      setShowResults(false);
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
                                <div className="w-5 h-5 bg-white rounded-full p-0.5 flex items-center justify-center overflow-hidden border border-neutral-100">
                                    {item.image ? (
                                        <img src={item.image} alt="" className="w-full h-full object-contain" />
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
                        <div className="relative mt-2 bg-white border border-neutral-300 rounded-lg p-2 w-full max-w-md animate-in fade-in slide-in-from-left-4 duration-200 shadow-lg">
                            <div className="flex items-center gap-2">
                                {/* Search Button */}
                                <div className="relative flex-grow">
                                    <input 
                                        autoFocus
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (newItemImage) handleAddItem(skill.id);
                                                else searchBrandfetch(newItemName);
                                            }
                                            if (e.key === 'Escape') resetForm();
                                        }}
                                        placeholder="Type brand name (e.g. Figma)..."
                                        className="text-sm border-none focus:ring-0 w-full p-1"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-2 top-1.5">
                                            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Current Image Preview */}
                                {newItemImage && (
                                    <div className="w-8 h-8 rounded border border-neutral-200 p-0.5 bg-white flex-shrink-0">
                                        <img src={newItemImage} className="w-full h-full object-contain" alt="preview" />
                                    </div>
                                )}

                                <button 
                                    onClick={() => searchBrandfetch(newItemName)} 
                                    className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 transition-colors"
                                    title="Search Brandfetch"
                                >
                                    <Search className="w-4 h-4"/>
                                </button>
                                
                                <div className="h-6 w-px bg-neutral-200 mx-1"></div>

                                <button onClick={() => handleAddItem(skill.id)} className="p-1.5 bg-green-50 hover:bg-green-100 rounded text-green-600 transition-colors">
                                    <Check className="w-4 h-4"/>
                                </button>
                                <button onClick={resetForm} className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors">
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                            
                            {/* Search Results Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                    <div className="p-2 text-xs font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50 sticky top-0">
                                        Select Logo from Brandfetch
                                    </div>
                                    {searchResults.map((brand: any) => (
                                        <button
                                            key={brand.domain}
                                            onClick={() => selectBrand(brand)}
                                            className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-3 border-b border-neutral-50 last:border-0"
                                        >
                                            <div className="w-8 h-8 p-1 bg-white border border-neutral-100 rounded flex items-center justify-center">
                                                <img src={brand.icon} alt="" className="w-full h-full object-contain" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-neutral-900">{brand.name}</div>
                                                <div className="text-xs text-neutral-400">{brand.domain}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
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