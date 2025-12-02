import React from 'react';
import { useData } from '../contexts/DataContext';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import { ArrowRight } from 'lucide-react';

interface WorkSectionProps {
  onProjectClick: (project: Project) => void;
}

const WorkSection: React.FC<WorkSectionProps> = ({ onProjectClick }) => {
  const { projects } = useData();
  const publishedProjects = projects.filter(p => p.published);

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

        {/* Responsive Grid View (1 Col Mobile, 2 Col Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
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