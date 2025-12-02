import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <motion.div
      layoutId={`project-card-${project.id}`}
      className="group cursor-pointer flex flex-col gap-4"
      onClick={() => onClick(project)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-md aspect-[4/3] bg-neutral-100">
        <motion.img
          layoutId={`project-image-${project.id}`}
          src={project.thumb}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Subtle Overlay on Hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
        
        {/* Floating Action Button - Appears on hover */}
        <div className="absolute bottom-4 right-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                <ArrowUpRight className="w-5 h-5 text-neutral-900" />
             </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <motion.h3 
            className="text-xl md:text-2xl font-semibold text-neutral-900 leading-tight group-hover:text-neutral-600 transition-colors"
          >
            {project.title}
          </motion.h3>
          <span className="text-xs font-mono text-neutral-400 mt-1.5">
            {project.year}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="font-medium">{project.client}</span>
          <span className="text-neutral-300">•</span>
          <span>{project.roles[0]}</span>
        </div>
        
        {/* Tags - Optional, show on desktop or if needed */}
        <div className="flex flex-wrap gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex">
             {project.tags.slice(0, 2).map(tag => (
                 <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 bg-neutral-100 rounded text-neutral-500">
                     {tag}
                 </span>
             ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;