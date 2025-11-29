import React from 'react';
import { useData } from '../contexts/DataContext';
import { motion } from 'framer-motion';

const SkillsSection: React.FC = () => {
  const { skills } = useData();

  return (
    <section className="py-24 border-t border-neutral-200 bg-neutral-50">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Minimal Section Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-12 gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
                Skills & Tools
            </h2>
            <span className="text-sm text-neutral-400 font-medium hidden md:block">
                Technical Proficiency
            </span>
        </div>

        <div className="space-y-20">
            {skills.map((category) => (
                <div key={category.id}>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 border-b border-neutral-200 pb-2">{category.title}</h3>
                    {/* Grid Layout mimicking ClientsSection */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-l border-t border-neutral-200 bg-white">
                        {category.items.map((item, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="group relative h-32 border-r border-b border-neutral-200 flex items-center justify-center p-6 hover:bg-neutral-50 transition-colors cursor-default"
                            >
                                <span className="text-lg md:text-xl font-semibold text-neutral-500 group-hover:text-neutral-900 transition-colors text-center">
                                    {item}
                                </span>
                            </motion.div>
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