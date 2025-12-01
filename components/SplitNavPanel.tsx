import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Project, Experience } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface SplitNavPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectClick: (project: Project) => void;
}

const containerVariants: Variants = {
  hidden: { y: "-100%" },
  visible: { 
    y: "0%",
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1], // Custom smooth cubic-bezier
    }
  },
  exit: {
    y: "-100%",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const columnVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (custom) => ({
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: custom * 0.1,
      duration: 0.8,
      ease: "easeOut" 
    }
  })
};

const SplitNavPanel: React.FC<SplitNavPanelProps> = ({ isOpen, onClose, onProjectClick }) => {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const { projects, experience } = useData();

  const visibleProjects = projects.filter(p => p.published).slice(0, 6); // Limit to 6 for menu
  const visibleExperience = experience.filter(e => e.published).slice(0, 4);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className="fixed inset-0 z-40 bg-[#111] text-white overflow-hidden"
        >
          <div className="h-full w-full flex flex-col md:flex-row max-w-screen-xl mx-auto pt-24 pb-8 px-4 md:px-8">
            
            {/* Left Column: Work Index */}
            <motion.div 
              custom={1}
              variants={columnVariants}
              className="flex-1 flex flex-col md:border-r border-white/10 md:pr-12"
            >
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-8 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Selected Works
              </h2>
              
              <ul className="flex flex-col gap-2">
                {visibleProjects.map((project, i) => (
                  <motion.li 
                    key={project.id} 
                    onMouseEnter={() => setHoveredProject(project.id)}
                    onMouseLeave={() => setHoveredProject(null)}
                    className="relative group"
                  >
                    <button
                      onClick={() => {
                        onProjectClick(project);
                        onClose();
                      }}
                      className="w-full text-left py-2 border-b border-white/10 flex items-center justify-between group-hover:border-white transition-colors"
                    >
                      <span className={`text-3xl md:text-5xl font-medium tracking-tight transition-colors duration-300 ${
                        hoveredProject && hoveredProject !== project.id ? 'text-neutral-700' : 'text-white'
                      }`}>
                        {project.title}
                      </span>
                      <span className="text-xs text-neutral-500 uppercase tracking-widest group-hover:text-white transition-colors">
                        {project.year}
                      </span>
                    </button>
                  </motion.li>
                ))}
              </ul>
              
              <div className="mt-auto pt-8">
                <button onClick={onClose} className="text-sm text-neutral-400 hover:text-white transition-colors">
                    View All Projects ({projects.length})
                </button>
              </div>
            </motion.div>

            {/* Right Column: Info & Experience */}
            <motion.div 
              custom={2}
              variants={columnVariants}
              className="flex-1 flex flex-col md:pl-12 pt-12 md:pt-0"
            >
              <div className="mb-12">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-8">
                    Navigation
                  </h2>
                  <div className="flex flex-col gap-4 text-xl font-medium">
                      <a href="#work" onClick={onClose} className="hover:text-neutral-400 transition-colors">Work</a>
                      <a href="#experience" onClick={onClose} className="hover:text-neutral-400 transition-colors">Experience</a>
                      <a href="#contact" onClick={onClose} className="hover:text-neutral-400 transition-colors">Contact</a>
                  </div>
              </div>

              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6">
                  Latest Roles
                </h2>
                <div className="space-y-6">
                  {visibleExperience.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-baseline group cursor-default">
                      <div>
                        <h3 className="text-lg font-bold text-neutral-200 group-hover:text-white transition-colors">{exp.company}</h3>
                        <p className="text-sm text-neutral-500">{exp.role}</p>
                      </div>
                      <span className="text-xs text-neutral-600 font-mono">{exp.period}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-12">
                 <a href="mailto:hello@mukhianik.com" className="text-2xl md:text-3xl font-bold hover:text-neutral-400 transition-colors inline-flex items-center gap-2">
                    Let's Talk <ArrowUpRight className="w-6 h-6" />
                 </a>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplitNavPanel;