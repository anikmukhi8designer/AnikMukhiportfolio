import React from 'react';
import { motion } from 'framer-motion';
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
      className="group relative border-b border-neutral-200 py-12 cursor-pointer transition-colors hover:border-neutral-400"
      onClick={() => onClick(project)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
        {/* Title */}
        <div className="md:col-span-5 relative">
           <h3 className="text-3xl md:text-4xl font-medium tracking-tight text-neutral-900 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02] group-hover:translate-x-2 origin-left">
             {project.title}
           </h3>
        </div>

        {/* Client */}
        <div className="md:col-span-3">
           <span className="text-lg text-neutral-500 transition-colors duration-300 group-hover:text-neutral-900">{project.client}</span>
        </div>

        {/* Services */}
        <div className="md:col-span-3 flex flex-wrap gap-2 mt-4 md:mt-0">
           {project.tags.slice(0, 3).map(tag => (
             <span key={tag} className="px-3 py-1 rounded-full border border-neutral-200 text-xs font-medium text-neutral-500 bg-white transition-all duration-300 group-hover:bg-neutral-100 group-hover:border-neutral-300 group-hover:text-neutral-900">
                {tag}
             </span>
           ))}
        </div>

        {/* Year */}
        <div className="md:col-span-1 text-left md:text-right mt-2 md:mt-0">
            <span className="text-sm font-mono text-neutral-400 transition-colors duration-300 group-hover:text-neutral-900">{project.year}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;