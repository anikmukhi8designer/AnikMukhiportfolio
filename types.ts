export interface Project {
  id: string;
  title: string;
  client: string;
  roles: string[];
  description: string;
  longDescription?: string;
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
