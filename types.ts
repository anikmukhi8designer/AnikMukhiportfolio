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
}