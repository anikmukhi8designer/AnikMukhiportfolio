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
    <div className="w-full h-full flex items-center justify-center px-10 whitespace-nowrap">
        <span className={`text-3xl md:text-4xl text-muted-foreground group-hover:text-foreground transition-colors duration-300 ${fontStyles[styleIndex]}`}>
            {client.name}
        </span>
    </div>
  );
};

const ClientsSection: React.FC = () => {
  const { clients } = useData();
  
  // Fallback to empty array if clients is undefined
  const safeClients = clients || [];
  
  // Ensure we have enough items to loop smoothly even if only 1 or 2 clients exist
  // We want at least 10 items in the marquee list if the count is low
  let marqueeClients = [...safeClients];
  if (safeClients.length > 0) {
      while (marqueeClients.length < 10) {
          marqueeClients = [...marqueeClients, ...safeClients];
      }
  }

  // Add one more set for the loop buffer
  marqueeClients = [...marqueeClients, ...safeClients];

  if (safeClients.length === 0) return null;

  return (
    <section className="py-24 bg-background border-t border-border overflow-hidden relative z-10">
      <motion.div 
        className="w-full"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        {/* Consistent Layout Container */}
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 mb-16 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors">
            Clients & Collaborations
          </h2>
          <span className="text-sm text-muted-foreground font-medium hidden md:block transition-colors">
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
                animate={{ x: ["0%", "-50%"] }}
                transition={{ 
                    ease: "linear", 
                    duration: Math.max(20, marqueeClients.length * 2), // Adjust speed based on content length
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