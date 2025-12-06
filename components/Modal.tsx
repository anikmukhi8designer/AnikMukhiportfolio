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
            className="fixed inset-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md"
          />
          <motion.div
            layoutId={`project-card-${project.id}`}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8" onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}>
                <motion.div 
                    className="w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden relative"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 z-10 p-2 bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black backdrop-blur-md rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-neutral-900 dark:text-white" />
                    </button>

                    <div className="w-full h-[50vh] sm:h-[60vh] relative">
                         <motion.img
                            layoutId={`project-image-${project.id}`}
                            src={project.heroImage}
                            alt={project.title}
                            className="w-full h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                         <div className="absolute bottom-0 left-0 p-8 sm:p-12 text-white">
                            <h2 className="text-4xl sm:text-5xl font-bold mb-4">{project.title}</h2>
                            <p className="text-lg opacity-90">{project.roles.join(' • ')}</p>
                         </div>
                    </div>

                    <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                           {/* If block content exists, render it. Otherwise fall back to description + images array */}
                           {project.content && project.content.length > 0 ? (
                             <ContentRenderer blocks={project.content} />
                           ) : (
                             <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-white">About the project</h3>
                                    <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                        {project.description}
                                    </p>
                                </div>
                                {project.images && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                        {project.images.map((img, idx) => (
                                            <img key={idx} src={img} alt="" className="w-full h-64 object-cover rounded-lg bg-neutral-100 dark:bg-neutral-800" />
                                        ))}
                                    </div>
                                )}
                             </div>
                           )}
                        </div>

                        <div className="lg:col-span-1 space-y-8">
                            <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">Client</h4>
                                    <p className="text-neutral-900 dark:text-white font-medium">{project.client}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">Year</h4>
                                    <p className="text-neutral-900 dark:text-white font-medium">{project.year}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">Services</h4>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {project.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 pt-2">
                                    {project.link && (
                                        <a 
                                            href={project.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-white hover:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
                                        >
                                            Visit Live Site <ArrowUpRight className="w-4 h-4" />
                                        </a>
                                    )}
                                    {project.githubRepoUrl && (
                                        <a 
                                            href={project.githubRepoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-white hover:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
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