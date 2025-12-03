import React from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'framer-motion';
import { SkillIcon } from './SkillIcons';

// Brandfetch Public Key
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
    item: any;
    index: number;
}

const SkillCard: React.FC<SkillCardProps> = ({ item, index }) => {
    const domain = DOMAIN_MAP[item.name];
    const imageUrl = domain 
        ? `https://cdn.brandfetch.io/${domain}/icon/theme/light/h/200/w/200?c=${BRANDFETCH_KEY}` 
        : item.image;
    
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.02, duration: 0.4 }}
            className="group relative flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 aspect-square border border-neutral-200/40 rounded-2xl hover:border-neutral-300 hover:shadow-lg hover:z-10"
        >
            <div className="w-12 h-12 mb-6 relative flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                 {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                            if (fallback) (fallback as HTMLElement).style.display = 'block';
                        }}
                    />
                ) : (
                    <SkillIcon icon={item.icon || 'Default'} className="w-full h-full text-neutral-400 group-hover:text-neutral-900 transition-colors duration-300" />
                )}
                 <div className="fallback-icon hidden w-full h-full text-neutral-400 group-hover:text-neutral-900">
                    <SkillIcon icon={item.icon || 'Default'} className="w-full h-full" />
                </div>
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900 transition-colors text-center">
                {item.name}
            </span>
        </motion.div>
    );
}

const SkillsSection: React.FC = () => {
  const { skills } = useData();

  return (
    <section className="py-24 border-t border-neutral-200 bg-transparent relative z-10">
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