import React from 'react';
import { useData } from '../contexts/DataContext';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ExperienceSection: React.FC = () => {
  const { experience, config } = useData();
  const publishedExperience = experience.filter(e => e.published);

  return (
    <section className="py-24 border-t border-neutral-200 bg-transparent relative z-10">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-20 gap-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-600">
                Experience
            </h2>
            <a href={config.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-neutral-500 transition-colors">
                Download Resume <ArrowUpRight className="w-4 h-4" />
            </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          {/* Introduction */}
          <div className="lg:col-span-4">
            <h3 className="text-2xl md:text-3xl font-medium text-neutral-900 leading-tight sticky top-32">
              Over the past 5 years, I've worked with startups and agencies to build scalable design systems and products.
            </h3>
          </div>
          
          {/* Experience List */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            {publishedExperience.map((job, index) => (
              <motion.div 
                key={job.id} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                className="group flex flex-col md:flex-row gap-6 md:gap-12 pb-12 border-b border-neutral-200 last:border-0"
              >
                <div className="md:w-1/3 pt-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">{job.period}</span>
                  <h4 className="text-xl font-bold text-neutral-900">{job.company}</h4>
                </div>
                
                <div className="md:w-2/3">
                  <h5 className="text-lg font-medium text-neutral-800 mb-4">{job.role}</h5>
                  <p className="text-neutral-600 leading-relaxed text-base">
                    {job.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;