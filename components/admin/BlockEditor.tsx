
import React, { useState, useEffect, useRef } from 'react';
import { Project, ContentBlock, BlockType } from '../../types';
import { 
  ArrowLeft, Save, Trash2, Image as ImageIcon, 
  Type, Grid, PlayCircle, Code, Aperture, MousePointer2, Box,
  Settings, Upload, Loader2, Check, X, LayoutTemplate,
  ChevronUp, ChevronDown, Plus, Heading1, Heading2, AlignLeft, Columns
} from 'lucide-react';

interface BlockEditorProps {
  project: Project;
  onSave: (updatedProject: Project) => void;
  onBack: () => void;
}

// Helper: Get Environment Variables
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

// Helper: GitHub Token & Config
const getGitHubToken = () => {
    const env = getEnv('VITE_GITHUB_TOKEN');
    if (env) return env;
    return localStorage.getItem('github_token') || '';
};

const getGitHubConfig = () => ({
    owner: getEnv('VITE_GITHUB_OWNER') || localStorage.getItem('github_owner') || "",
    repo: getEnv('VITE_GITHUB_REPO') || localStorage.getItem('github_repo') || ""
});

const BlockEditor: React.FC<BlockEditorProps> = ({ project, onSave, onBack }) => {
  // --- State ---
  const [formData, setFormData] = useState<Project>(project);
  const [blocks, setBlocks] = useState<ContentBlock[]>(project.content || []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // UI State
  const [activeSettingsTab, setActiveSettingsTab] = useState<'content' | 'settings'>('content');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadHandler, setPendingUploadHandler] = useState<((url: string) => void) | null>(null);

  // Focus Refs
  const blockInputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});

  // --- Handlers ---

  const handleMetaChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Block Operations
  const insertBlock = (type: BlockType, afterId?: string) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      caption: type === 'code' ? 'javascript' : '',
      secondaryContent: type === 'columns' ? '' : undefined
    };

    let newBlocks = [...blocks];
    if (afterId) {
        const index = newBlocks.findIndex(b => b.id === afterId);
        newBlocks.splice(index + 1, 0, newBlock);
    } else {
        newBlocks.push(newBlock);
    }

    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
    
    // Auto-focus next tick
    setTimeout(() => {
        blockInputRefs.current[newBlock.id]?.focus();
    }, 100);
  };

  const updateBlock = (id: string, content: string, caption?: string, secondaryContent?: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content, caption, secondaryContent } : b));
    setHasUnsavedChanges(true);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    setHasUnsavedChanges(true);
    setSelectedBlockId(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    
    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    onSave({ ...formData, content: blocks });
    setHasUnsavedChanges(false);
  };

  // Upload Logic
  const triggerUpload = (handler: (url: string) => void) => {
    setPendingUploadHandler(() => handler);
    fileInputRef.current?.click();
  };

  const processUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadHandler) return;
    
    setIsUploading(true);

    // Simple DataURL fallback if no GitHub keys
    const token = getGitHubToken();
    const { owner, repo } = getGitHubConfig();

    if (!owner || !repo || !token) {
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = () => {
             pendingUploadHandler(reader.result as string);
             setIsUploading(false);
             setPendingUploadHandler(null);
         };
         return;
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `public/uploads/${fileName}`;
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Content = (reader.result as string).split(',')[1];
            try {
                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: `Upload: ${fileName}`, content: base64Content })
                });
                if (!response.ok) throw new Error("Upload Failed");
                const publicUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
                pendingUploadHandler(publicUrl);
            } catch (err) {
                console.error(err);
                alert("Upload failed.");
            } finally {
                setIsUploading(false);
                setPendingUploadHandler(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
    } catch (error) {
        setIsUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={processUpload} />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full relative">
          
          <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-neutral-200 z-10 shrink-0">
              <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-bold">Exit Editor</span>
              </button>
              <div className="flex items-center gap-4">
                  {hasUnsavedChanges && <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Unsaved Draft</span>}
                  <button 
                    onClick={handleSave}
                    className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-all ${
                        hasUnsavedChanges ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-neutral-200 text-neutral-400'
                    }`}
                  >
                    Save Changes
                  </button>
              </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-neutral-100 py-12 px-4" onClick={() => setSelectedBlockId(null)}>
               <div className="max-w-[1000px] mx-auto min-h-screen bg-white shadow-2xl p-12 md:p-20 space-y-12" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Header Visualization */}
                    <div className="border-b border-neutral-100 pb-12">
                         <h1 className="text-6xl font-bold tracking-tighter text-neutral-900 leading-none">{formData.title}</h1>
                         <p className="text-xl text-neutral-400 mt-4 max-w-2xl">{formData.description}</p>
                    </div>

                    {/* Dynamic Blocks */}
                    {blocks.map((block) => (
                        <div 
                            key={block.id}
                            onClick={() => setSelectedBlockId(block.id)}
                            className={`relative group transition-all rounded-xl p-4 ${selectedBlockId === block.id ? 'bg-blue-50/50 ring-2 ring-blue-500' : 'hover:bg-neutral-50'}`}
                        >
                            {/* Controls */}
                            {selectedBlockId === block.id && (
                                <div className="absolute -right-16 top-0 flex flex-col gap-2 z-20">
                                    <button onClick={() => moveBlock(block.id, 'up')} className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-blue-600 shadow-sm"><ChevronUp className="w-4 h-4"/></button>
                                    <button onClick={() => moveBlock(block.id, 'down')} className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-blue-600 shadow-sm"><ChevronDown className="w-4 h-4"/></button>
                                    <button onClick={() => deleteBlock(block.id)} className="p-2 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-red-600 shadow-sm mt-4"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            )}

                            {/* Block Content Inputs */}
                            {block.type === 'paragraph' && (
                                <textarea
                                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder="Type your paragraph here..."
                                    className="w-full bg-transparent border-none p-0 text-lg leading-relaxed focus:ring-0 resize-none"
                                    rows={Math.max(2, block.content.split('\n').length)}
                                />
                            )}

                            {block.type === 'heavy-text' && (
                                <textarea
                                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder="Large Bold Statement..."
                                    className="w-full bg-transparent border-none p-0 text-3xl font-bold tracking-tight leading-tight focus:ring-0 resize-none"
                                    rows={Math.max(2, block.content.split('\n').length)}
                                />
                            )}

                            {block.type === 'columns' && (
                                <div className="grid grid-cols-2 gap-8">
                                    <textarea
                                        value={block.content}
                                        onChange={(e) => updateBlock(block.id, e.target.value, block.caption, block.secondaryContent)}
                                        placeholder="Left column text..."
                                        className="w-full bg-neutral-50/50 border-none p-4 text-sm leading-relaxed focus:ring-2 focus:ring-blue-100 rounded-lg resize-none"
                                        rows={4}
                                    />
                                    <textarea
                                        value={block.secondaryContent || ''}
                                        onChange={(e) => updateBlock(block.id, block.content, block.caption, e.target.value)}
                                        placeholder="Right column text..."
                                        className="w-full bg-neutral-50/50 border-none p-4 text-sm leading-relaxed focus:ring-2 focus:ring-blue-100 rounded-lg resize-none"
                                        rows={4}
                                    />
                                </div>
                            )}

                            {(block.type === 'h1' || block.type === 'h2') && (
                                <input
                                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder={block.type === 'h1' ? "Main Heading" : "Subheading"}
                                    className={`w-full bg-transparent border-none p-0 font-bold focus:ring-0 ${block.type === 'h1' ? 'text-4xl' : 'text-2xl'}`}
                                />
                            )}

                            {block.type === 'image' && (
                                <div className="space-y-4">
                                    <div 
                                        onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))}
                                        className="w-full h-80 bg-neutral-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors border-2 border-dashed border-neutral-200 overflow-hidden"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        ) : block.content ? (
                                            <img src={block.content} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <ImageIcon className="w-12 h-12 text-neutral-300" />
                                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Click to Upload Image</span>
                                            </div>
                                        )}
                                    </div>
                                    <input 
                                        value={block.caption || ''}
                                        onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                        placeholder="Image Caption (Optional)"
                                        className="w-full text-center text-xs text-neutral-400 italic focus:ring-0 border-none bg-transparent"
                                    />
                                </div>
                            )}

                            {block.type === 'divider' && (
                                <div className="h-px bg-neutral-200 w-full my-8" />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-center pt-12">
                        <button 
                            onClick={() => insertBlock('paragraph')}
                            className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-xl"
                        >
                            <Plus className="w-4 h-4" /> Add Block
                        </button>
                    </div>
               </div>
          </div>
      </div>

      {/* Toolbox Sidebar */}
      <aside className="w-[320px] bg-white border-l border-neutral-200 flex flex-col shadow-2xl">
          <div className="p-6 border-b border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8">Page Settings</h2>
              <div className="space-y-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Title</label>
                      <input value={formData.title} onChange={e => handleMetaChange('title', e.target.value)} className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-bold"/>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Client</label>
                      <input value={formData.client} onChange={e => handleMetaChange('client', e.target.value)} className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"/>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Year</label>
                      <input type="number" value={formData.year} onChange={e => handleMetaChange('year', parseInt(e.target.value))} className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"/>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Hero Image</label>
                      <div 
                        onClick={() => triggerUpload(url => handleMetaChange('heroImage', url))}
                        className="w-full h-32 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-neutral-100 overflow-hidden"
                      >
                          {formData.heroImage ? <img src={formData.heroImage} className="w-full h-full object-cover"/> : <ImageIcon className="w-6 h-6 text-neutral-300"/>}
                      </div>
                  </div>
              </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">Blocks</h2>
              <div className="grid grid-cols-2 gap-3">
                  <ToolBtn icon={Heading1} label="Large H1" onClick={() => insertBlock('h1')} />
                  <ToolBtn icon={Heading2} label="Small H2" onClick={() => insertBlock('h2')} />
                  <ToolBtn icon={AlignLeft} label="Large Text" onClick={() => insertBlock('heavy-text')} />
                  <ToolBtn icon={Columns} label="Columns" onClick={() => insertBlock('columns')} />
                  <ToolBtn icon={Type} label="Paragraph" onClick={() => insertBlock('paragraph')} />
                  <ToolBtn icon={ImageIcon} label="Image" onClick={() => insertBlock('image')} />
                  <ToolBtn icon={LayoutTemplate} label="Divider" onClick={() => insertBlock('divider')} />
              </div>
          </div>
      </aside>
    </div>
  );
};

const ToolBtn = ({ icon: Icon, label, onClick }: any) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-4 bg-neutral-50 border border-neutral-100 rounded-xl hover:bg-blue-50 hover:border-blue-100 hover:text-blue-600 transition-all text-neutral-500">
        <Icon className="w-5 h-5" />
        <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
);

export default BlockEditor;
