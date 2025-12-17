import React, { useRef, useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Edit2, Trash2, Plus, GripVertical, Loader2, Check, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Experience } from '../../types';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const ExperienceTable: React.FC = () => {
  const { experience, updateExperience, deleteExperience, addExperience, reorderExperience } = useData();
  
  // Local state to buffer changes
  const [localItems, setLocalItems] = useState<Experience[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local state on mount
  useEffect(() => {
      if (experience.length > 0 && localItems.length === 0 && !hasChanges) {
          setLocalItems(JSON.parse(JSON.stringify(experience)));
      }
  }, [experience]);

  // Status Notification State
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  const showStatus = (type: 'success' | 'error' | 'loading', message: string) => {
    setStatus({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleLocalUpdate = (id: string, data: Partial<Experience>) => {
      setLocalItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
      setHasChanges(true);
  };

  const handleLocalAdd = () => {
      const newId = generateUUID();
      const newItem: Experience = {
          id: newId,
          role: "Role Title",
          company: "Company Name",
          period: "2024 — Present",
          description: "",
          published: true
      };
      setLocalItems(prev => [...prev, newItem]);
      setHasChanges(true);
  };

  const handleLocalDelete = (id: string) => {
      if (!confirm("Remove this entry? (Click Save to confirm deletion from DB)")) return;
      setLocalItems(prev => prev.filter(item => item.id !== id));
      setHasChanges(true);
  };

  const handleReset = () => {
      if (hasChanges && !confirm("Discard unsaved changes?")) return;
      setLocalItems(JSON.parse(JSON.stringify(experience)));
      setHasChanges(false);
      showStatus('success', 'Changes discarded');
  };

  const handleSaveChanges = async () => {
      setIsSaving(true);
      showStatus('loading', 'Saving changes...');
      
      try {
          // 1. Identify Deletions (Items in DB but not in Local)
          const dbIds = experience.map(e => e.id);
          const localIds = localItems.map(l => l.id);
          const toDelete = dbIds.filter(id => !localIds.includes(id));

          // 2. Identify Additions (Items in Local but not in DB) - handled by upsert usually, or check IDs
          // actually simpler to just loop local items and upsert, and loop deletions and delete.
          
          // Execute Deletions
          for (const id of toDelete) {
              await deleteExperience(id);
          }

          // Execute Updates/Inserts
          // We'll update sequentially to ensure order is preserved if logic depends on it, 
          // though usually parallel is fine. Sequential helps avoid rate limits.
          for (let i = 0; i < localItems.length; i++) {
              const item = localItems[i];
              const original = experience.find(e => e.id === item.id);
              
              // If it's new (not in original) OR changed OR order changed (index mismatch)
              // We just upsert everything to be safe and ensure order field is correct
              
              // We need to inject the order based on current index
              const itemWithOrder = { ...item, order: i };
              
              if (!original) {
                  await addExperience(itemWithOrder);
              } else if (JSON.stringify(original) !== JSON.stringify(itemWithOrder) || i !== experience.findIndex(e => e.id === item.id)) {
                  await updateExperience(item.id, itemWithOrder);
              }
          }

          // Trigger re-order explicitly if needed, but the update loop above handles it via 'order' field if DB respects it
          // The updateExperience usually just patches fields. We ensured 'order' is passed if your schema supports it.
          // If 'order' is separate, we might need:
          // await reorderExperience(localItems); 
          // (Assuming reorderExperience just updates the 'order' column for a list of IDs)
          
          setHasChanges(false);
          showStatus('success', 'All changes saved!');
      } catch (e: any) {
          console.error(e);
          showStatus('error', 'Failed to save changes');
      } finally {
          setIsSaving(false);
      }
  };

  // Drag and Drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
        const _items = [...localItems];
        const draggedItemContent = _items[dragIndex];
        _items.splice(dragIndex, 1);
        _items.splice(dragOverIndex, 0, draggedItemContent);
        setLocalItems(_items);
        setHasChanges(true);
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
    setIsDragging(false);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h3 className="text-lg font-medium">Work History ({localItems.length})</h3>
            <p className="text-xs text-neutral-500">Drag to reorder. Changes are local until saved.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
                className="px-3 py-2 text-neutral-500 hover:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                title="Discard Changes"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
            <button 
                onClick={handleLocalAdd}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 text-sm font-bold rounded-lg hover:bg-neutral-50 transition-all"
            >
                <Plus className="w-4 h-4" /> Add
            </button>
            <button 
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
                className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg transition-all shadow-sm ${
                    hasChanges ? 'bg-neutral-900 hover:bg-black hover:shadow-lg' : 'bg-neutral-300 cursor-not-allowed'
                }`}
            >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
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
              {localItems.map((exp, index) => (
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
                      onClick={() => handleLocalUpdate(exp.id, { published: !exp.published })}
                      className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold w-fit transition-colors ${
                        exp.published 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
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
                            onChange={(e) => handleLocalUpdate(exp.id, { role: e.target.value })}
                            placeholder="e.g. Senior Designer"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Company</label>
                        <input 
                            className="bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 rounded px-2 py-1 text-neutral-700 w-full text-sm transition-colors focus:outline-none"
                            value={exp.company}
                            onChange={(e) => handleLocalUpdate(exp.id, { company: e.target.value })}
                            placeholder="e.g. TechFlow"
                        />
                     </div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <input 
                      className="bg-neutral-50 border border-transparent focus:bg-white focus:border-neutral-300 rounded px-2 py-1 text-neutral-600 w-full text-sm transition-colors focus:outline-none"
                      value={exp.period}
                      onChange={(e) => handleLocalUpdate(exp.id, { period: e.target.value })}
                      placeholder="e.g. 2023 - Present"
                    />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <textarea 
                        className="w-full bg-neutral-50 border border-transparent hover:border-neutral-200 focus:border-neutral-300 focus:bg-white rounded p-3 text-sm text-neutral-600 leading-relaxed resize-y focus:outline-none transition-colors min-h-[100px]"
                        value={exp.description || ''}
                        onChange={(e) => handleLocalUpdate(exp.id, { description: e.target.value })}
                        placeholder="Description of responsibilities..."
                    />
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <button 
                        onClick={() => handleLocalDelete(exp.id)}
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

export default ExperienceTable;