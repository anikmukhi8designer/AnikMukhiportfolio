import React from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'framer-motion';
import { SkillIcon } from './SkillIcons';

// Brandfetch Public Key
const BRANDFETCH_KEY = "xcgD6C-HsoohCTMkqg3DR0i9wYmaqUB2nVktAG16TWiSgYr32T7dDkfOVBVc-DXgPyODc3hx2IgCr0Y3urqLrA";

// Map Skill Names to Domains for Brandfetch API (Fallback only)
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
    item: any;
    index: number;
}

const SkillCard: React.FC<SkillCardProps> = ({ item, index }) => {
    // 1. Prioritize the image explicitly set in the data (from Admin)
    let imageUrl = item.image;

    // 2. If no image set, try to generate one from the Domain Map
    if (!imageUrl && DOMAIN_MAP[item.name]) {
        imageUrl = `https://cdn.brandfetch.io/${DOMAIN_MAP[item.name]}/icon/theme/light/h/200/w/200?c=${BRANDFETCH_KEY}`;
    } 
    
    // 3. Ensure Brandfetch URLs have the API key to prevent 403 errors
    if (imageUrl && imageUrl.includes('brandfetch.io') && !imageUrl.includes('c=')) {
         const separator = imageUrl.includes('?') ? '&' : '?';
         imageUrl = `${imageUrl}${separator}c=${BRANDFETCH_KEY}`;
    }
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.02, duration: 0.4 }}
            className="group relative flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-md hover:bg-white/80 transition-all duration-300 aspect-square border border-white/40 rounded-2xl hover:border-white/60 hover:shadow-xl hover:z-10"
        >
            <div className="w-12 h-12 mb-6 relative flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                 {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-contain filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                        onError={(e) => {
                            // Hide broken image
                            e.currentTarget.style.display = 'none';
                            // Show fallback icon
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                            if (fallback) (fallback as HTMLElement).style.display = 'block';
                        }}
                    />
                ) : (
                    // Immediate fallback if no URL exists at all
                    <SkillIcon icon={item.icon || item.name || 'Default'} className="w-full h-full text-neutral-500 group-hover:text-neutral-900 transition-colors duration-300" />
                )}
                 
                 {/* Hidden fallback container that shows if img errors */}
                 <div className="fallback-icon hidden w-full h-full text-neutral-500 group-hover:text-neutral-900">
                    <SkillIcon icon={item.icon || item.name || 'Default'} className="w-full h-full" />
                </div>
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 group-hover:text-neutral-900 transition-colors text-center">
                {item.name}
            </span>
        </motion.div>
    );
}

const SkillsSection: React.FC = () => {
  const { skills } = useData();

  return (
    <section className="py-24 border-t border-neutral-200/50 bg-transparent relative z-10">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-16 gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
                Skills & Tools
            </h2>
            <span className="text-sm text-neutral-400 font-medium hidden md:block">
                My Tech Stack
            </span>
        </div>

        <div className="space-y-24">
            {skills.map((category) => (
                <div key={category.id}>
                    <h3 className="text-xl font-medium text-neutral-900 mb-8 pl-1">
                        {category.title}
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
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