import React from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'framer-motion';
import { SkillIcon } from './SkillIcons';

// Provided Brandfetch Public Key
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
        // Requesting icon specifically
        imageUrl = `https://cdn.brandfetch.io/${DOMAIN_MAP[item.name]}/icon/theme/dark/h/200/w/200?c=${BRANDFETCH_KEY}`;
    } 
    
    // 3. Ensure Brandfetch URLs have the API key to prevent 403 errors
    if (imageUrl && imageUrl.includes('brandfetch.io') && !imageUrl.includes('c=')) {
         const separator = imageUrl.includes('?') ? '&' : '?';
         imageUrl = `${imageUrl}${separator}c=${BRANDFETCH_KEY}`;
    }
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="group relative flex flex-col items-center justify-center p-6 bg-white/30 backdrop-blur-xl border border-white/40 rounded-[2rem] hover:bg-white/50 transition-all duration-500 aspect-square shadow-sm hover:shadow-xl hover:shadow-purple-500/10"
        >
            {/* Circular Icon Container */}
            <div className="w-20 h-20 mb-6 rounded-full border-[3px] border-neutral-400/30 group-hover:border-neutral-900 transition-colors duration-500 flex items-center justify-center relative bg-white/10 overflow-hidden">
                 {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={item.name} 
                        className="w-10 h-10 object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110"
                        onError={(e) => {
                            // Hide broken image
                            e.currentTarget.style.display = 'none';
                            // Show fallback icon
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                    />
                ) : (
                    <div className="text-neutral-500 group-hover:text-neutral-900 transition-colors duration-500">
                        <SkillIcon icon={item.icon || item.name || 'Default'} className="w-8 h-8" />
                    </div>
                )}
                 
                 {/* Hidden fallback container that shows if img errors */}
                 <div className="fallback-icon hidden absolute inset-0 items-center justify-center text-neutral-500 group-hover:text-neutral-900">
                    <SkillIcon icon={item.icon || item.name || 'Default'} className="w-8 h-8" />
                </div>
            </div>

            {/* Label */}
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 group-hover:text-neutral-900 transition-colors duration-500 text-center">
                {item.name}
            </span>

            {/* Optional Active Indicator (Simulated) */}
            <div className="absolute top-6 right-6 w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow" />
            
        </motion.div>
    );
}

const SkillsSection: React.FC = () => {
  const { skills } = useData();

  return (
    <section className="py-32 border-t border-neutral-200/50 bg-transparent relative z-10">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-16 gap-4">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-neutral-900">
                Design & Tech
            </h2>
            <span className="text-sm text-neutral-400 font-medium hidden md:block uppercase tracking-widest">
                Tools we use
            </span>
        </div>

        <div className="space-y-24">
            {skills.map((category) => (
                <div key={category.id}>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-10 pl-2">
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