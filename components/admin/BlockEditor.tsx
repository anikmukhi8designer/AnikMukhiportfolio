import React, { useState, useEffect, useRef } from 'react';
import { Project, ContentBlock, BlockType } from '../../types';
import { 
  ArrowLeft, Save, Trash2, GripVertical, Image as ImageIcon, 
  Type, Heading1, Heading2, Code, Quote, ArrowUp, ArrowDown, Minus,
  Link as LinkIcon, Calendar, Tag, Copy, X, Upload, Loader2
} from 'lucide-react';

interface BlockEditorProps {
  project: Project;
  onSave: (updatedProject: Project) => void;
  onBack: () => void;
}

// Helper to access env safely
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

const BlockEditor: React.FC<BlockEditorProps> = ({ project, onSave, onBack }) => {
  const [formData, setFormData] = useState<Project>(project);
  const [blocks, setBlocks] = useState<ContentBlock[]>(project.content || []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Focus Management
  const blockInputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLTextAreaElement | null }>({});
  const [shouldFocusId, setShouldFocusId] = useState<string | null>(null);
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUploadHandler, setPendingUploadHandler] = useState<((url: string) => void) | null>(null);

  // GitHub Config for Uploads
  const GITHUB_TOKEN = getEnv('VITE_GITHUB_TOKEN');
  const GITHUB_OWNER = getEnv('VITE_GITHUB_OWNER') || "anikmukhi8designer";
  const GITHUB_REPO = getEnv('VITE_GITHUB_REPO') || "AnikMukhiportfolio";

  // Focus effect when shouldFocusId changes
  useEffect(() => {
    if (shouldFocusId && blockInputRefs.current[shouldFocusId]) {
        blockInputRefs.current[shouldFocusId]?.focus();
        setShouldFocusId(null);
    }
  }, [shouldFocusId, blocks]);

  useEffect(() => {
    if (!project.content || project.content.length === 0) {
      setBlocks([
        { id: '1', type: 'paragraph', content: project.description || '' }
      ]);
    }
  }, [project]);

  const handleMetaChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAddGalleryImage = (url: string) => {
    const currentImages = formData.images || [];
    handleMetaChange('images', [...currentImages, url]);
  };

  const handleRemoveGalleryImage = (index: number) => {
    const currentImages = formData.images || [];
    handleMetaChange('images', currentImages.filter((_, i) => i !== index));
  };

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      caption: type === 'code' ? 'javascript' : ''
    };
    setBlocks([...blocks, newBlock]);
    setHasUnsavedChanges(true);
  };

  const insertBlockAfter = (index: number, type: BlockType = 'paragraph') => {
    const newBlock: ContentBlock = {
        id: generateId(),
        type,
        content: '',
        caption: ''
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
    setShouldFocusId(newBlock.id);
  };

  const updateBlock = (id: string, content: string, caption?: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content, caption } : b));
    setHasUnsavedChanges(true);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    setHasUnsavedChanges(true);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === blocks.length - 1)
    ) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, block: ContentBlock) => {
      if (e.shiftKey && e.key === 'Delete') {
          e.preventDefault();
          const prev = blocks[index - 1];
          const next = blocks[index + 1];
          setBlocks(blocks.filter(b => b.id !== block.id));
          setHasUnsavedChanges(true);
          if (prev) setShouldFocusId(prev.id);
          else if (next) setShouldFocusId(next.id);
          return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
          if (['paragraph', 'h1', 'h2', 'quote'].includes(block.type)) {
             e.preventDefault();
             insertBlockAfter(index, 'paragraph');
          }
      }

      if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
          e.preventDefault();
          const prev = blocks[index - 1];
          const next = blocks[index + 1];
          setBlocks(blocks.filter(b => b.id !== block.id));
          setHasUnsavedChanges(true);
          if (prev) setShouldFocusId(prev.id);
          else if (next) setShouldFocusId(next.id);
      }
      
      if (e.key === 'ArrowUp' && index > 0) {
          const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
          if (target.selectionStart === 0 && target.selectionEnd === 0) {
              e.preventDefault();
              setShouldFocusId(blocks[index - 1].id);
          }
      }
      if (e.key === 'ArrowDown' && index < blocks.length - 1) {
           const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement;
           if (target.selectionStart === target.value.length && target.selectionEnd === target.value.length) {
              e.preventDefault();
              setShouldFocusId(blocks[index + 1].id);
           }
      }
  };

  const handleSave = () => {
    onSave({
      ...formData,
      content: blocks
    });
    setHasUnsavedChanges(false);
  };

  // Upload Logic (GitHub API)
  const triggerUpload = (handler: (url: string) => void) => {
    setPendingUploadHandler(() => handler);
    fileInputRef.current?.click();
  };

  const processUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadHandler) return;
    
    if (!GITHUB_TOKEN) {
        alert("GitHub Token not configured. Cannot upload images.");
        return;
    }

    setIsUploading(true);
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileExt}`;
        const filePath = `public/uploads/${fileName}`;

        // Convert file to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async () => {
            const base64Content = (reader.result as string).split(',')[1];

            try {
                const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `Upload image: ${fileName}`,
                        content: base64Content
                    })
                });

                if (!response.ok) throw new Error("GitHub Upload Failed");

                // Construct public URL
                // Note: For immediate preview we might want raw.githubusercontent.com
                // But for production usage, a CDN like jsDelivr or relative path is better if deployed together.
                // Assuming Vite deploy: files in public/ end up at root.
                // However, we are running local dev often. 
                // Let's use the Raw URL for now to ensure it works across environments.
                const publicUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${filePath}`;
                
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
        console.error("Upload failed", error);
        setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={processUpload}
      />

      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500 hover:text-neutral-900">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-neutral-200"></div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900">Editing: {formData.title}</h1>
            <p className="text-xs text-neutral-500">{hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved to cloud'}</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all ${
            hasUnsavedChanges ? 'bg-neutral-900 hover:bg-neutral-800' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <Save className="w-4 h-4" /> {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
        </button>
      </header>

      <div className="flex-grow flex overflow-hidden">
        
        {/* Sidebar: Metadata */}
        <aside className="w-96 bg-white border-r border-neutral-200 overflow-y-auto p-6 hidden lg:block">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">Project Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">Project Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => handleMetaChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">Client</label>
              <input 
                type="text" 
                value={formData.client}
                onChange={(e) => handleMetaChange('client', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3"/> Year
                    </label>
                    <input 
                        type="number" 
                        value={formData.year}
                        onChange={(e) => handleMetaChange('year', parseInt(e.target.value))}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3"/> Services
                    </label>
                    <input 
                        type="text" 
                        value={formData.tags.join(', ')}
                        onChange={(e) => handleMetaChange('tags', e.target.value.split(',').map(s => s.trim()))}
                        className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                        placeholder="Web, Mobile"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3"/> Live Site URL
                </label>
                <input 
                    type="text" 
                    value={formData.link || ''}
                    onChange={(e) => handleMetaChange('link', e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="https://..."
                />
            </div>

            {/* Thumbnail Image Section */}
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">Thumbnail URL</label>
              <div className="flex gap-2">
                <input 
                    type="text" 
                    value={formData.thumb}
                    onChange={(e) => handleMetaChange('thumb', e.target.value)}
                    className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="https://..."
                />
                <button 
                    onClick={() => triggerUpload((url) => handleMetaChange('thumb', url))}
                    disabled={isUploading}
                    className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 transition-colors"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
                </button>
              </div>
              <img src={formData.thumb} alt="Preview" className="mt-2 w-full h-24 object-cover rounded-md bg-neutral-100" />
            </div>

            {/* Hero Image Section */}
            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2 flex items-center justify-between">
                <span>Hero Image URL</span>
                <button 
                    onClick={() => handleMetaChange('heroImage', formData.thumb)}
                    className="text-[10px] text-blue-600 hover:underline font-normal flex items-center gap-1"
                >
                    <Copy className="w-3 h-3"/> Use Thumb
                </button>
              </label>
              <div className="flex gap-2">
                <input 
                    type="text" 
                    value={formData.heroImage}
                    onChange={(e) => handleMetaChange('heroImage', e.target.value)}
                    className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
                    placeholder="https://..."
                />
                 <button 
                    onClick={() => triggerUpload((url) => handleMetaChange('heroImage', url))}
                    disabled={isUploading}
                    className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg border border-neutral-200 transition-colors"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
                </button>
              </div>
              <img src={formData.heroImage} alt="Preview" className="mt-2 w-full h-24 object-cover rounded-md bg-neutral-100" />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-900 mb-2">Summary (Card Description)</label>
              <textarea 
                value={formData.description}
                onChange={(e) => handleMetaChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              />
            </div>

            {/* Gallery Images Management */}
            <div>
                <label className="block text-xs font-bold text-neutral-900 mb-2">Gallery Images</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {formData.images?.map((img, idx) => (
                        <div key={idx} className="relative group rounded-md overflow-hidden aspect-video bg-neutral-100">
                            <img src={img} className="w-full h-full object-cover" alt="" />
                            <button 
                                onClick={() => handleRemoveGalleryImage(idx)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => triggerUpload(handleAddGalleryImage)}
                    disabled={isUploading}
                    className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                     {isUploading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3" />}
                    Upload Image
                </button>
            </div>

            <div className="pt-6 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.published}
                        onChange={(e) => handleMetaChange('published', e.target.checked)}
                        className="w-4 h-4 text-neutral-900 focus:ring-neutral-900 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-neutral-900">Published Live</span>
                </label>
            </div>
          </div>
        </aside>

        {/* Main Content: Blocks */}
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-8 pb-32">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Project Header Preview */}
            <div className="mb-12 text-center opacity-50 hover:opacity-100 transition-opacity">
               <h1 className="text-4xl font-bold mb-2">{formData.title}</h1>
               <p>{formData.client} • {formData.year}</p>
            </div>

            {/* Blocks List */}
            {blocks.map((block, index) => (
              <div key={block.id} className="group relative flex gap-4 items-start">
                
                {/* Block Controls */}
                <div className="w-8 pt-2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveBlock(index, 'up')} className="p-1 hover:bg-white rounded text-neutral-400 hover:text-neutral-900">
                        <ArrowUp className="w-3 h-3" />
                    </button>
                    <GripVertical className="w-4 h-4 text-neutral-300 cursor-grab active:cursor-grabbing" />
                    <button onClick={() => moveBlock(index, 'down')} className="p-1 hover:bg-white rounded text-neutral-400 hover:text-neutral-900">
                        <ArrowDown className="w-3 h-3" />
                    </button>
                </div>

                {/* Block Content */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-transparent hover:border-neutral-300 transition-colors p-4 relative group-focus-within:ring-2 group-focus-within:ring-neutral-900 ring-offset-2">
                    
                    {/* Delete Button (absolute) */}
                    <button 
                        onClick={() => deleteBlock(block.id)}
                        className="absolute -right-3 -top-3 bg-white shadow-md p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10"
                        title="Delete (Shift+Delete)"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Render Input based on Type */}
                    {block.type === 'paragraph' && (
                        <textarea
                            ref={(el) => { blockInputRefs.current[block.id] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, index, block)}
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Type your paragraph here..."
                            rows={Math.max(2, block.content.length / 80)}
                            className="w-full resize-none border-none focus:ring-0 p-0 text-base text-neutral-700 leading-relaxed bg-transparent"
                        />
                    )}

                    {block.type === 'h1' && (
                         <input
                            ref={(el) => { blockInputRefs.current[block.id] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, index, block)}
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Heading 1"
                            className="w-full border-none focus:ring-0 p-0 text-2xl font-bold text-neutral-900 bg-transparent placeholder:text-neutral-300"
                        />
                    )}

                    {block.type === 'h2' && (
                         <input
                            ref={(el) => { blockInputRefs.current[block.id] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, index, block)}
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Heading 2"
                            className="w-full border-none focus:ring-0 p-0 text-xl font-bold text-neutral-800 bg-transparent placeholder:text-neutral-300"
                        />
                    )}

                    {block.type === 'quote' && (
                        <div className="flex gap-4">
                            <div className="w-1 bg-neutral-300 rounded-full shrink-0"></div>
                            <textarea
                                ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                onKeyDown={(e) => handleKeyDown(e, index, block)}
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, e.target.value)}
                                placeholder="Enter quote..."
                                rows={2}
                                className="w-full resize-none border-none focus:ring-0 p-0 text-xl italic text-neutral-700 bg-transparent"
                            />
                        </div>
                    )}

                    {block.type === 'code' && (
                        <div className="font-mono text-sm bg-neutral-50 p-2 rounded">
                            <input 
                                value={block.caption || ''}
                                onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                placeholder="Language (e.g. javascript)"
                                className="w-full bg-transparent border-b border-neutral-200 mb-2 pb-1 text-xs text-neutral-500 focus:outline-none"
                            />
                            <textarea
                                ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                onKeyDown={(e) => handleKeyDown(e, index, block)}
                                value={block.content}
                                onChange={(e) => updateBlock(block.id, e.target.value)}
                                placeholder="// Type your code here"
                                rows={4}
                                className="w-full resize-none border-none focus:ring-0 p-0 bg-transparent text-neutral-800"
                            />
                        </div>
                    )}

                    {block.type === 'image' && (
                        <div className="space-y-3">
                            {block.content ? (
                                <img src={block.content} alt="" className="w-full rounded bg-neutral-100 max-h-64 object-cover" />
                            ) : (
                                <button 
                                    onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))}
                                    className="w-full h-32 bg-neutral-50 rounded border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors gap-2"
                                >
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin"/> : <Upload className="w-6 h-6" />}
                                    <span className="text-xs font-medium">Click to Upload Image</span>
                                </button>
                            )}
                            <div className="flex gap-2">
                                <input
                                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                                    type="text"
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, e.target.value, block.caption)}
                                    placeholder="Paste image URL..."
                                    className="flex-1 text-xs px-2 py-1 bg-neutral-50 border border-neutral-200 rounded"
                                />
                                {block.content && (
                                    <button 
                                        onClick={() => triggerUpload((url) => updateBlock(block.id, url, block.caption))}
                                        className="p-1 bg-white border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-500"
                                        title="Replace Image"
                                    >
                                        <Upload className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={block.caption || ''}
                                onChange={(e) => updateBlock(block.id, block.content, e.target.value)}
                                placeholder="Image caption (optional)"
                                className="w-full text-xs px-2 py-1 bg-transparent border-b border-neutral-100 focus:border-neutral-300 focus:outline-none text-neutral-500"
                            />
                        </div>
                    )}
                    
                    {block.type === 'divider' && (
                        <div className="flex items-center justify-center h-8">
                            <div className="h-px w-full bg-neutral-200"></div>
                        </div>
                    )}
                </div>
              </div>
            ))}

            {/* Add Block Menu (Floating/Bottom) */}
            <div className="mt-8 p-4 border-2 border-dashed border-neutral-200 rounded-lg flex flex-col items-center justify-center gap-4 hover:border-neutral-400 transition-colors bg-white/50">
                <span className="text-sm font-medium text-neutral-400">Add content block</span>
                <div className="flex flex-wrap justify-center gap-2">
                    <button onClick={() => addBlock('paragraph')} className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 shadow-sm rounded-md hover:bg-neutral-50 text-sm font-medium text-neutral-700">
                        <Type className="w-4 h-4" /> Text
                    </button>
                    <button onClick={() => addBlock('h1')} className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 shadow-sm rounded-md hover:bg-neutral-50 text-sm font-medium text-neutral-700">
                        <Heading1 className="w-4 h-4" /> Heading 1
                    </button>
                    <button onClick={() => addBlock('h2')} className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 shadow-sm rounded-md hover:bg-neutral-50 text-sm font-medium text-neutral-700">
                        <Heading2 className="w-4 h-4" /> Heading 2
                    </button>
                    <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 shadow-sm rounded-md hover:bg-neutral-50 text-sm font-medium text-neutral-700">
                        <ImageIcon className="w-4 h-4" /> Image
                    </button>
                    <button onClick={() => addBlock('code')} className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 shadow-sm rounded-md hover:bg-neutral-50 text-sm font-medium text-neutral-700">
                        <Code className="w-4 h-4" /> Code
                    </button>
                    <button onClick={() => addBlock('quote')} className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 shadow-sm rounded-md hover:bg-neutral-50 text-sm font-medium text-neutral-700">
                        <Quote className="w-4 h-4" /> Quote
                    </button>
                    <button onClick={() => addBlock('divider')} className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 shadow-sm rounded-md hover:bg-neutral-50 text-sm font-medium text-neutral-700">
                        <Minus className="w-4 h-4" /> Divider
                    </button>
                </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default BlockEditor;