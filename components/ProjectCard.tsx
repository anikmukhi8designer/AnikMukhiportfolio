import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onMouseEnter, onMouseLeave }) => {
  return (
    <motion.div
      layoutId={`project-card-${project.id}`}
      className="group relative flex-shrink-0 w-[45vw] sm:w-[220px] md:w-[260px] cursor-pointer"
      onClick={() => onClick(project)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900 shadow-sm">
        <img
          src={project.thumb || project.heroImage}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Overlay / Dimmer */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

        {/* Hover Action Icon */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
             <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white border border-white/20">
                <ArrowUpRight className="w-4 h-4" />
             </div>
        </div>
      </div>

      {/* Info Below Card */}
      <div className="mt-3 flex flex-col px-1 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
         <div className="flex justify-between items-baseline mb-0.5">
            <span className="text-base font-medium text-neutral-900 dark:text-white tracking-tight truncate pr-2">
                {project.client}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-600 flex-shrink-0">
                {project.year}
            </span>
         </div>
         <span className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {project.description}
         </span>
         <div className="mt-2.5 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-1.5 py-0.5 rounded-md">
                    {tag}
                </span>
            ))}
         </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;