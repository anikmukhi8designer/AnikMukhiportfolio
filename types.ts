
export type BlockType = 'paragraph' | 'h1' | 'h2' | 'quote' | 'image' | 'code' | 'divider';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  caption?: string;
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
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
  published: boolean;
}

export interface Client {
  id: string;
  name: string;
  logo?: string;
  url?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
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
}

export interface GlobalConfig {
  resumeUrl: string;
  email: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroDescription: string;
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
