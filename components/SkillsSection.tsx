import React from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'framer-motion';
import { SkillIcon } from './SkillIcons';

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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {category.items.map((item, idx) => {
                            const brandColor = BRAND_COLORS[item.name] || BRAND_COLORS["Default"];
                            
                            return (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                                    whileHover={{ 
                                        y: -5,
                                        backgroundColor: "rgba(255, 255, 255, 0.8)",
                                        borderColor: brandColor,
                                        boxShadow: `0 10px 30px -10px ${brandColor}40` // 40 is hex opacity
                                    }}
                                    className="group relative h-48 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl flex flex-col items-center justify-center p-6 transition-all duration-300 shadow-sm cursor-default overflow-hidden"
                                >
                                    {/* Subtle colored background blob on hover */}
                                    <motion.div 
                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                                        style={{ backgroundColor: brandColor }}
                                    />

                                    <div className="relative z-10 w-16 h-16 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                                        {item.image ? (
                                            <img 
                                                src={item.image} 
                                                alt={item.name} 
                                                className="w-full h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextElementSibling;
                                                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 text-neutral-400 group-hover:text-neutral-900 transition-colors" style={{ color: 'inherit' }}>
                                                {/* We apply the brand color directly to the icon on hover via CSS/Style if needed, 
                                                    but group-hover:text-neutral-900 is usually cleaner. 
                                                    Let's try to apply the brand color on hover for icon-only items. */}
                                                <div className="w-full h-full transition-colors duration-300" style={{ color: 'inherit' }}>
                                                    <SkillIcon icon={item.icon || 'Default'} className="w-full h-full" />
                                                </div>
                                            </div>
                                        )}
                                        {/* Fallback container */}
                                        <div 
                                            className="w-12 h-12 hidden items-center justify-center transition-colors duration-300"
                                            style={{ color: 'inherit' }}
                                        >
                                            <SkillIcon icon={item.icon || 'Default'} className="w-full h-full" />
                                        </div>
                                    </div>

                                    <span 
                                        className="relative z-10 text-sm font-semibold text-neutral-500 group-hover:text-neutral-900 transition-colors"
                                    >
                                        {item.name}
                                    </span>
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