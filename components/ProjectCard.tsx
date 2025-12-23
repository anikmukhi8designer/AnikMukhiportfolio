
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types';
import { ArrowUpRight, Type, Image as ImageIcon, Edit3, Check, Save, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import { getOptimizedSrc, getOptimizedSrcSet } from '../utils/imageOptimizer';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onMouseEnter, onMouseLeave }) => {
  const { updateProjectInMemory, reloadContent, saveAllData, isSaving: globalSaving } = useData();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  // Check if we are in admin mode to enable inline editing
  const isAdmin = typeof window !== 'undefined' && window.location.hash === '#admin';

  const handleFieldEdit = (data: Partial<Project>) => {
    updateProjectInMemory(project.id, data);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleConfirmSave = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Safety check - prevent accidental data loss
    const confirmSave = window.confirm(`Push these changes to your GitHub repository? \n\nProject: ${project.title}`);
    if (!confirmSave) return;

    setSaveStatus('saving');
    try {
        await saveAllData(`Admin: Updated details for "${project.title}"`);
        setSaveStatus('saved');
        setHasChanges(false);
        toast.success("Changes pushed and live");
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e: any) {
        setSaveStatus('idle');
        toast.error(e.message || "Failed to push updates");
    }
  };

  const handleTogglePublish = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !project.published;
    
    const confirmVisibility = window.confirm(
        `Set "${project.title}" to ${newState ? 'PUBLIC' : 'DRAFT'}? This will update the live site.`
    );
    if (!confirmVisibility) return;

    updateProjectInMemory(project.id, { published: newState });
    
    try {
        setSaveStatus('saving');
        // Small delay to ensure state batching finishes
        setTimeout(async () => {
            try {
                await saveAllData(`${newState ? 'Publish' : 'Unpublish'}: ${project.title}`);
                setSaveStatus('idle');
                toast.success(newState ? "Project is now Live" : "Project hidden (Draft)");
            } catch (err: any) {
                setSaveStatus('idle');
                updateProjectInMemory(project.id, { published: !newState });
                toast.error("GitHub sync failed");
            }
        }, 100);
    } catch (err: any) {
        setSaveStatus('idle');
        updateProjectInMemory(project.id, { published: !newState });
    }
  };

  const handleDiscardChanges = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Discard all unsaved edits for this project?")) {
        await reloadContent();
        setHasChanges(false);
        toast.info("Changes reset to last saved state");
    }
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
        y: isAdmin ? 0 : -8,
        scale: isAdmin ? 1 : 1.015,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`group cursor-pointer flex flex-col border border-border bg-card hover:border-primary/40 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(255,255,255,0.05)] transition-all duration-500 ease-out relative ${!project.published && isAdmin ? 'opacity-70 bg-secondary/10' : ''}`}
      onClick={() => !isAdmin && onClick(project)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Admin Action Bar (Only shows when dirty) */}
      <AnimatePresence>
        {hasChanges && isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-x-0 top-0 z-[100] p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-orange-400 animate-pulse" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Unsaved Changes</span>
            </div>
            <div className="flex items-center gap-2">
               <button 
                  onClick={handleDiscardChanges}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[9px] font-bold uppercase tracking-widest transition-colors"
                >
                  Discard
               </button>
               <button 
                  onClick={() => handleConfirmSave()}
                  disabled={saveStatus === 'saving' || globalSaving}
                  className="px-4 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save to GitHub
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
          className={`w-full h-full object-cover grayscale transition-all duration-700 ease-out ${isAdmin ? 'grayscale-0' : 'group-hover:grayscale-0 group-hover:scale-105'}`}
        />
        
        {/* Admin Overlay Actions */}
        {isAdmin && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[1px] z-10">
                <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      const newUrl = prompt("Enter new thumbnail URL:", project.thumb);
                      if (newUrl) handleFieldEdit({ thumb: newUrl });
                  }}
                  className="bg-white text-black px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform"
                >
                    <Edit3 className="w-3 h-3" /> Change Cover
                </button>
            </div>
        )}

        {!isAdmin && (
            <div className="absolute top-4 right-4 bg-background/90 text-foreground p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowUpRight className="w-5 h-5" />
            </div>
        )}

        {isAdmin && (
            <div className={`absolute top-4 left-4 px-3 py-1 text-[10px] font-bold uppercase tracking-widest z-20 border ${project.published ? 'bg-green-500 text-white border-green-600' : 'bg-orange-500 text-white border-orange-600'}`}>
                {project.published ? 'Live' : 'Draft'}
            </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="space-y-1 w-full relative">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                    {project.client}
                </span>
                
                {isAdmin ? (
                  <div className="relative group/title">
                    <input
                        type="text"
                        value={project.title}
                        onChange={(e) => handleFieldEdit({ title: e.target.value })}
                        onKeyDown={handleTitleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: `${(project.titleSize || 10) * 0.4}rem` }}
                        className={`font-bold text-foreground leading-tight bg-neutral-50 dark:bg-neutral-900/50 border-b-2 border-transparent focus:border-primary p-2 -ml-2 w-full outline-none transition-all duration-300 ${hasChanges ? 'text-orange-500' : ''}`}
                        placeholder="Project Title"
                    />
                    <div className="absolute top-1 right-0 opacity-0 group-hover/title:opacity-40 transition-opacity">
                        <Type className="w-3 h-3" />
                    </div>
                    <AnimatePresence>
                        {saveStatus === 'saved' && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute -right-2 top-1/2 -translate-y-1/2 text-green-500"
                            >
                                <Check className="w-5 h-5" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.h3 
                    layoutId={`project-title-${project.id}`}
                    style={{ fontSize: `${(project.titleSize || 10) * 0.4}rem` }}
                    className="font-bold text-foreground leading-tight group-hover:text-primary transition-all duration-300"
                  >
                    {project.title}
                  </motion.h3>
                )}
            </div>
            <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-1 shrink-0 mt-2">
                {project.year}
            </span>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
            <div className="flex flex-wrap gap-2">
                {project.tags?.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase bg-secondary text-secondary-foreground px-2 py-1 font-bold">
                        {tag}
                    </span>
                ))}
            </div>

            {/* Admin Toggle Row */}
            {isAdmin && (
                <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={handleTogglePublish}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                            project.published 
                            ? 'bg-green-500 text-white border-green-600 shadow-sm' 
                            : 'bg-neutral-200 text-neutral-500 border-neutral-300'
                        }`}
                    >
                        {project.published ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 bg-neutral-400 rounded-full" />}
                        {project.published ? 'Live' : 'Hidden'}
                    </button>
                    
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          if (onClick) onClick(project);
                      }}
                      className="px-3 py-1.5 rounded-full bg-neutral-900 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
                    >
                        Detailed Editor
                    </button>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
