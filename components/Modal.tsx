import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { X, ArrowUpRight, Github, ArrowLeft } from 'lucide-react';
import { Project } from '../types';
import ContentRenderer from './ContentRenderer';
import { getOptimizedSrc, getOptimizedSrcSet } from '../utils/imageOptimizer';

interface ModalProps {
  project: Project | null;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ project, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  
  // Parallax effects
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);
  const textY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

  // Lock body scroll
  useEffect(() => {
    if (project) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [project]);

  // Handle escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!project) return null;

  const heroImgSrc = project.heroImage || project.thumb;

  return (
    <AnimatePresence mode="wait">
      {project && (
        <motion.div
          key="modal-container"
          className="fixed inset-0 z-[60] bg-background text-foreground overflow-y-auto overflow-x-hidden"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          ref={containerRef}
        >
            {/* Floating Navigation Bar */}
            <div className="fixed top-0 left-0 right-0 z-[70] p-6 flex justify-between items-start pointer-events-none">
                <button 
                    onClick={onClose}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-md border border-border rounded-full hover:bg-foreground hover:text-background transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Work</span>
                </button>

                <button 
                    onClick={onClose}
                    className="pointer-events-auto p-2 bg-background/50 backdrop-blur-md border border-border rounded-full hover:bg-red-500 hover:border-red-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Hero Section */}
            <div className="relative w-full h-[85vh] overflow-hidden">
                <motion.div 
                    className="absolute inset-0 w-full h-full"
                    style={{ scale: heroScale, opacity: heroOpacity }}
                >
                    <img
                        src={getOptimizedSrc(heroImgSrc, 1600)}
                        srcSet={getOptimizedSrcSet(heroImgSrc)}
                        sizes="100vw"
                        alt={project.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                </motion.div>

                <motion.div 
                    className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-24"
                    style={{ y: textY }}
                >
                    <div className="max-w-screen-2xl mx-auto">
                        <motion.h1 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-5xl md:text-7xl lg:text-[9rem] font-bold text-white tracking-tighter leading-[0.9] mb-6"
                        >
                            {project.title}
                        </motion.h1>
                        
                        <div className="flex flex-wrap gap-3">
                            {project.tags.map((tag, i) => (
                                <motion.span 
                                    key={tag}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="px-4 py-1.5 border border-white/30 text-white rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
                                >
                                    {tag}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Content Container */}
            <div className="bg-background relative z-10 min-h-screen">
                
                {/* Project Metadata Grid */}
                <div className="border-b border-border">
                    <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
                        <div className="p-8 md:p-12">
                            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Client</span>
                            <span className="text-xl md:text-2xl font-medium">{project.client}</span>
                        </div>
                        <div className="p-8 md:p-12">
                            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Year</span>
                            <span className="text-xl md:text-2xl font-medium font-mono">{project.year}</span>
                        </div>
                        <div className="p-8 md:p-12">
                            <span className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Services</span>
                            <div className="flex flex-col gap-1">
                                {project.roles.map(role => (
                                    <span key={role} className="text-sm font-medium">{role}</span>
                                ))}
                            </div>
                        </div>
                        <div className="p-8 md:p-12 flex flex-col justify-center gap-4 bg-secondary/20">
                            {project.link && (
                                <a href={project.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">
                                    Live Site <ArrowUpRight className="w-4 h-4" />
                                </a>
                            )}
                            {project.githubRepoUrl && (
                                <a href={project.githubRepoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-primary transition-colors">
                                    Source Code <Github className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-screen-2xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        
                        {/* Left Spacer / Sticky Title (Optional) */}
                        <div className="hidden lg:block lg:col-span-2 border-r border-border p-12">
                            <div className="sticky top-24">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground vertical-text rotate-180 writing-mode-vertical">
                                    Case Study
                                </span>
                            </div>
                        </div>

                        {/* Content Feed */}
                        <div className="lg:col-span-10">
                            {/* Intro Text */}
                            <div className="p-8 md:p-24 border-b border-border">
                                <h3 className="text-3xl md:text-5xl font-bold leading-tight max-w-4xl mb-12">
                                    {project.description}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="prose prose-lg dark:prose-invert">
                                        <p className="text-muted-foreground">
                                            We approached this project with a focus on usability and brand consistency. By analyzing the core user flows, we identified key friction points and resolved them through a streamlined interface design.
                                        </p>
                                    </div>
                                    <div className="prose prose-lg dark:prose-invert">
                                        <p className="text-muted-foreground">
                                            The result is a digital experience that not only looks premium but performs exceptionally well across all devices, increasing user engagement metrics significantly.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Blocks */}
                            <div className="p-0">
                                {project.content && project.content.length > 0 ? (
                                    <ContentRenderer blocks={project.content} />
                                ) : (
                                    <div className="p-8 md:p-24 space-y-24">
                                        {project.images?.map((img, idx) => (
                                            <div key={idx} className="relative group overflow-hidden">
                                                <img 
                                                    src={getOptimizedSrc(img, 1400)}
                                                    srcSet={getOptimizedSrcSet(img)}
                                                    sizes="(max-width: 768px) 100vw, 80vw"
                                                    loading="lazy"
                                                    alt={`Gallery ${idx}`}
                                                    className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Next Project */}
                <div className="bg-foreground text-background py-32 px-6 text-center cursor-pointer hover:bg-neutral-900 transition-colors" onClick={onClose}>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4 block">Next Project</span>
                    <h2 className="text-5xl md:text-8xl font-bold tracking-tighter">
                        Keep Exploring
                    </h2>
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;