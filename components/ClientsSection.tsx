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
    <div className="w-full h-full flex items-center justify-center p-8 transition-transform duration-500 ease-out whitespace-nowrap">
        <span className={`text-3xl md:text-4xl text-neutral-300 hover:text-neutral-900 transition-colors duration-300 ${fontStyles[styleIndex]}`}>
            {client.name}
        </span>
    </div>
  );
};

const ClientsSection: React.FC = () => {
  // Triple the clients list to ensure seamless looping on large screens
  const marqueeClients = [...CLIENTS, ...CLIENTS, ...CLIENTS];

  return (
    <section className="py-24 bg-transparent border-t border-neutral-200 overflow-hidden relative z-10">
      <motion.div 
        className="w-full"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {/* Minimal Section Header - Centered for the marquee style */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 mb-16 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
            Clients & Collaborations
          </h2>
          <span className="text-sm text-neutral-400 font-medium hidden md:block">
            {CLIENTS.length} Companies
          </span>
        </div>

        {/* Marquee Container */}
        <div className="relative w-full flex overflow-hidden">
            {/* 
                Gradient Masks for smooth fade in/out at edges 
            */}
            <div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-[#fafafa] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-[#fafafa] to-transparent z-10 pointer-events-none" />

            {/* Moving Track */}
            <motion.div 
                className="flex items-center gap-8 md:gap-16 w-max"
                animate={{ x: ["0%", "-33.33%"] }}
                transition={{ 
                    ease: "linear", 
                    duration: 40, // Adjust speed: higher = slower
                    repeat: Infinity 
                }}
            >
                {marqueeClients.map((client, index) => (
                    <div 
                        key={`${client.id}-${index}`} 
                        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-300"
                    >
                        <ClientLogo client={client} />
                    </div>
                ))}
            </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default ClientsSection;