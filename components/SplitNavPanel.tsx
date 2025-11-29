import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Project, Experience } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface SplitNavPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectClick: (project: Project) => void;
}

const containerVariants = {
  hidden: { y: "-100%" },
  visible: { 
    y: "0%",
    transition: {
      duration: 0.6,
      ease: [0.76, 0, 0.24, 1],
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  },
  exit: {
    y: "-100%",
    transition: {
      duration: 0.5,
      ease: [0.76, 0, 0.24, 1],
      when: "afterChildren",
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const SplitNavPanel: React.FC<SplitNavPanelProps> = ({ isOpen, onClose, onProjectClick }) => {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const { projects, experience } = useData();

  // Filter for published content only
  const visibleProjects = projects.filter(p => p.published);
  const visibleExperience = experience.filter(e => e.published);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className="fixed inset-0 z-40 bg-neutral-900 text-white overflow-y-auto"
        >
          <div className="min-h-screen flex flex-col pt-24 pb-12 px-4 md:px-8 max-w-screen-xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 flex-grow">
              
              {/* Left Column: Work */}
              <div className="flex flex-col gap-8">
                <motion.h2 
                  variants={itemVariants}
                  className="text-sm font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-800 pb-4"
                >
                  Work
                </motion.h2>
                
                <ul className="flex flex-col gap-6">
                  {visibleProjects.map((project) => (
                    <motion.li 
                      key={project.id} 
                      variants={itemVariants}
                      onMouseEnter={() => setHoveredProject(project.id)}
                      onMouseLeave={() => setHoveredProject(null)}
                      className="relative"
                    >
                      <button
                        onClick={() => {
                          onProjectClick(project);
                          onClose();
                        }}
                        className={`text-3xl md:text-5xl font-bold tracking-tight text-left transition-colors duration-300 flex items-center gap-4 group w-full
                          ${hoveredProject && hoveredProject !== project.id ? 'text-neutral-700' : 'text-white'}
                        `}
                      >
                        {project.title}
                        <ArrowUpRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-neutral-400" />
                      </button>
                      <p className={`text-sm text-neutral-500 mt-1 transition-opacity duration-300 ${hoveredProject === project.id ? 'opacity-100' : 'opacity-0 hidden md:block'}`}>
                        {project.client} — {project.roles[0]}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Right Column: Experience */}
              <div className="flex flex-col gap-8">
                <motion.h2 
                  variants={itemVariants}
                  className="text-sm font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-800 pb-4"
                >
                  Experience
                </motion.h2>

                <ul className="flex flex-col gap-8">
                  {visibleExperience.map((exp) => (
                    <motion.li key={exp.id} variants={itemVariants} className="group">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                        <h3 className="text-xl md:text-2xl font-bold text-neutral-200 group-hover:text-white transition-colors">
                          {exp.company}
                        </h3>
                        <span className="text-sm font-mono text-neutral-500">{exp.period}</span>
                      </div>
                      <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">
                        {exp.role}
                      </p>
                    </motion.li>
                  ))}
                </ul>
                
                <motion.div variants={itemVariants} className="mt-auto pt-12">
                     <a href="mailto:hello@mukhianik.com" className="text-xl font-medium text-neutral-400 hover:text-white transition-colors">
                        hello@mukhianik.com
                     </a>
                </motion.div>
              </div>

            </div>
          </div>
          
          <div className="absolute inset-0 -z-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neutral-800/20 via-transparent to-transparent opacity-50" />
          
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplitNavPanel;
