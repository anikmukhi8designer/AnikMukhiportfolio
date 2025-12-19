
export type BlockType = 'paragraph' | 'h1' | 'h2' | 'quote' | 'image' | 'code' | 'divider' | 'columns' | 'heavy-text';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string; 
  caption?: string;
  secondaryContent?: string; 
}

export interface Project {
  id: string;
  title: string;
  client: string;
  roles: string[];
  description: string;
  year: number;
  heroImage: string;
  thumb: string;
  tags: string[];
  link?: string;
  githubRepoUrl?: string;
  published: boolean;
  images?: string[];
  content?: ContentBlock[];
  titleSize?: number; // 1 to 10 scale
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  published: boolean;
  order?: number;
}

export interface Client {
  id: string;
  name: string;
  logo?: string;
  url?: string;
  order?: number;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string;
  order?: number;
}

export interface SkillItem {
  name: string;
  image?: string;
  icon?: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  items: SkillItem[];
  order?: number;
}

export interface GlobalConfig {
  resumeUrl: string;
  email: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroDescription: string;
  experienceIntro: string; // New field
  seoTitle?: string;       // New field
  seoDescription?: string; // New field
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: 'Push' | 'Pull' | 'Sync';
  status: 'Success' | 'Failed';
  message: string;
  author: string;
}

export interface CMSData {
    projects: Project[];
    experience: Experience[];
    clients: Client[];
    skills: SkillCategory[];
    config: GlobalConfig;
    socials: SocialLink[];
    lastUpdated: string;
}
