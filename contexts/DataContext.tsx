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
  hasNewVersion: boolean;
  reloadContent: () => void;
  syncData: (commitMessage?: string) => Promise<void>; 
  triggerDeploy: () => Promise<void>;
  resetData: () => Promise<void>;
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
    token: (getEnv('VITE_GITHUB_TOKEN') || localStorage.getItem('github_token') || '').trim(),
    owner: (getEnv('VITE_GITHUB_OWNER') || localStorage.getItem('github_owner') || '').trim(),
    repo: (getEnv('VITE_GITHUB_REPO') || localStorage.getItem('github_repo') || '').trim()
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

  const stateRef = useRef({ projects, experience, clients, skills, config, socials });
  useEffect(() => {
      stateRef.current = { projects, experience, clients, skills, config, socials };
  }, [projects, experience, clients, skills, config, socials]);

  // --- Core Logic: Fetch ---
  const fetchData = useCallback(async (silent = false): Promise<boolean> => {
    const { token, owner, repo } = getAuth();
    if (!silent) setIsLoading(true);
    
    try {
        let content: any = null;
        let sha: string = '';
        const timestamp = Date.now();
        const cacheBuster = Math.random().toString(36).substring(7);
        let fetchSuccess = false;

        const sanitizedBranch = encodeURIComponent(branch);
        const proxyParams = `path=src/data.json&branch=${sanitizedBranch}&t=${timestamp}&cb=${cacheBuster}`;

        // PATH 1: Admin (Direct GitHub API)
        if (token && owner && repo) {
            try {
                const sanitizedOwner = encodeURIComponent(owner);
                const sanitizedRepo = encodeURIComponent(repo);
                
                const url = `https://api.github.com/repos/${sanitizedOwner}/${sanitizedRepo}/contents/src/data.json?ref=${sanitizedBranch}&t=${timestamp}&cb=${cacheBuster}`;
                const res = await fetch(url, { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Cache-Control': 'no-cache'
                    },
                    cache: 'no-store'
                });
                
                if (res.ok) {
                    const data = await res.json();
                    sha = data.sha;
                    content = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
                    fetchSuccess = true;
                }
            } catch (directError) {
                console.warn("Direct GitHub fetch failed, attempting proxy fallback...", directError);
            }
        } 
        
        // PATH 2: Proxy (Fallback or Guest)
        if (!fetchSuccess) {
            const headers: HeadersInit = { 'Cache-Control': 'no-cache' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/data?${proxyParams}`, { headers, cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (!data.error) {
                    content = data;
                    sha = data._sha || '';
                    fetchSuccess = true;
                }
            }
        }

        if (fetchSuccess && content) {
            if (fileSha && sha && fileSha !== sha) {
                const isAdmin = !!token;
                if (silent) {
                    if (isAdmin) {
                        setHasNewVersion(true);
                    } else {
                        applyData(content);
                        setFileSha(sha);
                    }
                } else {
                    applyData(content);
                    setFileSha(sha);
                    setHasNewVersion(false);
                }
            } else if (!fileSha) {
                applyData(content);
                setFileSha(sha);
            }
            return true;
        }
        return false;
    } catch (e) {
        if (!silent) console.warn("Fetch failed:", e);
        return false;
    } finally {
        if (!silent) setIsLoading(false);
    }
  }, [branch, fileSha]);

  // --- Helper: Update a specific file in Repo ---
  const updateRepoFile = async (path: string, contentBase64: string, message: string, retries = 3): Promise<string> => {
      const { token, owner, repo } = getAuth();
      const sanitizedOwner = encodeURIComponent(owner);
      const sanitizedRepo = encodeURIComponent(repo);
      const sanitizedBranch = encodeURIComponent(branch);
      const proxyParams = `path=${path}&branch=${sanitizedBranch}`;

      try {
          // 1. Get SHA (Read current file to handle updates correctly)
          let currentSha: string | undefined;
          try {
              const getRes = await fetch(`https://api.github.com/repos/${sanitizedOwner}/${sanitizedRepo}/contents/${path}?ref=${sanitizedBranch}&t=${Date.now()}`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                  cache: 'no-store'
              });
              if (getRes.ok) {
                  const data = await getRes.json();
                  currentSha = data.sha;
              } else {
                   // Fallback to proxy
                   const proxyRes = await fetch(`/api/data?${proxyParams}`, { headers: { 'Authorization': `Bearer ${token}` } });
                   if (proxyRes.ok) {
                       const data = await proxyRes.json();
                       currentSha = data._sha;
                   }
              }
          } catch (e) { /* ignore read error, file might not exist yet */ }

          // 2. PUT Request
          const body = JSON.stringify({
              message,
              content: contentBase64,
              sha: currentSha,
              branch: branch
          });

          let putRes;
          try {
               putRes = await fetch(`https://api.github.com/repos/${sanitizedOwner}/${sanitizedRepo}/contents/${path}`, {
                  method: 'PUT',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body
              });
          } catch(e) {
               putRes = await fetch(`/api/data?${proxyParams}`, {
                  method: 'PUT',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body
              });
          }

          if (putRes && putRes.status === 409 && retries > 0) {
              await new Promise(r => setTimeout(r, 1000));
              return updateRepoFile(path, contentBase64, message, retries - 1);
          }

          if (!putRes || !putRes.ok) {
              throw new Error(`Failed to update ${path}`);
          }

          const resJson = await putRes.json();
          return resJson.content ? resJson.content.sha : resJson.sha;

      } catch (e) {
          if (retries > 0) {
              await new Promise(r => setTimeout(r, 1000));
              return updateRepoFile(path, contentBase64, message, retries - 1);
          }
          throw e;
      }
  };

  // --- Core Logic: Sync (Push to data.json AND data.ts) ---
  const syncData = async (commitMessage = "Update from CMS") => {
      if (!navigator.onLine) throw new Error("No internet connection.");

      const { token, owner, repo } = getAuth();
      if (!token || !owner || !repo) throw new Error("Missing credentials.");

      setIsSaving(true);
      const now = new Date();
      const currentUser = localStorage.getItem('github_owner') || 'Admin';
      
      try {
          // --- 1. Update src/data.json (For Runtime Fetching) ---
          const payload = {
              projects: stateRef.current.projects,
              experience: stateRef.current.experience,
              clients: stateRef.current.clients,
              skills: stateRef.current.skills,
              config: stateRef.current.config,
              socials: stateRef.current.socials,
              lastUpdated: now.toISOString()
          };
          const jsonBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
          
          const newJsonSha = await updateRepoFile('src/data.json', jsonBase64, commitMessage);
          setFileSha(newJsonSha);

          // --- 2. Update src/data.ts (For Codebase/Build Consistency) ---
          // We generate valid TypeScript code so the repo source is always up to date
          const tsContent = `import { Project, Experience, SocialLink, Client, SkillCategory, GlobalConfig } from './types';

export const LAST_UPDATED = "${now.toISOString()}";

export const INITIAL_CONFIG: GlobalConfig = ${JSON.stringify(stateRef.current.config, null, 2)};

export const PROJECTS: Project[] = ${JSON.stringify(stateRef.current.projects, null, 2)};

export const EXPERIENCE: Experience[] = ${JSON.stringify(stateRef.current.experience, null, 2)};

export const CLIENTS: Client[] = ${JSON.stringify(stateRef.current.clients, null, 2)};

export const SKILLS: SkillCategory[] = ${JSON.stringify(stateRef.current.skills, null, 2)};

export const SOCIALS: SocialLink[] = ${JSON.stringify(stateRef.current.socials, null, 2)};
`;
          const tsBase64 = btoa(unescape(encodeURIComponent(tsContent)));
          await updateRepoFile('src/data.ts', tsBase64, commitMessage);

          // Success State
          setLastUpdated(now);
          setHasNewVersion(false);
          setLatestPreviewUrl(`${window.location.origin}/preview?t=${now.getTime()}`);

          // Log Success
          await updateSyncLog({ 
            action: 'Push', status: 'Success', message: commitMessage, author: currentUser
          });

          // Trigger Vercel Deploy Hook if present
          const deployHook = localStorage.getItem('vercel_deploy_hook');
          if (deployHook) {
              fetch(deployHook, { method: 'POST', mode: 'no-cors' }).catch(() => {});
          }

          // Force Pull to verify consistency
          await new Promise(r => setTimeout(r, 1500));
          fetchData(true);

      } catch (e: any) {
          console.error("Sync Data Failed", e);
          await updateSyncLog({ 
            action: 'Push', status: 'Failed', message: e.message || 'Error', author: currentUser
          });
          throw e;
      } finally {
          setIsSaving(false);
      }
  };

  const applyData = (data: any) => {
      if (data.projects) setProjects(data.projects);
      if (data.experience) setExperience(data.experience);
      if (data.clients) setClients(data.clients);
      if (data.skills) setSkills(data.skills);
      if (data.config) setConfig(data.config);
      if (data.socials) setSocials(data.socials);
      if (data.lastUpdated) setLastUpdated(new Date(data.lastUpdated));
  };

  // --- Internal: Update Sync Log ---
  const updateSyncLog = async (entry: Omit<SyncLogEntry, 'id' | 'timestamp'>) => {
    // (Existing log logic kept intact but using updateRepoFile could simplify it. 
    //  Keeping it explicit here to avoid recursion issues if updateRepoFile logs internally.)
    const { token, owner, repo } = getAuth();
    if (!token) return;

    const logPath = 'public/admin/sync-log.json';
    const newEntry: SyncLogEntry = {
        id: self.crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...entry
    };
    
    try {
        let logs: SyncLogEntry[] = [];
        let sha = '';
        const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}?ref=${branch}&t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            logs = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
        }

        const updatedLogs = [newEntry, ...logs].slice(0, 50);
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(updatedLogs, null, 2))));

        await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Log: ${entry.action}`,
                content: contentBase64,
                sha: sha || undefined,
                branch: branch
            })
        });
    } catch (e) { /* ignore log errors */ }
  };

  // --- Lifecycle ---
  useEffect(() => {
      fetchData();
      const interval = setInterval(() => fetchData(true), 15000);
      return () => clearInterval(interval);
  }, [fetchData]);

  // Wrappers
  const updateProject = (id: string, data: Partial<Project>) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const addProject = (p: Project) => setProjects(prev => [p, ...prev]);
  const deleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));
  const updateExperience = (id: string, data: Partial<Experience>) => setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  const addExperience = (e: Experience) => setExperience(prev => [e, ...prev]);
  const deleteExperience = (id: string) => setExperience(prev => prev.filter(e => e.id !== id));
  const reorderExperience = (items: Experience[]) => setExperience(items);
  const updateClient = (id: string, data: Partial<Client>) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const addClient = (c: Client) => setClients(prev => [...prev, c]);
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));
  const updateSkill = (id: string, data: Partial<SkillCategory>) => setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const addSkill = (s: SkillCategory) => setSkills(prev => [...prev, s]);
  const deleteSkill = (id: string) => setSkills(prev => prev.filter(s => s.id !== id));
  const updateConfig = (data: Partial<GlobalConfig>) => setConfig(prev => ({ ...prev, ...data }));
  const updateSocials = (data: SocialLink[]) => setSocials(data);

  const resetData = async () => {
      if (!confirm("Are you sure?")) return;
      setProjects(INITIAL_PROJECTS);
      setExperience(INITIAL_EXPERIENCE);
      setClients(INITIAL_CLIENTS);
      setSkills(INITIAL_SKILLS);
      setConfig(INITIAL_CONFIG);
      setSocials(INITIAL_SOCIALS);
      setTimeout(() => syncData("Reset Data"), 500);
  };

  const verifyConnection = async () => {
      const { token, owner, repo } = getAuth();
      if (!token || !owner || !repo) return { success: false, message: "Missing Credentials" };
      try {
          const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
               const data = await res.json();
               if (branch === 'main' && data.default_branch !== 'main') {
                   setBranch(data.default_branch);
               }
               return { success: true, message: `Connected to ${data.default_branch}` };
          }
          return { success: false, message: `GitHub Error: ${res.status}` };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  };

  const getHistory = async (): Promise<CommitInfo[]> => {
      const { token, owner, repo } = getAuth();
      if (!token) return [];
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?path=src/data.json&sha=${branch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
          const data = await res.json();
          return data.map((c: any) => ({
              sha: c.sha,
              message: c.commit.message,
              date: c.commit.committer.date,
              author: c.commit.author.name
          }));
      }
      return [];
  };

  const restoreVersion = async (sha: string) => {
      const { token, owner, repo } = getAuth();
      if (!token) return;
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/src/data.json?ref=${sha}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
          const data = await res.json();
          const content = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
          applyData(content);
          setTimeout(() => syncData(`Restored version ${sha.substring(0,7)}`), 500);
      }
  };

  const getSyncHistory = async (): Promise<SyncLogEntry[]> => {
      const { token, owner, repo } = getAuth();
      if (!token) return [];
      const logPath = 'public/admin/sync-log.json';
      try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}?ref=${branch}&t=${Date.now()}`, {
             headers: { 'Authorization': `Bearer ${token}` },
             cache: 'no-store'
          });
          if (res.ok) {
              const data = await res.json();
              return JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
          }
      } catch (e) {}
      return [];
  };

  const triggerDeploy = async () => {
       const deployHook = localStorage.getItem('vercel_deploy_hook');
      if (!deployHook) throw new Error("No Deploy Hook configured in Settings.");
      try {
          const separator = deployHook.includes('?') ? '&' : '?';
          const hookWithCache = `${deployHook}${separator}t=${Date.now()}`;
          await fetch(hookWithCache, { method: 'POST', mode: 'no-cors' });
      } catch (e: any) {
          throw new Error("Failed to trigger deploy hook.");
      }
  };

  return (
    <DataContext.Provider value={{
        projects, experience, clients, skills, config, socials,
        lastUpdated, isSaving, isLoading, error, branch, hasNewVersion,
        reloadContent: () => fetchData(),
        syncData, resetData, triggerDeploy,
        updateProject, addProject, deleteProject,
        updateExperience, addExperience, deleteExperience, reorderExperience,
        updateClient, addClient, deleteClient,
        updateSkill, addSkill, deleteSkill,
        updateConfig, updateSocials,
        verifyConnection, getHistory, restoreVersion, getSyncHistory, latestPreviewUrl
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