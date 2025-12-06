import React from 'react';
import { motion } from 'framer-motion';
import { Github, ArrowUpRight } from 'lucide-react';
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
      className="group relative mb-6 py-12 px-8 md:px-12 cursor-pointer transition-all duration-500 rounded-[2rem] 
                 border border-white/30 dark:border-white/5 
                 bg-white/10 dark:bg-neutral-900/20 
                 backdrop-blur-md 
                 hover:bg-white/30 dark:hover:bg-neutral-800/40 
                 hover:backdrop-blur-xl 
                 hover:border-white/50 dark:hover:border-white/10 
                 hover:shadow-2xl hover:shadow-purple-500/10 dark:hover:shadow-black/20"
      onClick={() => onClick(project)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center md:items-baseline">
        {/* Title */}
        <div className="md:col-span-4 relative">
           <h3 className="text-3xl md:text-5xl font-medium tracking-tight text-neutral-900 dark:text-neutral-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.01] origin-left">
             {project.title}
           </h3>
        </div>

        {/* Client */}
        <div className="md:col-span-2">
           <span className="text-lg text-neutral-600 dark:text-neutral-400 transition-colors duration-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 font-medium">{project.client}</span>
        </div>

        {/* Services */}
        <div className="md:col-span-3 flex flex-wrap gap-2 mt-4 md:mt-0">
           {project.tags.slice(0, 3).map(tag => (
             <span key={tag} className="px-3 py-1 rounded-full border border-neutral-200/50 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 bg-white/40 dark:bg-white/5 transition-all duration-300 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:border-transparent group-hover:text-neutral-900 dark:group-hover:text-white">
                {tag}
             </span>
           ))}
        </div>

        {/* Actions / Links */}
        <div className="md:col-span-2 flex items-center md:justify-start gap-2 mt-4 md:mt-0">
            {project.link && (
                <a 
                    href={project.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors py-2 px-3 rounded-full border border-transparent hover:border-neutral-200 dark:hover:border-white/20 hover:bg-white/50 dark:hover:bg-white/10"
                    title="Visit Live Site"
                >
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="hidden lg:inline">Live</span>
                </a>
            )}
            
            {project.githubRepoUrl && (
                <a 
                    href={project.githubRepoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors py-2 px-3 rounded-full border border-transparent hover:border-neutral-200 dark:hover:border-white/20 hover:bg-white/50 dark:hover:bg-white/10"
                    title="View Source on GitHub"
                >
                    <Github className="w-4 h-4" />
                    <span className="hidden lg:inline">GitHub</span>
                </a>
            )}
        </div>

        {/* Year */}
        <div className="md:col-span-1 text-left md:text-right mt-2 md:mt-0">
            <span className="text-sm font-mono text-neutral-400 dark:text-neutral-600 transition-colors duration-300 group-hover:text-neutral-900 dark:group-hover:text-white">{project.year}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;