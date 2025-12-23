
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types';
import { ArrowUpRight, Type, Image as ImageIcon, Edit3, Eye, EyeOff, Check, X, Save, RotateCcw } from 'lucide-react';
import { getOptimizedSrc, getOptimizedSrcSet } from '../utils/imageOptimizer';
import { useData } from '../contexts/DataContext';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onMouseEnter, onMouseLeave }) => {
  const { updateProjectInMemory, updateProject, reloadContent } = useData();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  // Check if we are in admin mode to show the control
  const isAdmin = typeof window !== 'undefined' && window.location.hash === '#admin';

  const handleFieldEdit = (data: Partial<Project>) => {
    updateProjectInMemory(project.id, data);
    setHasChanges(true);
  };

  const handleConfirmSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaveStatus('saving');
    try {
        await updateProject(project.id, project);
        setSaveStatus('saved');
        setHasChanges(false);
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
        setSaveStatus('idle');
    }
  };

  const handleDiscardChanges = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await reloadContent(); // This will reset the global state to what's in DB
    setHasChanges(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
      }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        scale: 1.015,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`group cursor-pointer flex flex-col border border-border bg-card hover:border-primary/40 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(255,255,255,0.05)] transition-all duration-500 ease-out relative ${!project.published && isAdmin ? 'opacity-60 grayscale' : ''}`}
      onClick={() => onClick(project)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Admin Confirmation Overlay */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-x-0 top-0 z-[100] p-4 bg-neutral-900/95 backdrop-blur-md text-white flex items-center justify-between border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Unsaved Edits</span>
            </div>
            <div className="flex items-center gap-2">
               <button 
                  onClick={handleDiscardChanges}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Discard
               </button>
               <button 
                  onClick={handleConfirmSave}
                  disabled={saveStatus === 'saving'}
                  className="px-4 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                  Confirm Save
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Container */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted border-b border-border">
        <motion.img
          layoutId={`project-image-${project.id}`}
          src={getOptimizedSrc(project.thumb, 800)}
          srcSet={getOptimizedSrcSet(project.thumb)}
          sizes="(max-width: 768px) 100vw, 50vw"
          loading="lazy"
          alt={project.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
        />
        
        {/* Admin Direct Image Edit Button */}
        {isAdmin && (
            <button 
              onClick={(e) => {
                  e.stopPropagation();
                  const newUrl = prompt("Enter new thumbnail URL:", project.thumb);
                  if (newUrl) handleFieldEdit({ thumb: newUrl });
              }}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] z-10"
            >
                <div className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Edit3 className="w-3 h-3" /> Edit Image
                </div>
            </button>
        )}

        {/* Overlay Icon */}
        <div className="absolute top-4 right-4 bg-background/90 text-foreground p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight className="w-5 h-5" />
        </div>

        {/* Visibility Status Badge (Admin Only) */}
        {isAdmin && !project.published && (
            <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest z-20">
                Draft
            </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="space-y-1 w-full relative">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                    {project.client}
                </span>
                
                {isAdmin ? (
                  <div className="relative">
                    <input
                        type="text"
                        value={project.title}
                        onChange={(e) => handleFieldEdit({ title: e.target.value })}
                        onKeyDown={handleTitleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: `${project.titleSize || 40}px` }}
                        className={`font-bold text-foreground leading-tight bg-transparent border-none p-0 w-full focus:ring-0 focus:outline-none hover:text-primary transition-all duration-300 ${hasChanges ? 'text-orange-500' : ''}`}
                    />
                    <AnimatePresence>
                        {saveStatus === 'saved' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute -right-8 top-1/2 -translate-y-1/2 text-green-500"
                            >
                                <Check className="w-4 h-4" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.h3 
                    layoutId={`project-title-${project.id}`}
                    style={{ fontSize: `${project.titleSize || 40}px` }}
                    className="font-bold text-foreground leading-tight group-hover:text-primary transition-all duration-300"
                  >
                    {project.title}
                  </motion.h3>
                )}
            </div>
            <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-1 shrink-0">
                {project.year}
            </span>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
            <div className="flex flex-wrap gap-2">
                {project.tags?.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase bg-secondary text-secondary-foreground px-2 py-1">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Admin Controls - Visible only in Admin for editing */}
            {isAdmin && (
                <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Visibility Toggle */}
                    <button 
                      onClick={() => handleFieldEdit({ published: !project.published })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                        project.published 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 border-green-200 hover:bg-green-200' 
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 border-orange-200 hover:bg-orange-200'
                      }`}
                      title={project.published ? "Click to set as Draft" : "Click to Publish"}
                    >
                        {project.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {project.published ? 'Live' : 'Draft'}
                        </span>
                    </button>

                    {/* Thumbnail URL Control */}
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-border">
                        <ImageIcon className="w-3 h-3 text-muted-foreground" />
                        <input 
                          type="text"
                          value={project.thumb}
                          onChange={(e) => handleFieldEdit({ thumb: e.target.value })}
                          placeholder="Image URL..."
                          className="w-24 md:w-32 bg-transparent border-none p-0 text-[10px] focus:ring-0 text-muted-foreground truncate font-mono"
                        />
                    </div>

                    {/* Font Size Control */}
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-border">
                        <Type className="w-3 h-3 text-muted-foreground" />
                        <input 
                          type="range"
                          min="10"
                          max="60"
                          step="1"
                          value={project.titleSize || 40}
                          onChange={(e) => handleFieldEdit({ titleSize: parseInt(e.target.value) })}
                          className="w-20 md:w-24 accent-primary cursor-ew-resize h-1"
                        />
                        <span className="text-[9px] font-mono text-muted-foreground w-4">
                          {project.titleSize || 40}
                        </span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
