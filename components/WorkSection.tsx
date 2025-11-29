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
    <section id="work" className="py-24">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 mb-6">
              Selected Work
            </h2>
            <p className="text-xl text-neutral-500 max-w-lg leading-relaxed">
              Crafting digital experiences that blend aesthetics with functionality. 
              Focused on product design, design systems, and Webflow development.
            </p>
          </div>
          <div className="hidden md:block pb-2">
            <span className="text-sm font-medium text-neutral-400">
              {publishedProjects.length} Projects Available
            </span>
          </div>
        </div>

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
