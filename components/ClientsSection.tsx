import React from 'react';
import { motion } from 'framer-motion';
import { CLIENTS } from '../data';
import { Client } from '../types';

const ClientLogo: React.FC<{ client: Client }> = ({ client }) => {
  // Simulating brand logos with different typography styles since we don't have SVGs
  const fontStyles = [
    "font-sans font-bold tracking-tighter",
    "font-serif font-medium italic",
    "font-mono font-bold tracking-widest uppercase",
    "font-sans font-black tracking-normal",
    "font-sans font-light tracking-[0.2em] uppercase"
  ];
  
  // Deterministic random style based on name length
  const styleIndex = client.name.length % fontStyles.length;

  return (
    <div className="w-full h-full flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500 ease-out">
        {/* If we had an image, we'd render it here. For now, we use high-end typography. */}
        <span className={`text-xl md:text-2xl text-neutral-400 group-hover:text-neutral-900 transition-colors duration-300 ${fontStyles[styleIndex]}`}>
            {client.name}
        </span>
    </div>
  );
};

const ClientsSection: React.FC = () => {
  return (
    <section className="py-24 bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
            Clients & Collaborations
          </h2>
          <span className="text-sm text-neutral-400 hidden md:block">
            {CLIENTS.length} Companies
          </span>
        </div>

        {/* 
            Grid Layout:
            - Desktop: 4 columns
            - Tablet: 3 columns
            - Mobile: 2 columns
            - Borders: Using Tailwind's 'divide' utilities isn't enough for a grid, 
              so we use individual borders with negative margins to overlap them cleanly.
        */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-l border-t border-neutral-200">
          {CLIENTS.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="group relative h-32 md:h-40 border-r border-b border-neutral-200 bg-transparent hover:bg-white transition-colors duration-300 cursor-default"
            >
              <ClientLogo client={client} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
