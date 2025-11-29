import React from 'react';
import { useData } from '../contexts/DataContext';
import { Project } from '../types';
import ProjectCard from './ProjectCard';

interface WorkSectionProps {
  onProjectClick: (project: Project) => void;
}

const WorkSection: React.FC<WorkSectionProps> = ({ onProjectClick }) => {
  const { projects } = useData();
  const publishedProjects = projects.filter(p => p.published);

  return (
    <section id="work" className="py-24 border-t border-neutral-200">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        {/* Minimal Section Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-12 gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
            Selected Work
          </h2>
          <span className="text-sm text-neutral-400 font-medium hidden md:block">
            {publishedProjects.length} Projects
          </span>
        </div>

        {/* Optional: Keep the description but make it more subtle, or rely on the work to speak for itself. 
            Commented out to strictly follow the minimal aesthetic of the screenshot provided.
        <div className="mb-16 max-w-2xl">
           <p className="text-xl text-neutral-500 leading-relaxed">
              Crafting digital experiences that blend aesthetics with functionality.
           </p>
        </div>
        */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
          {publishedProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={onProjectClick} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkSection;