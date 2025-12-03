import React from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'framer-motion';
import { SkillIcon } from './SkillIcons';
import { SkillItem } from '../types';

// Provided Brandfetch Public Key
const BRANDFETCH_KEY = "xcgD6C-HsoohCTMkqg3DR0i9wYmaqUB2nVktAG16TWiSgYr32T7dDkfOVBVc-DXgPyODc3hx2IgCr0Y3urqLrA";

// Map Skill Names to Domains for Brandfetch API
// Using the standard logo endpoint is more reliable than the icon endpoint
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
    // We prioritize the DOMAIN_MAP because it uses the authenticated Brandfetch API 
    // with a reliable endpoint, overriding potentially stale URLs in the data.
    let imageUrl = item.image;
    const domain = DOMAIN_MAP[item.name];

    if (domain) {
         // Use the standard logo endpoint (/w/200/h/200) which is robust.
         // We don't use /icon because it frequently returns 404s for dev tools.
         imageUrl = `https://cdn.brandfetch.io/${domain}/w/200/h/200?c=${BRANDFETCH_KEY}`;
    } 
    else if (imageUrl && imageUrl.includes('brandfetch.io') && !imageUrl.includes('c=')) {
         // Fix up other Brandfetch URLs if they are missing the key
         const separator = imageUrl.includes('?') ? '&' : '?';
         imageUrl = `${imageUrl}${separator}c=${BRANDFETCH_KEY}`;
    }
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="group relative flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[2rem] hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-500 aspect-square shadow-sm hover:shadow-xl hover:shadow-purple-500/10"
        >
            {/* Circular Icon Container */}
            <div className="w-20 h-20 mb-6 rounded-full border-[3px] border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-900 dark:group-hover:border-white transition-colors duration-500 flex items-center justify-center relative bg-white dark:bg-white/90 overflow-hidden shadow-sm p-4">
                 {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={item.name} 
                        loading="lazy"
                        className="w-full h-full object-contain transition-all duration-500 transform group-hover:scale-110"
                        onError={(e) => {
                            // Hide broken image
                            e.currentTarget.style.display = 'none';
                            // Show fallback icon
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                    />
                ) : (
                    <div className="text-neutral-500 group-hover:text-neutral-900 transition-colors duration-500 w-full h-full">
                        <SkillIcon icon={item.icon || item.name || 'Default'} className="w-full h-full" />
                    </div>
                )}
                 
                 {/* Fallback container: Initially hidden, shown via onError */}
                 <div className="fallback-icon hidden absolute inset-0 items-center justify-center text-neutral-500 group-hover:text-neutral-900 p-4">
                    <SkillIcon icon={item.icon || item.name || 'Default'} className="w-full h-full" />
                </div>
            </div>

            {/* Label */}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors duration-500 text-center">
                {item.name}
            </span>

            {/* Active Indicator */}
            <div className="absolute top-6 right-6 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow" />
            
        </motion.div>
    );
}

const SkillsSection: React.FC = () => {
  const { skills } = useData();

  return (
    <section className="py-32 border-t border-neutral-200/50 dark:border-white/5 bg-transparent relative z-10 transition-colors duration-500">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-16 gap-4">
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
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mb-10 pl-2 transition-colors">
                        {category.title}
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