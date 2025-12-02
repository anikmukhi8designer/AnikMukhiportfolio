import React, { useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface WorkSectionProps {
  onProjectClick: (project: Project) => void;
}

const WorkSection: React.FC<WorkSectionProps> = ({ onProjectClick }) => {
  const { projects } = useData();
  const publishedProjects = projects.filter(p => p.published);
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <section id="work" className="py-24 border-t border-neutral-200 bg-transparent relative z-10">
      
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-16 gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
            Our Work
          </h2>
          <span className="text-sm text-neutral-400 font-medium hidden md:block">
            {publishedProjects.length} Projects
          </span>
        </div>

        {/* Desktop List View */}
        <div className="hidden md:flex flex-col" ref={listRef}>
          <div className="grid grid-cols-12 gap-4 pb-4 border-b border-neutral-200 text-xs font-bold uppercase text-neutral-400 tracking-wider">
            <div className="col-span-5">Project</div>
            <div className="col-span-4">Client</div>
            <div className="col-span-2">Services</div>
            <div className="col-span-1 text-right">Year</div>
          </div>

          {publishedProjects.map((project) => (
            <motion.div
              key={project.id}
              layoutId={`project-row-${project.id}`}
              onClick={() => onProjectClick(project)}
              className="group grid grid-cols-12 gap-4 py-8 border-b border-neutral-200 cursor-pointer items-center transition-colors hover:bg-white/40"
            >
              <div className="col-span-5">
                <h3 className="text-3xl font-medium text-neutral-900 group-hover:translate-x-2 transition-transform duration-300">
                  {project.title}
                </h3>
              </div>
              <div className="col-span-4 text-neutral-500 font-medium text-lg">
                {project.client}
              </div>
              <div className="col-span-2 flex flex-wrap gap-2">
                 {project.roles.slice(0, 2).map((role, i) => (
                   <span key={i} className="text-sm text-neutral-500 border border-neutral-200 rounded-full px-2 py-1">
                     {role}
                   </span>
                 ))}
              </div>
              <div className="col-span-1 text-right text-neutral-400 group-hover:text-neutral-900 transition-colors">
                {project.year}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Grid View (Fallback) */}
        <div className="grid grid-cols-1 gap-12 md:hidden">
          {publishedProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={onProjectClick} 
            />
          ))}
        </div>

        <div className="mt-16 flex justify-center md:justify-start">
           <a href="#contact" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-500 transition-colors">
              Start a project <ArrowRight className="w-4 h-4" />
           </a>
        </div>
      </div>
    </section>
  );
};

export default WorkSection;