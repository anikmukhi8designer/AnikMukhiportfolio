
import React, { useState, useEffect, useRef } from 'react';
import { Project, ContentBlock, BlockType } from '../../types';
import { 
  ArrowLeft, Save, Trash2, Image as ImageIcon, 
  Type, Grid, PlayCircle, Code, Aperture, MousePointer2, Box,
  Settings, Upload, Loader2, Check, X, LayoutTemplate,
  ChevronUp, ChevronDown, Plus, Heading1, Heading2, AlignLeft, Columns,
  Maximize2, Type as TypeIcon
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
    <div className="flex flex-col h-screen bg-[#f3f3f3] font-sans overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={processUpload} />

      {/* Header ribbon - Microsoft Word Style */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-neutral-200 z-[100] shrink-0">
          <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-bold">Exit</span>
          </button>

          {/* Block Insert Toolbar - Ribbon style */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
              <ToolBtn icon={Heading1} label="H1" onClick={() => insertBlock('h1')} />
              <ToolBtn icon={Heading2} label="H2" onClick={() => insertBlock('h2')} />
              <ToolBtn icon={AlignLeft} label="Accent" onClick={() => insertBlock('heavy-text')} />
              <div className="w-px h-6 bg-neutral-200 mx-1"></div>
              <ToolBtn icon={Type} label="Text" onClick={() => insertBlock('paragraph')} />
              <ToolBtn icon={Columns} label="Cols" onClick={() => insertBlock('columns')} />
              <ToolBtn icon={ImageIcon} label="Image" onClick={() => insertBlock('image')} />
              <ToolBtn icon={LayoutTemplate} label="Divide" onClick={() => insertBlock('divider')} />
          </div>

          <div className="flex items-center gap-4">
              {hasUnsavedChanges && <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Draft</span>}
              <button 
                onClick={handleSave}
                className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-all ${
                    hasUnsavedChanges ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-neutral-200 text-neutral-400'
                }`}
              >
                Save
              </button>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas Area */}
        <div className="flex-1 overflow-y-auto bg-neutral-200/50 p-6 md:p-12" onClick={() => setSelectedBlockId(null)}>
            <div className="max-w-[1200px] mx-auto min-h-screen bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                {/* Visual Banner Editor (Click to change) */}
                <div 
                    onClick={() => triggerUpload(url => handleMetaChange('heroImage', url))}
                    className="relative w-full h-[400px] bg-neutral-900 flex items-center justify-center group cursor-pointer overflow-hidden"
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                    ) : (
                        <>
                            {formData.heroImage ? (
                                <img src={formData.heroImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" alt="Banner" />
                            ) : (
                                <div className="text-white flex flex-col items-center gap-2">
                                    <ImageIcon className="w-10 h-10 opacity-30" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">Upload Banner Image</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-white/90 text-black px-4 py-2 rounded-full text-xs font-bold shadow-xl">Change Banner Image</span>
                            </div>
                        </>
                    )}

                    {/* Overlay Title Editor */}
                    <div className="absolute inset-0 flex flex-col justify-end p-12 md:p-20 pointer-events-none">
                        <textarea 
                            value={formData.title}
                            onChange={(e) => handleMetaChange('title', e.target.value)}
                            className="pointer-events-auto bg-transparent border-none p-0 text-white font-bold tracking-tighter leading-none focus:ring-0 resize-none overflow-hidden"
                            style={{ fontSize: `${(formData.titleSize || 10) * 0.8}rem` }}
                            rows={2}
                        />
                    </div>
                </div>

                {/* Sub-header Controls */}
                <div className="border-b border-neutral-100 p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Client</label>
                        <input value={formData.client} onChange={e => handleMetaChange('client', e.target.value)} className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Year</label>
                        <input type="number" value={formData.year} onChange={e => handleMetaChange('year', parseInt(e.target.value))} className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Title Scale</label>
                        <div className="flex items-center gap-2">
                             <input 
                                type="range" min="1" max="10" step="1" 
                                value={formData.titleSize || 10} 
                                onChange={(e) => handleMetaChange('titleSize', parseInt(e.target.value))} 
                                className="flex-1 accent-blue-600"
                            />
                            <span className="text-xs font-bold text-neutral-500">{formData.titleSize || 10}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Status</label>
                        <button 
                            onClick={() => handleMetaChange('published', !formData.published)}
                            className={`block w-full text-left py-1 text-xs font-bold uppercase tracking-widest ${formData.published ? 'text-green-600' : 'text-neutral-400'}`}
                        >
                            {formData.published ? 'Published' : 'Draft'}
                        </button>
                    </div>
                </div>

                {/* Blocks Content Area */}
                <div className="p-12 md:p-20 space-y-12">
                    {blocks.map((block) => (
                        <div 
                            key={block.id}
                            onClick={() => setSelectedBlockId(block.id)}
                            className={`relative group transition-all rounded-xl p-4 -mx-4 ${selectedBlockId === block.id ? 'bg-blue-50/50 ring-2 ring-blue-500' : 'hover:bg-neutral-50'}`}
                        >
                            {/* Controls */}
                            {selectedBlockId === block.id && (
                                <div className="absolute -left-12 top-0 flex flex-col gap-2 z-20">
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
                                    className="w-full bg-transparent border-none p-0 text-3xl md:text-5xl font-bold tracking-tight leading-tight focus:ring-0 resize-none"
                                    rows={Math.max(2, block.content.split('\n').length)}
                                />
                            )}

                            {block.type === 'columns' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-neutral-100 pt-8">
                                    <textarea
                                        value={block.content}
                                        onChange={(e) => updateBlock(block.id, e.target.value, block.caption, block.secondaryContent)}
                                        placeholder="Left column text..."
                                        className="w-full bg-neutral-50/50 border-none p-4 text-sm leading-relaxed focus:ring-2 focus:ring-blue-100 rounded-lg resize-none"
                                        rows={6}
                                    />
                                    <textarea
                                        value={block.secondaryContent || ''}
                                        onChange={(e) => updateBlock(block.id, block.content, block.caption, e.target.value)}
                                        placeholder="Right column text..."
                                        className="w-full bg-neutral-50/50 border-none p-4 text-sm leading-relaxed focus:ring-2 focus:ring-blue-100 rounded-lg resize-none"
                                        rows={6}
                                    />
                                </div>
                            )}

                            {(block.type === 'h1' || block.type === 'h2') && (
                                <input
                                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder={block.type === 'h1' ? "Heading 1" : "Heading 2"}
                                    className={`w-full bg-transparent border-none p-0 font-bold focus:ring-0 ${block.type === 'h1' ? 'text-4xl' : 'text-2xl'}`}
                                />
                            )}

                            {block.type === 'image' && (
                                <div className="space-y-4">
                                    <div 
                                        onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))}
                                        className="w-full aspect-video bg-neutral-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors border-2 border-dashed border-neutral-200 overflow-hidden"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        ) : block.content ? (
                                            <img src={block.content} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <ImageIcon className="w-12 h-12 text-neutral-300" />
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Click to Upload Image</span>
                                            </div>
                                        )}
                                    </div>
                                    <input 
                                        value={block.caption || ''}
                                        onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                        placeholder="Image Caption (Optional)"
                                        className="w-full text-center text-[10px] uppercase tracking-widest text-neutral-400 font-bold focus:ring-0 border-none bg-transparent"
                                    />
                                </div>
                            )}

                            {block.type === 'divider' && (
                                <div className="h-px bg-neutral-200 w-full my-8" />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-center pt-24 pb-12 border-t border-neutral-100">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">
                            End of Content
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Settings Sidebar */}
        <aside className="w-[300px] bg-white border-l border-neutral-200 flex flex-col shadow-xl">
          <div className="p-6 border-b border-neutral-100">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6 flex items-center gap-2">
                  <Settings className="w-3 h-3" /> Page Properties
              </h2>
              <div className="space-y-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Thumbnail</label>
                      <div 
                        onClick={() => triggerUpload(url => handleMetaChange('thumb', url))}
                        className="w-full aspect-[4/3] bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-neutral-100 overflow-hidden"
                      >
                          {formData.thumb ? <img src={formData.thumb} className="w-full h-full object-cover"/> : <ImageIcon className="w-6 h-6 text-neutral-300"/>}
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Summary</label>
                      <textarea 
                        value={formData.description} 
                        onChange={e => handleMetaChange('description', e.target.value)} 
                        rows={3}
                        className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs leading-relaxed"
                        placeholder="Short overview..."
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">External Link</label>
                      <input value={formData.link || ''} onChange={e => handleMetaChange('link', e.target.value)} className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"/>
                  </div>
              </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const ToolBtn = ({ icon: Icon, label, onClick }: any) => (
    <button 
        onClick={onClick} 
        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white hover:shadow-sm text-neutral-600 hover:text-blue-600 transition-all"
    >
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap">{label}</span>
    </button>
);

export default BlockEditor;
