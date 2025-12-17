import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { X, ArrowUpRight, Github, ArrowLeft } from 'lucide-react';
import { Project } from '../types';
import ContentRenderer from './ContentRenderer';
import { getOptimizedSrc, getOptimizedSrcSet } from '../utils/imageOptimizer';
import { useData } from '../contexts/DataContext';
import ProjectCard from './ProjectCard';

interface ModalProps {
  project: Project | null;
  onClose: () => void;
  onProjectClick: (project: Project) => void;
}

const Modal: React.FC<ModalProps> = ({ project, onClose, onProjectClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const { projects, config, socials } = useData();
  
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
  
  // Filter other projects for the footer suggestions
  const otherProjects = projects
    .filter(p => p.id !== project.id && p.published)
    .slice(0, 2);

  return (
    <AnimatePresence mode="wait">
      {project && (
        <motion.div
          key={project.id}
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
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Home</span>
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

                {/* More Projects & Footer */}
                <div className="bg-background border-t border-border mt-0 relative z-20">
                    <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-24">
                        <div className="flex justify-between items-end mb-12">
                            <h3 className="text-4xl md:text-5xl font-bold tracking-tighter">More Projects</h3>
                            <button onClick={onClose} className="hidden md:block text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                                Back to All
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {otherProjects.map(p => (
                                <ProjectCard 
                                    key={p.id} 
                                    project={p} 
                                    onClick={(p) => {
                                        if (containerRef.current) containerRef.current.scrollTop = 0;
                                        onProjectClick(p);
                                    }} 
                                />
                            ))}
                        </div>
                    </div>
                    
                    {/* Standard Footer */}
                    <footer className="py-24 border-t border-border bg-background">
                        <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
                            <div>
                                <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tighter">
                                Let's build<br/>something great.
                                </h2>
                                <a href={`mailto:${config.email}`} className="text-2xl md:text-3xl text-primary hover:text-foreground transition-colors underline decoration-2 underline-offset-8 decoration-border hover:decoration-primary">
                                {config.email}
                                </a>
                            </div>
                            <div className="flex flex-col justify-end items-start md:items-end gap-6">
                                {socials.map((social, index) => (
                                <a 
                                    key={`${social.platform}-${index}`} 
                                    href={social.url} 
                                    className="text-lg text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-bold" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                >
                                    {social.platform}
                                </a>
                                ))}
                            </div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-widest text-muted-foreground border-t border-border pt-8">
                            <p>&copy; {new Date().getFullYear()} Mukhi Anik. All rights reserved.</p>
                            <p>Designed with New Genre Principles.</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;