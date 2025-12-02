import React from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'framer-motion';
import { SkillIcon } from './SkillIcons';

// Brandfetch Public Key (from Admin context)
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

// Brand colors for hover effects
const BRAND_COLORS: Record<string, string> = {
    "Figma": "#F24E1E",
    "Adobe": "#FF0000",
    "Sketch": "#F7B500",
    "Framer": "#0055FF",
    "Webflow": "#4353FF",
    "Spline": "#F94D99",
    "React": "#61DAFB",
    "TypeScript": "#3178C6",
    "Tailwind": "#38B2AC",
    "Next.js": "#000000",
    "Vite": "#646CFF",
    "Node.js": "#339933",
    "Linear": "#5E6AD2",
    "Notion": "#000000",
    "VS Code": "#007ACC",
    "Raycast": "#FF6363",
    "Arc": "#FC585C",
    "GitHub": "#181717",
    "Default": "#737373"
};

const SkillsSection: React.FC = () => {
  const { skills } = useData();

  return (
    <section className="py-32 border-t border-neutral-200 bg-transparent relative z-10">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Minimal Section Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-16 gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
                Skills & Tools
            </h2>
            <span className="text-sm text-neutral-400 font-medium hidden md:block">
                Technical Proficiency
            </span>
        </div>

        <div className="space-y-24">
            {skills.map((category) => (
                <div key={category.id}>
                    <h3 className="text-xl font-medium text-neutral-900 mb-8 px-1">{category.title}</h3>
                    
                    {/* Glassy Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {category.items.map((item, idx) => {
                            const brandColor = BRAND_COLORS[item.name] || BRAND_COLORS["Default"];
                            
                            // Determine Image Source: API > Manual Data > Fallback
                            const domain = DOMAIN_MAP[item.name];
                            const imageUrl = domain 
                                ? `https://cdn.brandfetch.io/${domain}/icon/theme/light/h/200/w/200?c=${BRANDFETCH_KEY}` 
                                : item.image;

                            return (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                                    whileHover={{ 
                                        y: -5,
                                        backgroundColor: "rgba(255, 255, 255, 0.9)",
                                        borderColor: brandColor,
                                        boxShadow: `0 10px 30px -10px ${brandColor}30`
                                    }}
                                    className="group relative h-24 rounded-xl border border-white/60 bg-white/40 backdrop-blur-xl flex items-center justify-start p-5 gap-5 transition-all duration-300 shadow-sm cursor-default overflow-hidden"
                                >
                                    {/* Subtle colored background blob on hover */}
                                    <motion.div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
                                        style={{ backgroundColor: brandColor }}
                                    />

                                    {/* Logo */}
                                    <div className="relative z-10 w-10 h-10 flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                        {imageUrl ? (
                                            <img 
                                                src={imageUrl} 
                                                alt={item.name} 
                                                className="w-full h-full object-contain filter grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                                                onError={(e) => {
                                                    // Hide image and show fallback icon if load fails
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                                    if (fallback) (fallback as HTMLElement).style.display = 'block';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full text-neutral-400 group-hover:text-neutral-900 transition-colors">
                                                 <SkillIcon icon={item.icon || 'Default'} className="w-full h-full" />
                                            </div>
                                        )}
                                        {/* Hidden fallback icon for error handling */}
                                        <div className="fallback-icon hidden w-full h-full text-neutral-400 group-hover:text-neutral-900 transition-colors">
                                            <SkillIcon icon={item.icon || 'Default'} className="w-full h-full" />
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <span 
                                        className="relative z-10 text-sm font-semibold text-neutral-600 group-hover:text-neutral-900 transition-colors truncate"
                                    >
                                        {item.name}
                                    </span>

                                    {/* Decoration Line */}
                                    <div 
                                        className="absolute bottom-0 left-0 h-[2px] w-0 bg-current transition-all duration-300 group-hover:w-full opacity-50"
                                        style={{ color: brandColor }}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;