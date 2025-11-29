import React from 'react';
import { useData } from '../contexts/DataContext';

const ExperienceSection: React.FC = () => {
  const { experience } = useData();
  const publishedExperience = experience.filter(e => e.published);

  return (
    <section className="py-24 border-t border-neutral-200">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Experience</h2>
          <p className="text-neutral-500 max-w-xs leading-relaxed">
            A history of partnering with ambitious startups and established companies to build digital products.
          </p>
        </div>
        
        <div className="md:col-span-8 flex flex-col">
          {publishedExperience.map((job) => (
            <div 
              key={job.id} 
              className="group py-8 border-b border-neutral-200 first:border-t flex flex-col md:flex-row md:items-baseline justify-between gap-4 hover:bg-neutral-50/50 transition-colors px-4 -mx-4 rounded-lg"
            >
              <div className="md:w-1/3">
                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-neutral-600 transition-colors">
                  {job.company}
                </h3>
                <span className="text-sm text-neutral-400 font-medium">{job.period}</span>
              </div>
              
              <div className="md:w-2/3">
                <h4 className="text-lg font-medium text-neutral-900 mb-2">{job.role}</h4>
                <p className="text-neutral-600 leading-relaxed text-sm max-w-md">
                  {job.description}
                </p>
              </div>
            </div>
          ))}
          
          <div className="mt-8">
            <a 
              href="/resume.pdf" 
              className="inline-flex items-center text-sm font-bold text-neutral-900 hover:text-neutral-600 transition-colors border-b-2 border-neutral-900 hover:border-neutral-600 pb-0.5"
            >
              Download Full Resume
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
