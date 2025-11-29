import { Project, Experience, SocialLink, Client } from './types';

// Placeholder data simulating extraction from mukhianik.framer.website
// Images are from Unsplash/Picsum to ensure visibility in this demo environment.

export const PROJECTS: Project[] = [
  {
    id: "fintech-dashboard-2024",
    title: "Nova Financial",
    client: "Nova Inc.",
    roles: ["Product Design", "Design System"],
    description: "A comprehensive dashboard for modern financial tracking, featuring real-time data visualization and AI-driven insights.",
    year: 2024,
    heroImage: "https://picsum.photos/id/1/1200/800",
    thumb: "https://picsum.photos/id/1/800/600",
    tags: ["Fintech", "SaaS", "Dashboard"],
    link: "#",
    images: [
      "https://picsum.photos/id/2/800/600",
      "https://picsum.photos/id/3/800/600"
    ],
    published: true
  },
  {
    id: "ecom-mobile-2023",
    title: "Lumina App",
    client: "Lumina Fashion",
    roles: ["UX/UI", "Mobile Strategy"],
    description: "Redefining the mobile shopping experience with gesture-based navigation and immersive product storytelling.",
    year: 2023,
    heroImage: "https://picsum.photos/id/4/1200/800",
    thumb: "https://picsum.photos/id/4/800/600",
    tags: ["E-commerce", "Mobile App"],
    link: "#",
    published: true
  },
  {
    id: "ai-copilot-2023",
    title: "Syntax AI",
    client: "Syntax Labs",
    roles: ["Brand Identity", "Web Design"],
    description: "Web presence for an AI coding assistant, focusing on developer ergonomics and dark-mode aesthetics.",
    year: 2023,
    heroImage: "https://picsum.photos/id/6/1200/800",
    thumb: "https://picsum.photos/id/6/800/600",
    tags: ["AI", "Web Design"],
    link: "#",
    published: true
  },
  {
    id: "health-wearable-2022",
    title: "Pulse Os",
    client: "Pulse Health",
    roles: ["Interaction Design", "Prototyping"],
    description: "Operating system interface for a next-gen health wearable, prioritizing glanceability and battery efficiency.",
    year: 2022,
    heroImage: "https://picsum.photos/id/8/1200/800",
    thumb: "https://picsum.photos/id/8/800/600",
    tags: ["Healthtech", "Wearable"],
    link: "#",
    published: true
  },
  {
    id: "arch-vis-2022",
    title: "Urban Space",
    client: "Urban Architects",
    roles: ["3D Visualization", "Art Direction"],
    description: "Interactive architectural visualizations allowing potential buyers to tour properties in real-time 3D.",
    year: 2022,
    heroImage: "https://picsum.photos/id/10/1200/800",
    thumb: "https://picsum.photos/id/10/800/600",
    tags: ["3D", "Real Estate"],
    link: "#",
    published: true
  }
];

export const EXPERIENCE: Experience[] = [
  {
    id: "senior-pd-2023",
    role: "Senior Product Designer",
    company: "TechFlow Systems",
    period: "2023 — Present",
    description: "Leading the design system team and overseeing core product UX.",
    published: true
  },
  {
    id: "pd-2021",
    role: "Product Designer",
    company: "Creative Studio X",
    period: "2021 — 2023",
    description: "Worked on various client projects ranging from fintech to healthcare.",
    published: true
  },
  {
    id: "freelance-2019",
    role: "Freelance Designer",
    company: "Self-Employed",
    period: "2019 — 2021",
    description: "Partnered with early-stage startups to define their MVP visuals.",
    published: true
  }
];

export const CLIENTS: Client[] = [
  { id: "c1", name: "Nova Inc." },
  { id: "c2", name: "Lumina Fashion" },
  { id: "c3", name: "Syntax Labs" },
  { id: "c4", name: "Pulse Health" },
  { id: "c5", name: "Urban Architects" },
  { id: "c6", name: "TechFlow" },
  { id: "c7", name: "Studio X" },
  { id: "c8", name: "Google" }, // Placeholder for credibility
  { id: "c9", name: "Airbnb" },  // Placeholder for credibility
  { id: "c10", name: "Stripe" },  // Placeholder for credibility
  { id: "c11", name: "Linear" },  // Placeholder for credibility
  { id: "c12", name: "Vercel" }   // Placeholder for credibility
];

export const SOCIALS: SocialLink[] = [
  { platform: "Twitter", url: "https://twitter.com", label: "@mukhi_anik" },
  { platform: "LinkedIn", url: "https://linkedin.com", label: "Mukhi Anik" },
  { platform: "Email", url: "mailto:hello@example.com", label: "hello@mukhianik.com" }
];