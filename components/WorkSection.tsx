import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

interface WorkSectionProps {
  onProjectClick: (project: Project) => void;
}

const WorkSection: React.FC<WorkSectionProps> = ({ onProjectClick }) => {
  const { projects } = useData();
  const publishedProjects = projects.filter(p => p.published);
  
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  
  // Mouse tracking for floating image
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section id="work" className="py-32 relative z-10">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Main Header */}
        <div className="flex items-end justify-between mb-24">
           <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-600">
             Our Work
           </h2>
           <span className="text-sm text-neutral-600">
             {publishedProjects.length} Projects
           </span>
        </div>

        {/* Table Header (Desktop Only) */}
        <div className="hidden md:grid grid-cols-12 gap-6 pb-6 px-6 md:px-10 border-b border-neutral-200 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">
           <div className="col-span-5">Project</div>
           <div className="col-span-3">Client</div>
           <div className="col-span-3">Services</div>
           <div className="col-span-1 text-right">Year</div>
        </div>

        {/* Projects List */}
        <div>
          {publishedProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onClick={onProjectClick} 
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            />
          ))}
        </div>
      </div>

      {/* Floating Image Preview */}
      <AnimatePresence>
        {hoveredProject && (
           <motion.div
             initial={{ opacity: 0, scale: 0.9, y: 10 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9, y: 10 }}
             transition={{ type: "spring", stiffness: 400, damping: 25 }}
             style={{ 
               position: 'fixed', 
               left: springX, 
               top: springY,
               x: 20, 
               y: 20,
               zIndex: 60,
               pointerEvents: 'none'
             }}
             className="hidden md:block w-[450px] aspect-video rounded-xl overflow-hidden shadow-2xl shadow-neutral-900/10 bg-white border border-neutral-100 isolate"
           >
             <motion.img 
               src={projects.find(p => p.id === hoveredProject)?.thumb} 
               alt="" 
               className="w-full h-full object-cover"
               initial={{ scale: 1.1 }}
               animate={{ scale: 1 }}
               transition={{ duration: 0.4 }}
             />
             <div className="absolute inset-0 bg-neutral-900/5 mix-blend-multiply" />
           </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default WorkSection;