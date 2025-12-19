
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
    "Git": "git-scm.com",
    "Supabase": "supabase.com",
    "PostgreSQL": "postgresql.org",
    "Vercel": "vercel.com",
    "Stripe": "stripe.com",
    "Shopify": "shopify.com"
};

interface SkillCardProps {
    item: SkillItem;
    index: number;
}

const SkillCard: React.FC<SkillCardProps> = ({ item, index }) => {
    // 1. Resolve effective image URL
    let imageUrl = item.image;

    if (!imageUrl) {
         const domain = DOMAIN_MAP[item.name];
         if (domain) {
              imageUrl = `https://cdn.brandfetch.io/${domain}/w/128/h/128?c=${BRANDFETCH_KEY}`;
         }
    } else {
         if (imageUrl.includes('brandfetch.io') && !imageUrl.includes('c=')) {
              const separator = imageUrl.includes('?') ? '&' : '?';
              imageUrl = `${imageUrl}${separator}c=${BRANDFETCH_KEY}`;
         }
    }
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
            className="group relative flex flex-col items-center justify-center p-4 md:p-6 
                       bg-card/40 md:bg-card/50
                       backdrop-blur-xl border border-border/80 md:border-border
                       rounded-2xl md:rounded-3xl
                       hover:bg-card 
                       hover:border-primary/30
                       hover:shadow-xl
                       transition-all duration-500 ease-out aspect-square cursor-default overflow-hidden"
        >
            <div className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 flex items-center justify-center relative z-10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-125 md:group-hover:scale-150 group-hover:-translate-y-1 md:group-hover:-translate-y-2">
                 {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={item.name} 
                        loading="lazy"
                        className="w-full h-full object-contain drop-shadow-sm 
                                   filter grayscale opacity-50 
                                   dark:grayscale dark:opacity-60 dark:brightness-125
                                   group-hover:grayscale-0 group-hover:opacity-100 
                                   dark:group-hover:brightness-100 dark:group-hover:opacity-100
                                   transition-all duration-500"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                            if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                            (fallback as HTMLElement).style.display = 'flex';
                        }}
                    />
                ) : (
                    <div className="w-full h-full text-muted-foreground group-hover:text-foreground transition-colors duration-500">
                        <SkillIcon icon={item.icon || item.name || 'Default'} className="w-full h-full" />
                    </div>
                )}
                 
                 <div className="fallback-icon hidden absolute inset-0 items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <SkillIcon icon={item.icon || item.name || 'Default'} className="w-full h-full" />
                </div>
            </div>

            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground/80 dark:text-muted-foreground group-hover:text-foreground transition-all duration-300 text-center relative z-10 group-hover:translate-y-1">
                {item.name}
            </span>

            <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay" />
        </motion.div>
    );
}

const SkillsSection: React.FC = () => {
  const { skills } = useData();

  return (
    <section className="py-24 border-t border-border bg-background relative z-10 transition-colors duration-500">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-12 md:mb-20 gap-4">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-foreground transition-colors">
                Design & Tech
            </h2>
            <span className="text-sm text-muted-foreground font-medium hidden md:block uppercase tracking-widest transition-colors">
                Tools we use
            </span>
        </div>

        <div className="space-y-16 md:space-y-24">
            {skills.map((category) => (
                <div key={category.id}>
                    <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 md:mb-8 pl-1 transition-colors flex items-center gap-4">
                        {category.title}
                        <div className="h-px bg-border flex-grow"></div>
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
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
