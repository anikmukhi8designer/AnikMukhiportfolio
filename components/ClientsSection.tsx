import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { Client } from '../types';

// Shared Brandfetch Key
const BRANDFETCH_KEY = "xcgD6C-HsoohCTMkqg3DR0i9wYmaqUB2nVktAG16TWiSgYr32T7dDkfOVBVc-DXgPyODc3hx2IgCr0Y3urqLrA";

// Map common names to domains for auto-fetching logos
const CLIENT_DOMAINS: Record<string, string> = {
  "Google": "google.com",
  "Airbnb": "airbnb.com",
  "Stripe": "stripe.com",
  "Linear": "linear.app",
  "Vercel": "vercel.com",
  "Baltimore Ravens": "baltimoreravens.com",
  "Spotify": "spotify.com",
  "Netflix": "netflix.com",
  "Notion": "notion.so",
  "Figma": "figma.com",
  "GitHub": "github.com",
  "Adobe": "adobe.com",
  "Sketch": "sketch.com"
};

const ClientLogo: React.FC<{ client: Client }> = ({ client }) => {
  const [imgError, setImgError] = useState(false);
  
  // 1. Determine Logo URL
  let logoUrl = client.logo;
  if (!logoUrl && !imgError) {
      // Try to find domain from URL or Map
      const domain = client.url 
          ? new URL(client.url).hostname 
          : CLIENT_DOMAINS[client.name];
          
      if (domain) {
          logoUrl = `https://cdn.brandfetch.io/${domain}/w/400/h/200?c=${BRANDFETCH_KEY}`;
      }
  }

  // 2. Text Fallback Styles
  const fontStyles = [
    "font-sans font-bold tracking-tighter",
    "font-serif font-medium italic",
    "font-mono font-bold tracking-widest uppercase",
    "font-sans font-black tracking-normal",
    "font-sans font-light tracking-[0.2em] uppercase"
  ];
  const styleIndex = client.name.length % fontStyles.length;

  // 3. Render Image if available and valid
  if (logoUrl && !imgError) {
      return (
         <div className="h-12 md:h-16 w-auto px-6 md:px-10 flex items-center justify-center transition-all duration-300 group">
            {/* 
                Logo Filters:
                Light Mode: Grayscale & Faded -> Color & Opaque
                Dark Mode: Brightness 0 & Invert (White Silhouette) -> Brightness 0 & Invert (White Silhouette) but full Opacity
                (We avoid restoring original color in dark mode because black text logos would disappear)
            */}
            <img 
                src={logoUrl} 
                alt={client.name} 
                className="h-full w-auto object-contain 
                           opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0
                           dark:opacity-50 dark:brightness-0 dark:invert dark:grayscale-0
                           dark:group-hover:opacity-100
                           transition-all duration-300" 
                onError={() => setImgError(true)}
            />
        </div>
      )
  }

  // 4. Render Text Fallback
  return (
    <div className="w-full h-full flex items-center justify-center px-8 whitespace-nowrap">
        <span className={`text-3xl md:text-4xl text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors duration-300 ${fontStyles[styleIndex]}`}>
            {client.name}
        </span>
    </div>
  );
};

const ClientsSection: React.FC = () => {
  const { clients } = useData();
  
  // Fallback to empty array if clients is undefined
  const safeClients = clients || [];
  
  // Clone list for seamless loop
  const marqueeClients = [...safeClients, ...safeClients, ...safeClients];

  if (safeClients.length === 0) return null;

  return (
    <section className="py-24 bg-transparent border-t border-neutral-200 dark:border-white/5 overflow-hidden relative z-10 transition-colors duration-500">
      <motion.div 
        className="w-full"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {/* Minimal Section Header */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-8 mb-16 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 transition-colors">
            Clients & Collaborations
          </h2>
          <span className="text-sm text-neutral-400 dark:text-neutral-500 font-medium hidden md:block transition-colors">
            {safeClients.length} Companies
          </span>
        </div>

        {/* Marquee Container */}
        <div 
          className="relative w-full flex overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
          }}
        >
            {/* Moving Track */}
            <motion.div 
                className="flex items-center gap-4 md:gap-8 w-max"
                animate={{ x: ["0%", "-33.33%"] }}
                transition={{ 
                    ease: "linear", 
                    duration: 40, 
                    repeat: Infinity 
                }}
            >
                {marqueeClients.map((client, index) => (
                    <div 
                        key={`${client.id}-${index}`} 
                        className="flex-shrink-0 group cursor-default"
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