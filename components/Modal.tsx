import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, Github } from 'lucide-react';
import { Project } from '../types';
import ContentRenderer from './ContentRenderer';

interface ModalProps {
  project: Project | null;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ project, onClose }) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [project]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-white/90 dark:bg-black/90 backdrop-blur-xl"
          />
          <motion.div
            className="fixed inset-0 z-[70] overflow-y-auto"
          >
            <div className="min-h-screen w-full flex items-center justify-center p-0 md:p-6" onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}>
                <motion.div 
                    className="w-full max-w-6xl bg-white dark:bg-[#0a0a0a] md:rounded-[2rem] shadow-2xl overflow-hidden relative min-h-screen md:min-h-0"
                    initial={{ y: 50, opacity: 0, scale: 0.98 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                >
                    <button 
                        onClick={onClose}
                        className="fixed md:absolute top-6 right-6 z-20 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black backdrop-blur-md rounded-full transition-all group"
                    >
                        <X className="w-6 h-6 text-neutral-900 dark:text-white group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    {/* Hero Image */}
                    <div className="w-full h-[40vh] md:h-[60vh] relative overflow-hidden">
                         <motion.img
                            layoutId={`project-image-${project.id}`}
                            src={project.heroImage || project.thumb}
                            alt={project.title}
                            className="w-full h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                         
                         <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white">
                            <motion.h2 
                                layoutId={`project-title-${project.id}`}
                                className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight"
                            >
                                {project.title}
                            </motion.h2>
                            <p className="text-lg md:text-xl opacity-90 max-w-2xl font-medium text-neutral-200">
                                {project.roles.join(' • ')}
                            </p>
                         </div>
                    </div>

                    <div className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                           <div className="prose prose-lg dark:prose-invert max-w-none">
                               <p className="lead text-xl md:text-2xl text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                                   {project.description}
                               </p>
                           </div>

                           <div className="border-t border-neutral-100 dark:border-neutral-800 pt-12">
                               {/* If block content exists, render it. Otherwise fall back to images array */}
                               {project.content && project.content.length > 0 ? (
                                 <ContentRenderer blocks={project.content} />
                               ) : (
                                 <div className="space-y-8">
                                    {project.images && (
                                        <div className="grid grid-cols-1 gap-8">
                                            {project.images.map((img, idx) => (
                                                <img key={idx} src={img} alt="" className="w-full h-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
                                            ))}
                                        </div>
                                    )}
                                 </div>
                               )}
                           </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="p-8 bg-neutral-50 dark:bg-white/5 rounded-3xl space-y-8 sticky top-12">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">Client</h4>
                                    <p className="text-lg text-neutral-900 dark:text-white font-bold">{project.client}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2">Year</h4>
                                    <p className="text-lg text-neutral-900 dark:text-white font-bold">{project.year}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">Services</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1.5 bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/5 rounded-full text-xs font-bold text-neutral-700 dark:text-neutral-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 pt-4">
                                    {project.link && (
                                        <a 
                                            href={project.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
                                        >
                                            Visit Live Site <ArrowUpRight className="w-4 h-4" />
                                        </a>
                                    )}
                                    {project.githubRepoUrl && (
                                        <a 
                                            href={project.githubRepoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                        >
                                            View Source <Github className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;