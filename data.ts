import { Project, Experience, SocialLink, Client, SkillCategory, GlobalConfig } from './types';

// Placeholder data simulating extraction from mukhianik.framer.website
// Images are from Unsplash/Picsum to ensure visibility in this demo environment.

export const LAST_UPDATED = new Date().toISOString();

export const INITIAL_CONFIG: GlobalConfig = {
    resumeUrl: "/resume.pdf",
    email: "hello@mukhianik.com",
    heroHeadline: "Product Designer",
    heroSubheadline: "& Creative Dev.",
    heroDescription: "Building digital products that blend aesthetics with function. Currently crafting experiences in San Francisco."
};

export const PROJECTS: Project[] = [
  {
    id: "ravens-tablet-2024",
    title: "Stadium Suite Tablet",
    client: "Baltimore Ravens",
    roles: ["UX Architecture", "UI Design", "Wireframing"],
    description: "A premium in-suite digital experience allowing guests to control the TV, order food, and request assistance.",
    year: 2024,
    heroImage: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    tags: ["Tablet App", "Hospitality", "Sports Tech", "Fintech"],
    link: "#",
    published: true,
    images: [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=2070&auto=format&fit=crop"
    ],
    content: [
      { id: '1', type: 'h2', content: 'Introduction' },
      { id: '2', type: 'paragraph', content: 'The Baltimore Ravens Stadium Suite Tablet Experience was designed to enhance the luxury suite environment by offering guests an intuitive digital platform. This tablet enables users to control suite amenities including TV, food and beverage ordering, valet services, merchandise shopping, and service assistance—all from a single interface.' },
      
      { id: '3', type: 'h2', content: 'Project Overview' },
      { id: '4', type: 'paragraph', content: 'The goal was to upgrade traditional, manual suite services with a premium digital solution. The platform had to provide real-time control, seamless navigation, and a visually polished appearance aligned with the Baltimore Ravens brand identity.' },
      
      { id: '5', type: 'h2', content: 'Problem Statement' },
      { id: '6', type: 'paragraph', content: 'Guests often encountered delays ordering food, controlling the TV, or requesting support. These interruptions affected the premium experience expected in a luxury stadium suite.' },

      { id: '7', type: 'h2', content: 'Objective' },
      { id: '8', type: 'paragraph', content: 'Create a unified, easy-to-use tablet interface enabling users to manage entertainment, suite services, and amenities conveniently without needing staff assistance for basic tasks.' },

      { id: '9', type: 'h2', content: 'Target Users' },
      { id: '10', type: 'paragraph', content: 'The system primarily serves VIP guests, corporate clients, and season ticket holders who value convenience and expect a high-end digital environment.' },

      { id: '11', type: 'h2', content: 'Role & Responsibilities' },
      { id: '12', type: 'paragraph', content: 'As the UI/UX designer, I was responsible for the complete design process—research, interaction design, user flows, wireframes, and final high-fidelity UI development.' },

      { id: '13', type: 'h2', content: 'Research Insights' },
      { id: '14', type: 'paragraph', content: 'Based on interviews and competitive analysis, users needed:\n• Fast navigation and quick service access\n• Minimal steps for ordering and content switching\n• Large, high-contrast UI elements suitable for stadium lighting\n• A modern interface that reflects the Ravens’ identity' },

      { id: '15', type: 'h2', content: 'User Flow Overview' },
      { id: '16', type: 'paragraph', content: 'The core flows included:\n• TV Control (Live match, highlights, replays, streaming apps)\n• Food & Beverage Ordering (Menu → Selection → Customization → Checkout)\n• Merchandise Shopping\n• Service Requests (Call server, valet assistance, suite cleaning)\n• Order & Game Notifications' },

      { id: '17', type: 'h2', content: 'Wireframing' },
      { id: '18', type: 'paragraph', content: 'Wireframes focused on creating a simple, modular layout with clear hierarchy. The emphasis was on reducing cognitive load and ensuring thumb-friendly interaction for seated users.' },

      { id: '19', type: 'h2', content: 'UI Design' },
      { id: '20', type: 'paragraph', content: 'The final UI employs a dark, modern theme with the Baltimore Ravens’ signature purple accents. Visual elements are large and bold, optimized for visibility from various seating angles and lighting conditions.' },

      { id: '21', type: 'h2', content: 'Key Features' },
      { id: '22', type: 'paragraph', content: '• One-tap shortcuts for essential actions\n• Real-time order tracking\n• Simplified TV control dashboard\n• Personalized suite-level experience' },

      { id: '23', type: 'h2', content: 'Outcome & Conclusion' },
      { id: '24', type: 'paragraph', content: 'The new tablet interface significantly improved service speed, reduced dependency on staff for routine tasks, and increased guest satisfaction within the suite environment.' },
      { id: '25', type: 'paragraph', content: 'The Baltimore Ravens Stadium Suite Tablet transforms the game-day experience by combining entertainment, hospitality, and convenience into a single, sleek digital interface. The product delivers a premium, efficient, and engaging experience aligned with the expectations of high-value stadium guests.' }
    ]
  },
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
  },
  {
    id: "junior-ux-2018",
    role: "Junior UX Designer",
    company: "StartUp Inc.",
    period: "2018 — 2019",
    description: "Assisted in user research, wireframing, and usability testing for mobile applications.",
    published: true
  },
  {
    id: "placeholder-2024",
    role: "Design Lead",
    company: "Next Gen Solutions",
    period: "2024",
    description: "Spearheading the UI overhaul for the next generation of enterprise tools.",
    published: true
  }
];

export const CLIENTS: Client[] = [
  { id: "ravens", name: "Baltimore Ravens" },
  { id: "c1", name: "Nova Inc." },
  { id: "c2", name: "Lumina Fashion" },
  { id: "c3", name: "Syntax Labs" },
  { id: "c4", name: "Pulse Health" },
  { id: "c5", name: "Urban Architects" },
  { id: "c6", name: "TechFlow" },
  { id: "c7", name: "Studio X" },
  { id: "c8", name: "Google" }, 
  { id: "c9", name: "Airbnb" }  
];

export const SKILLS: SkillCategory[] = [
  {
    id: "s1",
    title: "Design",
    items: [
        { name: "Figma", image: "https://cdn.brandfetch.io/figma.com/w/200/h/200" },
        { name: "Adobe", image: "https://cdn.brandfetch.io/adobe.com/w/200/h/200" },
        { name: "Sketch", image: "https://cdn.brandfetch.io/sketch.com/w/200/h/200" },
        { name: "Framer", image: "https://cdn.brandfetch.io/framer.com/w/200/h/200" },
        { name: "Webflow", image: "https://cdn.brandfetch.io/webflow.com/w/200/h/200" },
        { name: "Spline", image: "https://cdn.brandfetch.io/spline.design/w/200/h/200" }
    ]
  }
];

export const SOCIALS: SocialLink[] = [
  { id: "twitter-link", platform: "Twitter", url: "https://twitter.com", label: "@mukhi_anik" },
  { id: "linkedin-link", platform: "LinkedIn", url: "https://linkedin.com", label: "Mukhi Anik" },
  { id: "email-link", platform: "Email", url: "mailto:hello@example.com", label: "hello@mukhianik.com" }
];
