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
      className="group cursor-pointer flex flex-col gap-6"
      onClick={() => onClick(project)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative overflow-hidden rounded-lg aspect-[4/3] bg-neutral-100">
        <motion.img
          layoutId={`project-image-${project.id}`}
          src={project.thumb}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
        
        {/* Minimal Floating Badge */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ArrowUpRight className="w-5 h-5 text-neutral-900" />
             </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-baseline">
          <motion.h3 
            className="text-2xl font-bold text-neutral-900 tracking-tight"
          >
            {project.title}
          </motion.h3>
          <span className="text-sm text-neutral-400 font-mono">
            {project.year}
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>{project.client}</span>
          <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
          <span>{project.roles[0]}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;