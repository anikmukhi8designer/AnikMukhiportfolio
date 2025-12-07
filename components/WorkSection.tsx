import React, { useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface WorkSectionProps {
  onProjectClick: (project: Project) => void;
}

const WorkSection: React.FC<WorkSectionProps> = ({ onProjectClick }) => {
  const { projects, lastUpdated } = useData();
  const publishedProjects = projects.filter(p => p.published);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
        // Reduced scroll amount for smaller cards (260px card + gap)
        const scrollAmount = direction === 'left' ? -300 : 300;
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="work" className="py-24 md:py-32 relative z-10 overflow-hidden bg-transparent transition-colors duration-500">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 mb-12 md:mb-16 flex items-end justify-between">
         <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Selected Work
            </h2>
         </div>
         
         {/* Desktop Navigation Controls */}
         <div className="hidden md:flex gap-4">
            <button 
                onClick={() => scroll('left')}
                className="p-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-white"
                aria-label="Scroll left"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
                onClick={() => scroll('right')}
                className="p-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-900 dark:text-white"
                aria-label="Scroll right"
            >
                <ArrowRight className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Horizontal Scroll Container - Aligned padding with header */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-6 md:gap-8 px-4 md:px-8 pb-12 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div key={lastUpdated?.getTime()} className="flex gap-6 md:gap-8">
          {publishedProjects.map((project) => (
            <div key={project.id} className="snap-start">
                <ProjectCard 
                  project={project} 
                  onClick={onProjectClick} 
                />
            </div>
          ))}
          
          {publishedProjects.length === 0 && (
             <div className="w-[45vw] sm:w-[220px] md:w-[260px] aspect-[4/5] flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400">
                <p className="text-xs">No projects.</p>
             </div>
          )}

          {/* Spacer for right padding in scroll view */}
          <div className="w-4 md:w-8 flex-shrink-0" />
        </div>
      </div>
    </section>
  );
};

export default WorkSection;