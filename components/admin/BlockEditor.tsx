import React, { useState, useEffect, useRef } from 'react';
import { Project, ContentBlock, BlockType } from '../../types';
import { 
  ArrowLeft, Save, Trash2, Image as ImageIcon, 
  Type, Grid, PlayCircle, Code, Aperture, MousePointer2, Box,
  Settings, Upload, Loader2, MoreHorizontal, Check, X, LayoutTemplate,
  ChevronUp, ChevronDown, Plus
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
      caption: type === 'code' ? 'javascript' : ''
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

  const updateBlock = (id: string, content: string, caption?: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content, caption } : b));
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
    
    // Simulate upload or real GitHub upload
    let token = getGitHubToken();
    let { owner, repo } = getGitHubConfig();

    setIsUploading(true);

    if (!owner || !repo || !token) {
         // Demo Fallback
         setTimeout(() => {
             const demoUrl = URL.createObjectURL(file);
             pendingUploadHandler(demoUrl);
             setPendingUploadHandler(null);
             setIsUploading(false);
         }, 1000);
         return;
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
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

  // --- Components ---

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in duration-500">
        <h2 className="text-2xl font-light text-neutral-500 mb-12">Start building your project:</h2>
        
        <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
            {[
                { label: 'Image', icon: ImageIcon, action: () => insertBlock('image') },
                { label: 'Text', icon: Type, action: () => insertBlock('paragraph') },
                { label: 'Photo Grid', icon: Grid, action: () => insertBlock('image') }, // Simplified to image for now
                { label: 'Video & Audio', icon: PlayCircle, action: () => insertBlock('code') },
                { label: 'Embed', icon: Code, action: () => insertBlock('code') },
                { label: 'Lightroom', icon: Aperture, action: () => insertBlock('image') },
                { label: 'Prototype', icon: MousePointer2, action: () => insertBlock('image') },
                { label: '3D', icon: Box, action: () => insertBlock('image') },
            ].map((tool, idx) => (
                <button 
                    key={idx}
                    onClick={tool.action}
                    className="group flex flex-col items-center gap-4 transition-transform hover:-translate-y-1"
                >
                    <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <tool.icon className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-bold text-neutral-600 group-hover:text-neutral-900">{tool.label}</span>
                </button>
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F9F9F9] font-sans overflow-hidden">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={processUpload} />

      {/* 1. Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full relative">
          
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-neutral-200 z-10 shrink-0">
              <button onClick={onBack} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-bold">Back to Dashboard</span>
              </button>
              <div className="flex items-center gap-4">
                  <span className="text-xs text-neutral-400 font-mono">
                      {hasUnsavedChanges ? 'Unsaved Changes' : 'All Changes Saved'}
                  </span>
                  <button 
                    onClick={handleSave}
                    className={`px-6 py-2 rounded-full text-sm font-bold shadow-sm transition-all ${
                        hasUnsavedChanges ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow' : 'bg-neutral-200 text-neutral-400 cursor-default'
                    }`}
                  >
                    Save Draft
                  </button>
              </div>
          </header>

          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto" onClick={() => setSelectedBlockId(null)}>
               {blocks.length === 0 ? (
                   <EmptyState />
               ) : (
                   <div className="max-w-[1000px] mx-auto min-h-screen bg-white shadow-sm my-8 p-8 md:p-16 space-y-8" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Title Block (Visual Representation) */}
                        <div className="group relative border-b border-transparent hover:border-neutral-100 pb-8 mb-12">
                             <h1 className="text-5xl font-bold tracking-tight text-neutral-900 mb-2">{formData.title}</h1>
                             <p className="text-xl text-neutral-500">{formData.description}</p>
                             <button 
                                onClick={() => setActiveSettingsTab('settings')}
                                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-500 hover:text-blue-600"
                             >
                                Edit Details
                             </button>
                        </div>

                        {/* Dynamic Blocks */}
                        {blocks.map((block, index) => (
                            <div 
                                key={block.id}
                                onClick={() => setSelectedBlockId(block.id)}
                                className={`relative group transition-all rounded-lg p-2 ${selectedBlockId === block.id ? 'ring-2 ring-blue-500 ring-offset-4' : 'hover:bg-neutral-50'}`}
                            >
                                {/* Block Controls (Hover) */}
                                {selectedBlockId === block.id && (
                                    <div className="absolute -right-12 top-0 flex flex-col gap-1 z-20">
                                        <button onClick={() => moveBlock(block.id, 'up')} className="p-1.5 bg-white border border-neutral-200 rounded text-neutral-500 hover:text-blue-600 shadow-sm"><ChevronUp className="w-4 h-4"/></button>
                                        <button onClick={() => moveBlock(block.id, 'down')} className="p-1.5 bg-white border border-neutral-200 rounded text-neutral-500 hover:text-blue-600 shadow-sm"><ChevronDown className="w-4 h-4"/></button>
                                        <button onClick={() => deleteBlock(block.id)} className="p-1.5 bg-white border border-neutral-200 rounded text-neutral-500 hover:text-red-600 shadow-sm mt-2"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                )}

                                {block.type === 'paragraph' && (
                                    <textarea
                                        ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                        value={block.content}
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        placeholder="Start typing..."
                                        className="w-full bg-transparent border-none p-0 text-lg leading-relaxed focus:ring-0 resize-none"
                                        rows={Math.max(2, block.content.split('\n').length)}
                                    />
                                )}

                                {block.type === 'image' && (
                                    <div className="w-full">
                                        {block.content ? (
                                            <div className="relative group/img">
                                                <img src={block.content} alt="" className="w-full h-auto" />
                                                <button 
                                                    onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))}
                                                    className="absolute top-4 right-4 bg-white/90 text-neutral-900 px-3 py-1.5 rounded text-xs font-bold opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                >
                                                    Replace Image
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))}
                                                className="w-full h-64 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center gap-3 text-neutral-400 hover:border-blue-400 hover:text-blue-500 transition-all"
                                            >
                                                {isUploading ? <Loader2 className="w-8 h-8 animate-spin"/> : <ImageIcon className="w-10 h-10"/>}
                                                <span className="font-bold">Upload Image</span>
                                            </button>
                                        )}
                                        <input 
                                            value={block.caption || ''}
                                            onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                            placeholder="Add a caption (optional)"
                                            className="w-full text-center mt-3 text-sm text-neutral-500 border-none bg-transparent focus:ring-0 italic"
                                        />
                                    </div>
                                )}

                                {block.type === 'code' && (
                                    <div className="bg-neutral-900 rounded-lg p-6">
                                        <div className="flex justify-between items-center mb-4 border-b border-neutral-800 pb-2">
                                            <span className="text-xs font-mono text-neutral-500 uppercase">Code / Embed</span>
                                            <input 
                                                value={block.caption || ''}
                                                onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                                placeholder="Language"
                                                className="bg-transparent border-none text-right text-xs text-neutral-500 focus:ring-0 w-32"
                                            />
                                        </div>
                                        <textarea
                                            ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                            value={block.content}
                                            onChange={(e) => updateBlock(block.id, e.target.value)}
                                            placeholder="Paste code or embed script here..."
                                            className="w-full bg-transparent border-none p-0 text-sm font-mono text-neutral-300 focus:ring-0 resize-none"
                                            rows={Math.max(4, block.content.split('\n').length)}
                                        />
                                    </div>
                                )}
                                
                                {block.type === 'divider' && (
                                    <div className="flex items-center justify-center py-8 opacity-50">
                                        <div className="h-px bg-neutral-300 w-full"></div>
                                        <div className="mx-4 text-neutral-400 text-xs font-mono uppercase">Section Break</div>
                                        <div className="h-px bg-neutral-300 w-full"></div>
                                    </div>
                                )}

                                {/* Hover Insert Trigger */}
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <button 
                                        onClick={() => insertBlock('paragraph', block.id)}
                                        className="bg-blue-600 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                   </div>
               )}
          </div>
      </div>

      {/* 2. Right Sidebar (Tools) */}
      <aside className="w-[280px] bg-white border-l border-neutral-200 flex flex-col shrink-0 z-20 shadow-xl shadow-neutral-200/50">
          
          {/* Tab Switcher */}
          <div className="flex border-b border-neutral-200">
             <button 
                onClick={() => setActiveSettingsTab('content')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider text-center transition-colors ${activeSettingsTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-neutral-500 hover:bg-neutral-50'}`}
             >
                 Add Content
             </button>
             <button 
                onClick={() => setActiveSettingsTab('settings')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider text-center transition-colors ${activeSettingsTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-neutral-500 hover:bg-neutral-50'}`}
             >
                 Settings
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
              
              {/* CONTENT TOOLS TAB */}
              {activeSettingsTab === 'content' && (
                  <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                      <div>
                          <h6 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Media</h6>
                          <div className="grid grid-cols-2 gap-3">
                              <button onClick={() => insertBlock('image')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100">
                                  <ImageIcon className="w-6 h-6" />
                                  <span className="text-[10px] font-bold">Image</span>
                              </button>
                              <button onClick={() => insertBlock('image')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100">
                                  <Grid className="w-6 h-6" />
                                  <span className="text-[10px] font-bold">Photo Grid</span>
                              </button>
                              <button onClick={() => insertBlock('code')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100">
                                  <PlayCircle className="w-6 h-6" />
                                  <span className="text-[10px] font-bold">Video</span>
                              </button>
                              <button onClick={() => insertBlock('code')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-neutral-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100">
                                  <Code className="w-6 h-6" />
                                  <span className="text-[10px] font-bold">Embed</span>
                              </button>
                          </div>
                      </div>

                      <div>
                          <h6 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Typography</h6>
                          <div className="space-y-2">
                              <button onClick={() => insertBlock('paragraph')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-left transition-colors">
                                  <Type className="w-4 h-4 text-neutral-500" />
                                  <span className="text-xs font-bold">Paragraph</span>
                              </button>
                              <button onClick={() => insertBlock('h1')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-left transition-colors">
                                  <span className="text-lg font-bold leading-none w-4 text-center">H1</span>
                                  <span className="text-xs font-bold">Large Heading</span>
                              </button>
                              <button onClick={() => insertBlock('h2')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-left transition-colors">
                                  <span className="text-base font-bold leading-none w-4 text-center">H2</span>
                                  <span className="text-xs font-bold">Subheading</span>
                              </button>
                          </div>
                      </div>

                      <div>
                           <h6 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Layout</h6>
                           <button onClick={() => insertBlock('divider')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-left transition-colors">
                                  <LayoutTemplate className="w-4 h-4 text-neutral-500" />
                                  <span className="text-xs font-bold">Divider / Spacer</span>
                            </button>
                      </div>
                  </div>
              )}

              {/* SETTINGS TAB */}
              {activeSettingsTab === 'settings' && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-neutral-900">Project Title</label>
                          <input 
                              value={formData.title} 
                              onChange={(e) => handleMetaChange('title', e.target.value)}
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-neutral-900">Client / Company</label>
                          <input 
                              value={formData.client} 
                              onChange={(e) => handleMetaChange('client', e.target.value)}
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-neutral-900">Year</label>
                          <input 
                              type="number"
                              value={formData.year} 
                              onChange={(e) => handleMetaChange('year', parseInt(e.target.value))}
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-neutral-900">Summary</label>
                          <textarea 
                              rows={4}
                              value={formData.description} 
                              onChange={(e) => handleMetaChange('description', e.target.value)}
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-neutral-900">Cover Image</label>
                          <div className="w-full aspect-video bg-neutral-100 rounded-lg overflow-hidden relative group">
                                {formData.thumb ? (
                                    <img src={formData.thumb} className="w-full h-full object-cover" alt="cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        onClick={() => triggerUpload((url) => handleMetaChange('thumb', url))}
                                        className="bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"
                                    >
                                        <Upload className="w-3 h-3"/> Change
                                    </button>
                                </div>
                          </div>
                      </div>

                      <div className="pt-6 border-t border-neutral-200">
                          <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-neutral-900">Publish Status</label>
                              <div className={`w-2 h-2 rounded-full ${formData.published ? 'bg-green-500' : 'bg-neutral-300'}`}></div>
                          </div>
                          <button 
                              onClick={() => handleMetaChange('published', !formData.published)}
                              className={`w-full py-2 rounded-lg text-xs font-bold border transition-colors ${
                                  formData.published 
                                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                              }`}
                          >
                              {formData.published ? 'Published (Live)' : 'Draft (Hidden)'}
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </aside>
    </div>
  );
};

export default BlockEditor;