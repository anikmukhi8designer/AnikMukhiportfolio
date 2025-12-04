import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Project, Experience, Client, SkillCategory, GlobalConfig, SocialLink, SyncLogEntry } from '../types';
import { 
  PROJECTS as INITIAL_PROJECTS, 
  EXPERIENCE as INITIAL_EXPERIENCE, 
  CLIENTS as INITIAL_CLIENTS, 
  SKILLS as INITIAL_SKILLS, 
  INITIAL_CONFIG,
  SOCIALS as INITIAL_SOCIALS
} from '../data';

// --- Types ---
interface CommitInfo {
    sha: string;
    message: string;
    date: string;
    author: string;
}

interface DataContextType {
  // Data State
  projects: Project[];
  experience: Experience[];
  clients: Client[];
  skills: SkillCategory[];
  config: GlobalConfig;
  socials: SocialLink[];
  
  // Meta State
  lastUpdated: Date | null;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  branch: string;
  hasNewVersion: boolean;
  
  // Actions
  reloadContent: () => void;
  syncData: (commitMessage?: string) => Promise<void>; 
  resetData: () => Promise<void>;
  
  // CRUD
  updateProject: (id: string, data: Partial<Project>) => void;
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  
  updateExperience: (id: string, data: Partial<Experience>) => void;
  addExperience: (exp: Experience) => void;
  deleteExperience: (id: string) => void;
  reorderExperience: (items: Experience[]) => void;

  updateClient: (id: string, data: Partial<Client>) => void;
  addClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  updateSkill: (id: string, data: Partial<SkillCategory>) => void;
  addSkill: (skill: SkillCategory) => void;
  deleteSkill: (id: string) => void;

  updateConfig: (data: Partial<GlobalConfig>) => void;
  updateSocials: (data: SocialLink[]) => void;
  
  // Helpers
  verifyConnection: () => Promise<{ success: boolean; message: string }>;
  getHistory: () => Promise<CommitInfo[]>;
  restoreVersion: (sha: string) => Promise<void>;
  getSyncHistory: () => Promise<SyncLogEntry[]>;
  latestPreviewUrl: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- Helpers ---
const getEnv = (key: string) => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch(e) {}
    return '';
};

// Safe Accessors for Auth
const getAuth = () => ({
    token: getEnv('VITE_GITHUB_TOKEN') || localStorage.getItem('github_token') || '',
    owner: getEnv('VITE_GITHUB_OWNER') || localStorage.getItem('github_owner') || '',
    repo: getEnv('VITE_GITHUB_REPO') || localStorage.getItem('github_repo') || ''
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [experience, setExperience] = useState<Experience[]>(INITIAL_EXPERIENCE);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [skills, setSkills] = useState<SkillCategory[]>(INITIAL_SKILLS);
  const [config, setConfig] = useState<GlobalConfig>(INITIAL_CONFIG);
  const [socials, setSocials] = useState<SocialLink[]>(INITIAL_SOCIALS);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [branch, setBranch] = useState('main');
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [latestPreviewUrl, setLatestPreviewUrl] = useState<string | null>(null);

  // Keep a ref of state for saving without dependency cycles
  const stateRef = useRef({ projects, experience, clients, skills, config, socials });
  useEffect(() => {
      stateRef.current = { projects, experience, clients, skills, config, socials };
  }, [projects, experience, clients, skills, config, socials]);

  // --- Core Logic: Fetch (Pull) ---
  const fetchData = useCallback(async (silent = false) => {
    const { token, owner, repo } = getAuth();
    if (!silent) setIsLoading(true);
    
    try {
        let content: any = null;
        let sha: string = '';
        const timestamp = Date.now();

        // PATH 1: Admin (Direct GitHub API)
        if (token && owner && repo) {
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/src/data.json?ref=${branch}&t=${timestamp}`;
            const res = await fetch(url, { 
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            
            if (res.ok) {
                const data = await res.json();
                sha = data.sha;
                content = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
            }
        } 
        // PATH 2: Guest (Proxy to avoid Rate Limits & Cache)
        else {
            const res = await fetch(`/api/data?path=src/data.json&t=${timestamp}`);
            if (res.ok) {
                const data = await res.json();
                if (!data.error) {
                    content = data;
                    sha = data._sha || ''; // Proxy injects _sha
                }
            }
        }

        if (content) {
            // Check if data is new
            if (fileSha && sha && fileSha !== sha) {
                const isAdmin = !!token;
                if (isAdmin) {
                    setHasNewVersion(true);
                } else {
                    applyData(content);
                    setFileSha(sha);
                }
            } else if (!fileSha) {
                // First load
                applyData(content);
                setFileSha(sha);
            }
        }
        return true;
    } catch (e) {
        if (!silent) console.warn("Fetch failed:", e);
        return false;
    } finally {
        if (!silent) setIsLoading(false);
    }
  }, [branch, fileSha]);

  // --- Core Logic: Sync (Push & Pull) ---
  const syncData = async (commitMessage = "Update from CMS") => {
      const { token, owner, repo } = getAuth();
      if (!token || !owner || !repo) throw new Error("Missing configuration");

      setIsSaving(true);
      const now = new Date();
      
      const payload = {
          projects: stateRef.current.projects,
          experience: