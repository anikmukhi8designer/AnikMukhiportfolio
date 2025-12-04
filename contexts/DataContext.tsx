import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { Project, Experience, Client, SkillCategory, GlobalConfig, SocialLink, SyncLogEntry } from '../types';
import { 
  PROJECTS as INITIAL_PROJECTS, 
  EXPERIENCE as INITIAL_EXPERIENCE, 
  CLIENTS as INITIAL_CLIENTS, 
  SKILLS as INITIAL_SKILLS, 
  INITIAL_CONFIG,
  SOCIALS as INITIAL_SOCIALS
} from '../data';

interface CommitInfo {
    sha: string;
    message: string;
    date: string;
    author: string;
}

interface DataContextType {
  projects: Project[];
  experience: Experience[];
  clients: Client[];
  skills: SkillCategory[];
  config: GlobalConfig;
  socials: SocialLink[];
  lastUpdated: Date | null;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  branch: string;
  hasNewVersion: boolean; // Notifies UI to show "New Update Available"
  reloadContent: () => void;
  
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

  resetData: () => void;
  refreshAllClients: () => Promise<string | null>;
  verifyConnection: () => Promise<{ success: boolean; message: string }>;
  fetchFromGitHub: (shouldApplyData?: boolean, silent?: boolean) => Promise<boolean>;
  
  getHistory: () => Promise<CommitInfo[]>;
  restoreVersion: (sha: string) => Promise<void>;
  getSyncHistory: () => Promise<SyncLogEntry[]>;
  latestPreviewUrl: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Safe environment accessor
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

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 500): Promise<Response> {
    try {
        const res = await fetch(url, options);
        if (res.status === 401 || res.status === 403 || res.status === 409) return res;
        if (res.status >= 500 && retries > 0) throw new Error(`Server Error: ${res.status}`);
        return res;
    } catch (err: any) {
        if (retries <= 0) throw err;
        await new Promise(r => setTimeout(r, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
}

// Data Cleaning
function deduplicateAndClean<T extends { id: string }>(items: T[]): T[] {
    const seen = new Set();
    return items.filter(item => {
        if (!item.id) return false;
        if (seen.has(item.id)) return false; 
        seen.add(item.id);
        return true;
    });
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

  const [latestPreviewUrl, setLatestPreviewUrl] = useState<string | null>(null);
  const [branch, setBranch] = useState<string>('main');
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const saved = localStorage.getItem('cms_last_updated');
    return saved ? new Date(saved) : null;
  });

  const [activeDataPath, setActiveDataPath] = useState('src/data.json');
  const [fileSha, setFileSha] = useState<string | null>(null);
  const fileShaRef = useRef<string | null>(null);
  
  const stateRef = useRef({ projects, experience, clients, skills, config, socials });

  useEffect(() => {
      stateRef.current = { projects, experience, clients, skills, config, socials };
  }, [projects, experience, clients, skills, config, socials]);

  useEffect(() => {
    fileShaRef.current = fileSha;
  }, [fileSha]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getGitHubToken = () => {
      const env = getEnv('VITE_GITHUB_TOKEN');
      if (env) return env.trim();
      return (localStorage.getItem('github_token') || '').trim();
  };

  const getGitHubConfig = () => {
      const owner = getEnv('VITE_GITHUB_OWNER') || localStorage.getItem('github_owner') || "";
      const repo = getEnv('VITE_GITHUB_REPO') || localStorage.getItem('github_repo') || "";
      return { owner: owner.trim(), repo: repo.trim() };
  };

  const verifyConnection = async (): Promise<{ success: boolean; message: string }> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      
      if (!owner || !repo || !token) return { success: false, message: "Missing Credentials" };

      try {
          const res = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}`, {
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/vnd.github.v3+json'
              }
          }, 1);
          
          if (res.ok) {
              const repoData = await res.json();
              if (repoData.default_branch && repoData.default_branch !== branch) {
                  setBranch(repoData.default_branch);
              }
              return { success: true, message: "Connection Successful" };
          }
          if (res.status === 404) return { success: false, message: "Repo not found" };
          return { success: false, message: "Connection Failed" };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  };
  
  const fetchFromGitHub = useCallback(async (shouldApplyData = true, silent = false): Promise<boolean> => {
    const { owner, repo } = getGitHubConfig();
    const token = getGitHubToken();
    const timestamp = Date.now();
    let path = activeDataPath;

    if (!silent) setIsLoading(true);
    if (!silent) setError(null);

    // Explicit cache buster for fetch
    const cacheBuster = `?update=${timestamp}`;

    // --- Strategy 1: Admin Direct Access (Priority) ---
    if (owner && repo && token) {
        try {
            const headers: HeadersInit = {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${token}`
            };
            const refParam = branch ? `&ref=${branch}` : '';
            
            // Try src/data.json first
            let apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?t=${timestamp}${refParam}`;
            let response = await fetchWithRetry(apiUrl, { headers });

            if (response.status === 404 && path === 'src/data.json') {
                path = 'data.json';
                apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?t=${timestamp}${refParam}`;
                response = await fetchWithRetry(apiUrl, { headers });
            }

            if (response.ok) {
                const data: any = await response.json();
                handleDataSuccess(data, path, shouldApplyData, silent);
                return true;
            }
        } catch (error) {
             // Fall through to proxy
        }
    }
    
    // --- Strategy 2: Public Proxy (Guest) ---
    try {
        // We append timestamp to PROXY URL to bypass Vercel Edge Cache
        const proxyUrl = `/api/data?path=${path}&t=${timestamp}`;
        const response = await fetch(proxyUrl, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        
        if (response.ok) {
            const content = await response.json();
            
            if (content.error && content.status === 404 && path === 'src/data.json') {
                // Retry root path
                const rootRes = await fetch(`/api/data?path=data.json&t=${timestamp}`, { cache: 'no-store' });
                if (rootRes.ok) {
                    const rootContent = await rootRes.json();
                    if (!rootContent.error) {
                        handleDataSuccess(rootContent, 'data.json', shouldApplyData, silent);
                        return true;
                    }
                }
            } else if (!content.error) {
                handleDataSuccess(content, path, shouldApplyData, silent);
                return true;
            }
        }
    } catch (e) {
        console.warn("Proxy fetch failed.", e);
    }
    
    if (!silent) setIsLoading(false);
    return false;
  }, [activeDataPath, branch]);

  const handleDataSuccess = (data: any, path: string, shouldApplyData: boolean, silent: boolean) => {
      // Logic to detect new version without auto-applying (if preferred)
      if (data.sha || data._sha) {
          const newSha = data.sha || data._sha;
          if (fileShaRef.current && fileShaRef.current !== newSha) {
               // New version detected!
               setHasNewVersion(true);
               if (!shouldApplyData) return; // Wait for user to reload
          }
          if (shouldApplyData) {
              setFileSha(newSha);
              setHasNewVersion(false);
          }
      }

      if (path !== activeDataPath) setActiveDataPath(path);

      if (shouldApplyData) {
          try {
              // Handle both raw JSON (Proxy) and Base64 encoded (GitHub API)
              let content = data;
              if (data.content && data.encoding === 'base64') {
                  const cleanContent = data.content.replace(/\s/g, '');
                  const decodedContent = decodeURIComponent(escape(atob(cleanContent)));
                  content = JSON.parse(decodedContent);
              }

              applyData(content);
          } catch (e) {
              if (!silent) setError("Data Parse Error");
          }
      }
      if (!silent) setIsLoading(false);
  };

  const applyData = (content: any) => {
      if (content.projects) setProjects(deduplicateAndClean(content.projects));
      if (content.experience) setExperience(deduplicateAndClean(content.experience));
      if (content.clients) setClients(deduplicateAndClean(content.clients));
      if (content.skills) setSkills(deduplicateAndClean(content.skills));
      if (content.config) setConfig(content.config);
      if (content.socials) setSocials(content.socials);
      
      if (content.lastUpdated) {
          setLastUpdated(new Date(content.lastUpdated));
      }
  };

  const saveToGitHub = async (isManualSync = false) => {
    let { owner, repo } = getGitHubConfig();
    const token = getGitHubToken();
    if (!owner || !repo || !token) throw new Error("Missing credentials.");

    setIsSaving(true);
    const now = new Date();
    const currentState = stateRef.current;
    
    const content = {
      projects: deduplicateAndClean(currentState.projects),
      experience: deduplicateAndClean(currentState.experience),
      clients: deduplicateAndClean(currentState.clients),
      skills: deduplicateAndClean(currentState.skills),
      config: currentState.config, 
      socials: currentState.socials,
      lastUpdated: now.toISOString()
    };
    
    const contentString = JSON.stringify(content, null, 2);

    try {
        // Blob
        const blobRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: contentString, encoding: 'utf-8' })
        });
        const blobData = await blobRes.json();

        // Latest Commit
        const commitsRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        const commitData = await commitsRes.json();
        
        // Tree
        const treeRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                base_tree: commitData.commit.tree.sha,
                tree: [{ path: activeDataPath, mode: '100644', type: 'blob', sha: blobData.sha }]
            })
        });
        const treeData = await treeRes.json();
        
        // Commit
        const commitRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `CMS Update: ${now.toLocaleString()}`,
                tree: treeData.sha,
                parents: [commitData.sha]
            })
        });
        const newCommitData = await commitRes.json();

        // Ref Update
        await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sha: newCommitData.sha })
        });

        setLastUpdated(now);
        fetchFromGitHub(false, true); // Trigger local update check
        
        if (isManualSync) {
             const url = `${window.location.origin}/preview?update=${now.getTime()}`;
             setLatestPreviewUrl(url);
             return url;
        }
        return null;

    } catch (error: any) {
      console.error("Save failed", error);
      throw error;
    } finally {
        setIsSaving(false);
    }
  };

  // State Management Actions
  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const updateExperience = (id: string, data: Partial<Experience>) => {
    setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const addExperience = (exp: Experience) => {
    setExperience(prev => [exp, ...prev]);
  };

  const deleteExperience = (id: string) => {
    setExperience(prev => prev.filter(e => e.id !== id));
  };

  const reorderExperience = (items: Experience[]) => {
    setExperience(items);
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const updateSkill = (id: string, data: Partial<SkillCategory>) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const addSkill = (skill: SkillCategory) => {
    setSkills(prev => [...prev, skill]);
  };

  const deleteSkill = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  const updateConfig = (data: Partial<GlobalConfig>) => {
    setConfig(prev => ({ ...prev, ...data }));
  };

  const updateSocials = (data: SocialLink[]) => {
    setSocials(data);
  };

  const resetData = () => {
    setProjects(INITIAL_PROJECTS);
    setExperience(INITIAL_EXPERIENCE);
    setClients(INITIAL_CLIENTS);
    setSkills(INITIAL_SKILLS);
    setConfig(INITIAL_CONFIG);
    setSocials(INITIAL_SOCIALS);
    setLastUpdated(null);
  };

  // --- Helpers ---
  const getHistory = async () => { return []; /* simplified for brevity */ };
  const restoreVersion = async (sha: string) => {};
  const getSyncHistory = async () => { return []; };
  const reloadContent = () => fetchFromGitHub(true);

  // Polling for Real-Time Updates (Every 10 seconds)
  useEffect(() => {
    const init = async () => {
        await verifyConnection();
        fetchFromGitHub(true, false);
    };
    init();

    const interval = setInterval(() => {
        // Silent check for updates
        fetchFromGitHub(false, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchFromGitHub]);

  return (
    <DataContext.Provider value={{
      projects, experience, clients, skills, lastUpdated, config, socials, isSaving, isLoading, error, branch,
      hasNewVersion, reloadContent,
      updateProject, addProject, deleteProject,
      updateExperience, addExperience, deleteExperience, reorderExperience,
      updateClient, addClient, deleteClient,
      updateSkill, addSkill, deleteSkill,
      updateConfig, updateSocials,
      resetData, refreshAllClients: saveToGitHub, verifyConnection, fetchFromGitHub,
      getHistory, restoreVersion, getSyncHistory, latestPreviewUrl
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};