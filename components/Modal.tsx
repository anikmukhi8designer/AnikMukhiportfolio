import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { X, ArrowUpRight, Github, ArrowRight } from 'lucide-react';
import { Project } from '../types';
import ContentRenderer from './ContentRenderer';
import { useData } from '../contexts/DataContext';

interface ModalProps {
  project: Project | null;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ project, onClose }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { projects } = useData();

  // Find related projects (excluding current)
  const relatedProjects = projects
    .filter(p => p.id !== project?.id && p.published)
    .slice(0, 2);

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

  if (!project) return null;

  return (
    <AnimatePresence mode="wait">
      {project && (
        <motion.div
          key="modal-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-white dark:bg-[#050505] overflow-y-auto overflow-x-hidden"
          ref={scrollContainerRef}
        >
            {/* Sticky Navigation / Header */}
            <div className="fixed top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-start z-[60] pointer-events-none mix-blend-difference text-white">
                <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="hidden md:flex flex-col"
                >
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Currently Viewing</span>
                    <span className="text-sm font-bold tracking-wide">{project.title}</span>
                </motion.div>

                <button 
                    onClick={onClose}
                    className="group pointer-events-auto flex items-center gap-3"
                >
                    <span className="hidden md:block text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">Close</span>
                    <div className="p-3 bg-white text-black rounded-full hover:scale-110 active:scale-90 transition-transform duration-300">
                        <X className="w-6 h-6" />
                    </div>
                </button>
            </div>

            {/* Immersive Hero Section */}
            <header className="relative w-full h-[85vh] md:h-screen overflow-hidden">
                <motion.div 
                    className="absolute inset-0"
                    layoutId={`project-image-${project.id}`}
                >
                    <img
                        src={project.heroImage}
                        alt={project.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                </motion.div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 pb-12 md:pb-24 max-w-[90vw]">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Subtitle / Tags */}
                        <div className="flex flex-wrap gap-4 mb-6 md:mb-8">
                            {project.tags.map((tag, i) => (
                                <span key={i} className="px-4 py-1.5 rounded-full border border-white/20 text-white/90 text-xs md:text-sm font-medium uppercase tracking-widest backdrop-blur-md bg-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Huge Title */}
                        <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold text-white tracking-tighter leading-[0.9] mb-6 md:mb-8">
                            {project.title}
                        </h1>

                        {/* One-liner */}
                        <p className="text-lg md:text-2xl text-white/80 max-w-3xl leading-relaxed font-light">
                            {project.description}
                        </p>
                    </motion.div>
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="relative bg-white dark:bg-[#050505] min-h-screen z-10">
                <div className="max-w-screen-2xl mx-auto">
                    
                    {/* Intro & Metadata Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 px-6 md:px-12 py-24 border-b border-neutral-100 dark:border-neutral-900">
                        {/* Left: Metadata Sidebar (Sticky) */}
                        <div className="lg:col-span-3 lg:sticky lg:top-32 h-fit space-y-12">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Client</h4>
                                <p className="text-lg font-medium text-neutral-900 dark:text-white">{project.client}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Year</h4>
                                <p className="text-lg font-medium text-neutral-900 dark:text-white">{project.year}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Role</h4>
                                <div className="flex flex-col gap-1">
                                    {project.roles.map(role => (
                                        <span key={role} className="text-base text-neutral-700 dark:text-neutral-300">{role}</span>
                                    ))}
                                </div>
                            </div>
                            
                            {(project.link || project.githubRepoUrl) && (
                                <div className="pt-8 space-y-4">
                                    {project.link && (
                                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-neutral-500 transition-colors">
                                            Visit Live Site <ArrowUpRight className="w-4 h-4" />
                                        </a>
                                    )}
                                    {project.githubRepoUrl && (
                                        <a href={project.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-neutral-500 transition-colors">
                                            View Source <Github className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: Main Story Content */}
                        <div className="lg:col-span-8 lg:col-start-5">
                            {/* Intro Text */}
                            <div className="mb-24">
                                <h2 className="text-3xl md:text-5xl font-medium text-neutral-900 dark:text-white leading-tight mb-8">
                                    {project.description}
                                </h2>
                                <div className="w-24 h-1 bg-neutral-900 dark:bg-white"></div>
                            </div>

                            {/* Rendered Content Blocks */}
                            <ContentRenderer blocks={project.content} />
                        </div>
                    </div>

                    {/* Gallery / Full Width Images */}
                    {project.images && project.images.length > 0 && (
                        <div className="py-12 md:py-24 space-y-12 md:space-y-24">
                            {project.images.map((img, idx) => (
                                <div key={idx} className="w-full px-4 md:px-12">
                                    <img 
                                        src={img} 
                                        alt={`Gallery ${idx + 1}`} 
                                        className="w-full h-auto rounded-none md:rounded-3xl shadow-2xl"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Related Work Footer */}
                    <div className="py-32 px-6 md:px-12 bg-neutral-50 dark:bg-neutral-900/30">
                        <div className="max-w-screen-xl mx-auto">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-12">Next Project</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {relatedProjects.map(p => (
                                    <div 
                                        key={p.id} 
                                        className="group cursor-pointer"
                                        onClick={() => {
                                            onClose(); // Close current
                                            setTimeout(() => {
                                                // This is a bit of a hack since we don't have a direct "switch" prop here, 
                                                // but usually you'd pass a handler. For now, we rely on the parent updating or just closing.
                                                // Ideally, the parent component handles this "Next" logic.
                                            }, 300);
                                        }}
                                    >
                                        <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-neutral-200 dark:bg-neutral-800">
                                            <img 
                                                src={p.thumb} 
                                                alt={p.title} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        </div>
                                        <h4 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 group-hover:underline decoration-1 underline-offset-4">
                                            {p.title}
                                        </h4>
                                        <p className="text-neutral-500">{p.client}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact CTA */}
                    <div className="py-24 md:py-32 px-6 md:px-12 text-center bg-white dark:bg-[#050505] border-t border-neutral-100 dark:border-neutral-900">
                        <h2 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-8 tracking-tight">
                            Start a project like this.
                        </h2>
                        <a 
                            href="mailto:hello@mukhianik.com" 
                            className="inline-flex items-center gap-3 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full text-lg font-bold hover:scale-105 transition-transform"
                        >
                            Get in Touch <ArrowRight className="w-5 h-5" />
                        </a>
                    </div>

                </div>
            </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
