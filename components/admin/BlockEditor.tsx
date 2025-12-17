import React, { useState, useEffect, useRef } from 'react';
import { Project, ContentBlock, BlockType } from '../../types';
import { 
  ArrowLeft, Save, Trash2, Image as ImageIcon, 
  Type, Heading1, Heading2, Code, Quote, ArrowUp, ArrowDown, Minus,
  Settings, Upload, Loader2, FileText, Layout,
  MoreHorizontal, Check, X, ChevronRight, Sidebar
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

// Helper: GitHub Token
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
  // --- State Management ---
  const [formData, setFormData] = useState<Project>(project);
  const [blocks, setBlocks] = useState<ContentBlock[]>(project.content || []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'layout'>('home');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(window.innerWidth > 1200);

  // Focus Management
  const blockInputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});
  const [shouldFocusId, setShouldFocusId] = useState<string | null>(null);
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadHandler, setPendingUploadHandler] = useState<((url: string) => void) | null>(null);

  // --- Effects ---

  // Handle focus requests
  useEffect(() => {
    if (shouldFocusId && blockInputRefs.current[shouldFocusId]) {
        blockInputRefs.current[shouldFocusId]?.focus();
        setShouldFocusId(null);
    }
  }, [shouldFocusId, blocks]);

  // Ensure at least one block exists
  useEffect(() => {
    if (!project.content || project.content.length === 0) {
      setBlocks([
        { id: '1', type: 'paragraph', content: project.description || '' }
      ]);
    }
  }, [project]);

  // Responsive Sidebar
  useEffect(() => {
      const handleResize = () => {
          if (window.innerWidth < 1200) setShowMetadata(false);
          else setShowMetadata(true);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Logic / Handlers ---

  const handleMetaChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Core Block Operations
  const insertBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      caption: type === 'code' ? 'javascript' : ''
    };

    let newBlocks = [...blocks];
    
    // If a block is selected, insert after it
    if (selectedBlockId) {
        const index = blocks.findIndex(b => b.id === selectedBlockId);
        if (index !== -1) {
            newBlocks.splice(index + 1, 0, newBlock);
        } else {
            newBlocks.push(newBlock);
        }
    } else {
        newBlocks.push(newBlock);
    }

    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
    setShouldFocusId(newBlock.id);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, content: string, caption?: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content, caption } : b));
    setHasUnsavedChanges(true);
  };

  const deleteBlock = () => {
    if (!selectedBlockId) return;
    const index = blocks.findIndex(b => b.id === selectedBlockId);
    if (index === -1) return;

    // Safety check for last block
    if (blocks.length <= 1) {
        alert("Document must have at least one block.");
        return;
    }

    const newBlocks = blocks.filter(b => b.id !== selectedBlockId);
    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
    
    // Focus neighbor
    const prev = newBlocks[index - 1];
    const next = newBlocks[index];
    if (prev) {
        setSelectedBlockId(prev.id);
        setShouldFocusId(prev.id);
    } else if (next) {
        setSelectedBlockId(next.id);
        setShouldFocusId(next.id);
    } else {
        setSelectedBlockId(null);
    }
  };

  const moveBlock = (direction: 'up' | 'down') => {
    if (!selectedBlockId) return;
    const index = blocks.findIndex(b => b.id === selectedBlockId);
    if (index === -1) return;
    
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    
    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
    // Keep focus logic handled by react re-render, but usually focus stays if key matches
    // We might need to forcefully re-focus if DOM shifts
    setTimeout(() => {
         blockInputRefs.current[selectedBlockId]?.focus();
    }, 0);
  };

  const handleSave = () => {
    onSave({
      ...formData,
      content: blocks
    });
    setHasUnsavedChanges(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, block: ContentBlock) => {
      // Enter to create new paragraph
      if (e.key === 'Enter' && !e.shiftKey) {
          if (['paragraph', 'h1', 'h2', 'quote'].includes(block.type)) {
             e.preventDefault();
             // Manually insert paragraph after current index
             const newBlock: ContentBlock = { id: generateId(), type: 'paragraph', content: '' };
             const newBlocks = [...blocks];
             newBlocks.splice(index + 1, 0, newBlock);
             setBlocks(newBlocks);
             setHasUnsavedChanges(true);
             setShouldFocusId(newBlock.id);
             setSelectedBlockId(newBlock.id);
          }
      }
      
      // Backspace to delete empty block
      if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
          e.preventDefault();
          const prev = blocks[index - 1];
          const next = blocks[index + 1];
          setBlocks(blocks.filter(b => b.id !== block.id));
          setHasUnsavedChanges(true);
          if (prev) {
              setShouldFocusId(prev.id);
              setSelectedBlockId(prev.id);
          }
          else if (next) {
              setShouldFocusId(next.id);
              setSelectedBlockId(next.id);
          }
      }

      // Arrows for navigation
      if (e.key === 'ArrowUp' && index > 0) {
          const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
          if (target.selectionStart === 0) {
              e.preventDefault();
              setShouldFocusId(blocks[index - 1].id);
              setSelectedBlockId(blocks[index - 1].id);
          }
      }
      if (e.key === 'ArrowDown' && index < blocks.length - 1) {
           const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
           if (target.selectionStart === target.value.length) {
              e.preventDefault();
              setShouldFocusId(blocks[index + 1].id);
              setSelectedBlockId(blocks[index + 1].id);
           }
      }
  };

  // --- Upload Logic ---
  const triggerUpload = (handler: (url: string) => void) => {
    setPendingUploadHandler(() => handler);
    fileInputRef.current?.click();
  };

  const processUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadHandler) return;
    
    let token = getGitHubToken();
    let { owner, repo } = getGitHubConfig();

    if (!owner || !repo || !token) {
         // Fallback for demo mode or missing config
         const demoUrl = URL.createObjectURL(file);
         pendingUploadHandler(demoUrl);
         setPendingUploadHandler(null);
         return;
    }

    setIsUploading(true);
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
                    body: JSON.stringify({ message: `Upload image: ${fileName}`, content: base64Content })
                });

                if (!response.ok) throw new Error("GitHub Upload Failed");
                const publicUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
                pendingUploadHandler(publicUrl);
            } catch (err) {
                console.error(err);
                alert("Upload failed. Check console.");
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

  // --- Renderers ---

  const renderRibbon = () => (
      <div className="bg-white border-b border-neutral-300 shadow-sm z-30 relative">
          {/* File/Title Bar */}
          <div className="bg-[#2b579a] text-white px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="p-1 hover:bg-white/10 rounded">
                      <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col leading-none">
                       <span className="text-sm font-semibold tracking-wide">{formData.title || "Untitled Document"}</span>
                       <span className="text-[10px] opacity-80">{hasUnsavedChanges ? "Unsaved changes" : "Saved to cloud"}</span>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                   <button 
                        onClick={handleSave} 
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 ${
                            hasUnsavedChanges ? 'bg-white text-[#2b579a] hover:bg-neutral-100' : 'bg-white/20 text-white cursor-default'
                        }`}
                   >
                       <Save className="w-3 h-3" />
                       {hasUnsavedChanges ? 'Save' : 'Saved'}
                   </button>
              </div>
          </div>

          {/* Tab Headers */}
          <div className="flex px-2 border-b border-neutral-200 bg-[#f3f2f1]">
              {[
                  { id: 'home', label: 'Home' },
                  { id: 'insert', label: 'Insert' },
                  { id: 'layout', label: 'Page Layout' },
              ].map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-5 py-2 text-sm font-medium border-t-2 border-x border-transparent mb-[-1px] transition-colors ${
                          activeTab === tab.id 
                          ? 'bg-white border-neutral-200 border-t-2 border-t-[#2b579a] text-[#2b579a]' 
                          : 'text-neutral-600 hover:bg-neutral-200'
                      }`}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>

          {/* Toolbar Area */}
          <div className="h-24 bg-[#f3f2f1] flex items-center px-4 gap-6 overflow-x-auto">
              
              {/* HOME TAB TOOLS */}
              {activeTab === 'home' && (
                  <>
                      {/* Clipboard Group (Mock) */}
                      <div className="flex flex-col items-center gap-1 pr-6 border-r border-neutral-300">
                           <div className="flex gap-1">
                                <button className="p-1.5 text-neutral-500 hover:bg-white hover:shadow-sm rounded disabled:opacity-30" title="Paste (Ctrl+V)"><FileText className="w-5 h-5" /></button>
                           </div>
                           <span className="text-[10px] text-neutral-500">Clipboard</span>
                      </div>

                      {/* Styles Group */}
                      <div className="flex flex-col gap-1 pr-6 border-r border-neutral-300">
                          <div className="flex gap-1">
                              <button onClick={() => insertBlock('h1')} className="p-2 hover:bg-white hover:shadow-sm rounded group flex flex-col items-center min-w-[3rem]" title="Heading 1">
                                  <Heading1 className="w-5 h-5 text-neutral-700 group-hover:text-[#2b579a]" />
                                  <span className="text-[10px] mt-1 text-neutral-500">Title</span>
                              </button>
                              <button onClick={() => insertBlock('h2')} className="p-2 hover:bg-white hover:shadow-sm rounded group flex flex-col items-center min-w-[3rem]" title="Heading 2">
                                  <Heading2 className="w-5 h-5 text-neutral-700 group-hover:text-[#2b579a]" />
                                  <span className="text-[10px] mt-1 text-neutral-500">Header</span>
                              </button>
                              <button onClick={() => insertBlock('paragraph')} className="p-2 hover:bg-white hover:shadow-sm rounded group flex flex-col items-center min-w-[3rem]" title="Paragraph">
                                  <Type className="w-5 h-5 text-neutral-700 group-hover:text-[#2b579a]" />
                                  <span className="text-[10px] mt-1 text-neutral-500">Normal</span>
                              </button>
                              <button onClick={() => insertBlock('quote')} className="p-2 hover:bg-white hover:shadow-sm rounded group flex flex-col items-center min-w-[3rem]" title="Quote">
                                  <Quote className="w-5 h-5 text-neutral-700 group-hover:text-[#2b579a]" />
                                  <span className="text-[10px] mt-1 text-neutral-500">Quote</span>
                              </button>
                              <button onClick={() => insertBlock('code')} className="p-2 hover:bg-white hover:shadow-sm rounded group flex flex-col items-center min-w-[3rem]" title="Code Block">
                                  <Code className="w-5 h-5 text-neutral-700 group-hover:text-[#2b579a]" />
                                  <span className="text-[10px] mt-1 text-neutral-500">Code</span>
                              </button>
                          </div>
                          <div className="text-center w-full">
                               <span className="text-[10px] text-neutral-500">Styles</span>
                          </div>
                      </div>

                      {/* Editing Group */}
                      <div className="flex flex-col items-center gap-1 pr-6 border-r border-neutral-300">
                           <div className="flex gap-1">
                                <div className="flex flex-col">
                                    <button 
                                        onClick={() => moveBlock('up')} 
                                        disabled={!selectedBlockId}
                                        className="p-1 hover:bg-white hover:shadow-sm rounded text-neutral-700 disabled:opacity-30"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => moveBlock('down')} 
                                        disabled={!selectedBlockId}
                                        className="p-1 hover:bg-white hover:shadow-sm rounded text-neutral-700 disabled:opacity-30"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </button>
                                </div>
                                <button 
                                    onClick={deleteBlock} 
                                    disabled={!selectedBlockId}
                                    className="p-2 hover:bg-red-50 hover:text-red-600 hover:shadow-sm rounded text-neutral-700 disabled:opacity-30 flex flex-col items-center justify-center"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                           </div>
                           <span className="text-[10px] text-neutral-500">Editing</span>
                      </div>
                  </>
              )}

              {/* INSERT TAB TOOLS */}
              {activeTab === 'insert' && (
                  <>
                      <div className="flex flex-col items-center gap-1 pr-6 border-r border-neutral-300">
                           <button onClick={() => insertBlock('image')} className="p-2 hover:bg-white hover:shadow-sm rounded group flex flex-col items-center min-w-[3rem]">
                                <ImageIcon className="w-6 h-6 text-neutral-700 group-hover:text-[#2b579a]" />
                           </button>
                           <span className="text-[10px] text-neutral-500">Picture</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 pr-6 border-r border-neutral-300">
                           <button onClick={() => insertBlock('divider')} className="p-2 hover:bg-white hover:shadow-sm rounded group flex flex-col items-center min-w-[3rem]">
                                <Minus className="w-6 h-6 text-neutral-700 group-hover:text-[#2b579a]" />
                           </button>
                           <span className="text-[10px] text-neutral-500">Divider</span>
                      </div>
                  </>
              )}

              {/* LAYOUT TAB TOOLS */}
              {activeTab === 'layout' && (
                  <>
                     <div className="flex flex-col items-center gap-1 pr-6 border-r border-neutral-300">
                           <button 
                                onClick={() => setShowMetadata(!showMetadata)} 
                                className={`p-2 hover:bg-white hover:shadow-sm rounded group flex flex-col items-center min-w-[3rem] ${showMetadata ? 'bg-white shadow-sm text-[#2b579a]' : ''}`}
                            >
                                <Sidebar className="w-6 h-6 text-neutral-700 group-hover:text-[#2b579a]" />
                           </button>
                           <span className="text-[10px] text-neutral-500">Properties</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 pr-6 border-r border-neutral-300">
                           <div className="flex items-center gap-2 px-3 py-1">
                                <span className="text-xs font-bold text-neutral-600">Status:</span>
                                <button 
                                    onClick={() => handleMetaChange('published', !formData.published)}
                                    className={`px-3 py-1 rounded text-xs font-bold ${formData.published ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'}`}
                                >
                                    {formData.published ? 'Published' : 'Draft'}
                                </button>
                           </div>
                           <span className="text-[10px] text-neutral-500">State</span>
                      </div>
                  </>
              )}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex flex-col font-sans text-neutral-900">
      
      {/* Hidden Upload Input */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={processUpload} />

      {/* 1. Ribbon UI */}
      {renderRibbon()}

      <div className="flex flex-1 overflow-hidden relative">
          
          {/* 2. Main Canvas (The "Paper") */}
          <main className="flex-1 overflow-y-auto relative p-8 md:p-12 flex justify-center" onClick={() => setSelectedBlockId(null)}>
              
              <div 
                  className="bg-white shadow-sm border border-neutral-300 w-full max-w-[850px] min-h-[1100px] p-8 md:p-16 flex flex-col gap-4 transition-all"
                  onClick={(e) => e.stopPropagation()} 
              >
                  {/* Document Title (Visual only in Canvas, actual editing in Properties) */}
                  <div className="mb-8 border-b border-transparent hover:border-neutral-200 pb-4 group">
                      <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight tracking-tight mb-2 outline-none">
                          {formData.title}
                      </h1>
                      <div className="text-neutral-500 text-lg">{formData.client} • {formData.year}</div>
                  </div>

                  {/* Blocks Rendering */}
                  {blocks.map((block, index) => {
                      const isSelected = selectedBlockId === block.id;

                      return (
                          <div 
                              key={block.id} 
                              className={`relative group transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500/50 rounded-sm' : 'hover:bg-neutral-50 rounded-sm'}`}
                              onClick={() => setSelectedBlockId(block.id)}
                          >
                              {/* Element Renderer */}
                              {block.type === 'paragraph' && (
                                  <textarea
                                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                                      value={block.content}
                                      onChange={(e) => updateBlock(block.id, e.target.value)}
                                      placeholder="Type something..."
                                      className="w-full resize-none bg-transparent border-none p-2 text-lg text-neutral-800 leading-relaxed focus:ring-0 placeholder:text-neutral-300"
                                      rows={Math.max(1, block.content.split('\n').length)}
                                      style={{ minHeight: '1.5em' }}
                                  />
                              )}

                              {block.type === 'h1' && (
                                  <input
                                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                                      value={block.content}
                                      onChange={(e) => updateBlock(block.id, e.target.value)}
                                      placeholder="Heading 1"
                                      className="w-full bg-transparent border-none p-2 text-3xl font-bold text-neutral-900 focus:ring-0 placeholder:text-neutral-300"
                                  />
                              )}

                              {block.type === 'h2' && (
                                  <input
                                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                                      value={block.content}
                                      onChange={(e) => updateBlock(block.id, e.target.value)}
                                      placeholder="Heading 2"
                                      className="w-full bg-transparent border-none p-2 text-2xl font-bold text-neutral-800 focus:ring-0 placeholder:text-neutral-300 mt-4"
                                  />
                              )}

                              {block.type === 'quote' && (
                                  <div className="flex gap-4 px-2 py-4">
                                      <div className="w-1 bg-[#2b579a] rounded-full shrink-0"></div>
                                      <textarea
                                          ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                          onKeyDown={(e) => handleKeyDown(e, index, block)}
                                          value={block.content}
                                          onChange={(e) => updateBlock(block.id, e.target.value)}
                                          placeholder="Pull quote..."
                                          className="w-full resize-none bg-transparent border-none p-0 text-xl italic text-neutral-600 focus:ring-0 placeholder:text-neutral-300"
                                          rows={Math.max(2, block.content.length / 50)}
                                      />
                                  </div>
                              )}

                              {block.type === 'code' && (
                                  <div className="bg-neutral-50 border border-neutral-200 rounded p-4 font-mono text-sm my-2">
                                      <div className="flex justify-between border-b border-neutral-200 pb-2 mb-2">
                                          <input 
                                              value={block.caption || ''}
                                              onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                              placeholder="Language"
                                              className="bg-transparent border-none text-xs text-neutral-500 focus:ring-0 w-32 p-0"
                                          />
                                      </div>
                                      <textarea
                                          ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                          onKeyDown={(e) => handleKeyDown(e, index, block)}
                                          value={block.content}
                                          onChange={(e) => updateBlock(block.id, e.target.value)}
                                          placeholder="// Type code here..."
                                          className="w-full resize-none bg-transparent border-none p-0 text-neutral-800 focus:ring-0 font-mono"
                                          rows={Math.max(3, block.content.split('\n').length)}
                                      />
                                  </div>
                              )}

                              {block.type === 'image' && (
                                  <div className="my-4">
                                      {block.content ? (
                                          <div className="relative group/img">
                                              <img src={block.content} alt="" className="w-full h-auto rounded shadow-sm" />
                                              <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity flex gap-2">
                                                  <button onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))} className="bg-white/90 p-1.5 rounded text-neutral-700 shadow hover:text-[#2b579a]">
                                                      <Layout className="w-4 h-4" />
                                                  </button>
                                              </div>
                                          </div>
                                      ) : (
                                          <button 
                                              onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))}
                                              className="w-full h-48 bg-neutral-50 border-2 border-dashed border-neutral-300 rounded flex flex-col items-center justify-center text-neutral-400 gap-2 hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
                                          >
                                              {isUploading ? <Loader2 className="w-6 h-6 animate-spin"/> : <ImageIcon className="w-8 h-8 opacity-50"/>}
                                              <span className="text-sm">Click to Upload Image</span>
                                          </button>
                                      )}
                                      <input 
                                          value={block.caption || ''}
                                          onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                          placeholder="Add a caption..."
                                          className="w-full text-center text-xs text-neutral-500 bg-transparent border-none focus:ring-0 mt-2 italic"
                                      />
                                  </div>
                              )}

                              {block.type === 'divider' && (
                                  <div className="py-8 flex items-center justify-center">
                                      <div className="h-px w-24 bg-neutral-300"></div>
                                      <div className="mx-4 text-neutral-300 text-xs">***</div>
                                      <div className="h-px w-24 bg-neutral-300"></div>
                                  </div>
                              )}
                          </div>
                      );
                  })}

                  {/* Empty State / Bottom Area */}
                  <div className="h-32 flex items-center justify-center text-neutral-300 text-sm italic select-none pointer-events-none">
                      End of Document
                  </div>
              </div>
          </main>

          {/* 3. Right Sidebar (Document Properties) */}
          <aside className={`
              w-80 bg-white border-l border-neutral-300 flex-shrink-0 flex flex-col transition-all duration-300
              ${showMetadata ? 'mr-0' : '-mr-80'}
          `}>
              <div className="p-4 border-b border-neutral-200 bg-neutral-50 font-bold text-xs text-neutral-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Properties</span>
                  <button onClick={() => setShowMetadata(false)} className="hover:bg-neutral-200 p-1 rounded"><ChevronRight className="w-4 h-4"/></button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                  {/* General Info */}
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700">Document Title</label>
                          <input 
                              type="text" 
                              value={formData.title}
                              onChange={(e) => handleMetaChange('title', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-sm focus:border-[#2b579a] focus:ring-1 focus:ring-[#2b579a] outline-none"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700">Client</label>
                          <input 
                              type="text" 
                              value={formData.client}
                              onChange={(e) => handleMetaChange('client', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-sm focus:border-[#2b579a] focus:ring-1 focus:ring-[#2b579a] outline-none"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-neutral-700">Year</label>
                              <input 
                                  type="number" 
                                  value={formData.year}
                                  onChange={(e) => handleMetaChange('year', parseInt(e.target.value))}
                                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-sm focus:border-[#2b579a] focus:ring-1 focus:ring-[#2b579a] outline-none"
                              />
                          </div>
                      </div>
                  </div>

                  <hr className="border-neutral-200"/>

                  {/* Media */}
                  <div className="space-y-4">
                      <label className="text-xs font-bold text-neutral-700">Cover Image</label>
                      <div className="border border-neutral-200 rounded p-2 bg-neutral-50">
                          {formData.thumb && <img src={formData.thumb} className="w-full h-32 object-cover rounded mb-2 bg-white" alt="cover" />}
                          <div className="flex gap-2">
                               <input 
                                  type="text" 
                                  value={formData.thumb}
                                  onChange={(e) => handleMetaChange('thumb', e.target.value)}
                                  className="flex-1 px-2 py-1 text-xs border border-neutral-300 rounded"
                                  placeholder="https://..."
                               />
                               <button 
                                  onClick={() => triggerUpload((url) => handleMetaChange('thumb', url))}
                                  className="p-1.5 bg-white border border-neutral-300 rounded hover:bg-neutral-100"
                               >
                                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>}
                               </button>
                          </div>
                      </div>
                  </div>
                  
                  <hr className="border-neutral-200"/>

                  {/* SEO / Meta */}
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700">Summary</label>
                          <textarea 
                              value={formData.description}
                              onChange={(e) => handleMetaChange('description', e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-sm focus:border-[#2b579a] focus:ring-1 focus:ring-[#2b579a] outline-none resize-none"
                          />
                      </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-neutral-700">Tags (Comma separated)</label>
                          <input 
                              type="text" 
                              value={formData.tags.join(', ')}
                              onChange={(e) => handleMetaChange('tags', e.target.value.split(',').map(s => s.trim()))}
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded text-sm focus:border-[#2b579a] focus:ring-1 focus:ring-[#2b579a] outline-none"
                          />
                      </div>
                  </div>
              </div>
          </aside>
      </div>
    </div>
  );
};

export default BlockEditor;