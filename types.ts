export type BlockType = 'paragraph' | 'h1' | 'h2' | 'image' | 'code' | 'quote' | 'divider';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string; // For images, this is the URL. For code, this is the code snippet.
  caption?: string; // Optional for images or code language
}

export interface Project {
  id: string;
  title: string;
  client: string;
  roles: string[];
  description: string; // Short summary for the card
  content?: ContentBlock[]; // Rich content for the full case study
  longDescription?: string; // Deprecated, keeping for safety
  year: number;
  heroImage: string;
  thumb: string;
  tags: string[];
  link?: string;
  images?: string[]; 
  published: boolean;
  createdAt?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description?: string;
  published: boolean;
  featured?: boolean;
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