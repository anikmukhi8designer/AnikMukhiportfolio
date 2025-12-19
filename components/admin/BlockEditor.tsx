
import React, { useState, useEffect, useRef } from 'react';
import { Project, ContentBlock, BlockType } from '../../types';
import { 
  ArrowLeft, Save, Trash2, Image as ImageIcon, 
  Type, Grid, PlayCircle, Code, Aperture, MousePointer2, Box,
  Settings, Upload, Loader2, Check, X, LayoutTemplate,
  ChevronUp, ChevronDown, Plus, Heading1, Heading2, AlignLeft, Columns,
  Maximize2, Type as TypeIcon, Eye
} from 'lucide-react';
// Added missing motion and AnimatePresence imports from framer-motion
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../../contexts/DataContext';

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
  const { isSaving } = useData();
  const [formData, setFormData] = useState<Project>(project);
  const [blocks, setBlocks] = useState<ContentBlock[]>(project.content || []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadHandler, setPendingUploadHandler] = useState<((url: string) => void) | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const blockInputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});

  const handleMetaChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
    setTimeout(() => {
        blockInputRefs.current[newBlock.id]?.focus();
    }, 100);
  };

  const updateBlock = (id: string, content: string, caption?: string, secondaryContent?: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content, caption, secondaryContent } : b));
    setHasUnsavedChanges(true);
  };

  const deleteBlock = (id: string) => {
    if(!confirm("Remove this block?")) return;
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

  const handleSave = async () => {
    await onSave({ ...formData, content: blocks });
    setHasUnsavedChanges(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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

      {/* Ribbon Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-neutral-200 shadow-sm z-[100] shrink-0">
          <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-all font-bold group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Exit</span>
          </button>

          <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200">
              <ToolBtn icon={Heading1} label="H1" onClick={() => insertBlock('h1')} />
              <ToolBtn icon={Heading2} label="H2" onClick={() => insertBlock('h2')} />
              <ToolBtn icon={AlignLeft} label="Accent" onClick={() => insertBlock('heavy-text')} />
              <div className="w-px h-6 bg-neutral-300 mx-1"></div>
              <ToolBtn icon={Type} label="Text" onClick={() => insertBlock('paragraph')} />
              <ToolBtn icon={Columns} label="Cols" onClick={() => insertBlock('columns')} />
              <ToolBtn icon={ImageIcon} label="Image" onClick={() => insertBlock('image')} />
              <ToolBtn icon={LayoutTemplate} label="Divide" onClick={() => insertBlock('divider')} />
          </div>

          <div className="flex items-center gap-4">
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-[10px] text-orange-500 font-bold uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                  Unsaved Changes
                </div>
              )}
              <button 
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={`px-8 py-2.5 rounded-full text-sm font-bold shadow-md transition-all flex items-center gap-2 min-w-[120px] justify-center ${
                    hasUnsavedChanges 
                    ? 'bg-neutral-900 text-white hover:bg-black hover:scale-105' 
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
          </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-[#e5e5e5] p-6 md:p-12" onClick={() => setSelectedBlockId(null)}>
            <div className="max-w-[1100px] mx-auto min-h-screen bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden rounded-sm" onClick={(e) => e.stopPropagation()}>
                
                {/* Hero Editor */}
                <div 
                    onClick={() => triggerUpload(url => handleMetaChange('heroImage', url))}
                    className="relative w-full h-[500px] bg-neutral-900 flex items-center justify-center group cursor-pointer overflow-hidden"
                >
                    {isUploading ? (
                        <Loader2 className="w-10 h-10 animate-spin text-white" />
                    ) : (
                        <>
                            {formData.heroImage ? (
                                <img src={formData.heroImage} className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity duration-500" alt="Banner" />
                            ) : (
                                <div className="text-white flex flex-col items-center gap-4">
                                    <ImageIcon className="w-16 h-16 opacity-20" />
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-40">Upload Hero Image</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <div className="bg-white text-black px-6 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                  <Upload className="w-4 h-4" /> Change Background Image
                                </div>
                            </div>
                        </>
                    )}

                    <div className="absolute inset-0 flex flex-col justify-end p-12 md:p-24 pointer-events-none">
                        <textarea 
                            value={formData.title}
                            onChange={(e) => handleMetaChange('title', e.target.value)}
                            className="pointer-events-auto bg-transparent border-none p-0 text-white font-bold tracking-tighter leading-[0.85] focus:ring-0 resize-none overflow-hidden drop-shadow-2xl"
                            style={{ fontSize: `${(formData.titleSize || 10) * 0.8}rem` }}
                            rows={2}
                            placeholder="Project Title"
                        />
                    </div>
                </div>

                {/* Sub-header Data */}
                <div className="border-b border-neutral-100 p-10 grid grid-cols-1 md:grid-cols-4 gap-10 bg-neutral-50/50">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Client</label>
                        <input value={formData.client} onChange={e => handleMetaChange('client', e.target.value)} className="w-full bg-transparent border-none p-0 text-xl font-bold focus:ring-0 text-neutral-800" placeholder="Acme Corp" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Year</label>
                        <input type="number" value={formData.year} onChange={e => handleMetaChange('year', parseInt(e.target.value))} className="w-full bg-transparent border-none p-0 text-xl font-bold focus:ring-0 text-neutral-800" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Title Scale</label>
                        <div className="flex items-center gap-4">
                             <input 
                                type="range" min="1" max="15" step="1" 
                                value={formData.titleSize || 10} 
                                onChange={(e) => handleMetaChange('titleSize', parseInt(e.target.value))} 
                                className="flex-1 accent-neutral-900"
                            />
                            <span className="text-xs font-bold text-neutral-500 w-4">{formData.titleSize || 10}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Visibility</label>
                        <button 
                            onClick={() => handleMetaChange('published', !formData.published)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${formData.published ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-neutral-200 text-neutral-500 border border-neutral-300'}`}
                        >
                            <div className={`w-2 h-2 rounded-full ${formData.published ? 'bg-green-500' : 'bg-neutral-400'}`}></div>
                            {formData.published ? 'Published' : 'Draft'}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-12 md:p-24 space-y-16">
                    {blocks.map((block) => (
                        <div 
                            key={block.id}
                            onClick={() => setSelectedBlockId(block.id)}
                            className={`relative group transition-all rounded-2xl p-6 -mx-6 ${selectedBlockId === block.id ? 'bg-blue-50/50 ring-2 ring-blue-200' : 'hover:bg-neutral-50/80'}`}
                        >
                            {selectedBlockId === block.id && (
                                <div className="absolute -left-16 top-6 flex flex-col gap-2 z-20">
                                    <button onClick={() => moveBlock(block.id, 'up')} className="p-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-500 hover:text-blue-600 shadow-md transition-all hover:scale-110"><ChevronUp className="w-4 h-4"/></button>
                                    <button onClick={() => moveBlock(block.id, 'down')} className="p-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-500 hover:text-blue-600 shadow-md transition-all hover:scale-110"><ChevronDown className="w-4 h-4"/></button>
                                    <button onClick={() => deleteBlock(block.id)} className="p-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-400 hover:text-red-600 shadow-md transition-all hover:scale-110 mt-4"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            )}

                            {block.type === 'paragraph' && (
                                <textarea
                                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder="Body text..."
                                    className="w-full bg-transparent border-none p-0 text-xl leading-relaxed focus:ring-0 resize-none text-neutral-600"
                                    rows={3}
                                />
                            )}

                            {block.type === 'heavy-text' && (
                                <textarea
                                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder="Big statement..."
                                    className="w-full bg-transparent border-none p-0 text-4xl md:text-6xl font-bold tracking-tighter leading-none focus:ring-0 resize-none text-neutral-900"
                                    rows={2}
                                />
                            )}

                            {block.type === 'columns' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 pt-8 border-t border-neutral-100">
                                    <textarea
                                        value={block.content}
                                        onChange={(e) => updateBlock(block.id, e.target.value, block.caption, block.secondaryContent)}
                                        placeholder="Left column..."
                                        className="w-full bg-neutral-100/50 border-none p-6 text-base leading-relaxed focus:ring-2 focus:ring-blue-100 rounded-2xl resize-none text-neutral-600"
                                        rows={6}
                                    />
                                    <textarea
                                        value={block.secondaryContent || ''}
                                        onChange={(e) => updateBlock(block.id, block.content, block.caption, e.target.value)}
                                        placeholder="Right column..."
                                        className="w-full bg-neutral-100/50 border-none p-6 text-base leading-relaxed focus:ring-2 focus:ring-blue-100 rounded-2xl resize-none text-neutral-600"
                                        rows={6}
                                    />
                                </div>
                            )}

                            {(block.type === 'h1' || block.type === 'h2') && (
                                <input
                                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, e.target.value)}
                                    placeholder={block.type === 'h1' ? "H1 Heading" : "H2 Subheading"}
                                    className={`w-full bg-transparent border-none p-0 font-bold focus:ring-0 text-neutral-900 ${block.type === 'h1' ? 'text-5xl tracking-tighter' : 'text-3xl'}`}
                                />
                            )}

                            {block.type === 'image' && (
                                <div className="space-y-6">
                                    <div 
                                        onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))}
                                        className="w-full aspect-[16/9] bg-neutral-50 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100 transition-all border-2 border-dashed border-neutral-200 overflow-hidden shadow-inner"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                        ) : block.content ? (
                                            <img src={block.content} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="p-4 bg-neutral-100 rounded-full">
                                                  <ImageIcon className="w-10 h-10 text-neutral-400" />
                                                </div>
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Add Media Asset</span>
                                            </div>
                                        )}
                                    </div>
                                    <input 
                                        value={block.caption || ''}
                                        onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                        placeholder="Add a detailed caption..."
                                        className="w-full text-center text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-bold focus:ring-0 border-none bg-transparent"
                                    />
                                </div>
                            )}

                            {block.type === 'divider' && (
                                <div className="h-px bg-neutral-200 w-full my-12" />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-center pt-32 pb-16">
                        <button 
                            onClick={() => insertBlock('paragraph')}
                            className="flex items-center gap-3 px-10 py-4 bg-neutral-900 text-white rounded-full text-sm font-bold hover:scale-105 transition-all shadow-2xl active:scale-95 group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add New Content Block
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Sidebar Settings */}
        <aside className="w-[320px] bg-white border-l border-neutral-200 flex flex-col shadow-2xl z-[50]">
          <div className="p-8 border-b border-neutral-100">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-8 flex items-center gap-3">
                  <Settings className="w-3.5 h-3.5" /> Project Metadata
              </h2>
              <div className="space-y-8">
                  <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Grid Thumbnail</label>
                      <div 
                        onClick={() => triggerUpload(url => handleMetaChange('thumb', url))}
                        className="w-full aspect-[4/3] bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors overflow-hidden group shadow-sm"
                      >
                          {formData.thumb ? <img src={formData.thumb} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/> : <ImageIcon className="w-8 h-8 text-neutral-300"/>}
                      </div>
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Brief Overview</label>
                      <textarea 
                        value={formData.description} 
                        onChange={e => handleMetaChange('description', e.target.value)} 
                        rows={4}
                        className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-neutral-900 focus:outline-none focus:bg-white transition-all"
                        placeholder="Write a clear summary..."
                      />
                  </div>
                  <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Live URL</label>
                      <input 
                        value={formData.link || ''} 
                        onChange={e => handleMetaChange('link', e.target.value)} 
                        className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                        placeholder="https://mysite.com"
                      />
                  </div>
              </div>
          </div>
          
          <div className="p-8 flex-1">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="w-full py-4 bg-neutral-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-lg"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                Save Draft
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-900 text-white px-8 py-4 rounded-full shadow-2xl z-[200] flex items-center gap-3 font-bold text-sm border border-green-800 backdrop-blur-md"
          >
            <Check className="w-5 h-5 text-green-400" />
            Changes Saved Successfully
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolBtn = ({ icon: Icon, label, onClick }: any) => (
    <button 
        onClick={onClick} 
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white hover:shadow-lg text-neutral-500 hover:text-neutral-900 transition-all font-bold"
    >
        <Icon className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{label}</span>
    </button>
);

export default BlockEditor;
