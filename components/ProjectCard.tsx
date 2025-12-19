
import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { ArrowUpRight, Type, Image as ImageIcon, Edit3 } from 'lucide-react';
import { getOptimizedSrc, getOptimizedSrcSet } from '../utils/imageOptimizer';
import { useData } from '../contexts/DataContext';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onMouseEnter, onMouseLeave }) => {
  const { updateProjectInMemory } = useData();

  // Check if we are in admin mode to show the control
  const isAdmin = typeof window !== 'undefined' && window.location.hash === '#admin';

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
      className="group cursor-pointer flex flex-col border border-border bg-card hover:border-primary/40 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(255,255,255,0.05)] transition-all duration-500 ease-out"
      onClick={() => onClick(project)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
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
                  if (newUrl) updateProjectInMemory(project.id, { thumb: newUrl });
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
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="space-y-1 w-full">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                    {project.client}
                </span>
                <motion.h3 
                  layoutId={`project-title-${project.id}`}
                  style={{ fontSize: `${project.titleSize || 40}px` }}
                  className="font-bold text-foreground leading-tight group-hover:text-primary transition-all duration-300"
                >
                  {project.title}
                </motion.h3>
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
                <div className="flex flex-wrap items-center gap-2">
                    {/* Thumbnail URL Control */}
                    <div 
                      className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                        <ImageIcon className="w-3 h-3 text-muted-foreground" />
                        <input 
                          type="text"
                          value={project.thumb}
                          onChange={(e) => updateProjectInMemory(project.id, { thumb: e.target.value })}
                          placeholder="Image URL..."
                          className="w-24 md:w-32 bg-transparent border-none p-0 text-[10px] focus:ring-0 text-muted-foreground truncate font-mono"
                        />
                    </div>

                    {/* Font Size Control */}
                    <div 
                      className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                        <Type className="w-3 h-3 text-muted-foreground" />
                        <input 
                          type="range"
                          min="10"
                          max="60"
                          step="1"
                          value={project.titleSize || 40}
                          onChange={(e) => updateProjectInMemory(project.id, { titleSize: parseInt(e.target.value) })}
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
