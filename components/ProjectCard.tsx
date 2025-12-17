import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onMouseEnter, onMouseLeave }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group cursor-pointer flex flex-col border border-border bg-card hover:border-primary/50 transition-colors"
      onClick={() => onClick(project)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Image Container - Aspect Ratio preserved but sharp corners */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted border-b border-border">
        <motion.img
          layoutId={`project-image-${project.id}`}
          src={project.thumb}
          alt={project.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out"
        />
        
        {/* Overlay Icon */}
        <div className="absolute top-4 right-4 bg-background/90 text-foreground p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>

      {/* Content - Technical Layout */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                    {project.client}
                </span>
                <motion.h3 
                  layoutId={`project-title-${project.id}`}
                  className="text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors"
                >
                  {project.title}
                </motion.h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground border border-border px-2 py-1">
                {project.year}
            </span>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-auto">
            {project.tags?.slice(0, 3).map((tag, i) => (
                <span key={i} className="text-[10px] uppercase bg-secondary text-secondary-foreground px-2 py-1">
                    {tag}
                </span>
            ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;