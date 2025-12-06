import React, { useState, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { Trash2, Plus, X, Check, Search, Loader2, Upload, AlertCircle } from 'lucide-react';
import { ICON_KEYS, SkillIcon } from '../SkillIcons';

// Use the provided Brandfetch API Key
const BRANDFETCH_API_KEY = "xcgD6C-HsoohCTMkqg3DR0i9wYmaqUB2nVktAG16TWiSgYr32T7dDkfOVBVc-DXgPyODc3hx2IgCr0Y3urqLrA";

// --- Helpers for Upload (Copied to keep component self-contained) ---
const getEnv = (key: string) => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch(e) {}
    return '';
};

const getGitHubToken = () => {
    const env = getEnv('VITE_GITHUB_TOKEN');
    if (env) return env;
    return localStorage.getItem('github_token') || '';
};

const getGitHubConfig = () => ({
    owner: getEnv('VITE_GITHUB_OWNER') || localStorage.getItem('github_owner') || "",
    repo: getEnv('VITE_GITHUB_REPO') || localStorage.getItem('github_repo') || ""
});

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

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

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Status Notification State
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  const showStatus = (type: 'success' | 'error' | 'loading', message: string) => {
    setStatus({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleAddNewCategory = async () => {
    try {
        showStatus('loading', 'Creating category...');
        const newId = generateUUID();
        await addSkill({
            id: newId,
            title: "New Category",
            items: []
        });
        showStatus('success', 'Category created');
    } catch (e) {
        showStatus('error', 'Failed to create category');
    }
  };

  const handleAddItem = async (categoryId: string) => {
    if (!newItemName.trim()) return;
    const category = skills.find(s => s.id === categoryId);
    if (!category) return;

    try {
        showStatus('loading', 'Adding skill item...');
        // Use newItemImage if present, otherwise fall back to icon
        const updatedItems = [...category.items, { 
            name: newItemName, 
            icon: newItemImage ? undefined : newItemIcon, 
            image: newItemImage 
        }];
        await updateSkill(categoryId, { items: updatedItems });
        showStatus('success', 'Skill item added');
        
        // Reset form
        resetForm();
    } catch (e) {
        showStatus('error', 'Failed to add item');
    }
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemIcon('Default');
    setNewItemImage('');
    setAddingToId(null);
    setSearchResults([]);
    setShowResults(false);
  };

  const handleDeleteItem = async (categoryId: string, itemIndex: number) => {
     const category = skills.find(s => s.id === categoryId);
     if (!category) return;
     
     try {
         showStatus('loading', 'Removing item...');
         const updatedItems = category.items.filter((_, idx) => idx !== itemIndex);
         await updateSkill(categoryId, { items: updatedItems });
         showStatus('success', 'Item removed');
     } catch(e) {
         showStatus('error', 'Failed to remove item');
     }
  };

  const handleDeleteCategory = async (id: string) => {
      if (!confirm("Delete this entire category?")) return;
      try {
          showStatus('loading', 'Deleting category...');
          await deleteSkill(id);
          showStatus('success', 'Category deleted');
      } catch(e) {
          showStatus('error', 'Failed to delete category');
      }
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
        setSearchResults(data as any[]);
    } catch (error) {
        console.error("Brandfetch search error:", error);
        showStatus('error', 'Brandfetch search failed');
    } finally {
        setIsSearching(false);
    }
  };

  const selectBrand = (brand: any) => {
      setNewItemName(brand.name);
      setNewItemImage(brand.icon); 
      setShowResults(false);
  };

  // Upload Logic
  const triggerUpload = () => {
      fileInputRef.current?.click();
  };

  const processUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let token = getGitHubToken();
    let { owner, repo } = getGitHubConfig();

    if (!owner || !repo) {
         const userOwner = prompt("GitHub Repository Owner (e.g. 'username'):");
         if (!userOwner) return;
         const userRepo = prompt("GitHub Repository Name (e.g. 'portfolio'):");
         if (!userRepo) return;
         
         localStorage.setItem('github_owner', userOwner);
         localStorage.setItem('github_repo', userRepo);
         owner = userOwner;
         repo = userRepo;
    }
    
    if (!token) {
        const userInput = prompt("GitHub Token is required for uploads. Please enter your GitHub Personal Access Token:");
        if (userInput) {
            localStorage.setItem('github_token', userInput.trim());
            token = userInput.trim();
        } else {
            return;
        }
    }

    setIsUploading(true);
    showStatus('loading', 'Uploading image...');
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `skill_${Date.now()}.${fileExt}`;
        const filePath = `public/uploads/${fileName}`;

        // Convert file to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async () => {
            const base64Content = (reader.result as string).split(',')[1];

            try {
                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `Upload skill icon: ${fileName}`,
                        content: base64Content
                    })
                });

                if (!response.ok) throw new Error("GitHub Upload Failed");

                // Use Raw URL
                const publicUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
                
                setNewItemImage(publicUrl);
                // If name is empty, try to use filename (minus ext)
                if (!newItemName) {
                    setNewItemName(file.name.replace(`.${fileExt}`, ''));
                }
                showStatus('success', 'Image uploaded');

            } catch (err) {
                console.error(err);
                showStatus('error', 'Upload failed. Verify permissions.');
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

    } catch (error) {
        console.error("Upload failed", error);
        setIsUploading(false);
        showStatus('error', 'Upload failed');
    }
  };

  return (
    <div className="space-y-6 relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,image/svg+xml"
        onChange={processUpload}
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Skills & Tools ({skills.length} Categories)</h3>
        <button 
          onClick={handleAddNewCategory}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Category</span><span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
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
                      className="bg-transparent border-none p-0 font-bold text-neutral-900 w-full focus:ring-0 placeholder:text-neutral-300 transition-colors focus:bg-neutral-50 px-1 rounded"
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
                                        <img 
                                            src={item.image.includes('brandfetch') && !item.image.includes('c=') ? `${item.image}${item.image.includes('?') ? '&' : '?'}c=${BRANDFETCH_API_KEY}` : item.image} 
                                            alt="" 
                                            className="w-full h-full object-contain" 
                                        />
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
                        <div className="relative mt-2 bg-white border border-neutral-300 rounded-lg p-3 w-full max-w-md animate-in fade-in slide-in-from-left-4 duration-200 shadow-lg z-10">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                {/* Search Input */}
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
                                        placeholder="Type name..."
                                        className="text-sm border border-neutral-200 rounded px-2 py-1.5 focus:border-neutral-400 focus:ring-0 w-full bg-transparent"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-2 top-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2 justify-end sm:justify-start">
                                    {/* Icon Selector (Only if no image selected) */}
                                    {!newItemImage && (
                                        <select
                                            value={newItemIcon}
                                            onChange={(e) => setNewItemIcon(e.target.value)}
                                            className="w-24 text-xs bg-neutral-50 border border-neutral-200 rounded focus:ring-0 py-1.5"
                                            title="Select Icon"
                                        >
                                            {ICON_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    )}

                                    {/* Current Image Preview */}
                                    {newItemImage && (
                                        <div className="w-8 h-8 rounded border border-neutral-200 p-0.5 bg-white flex-shrink-0 relative group">
                                            <img src={newItemImage} className="w-full h-full object-contain" alt="preview" />
                                            <button 
                                                onClick={() => setNewItemImage('')} 
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-2 h-2" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <button 
                                        onClick={triggerUpload} 
                                        disabled={isUploading}
                                        className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 transition-colors flex-shrink-0"
                                        title="Upload Image/SVG"
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                                    </button>

                                    <button 
                                        onClick={() => searchBrandfetch(newItemName)} 
                                        className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-600 transition-colors flex-shrink-0"
                                        title="Search Brandfetch"
                                    >
                                        <Search className="w-4 h-4"/>
                                    </button>
                                    
                                    <div className="h-6 w-px bg-neutral-200 mx-1 flex-shrink-0"></div>

                                    <button onClick={() => handleAddItem(skill.id)} className="p-1.5 bg-green-50 hover:bg-green-100 rounded text-green-600 transition-colors flex-shrink-0">
                                        <Check className="w-4 h-4"/>
                                    </button>
                                    <button onClick={resetForm} className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors flex-shrink-0">
                                        <X className="w-4 h-4"/>
                                    </button>
                                </div>
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
                        onClick={() => handleDeleteCategory(skill.id)}
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

export default SkillsTable;