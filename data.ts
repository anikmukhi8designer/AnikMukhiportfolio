import { Project, Experience, SocialLink, Client, SkillCategory } from './types';

// Placeholder data simulating extraction from mukhianik.framer.website
// Images are from Unsplash/Picsum to ensure visibility in this demo environment.

export const PROJECTS: Project[] = [
  {
    id: "fintech-dashboard-2024",
    title: "Nova Financial",
    client: "Nova Inc.",
    roles: ["Product Design", "Design System"],
    description: "A comprehensive dashboard for modern financial tracking.",
    year: 2024,
    heroImage: "https://picsum.photos/id/1/1200/800",
    thumb: "https://picsum.photos/id/1/800/600",
    tags: ["Fintech", "SaaS", "Dashboard"],
    link: "#",
    published: true,
    content: [
      { id: '1', type: 'h1', content: 'The Challenge' },
      { id: '2', type: 'paragraph', content: 'Nova Financial needed a complete overhaul of their legacy tracking system. The goal was to reduce the time it takes for users to analyze their monthly spend by 50%.' },
      { id: '3', type: 'image', content: 'https://picsum.photos/id/2/800/600', caption: 'Initial wireframes and sketches' },
      { id: '4', type: 'h2', content: 'Design System' },
      { id: '5', type: 'paragraph', content: 'We established a strict 8pt grid system and a color palette inspired by Swiss typography. Typography plays a huge role in the readability of complex data sets.' },
      { id: '6', type: 'image', content: 'https://picsum.photos/id/3/800/600', caption: 'Final UI screens' },
      { id: '7', type: 'quote', content: 'The new dashboard has completely transformed how our users interact with their finances.' },
    ]
  },
  {
    id: "ecom-mobile-2023",
    title: "Lumina App",
    client: "Lumina Fashion",
    roles: ["UX/UI", "Mobile Strategy"],
    description: "Redefining the mobile shopping experience.",
    year: 2023,
    heroImage: "https://picsum.photos/id/4/1200/800",
    thumb: "https://picsum.photos/id/4/800/600",
    tags: ["E-commerce", "Mobile App"],
    link: "#",
    published: true,
    content: [
      { id: '1', type: 'paragraph', content: 'Lumina focuses on high-end fashion, so the app needed to feel invisible, letting the photography shine.' }
    ]
  },
  {
    id: "ai-copilot-2023",
    title: "Syntax AI",
    client: "Syntax Labs",
    roles: ["Brand Identity", "Web Design"],
    description: "Web presence for an AI coding assistant.",
    year: 2023,
    heroImage: "https://picsum.photos/id/6/1200/800",
    thumb: "https://picsum.photos/id/6/800/600",
    tags: ["AI", "Web Design"],
    link: "#",
    published: true,
    content: [
        { id: '1', type: 'paragraph', content: 'Designing for developer tools requires a specific aesthetic. Dark mode wasn\'t an option; it was a requirement.' },
        { id: '2', type: 'code', content: 'const ai = new SyntaxAI({\n  mode: "advanced",\n  theme: "dark"\n});', caption: 'Integration Example' }
    ]
  },
  {
    id: "health-wearable-2022",
    title: "Pulse Os",
    client: "Pulse Health",
    roles: ["Interaction Design", "Prototyping"],
    description: "Operating system interface for a next-gen health wearable.",
    year: 2022,
    heroImage: "https://picsum.photos/id/8/1200/800",
    thumb: "https://picsum.photos/id/8/800/600",
    tags: ["Healthtech", "Wearable"],
    link: "#",
    published: true,
    content: [
        { id: '1', type: 'paragraph', content: 'On a 1.5 inch screen, every pixel counts. We removed all non-essential elements.' }
    ]
  },
  {
    id: "arch-vis-2022",
    title: "Urban Space",
    client: "Urban Architects",
    roles: ["3D Visualization", "Art Direction"],
    description: "Interactive architectural visualizations.",
    year: 2022,
    heroImage: "https://picsum.photos/id/10/1200/800",
    thumb: "https://picsum.photos/id/10/800/600",
    tags: ["3D", "Real Estate"],
    link: "#",
    published: true,
    content: [
        { id: '1', type: 'paragraph', content: 'Using WebGL to bring architectural blueprints to life in the browser.' }
    ]
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
  { id: "c8", name: "Google" }, 
  { id: "c9", name: "Airbnb" },  
  { id: "c10", name: "Stripe" },  
  { id: "c11", name: "Linear" },  
  { id: "c12", name: "Vercel" }   
];

export const SKILLS: SkillCategory[] = [
  {
    id: "s1",
    title: "Design",
    items: ["Figma", "Adobe CC", "Prototyping", "Design Systems", "UI/UX", "Motion"]
  },
  {
    id: "s2",
    title: "Development",
    items: ["React", "TypeScript", "Tailwind CSS", "Next.js", "Framer Motion", "Git"]
  },
  {
    id: "s3",
    title: "Tools",
    items: ["Linear", "Notion", "VS Code", "Raycast", "Arc", "Spline"]
  }
];

export const SOCIALS: SocialLink[] = [
  { platform: "Twitter", url: "https://twitter.com", label: "@mukhi_anik" },
  { platform: "LinkedIn", url: "https://linkedin.com", label: "Mukhi Anik" },
  { platform: "Email", url: "mailto:hello@example.com", label: "hello@mukhianik.com" }
];