import React from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'framer-motion';
import { SkillIcon } from './SkillIcons';
import { SkillItem } from '../types';

// Provided Brandfetch Public Key
const BRANDFETCH_KEY = "xcgD6C-HsoohCTMkqg3DR0i9wYmaqUB2nVktAG16TWiSgYr32T7dDkfOVBVc-DXgPyODc3hx2IgCr0Y3urqLrA";

// Map Skill Names to Domains for Brandfetch API
const DOMAIN_MAP: Record<string, string> = {
    "Figma": "figma.com",
    "Adobe": "adobe.com",
    "Sketch": "sketch.com",
    "Framer": "framer.com",
    "Webflow": "webflow.com",
    "Spline": "spline.design",
    "React": "react.dev",
    "TypeScript": "typescriptlang.org",
    "Tailwind": "tailwindcss.com",
    "Next.js": "nextjs.org",
    "Vite": "vitejs.dev",
    "Node.js": "nodejs.org",
    "Linear": "linear.app",
    "Notion": "notion.so",
    "VS Code": "visualstudio.com",
    "Raycast": "raycast.com",
    "Arc": "arc.net",
    "GitHub": "github.com",
    "Python": "python.org",
    "Git": "git-scm.com"
};

interface SkillCardProps {
    item: SkillItem;
    index: number;
}

const SkillCard: React.FC<SkillCardProps> = ({ item, index }) => {
    // 1. Resolve effective image URL
    let imageUrl = item.image;
    const domain = DOMAIN_MAP[item.name];

    if (domain) {
         imageUrl = `https://cdn.brandfetch.io/${domain}/w/200/h/200?c=${BRANDFETCH_KEY}`;
    } 
    else if (imageUrl && imageUrl.includes('brandfetch.io') && !imageUrl.includes('c=')) {
         const separator = imageUrl.includes('?') ? '&' : '?';
         imageUrl = `${imageUrl}${separator}c=${BRANDFETCH_KEY}`;
    }
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
            className="group relative flex flex-col items-center justify-center p-6 
                       bg-white/60 dark:bg-white/5 
                       backdrop-blur-xl border border-neutral-200 dark:border-white/5
                       rounded-3xl
                       hover:bg-white dark:hover:bg-white/10 
                       hover:border-neutral-300 dark:hover:border-white/20
                       hover:shadow-2xl dark:hover:shadow-purple-500/10 
                       transition-all duration-500 ease-out aspect-square cursor-default overflow-hidden"
        >
            {/* 
                Icon Container 
                - Starts at w-10 (40px)
                - Scales 1.8x on hover (~72px)
                - Translates up slightly to stay centered visually if text remains or moves
            */}
            <div className="w-10 h-10 mb-4 flex items-center justify-center relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.8] group-hover:-translate-y-2">
                 {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={item.name} 
                        loading="lazy"
                        className="w-full h-full object-contain drop-shadow-sm 
                                   filter grayscale opacity-70 
                                   dark:brightness-0 dark:invert 
                                   group-hover:grayscale-0 group-hover:opacity-100 
                                   dark:group-hover:brightness-100 dark:group-hover:invert-0
                                   transition-all duration-500"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                    />
                ) : (
                    <div className="w-full h-full text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors duration-500">
                        <SkillIcon icon={item.icon || item.name || 'Default'} className="w-full h-full" />
                    </div>
                )}
                 
                 {/* Fallback Icon */}
                 <div className="fallback-icon hidden absolute inset-0 items-center justify-center text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                    <SkillIcon icon={item.icon || item.name || 'Default'} className="w-full h-full" />
                </div>
            </div>

            {/* Label */}
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-all duration-300 text-center relative z-10 group-hover:translate-y-2 group-hover:opacity-80">
                {item.name}
            </span>

            {/* Shine/Glare Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </motion.div>
    );
}

const SkillsSection: React.FC = () => {
  const { skills } = useData();

  return (
    <section className="py-32 border-t border-neutral-200/50 dark:border-white/5 bg-transparent relative z-10 transition-colors duration-500">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-20 gap-4">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-neutral-900 dark:text-white transition-colors">
                Design & Tech
            </h2>
            <span className="text-sm text-neutral-400 dark:text-neutral-500 font-medium hidden md:block uppercase tracking-widest transition-colors">
                Tools we use
            </span>
        </div>

        <div className="space-y-24">
            {skills.map((category) => (
                <div key={category.id}>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-8 pl-1 transition-colors flex items-center gap-4">
                        {category.title}
                        <div className="h-px bg-neutral-200 dark:bg-white/10 flex-grow"></div>
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {category.items.map((item, idx) => (
                            <SkillCard key={idx} item={item} index={idx} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;