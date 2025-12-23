
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Project } from '../types';
import ProjectCard from './ProjectCard';

interface WorkSectionProps {
  onProjectClick: (project: Project) => void;
}

const WorkSection: React.FC<WorkSectionProps> = ({ onProjectClick }) => {
  const { projects } = useData();
  
  // Check if we are in admin mode to show unpublished work
  const isAdmin = typeof window !== 'undefined' && window.location.hash === '#admin';
  
  // Show all projects in admin, otherwise only published
  const displayProjects = isAdmin ? projects : projects.filter(p => p.published);
  
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  return (
    <section id="work" className="py-24 border-t border-border bg-background relative z-10">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
        
        {/* Header - Brutalist Style */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4 pb-8 border-b border-border">
           <div>
             <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground mb-2">
               {isAdmin ? 'Project Manager' : 'Selected Work'}
             </h2>
             <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest">
               {isAdmin ? '/ Content Repository' : '/ Case Studies & Experiments'}
             </p>
           </div>
           
           <div className="text-right hidden md:block">
             <span className="text-lg font-bold text-primary block">
               {String(displayProjects.length).padStart(2, '0')}
             </span>
             <span className="text-[10px] uppercase text-muted-foreground tracking-widest">
               Total items
             </span>
           </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
          {displayProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={onProjectClick} 
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            />
          ))}
        </div>

        {displayProjects.length === 0 && (
            <div className="py-24 text-center text-muted-foreground font-mono">
                [ No projects found ]
            </div>
        )}
      </div>
    </section>
  );
};

export default WorkSection;
