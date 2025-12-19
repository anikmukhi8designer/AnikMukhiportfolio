
import { Project, Experience, SocialLink, Client, SkillCategory, GlobalConfig } from './types';
import { PROJECT_APEX } from './project_apex';

export const LAST_UPDATED = new Date().toISOString();

export const INITIAL_CONFIG: GlobalConfig = {
    resumeUrl: "/resume.pdf",
    email: "hello@mukhianik.com",
    heroHeadline: "Product Designer",
    heroSubheadline: "& Creative Dev.",
    heroDescription: "Building digital products that blend aesthetics with function. Currently crafting experiences in San Francisco.",
    experienceIntro: "Over the past 5 years, I've worked with startups and agencies to build scalable design systems and products.",
    seoTitle: "Mukhi Anik | Product Designer & Creative Developer",
    seoDescription: "Product designer building digital products that blend aesthetics with function. Specializing in SaaS, Fintech, and high-end web experiences."
};

export const PROJECTS: Project[] = [
  {
    id: "investa-2023",
    title: "Investa- Fund Management App",
    client: "Investa",
    roles: ["Design"],
    description: "Investa is a mobile and web-based financial solution that helps salary earners automatically set aside a portion of their monthly income for rent, track savings progress, and receive timely reminders, ensuring rent is always paid on time without stress.",
    year: 2023,
    heroImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    tags: ["Fintech", "Mobile App", "Web App"],
    link: "#",
    published: true,
    content: [
      {
        id: "block-1",
        type: "heavy-text",
        content: "Investa is a mobile and web-based financial solution that helps salary earners automatically set aside a portion of their monthly income for rent, track savings progress, and receive timely reminders, ensuring rent is always paid on time without stress."
      },
      {
        id: "block-2",
        type: "columns",
        content: "We approached this project with a focus on usability and brand consistency. By analyzing the core user flows, we identified key friction points and resolved them through a streamlined interface design.",
        secondaryContent: "The result is a digital experience that not only looks premium but performs exceptionally well across all devices, increasing user engagement metrics significantly."
      },
      {
        id: "block-3",
        type: "image",
        content: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
        caption: "Dashboard Experience"
      }
    ]
  },
  {
    id: "ravens-tablet-2024",
    title: "Stadium Suite Tablet",
    client: "Baltimore Ravens",
    roles: ["UX Architecture", "UI Design"],
    description: "A premium in-suite digital experience allowing guests to control the TV, order food, and request assistance.",
    year: 2024,
    heroImage: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop",
    thumb: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    tags: ["Tablet App", "Hospitality", "Sports Tech"],
    link: "#",
    published: true,
    content: [
      { id: '1', type: 'h2', content: 'Introduction' },
      { id: '2', type: 'paragraph', content: 'The Baltimore Ravens Stadium Suite Tablet Experience was designed to enhance the luxury suite environment by offering guests an intuitive digital platform.' }
    ]
  },
  PROJECT_APEX,
  {
    id: "fintech-dashboard-2024",
    title: "Nova Financial",
    client: "Nova Inc.",
    roles: ["Product Design"],
    description: "A comprehensive dashboard for modern financial tracking.",
    year: 2024,
    heroImage: "https://picsum.photos/id/1/1200/800",
    thumb: "https://picsum.photos/id/1/800/600",
    tags: ["Fintech", "SaaS"],
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
  }
];

export const CLIENTS: Client[] = [
  { id: "investa", name: "Investa" },
  { id: "ravens", name: "Baltimore Ravens" },
  { id: "google", name: "Google" }
];

export const SKILLS: SkillCategory[] = [
  {
    id: "s1",
    title: "Design",
    items: [
        { name: "Figma", image: "https://cdn.brandfetch.io/figma.com/w/200/h/200" },
        { name: "Framer", image: "https://cdn.brandfetch.io/framer.com/w/200/h/200" }
    ]
  }
];

export const SOCIALS: SocialLink[] = [
  { id: "twitter-link", platform: "Twitter", url: "https://twitter.com", label: "@mukhi_anik" },
  { id: "linkedin-link", platform: "LinkedIn", url: "https://linkedin.com", label: "Mukhi Anik" },
  { id: "email-link", platform: "Email", url: "mailto:hello@mukhianik.com", label: "hello@mukhianik.com" }
];
