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
      className="group relative border-b border-neutral-200 py-10 cursor-pointer transition-colors hover:bg-neutral-50/50"
      onClick={() => onClick(project)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Title */}
        <div className="md:col-span-5">
           <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-neutral-900 group-hover:translate-x-2 transition-transform duration-300">
             {project.title}
           </h3>
        </div>

        {/* Client */}
        <div className="md:col-span-3">
           <span className="text-base md:text-lg text-neutral-500">{project.client}</span>
        </div>

        {/* Services */}
        <div className="md:col-span-3 flex flex-wrap gap-2 mt-2 md:mt-0">
           {project.tags.slice(0, 3).map(tag => (
             <span key={tag} className="px-3 py-1 rounded-full border border-neutral-200 text-xs font-medium text-neutral-600 bg-white">
                {tag}
             </span>
           ))}
        </div>

        {/* Year */}
        <div className="md:col-span-1 text-left md:text-right mt-2 md:mt-0">
            <span className="text-sm font-mono text-neutral-400">{project.year}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;