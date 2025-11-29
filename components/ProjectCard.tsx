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
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-lg aspect-[4/3] bg-neutral-200">
        <motion.img
          layoutId={`project-image-${project.id}`}
          src={project.thumb}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        
        {/* Mobile/Hover Badge */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm">
            <ArrowUpRight className="w-5 h-5 text-neutral-900" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <motion.h3 
            className="text-xl font-medium text-neutral-900 group-hover:text-neutral-600 transition-colors"
          >
            {project.title}
          </motion.h3>
          <span className="text-sm text-neutral-400 font-medium tabular-nums">
            {project.year}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-500">
          <span>{project.client}</span>
          <span className="text-neutral-300">•</span>
          <span>{project.roles.join(', ')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
