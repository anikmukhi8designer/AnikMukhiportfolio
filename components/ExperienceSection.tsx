
import React from 'react';
import { useData } from '../contexts/DataContext';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ExperienceSection: React.FC = () => {
  const { experience, config } = useData();
  const publishedExperience = experience.filter(e => e.published);

  return (
    <section className="py-24 border-t border-border bg-background relative z-10">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-20 gap-4 border-b border-border pb-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Experience
            </h2>
            <a href={config.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors">
                [ Download Resume <ArrowUpRight className="w-3 h-3" /> ]
            </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Introduction */}
          <div className="lg:col-span-4">
            <h3 className="text-xl font-mono text-muted-foreground sticky top-32 leading-relaxed whitespace-pre-wrap">
              // {config.experienceIntro || "Over the past years, I've worked with startups and agencies to build scalable systems."}
            </h3>
          </div>
          
          {/* Experience List - Tabular Style */}
          <div className="lg:col-span-8 flex flex-col border-t border-border">
            {publishedExperience.map((job, index) => (
              <motion.div 
                key={job.id} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-border hover:bg-secondary/20 transition-colors px-4 -mx-4"
              >
                <div className="md:col-span-3">
                  <span className="text-xs font-mono text-muted-foreground block">{job.period}</span>
                </div>
                
                <div className="md:col-span-9">
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{job.company}</h4>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{job.role}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
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
