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
  triggerDeploy: () => Promise<void>;
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

  // --- Core Logic: Fetch ---
  const fetchData = useCallback(async (silent = false): Promise<boolean> => {
    const { token, owner, repo } = getAuth();
    if (!silent) setIsLoading(true);
    
    try {
        let content: any = null;
        let sha: string = '';
        const timestamp = Date.now();
        // Add random string to ensure absolutely no cache collisions
        const cacheBuster = Math.random().toString(36).substring(7);

        // PATH 1: Admin (Direct GitHub API)
        if (token && owner && repo) {
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/src/data.json?ref=${branch}&t=${timestamp}&cb=${cacheBuster}`;
            const res = await fetch(url, { 
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            
            if (res.ok) {
                const data = await res.json();
                sha = data.sha;
                // Handle base64 decoding with UTF-8 support
                content = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
            }
        } 
        // PATH 2: Guest (Proxy to avoid Rate Limits & Cache)
        else {
            const res = await fetch(`/api/data?path=src/data.json&t=${timestamp}&cb=${cacheBuster}`);
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

  // --- Internal: Update Sync Log ---
  const updateSyncLog = async (entry: Omit<SyncLogEntry, 'id' | 'timestamp'>) => {
    const { token, owner, repo } = getAuth();
    if (!token) return;

    const logPath = 'public/admin/sync-log.json';
    const newEntry: SyncLogEntry = {
        id: self.crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...entry
    };

    try {
        // 1. Get current log
        let logs: SyncLogEntry[] = [];
        let sha = '';
        
        try {
          const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}?ref=${branch}&t=${Date.now()}`, {
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Cache-Control': 'no-cache'
              },
              cache: 'no-store'
          });
          if (getRes.ok) {
              const data = await getRes.json();
              sha = data.sha;
              logs = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
          }
        } catch (e) {
            // File might not exist yet
        }

        // 2. Update (Prepend and Slice)
        const updatedLogs = [newEntry, ...logs].slice(0, 50); // Keep last 50
        const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(updatedLogs, null, 2))));

        // 3. Put
        await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Log: ${entry.action} - ${entry.status}`,
                content: contentBase64,
                sha: sha || undefined,
                branch: branch
            })
        });

    } catch (e) {
        console.warn("Failed to update sync log", e);
    }
  };

  const getSyncHistory = async (): Promise<SyncLogEntry[]> => {
      const { token, owner, repo } = getAuth();
      if (!token) return [];
      
      const logPath = 'public/admin/sync-log.json';
      try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}?ref=${branch}&t=${Date.now()}`, {
             headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' },
             cache: 'no-store'
          });
          
          if (res.ok) {
              const data = await res.json();
              return JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\s/g, '')))));
          }
      } catch (e) {
          console.error(e);
      }
      return [];
  };

  // --- Trigger Vercel Deploy Hook ---
  const triggerDeploy = async () => {
      const deployHook = localStorage.getItem('vercel_deploy_hook');
      if (!deployHook) throw new Error("No Deploy Hook configured in Settings.");
      
      try {
          // Add cache buster to hook to ensure it's treated as new
          const separator = deployHook.includes('?') ? '&' : '?';
          const hookWithCache = `${deployHook}${separator}t=${Date.now()}`;
          
          await fetch(hookWithCache, { method: 'POST', mode: 'no-cors' });
          
          await updateSyncLog({ 
            action: 'Sync', 
            status: 'Success', 
            message: 'Manual Deploy Triggered', 
            author: 'Admin'
          });
      } catch (e: any) {
          console.error("Deploy failed", e);
          throw new Error("Failed to trigger deploy hook.");
      }
  };

  // --- Core Logic: Sync (Push then Pull) ---
  const syncData = async (commitMessage = "Update from CMS") => {
      if (!navigator.onLine) throw new Error("No internet connection. Cannot sync.");

      const { token, owner, repo } = getAuth();
      if (!token || !owner || !repo) throw new Error("Missing configuration credentials. Check Settings.");

      setIsSaving(true);
      const now = new Date();
      const currentUser = localStorage.getItem('github_owner') || 'Admin';
      
      const payload = {
          projects: stateRef.current.projects,
          experience: stateRef.current.experience,
          clients: stateRef.current.clients,
          skills: stateRef.current.skills,
          config: stateRef.current.config,
          socials: stateRef.current.socials,
          lastUpdated: now.toISOString()
      };
      
      const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));

      // Recursive attempt function for the Push
      const attemptPush = async (retriesLeft: number): Promise<void> => {
          try {
              let currentSha: string | undefined = undefined;
              
              const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/src/data.json?ref=${branch}&t=${Date.now()}`, {
                  headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                  },
                  cache: 'no-store'
              });

              if (getRes.ok) {
                  const currentFile = await getRes.json();
                  currentSha = currentFile.sha;
              }

              const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/src/data.json`, {
                  method: 'PUT',
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      message: commitMessage,
                      content: contentBase64,
                      sha: currentSha,
                      branch: branch
                  })
              });

              if (putRes.status === 409 && retriesLeft > 0) {
                  await new Promise(r => setTimeout(r, 800)); 
                  return attemptPush(retriesLeft - 1);
              }

              if (!putRes.ok) {
                  const errData = await putRes.json().catch(() => ({}));
                  throw new Error(errData.message || `GitHub API Error: ${putRes.status}`);
              }

              const result = await putRes.json();
              setFileSha(result.content.sha);
              setLastUpdated(now);
              setHasNewVersion(false);
              
              const url = `${window.location.origin}/preview?t=${now.getTime()}`;
              setLatestPreviewUrl(url);

          } catch (e: any) {
              if (e.message === 'Failed to fetch') {
                  throw new Error("Network Error: Could not reach GitHub. Check CORS/AdBlocker.");
              }
              if (retriesLeft > 0) {
                 await new Promise(r => setTimeout(r, 1000));
                 return attemptPush(retriesLeft - 1);
              }
              throw e;
          }
      };

      try {
          // 1. PUSH (PUT)
          await attemptPush(3);
          
          // Log Push Success
          await updateSyncLog({ 
            action: 'Push', 
            status: 'Success', 
            message: commitMessage, 
            author: currentUser
          });

          // 2. TRIGGER HOOKS
          const deployHook = localStorage.getItem('vercel_deploy_hook');
          if (deployHook) {
              fetch(deployHook, { method: 'POST', mode: 'no-cors' }).catch(e => console.warn("Deploy hook failed", e));
          }

          // 3. PULL (FETCH) - Verify
          await new Promise(r => setTimeout(r, 1000));
          const pulled = await fetchData(true);
          
          if (pulled) {
             await updateSyncLog({ 
                action: 'Pull', 
                status: 'Success', 
                message: 'Verified update from remote', 
                author: 'System'
             });
          }

      } catch (e: any) {
          console.error("Sync Data Failed", e);
          // Log Failure
          await updateSyncLog({ 
            action: 'Push', 
            status: 'Failed', 
            message: e.message || 'Unknown Error', 
            author: currentUser
          });
          throw e; // Re-throw to UI
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

  // --- Lifecycle ---
  useEffect(() => {
      fetchData();
      const interval = setInterval(() => {
          fetchData(true);
      }, 30000); // Relaxed polling to 30s
      return () => clearInterval(interval);
  }, [fetchData]);

  // --- CRUD Wrappers ---
  const updateProject = (id: string, data: Partial<Project>) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };
  const addProject = (p: Project) => setProjects(prev => [p, ...prev]);
  const deleteProject = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));
  
  const updateExperience = (id: string, data: Partial<Experience>) => {
      setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };
  const addExperience = (e: Experience) => setExperience(prev => [e, ...prev]);
  const deleteExperience = (id: string) => setExperience(prev => prev.filter(e => e.id !== id));
  const reorderExperience = (items: Experience[]) => setExperience(items);

  const updateClient = (id: string, data: Partial<Client>) => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };
  const addClient = (c: Client) => setClients(prev => [...prev, c]);
  const deleteClient = (id: string) => setClients(prev => prev.filter(c => c.id !== id));

  const updateSkill = (id: string, data: Partial<SkillCategory>) => {
      setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };
  const addSkill = (s: SkillCategory) => setSkills(prev => [...prev, s]);
  const deleteSkill = (id: string) => setSkills(prev => prev.filter(s => s.id !== id));

  const updateConfig = (data: Partial<GlobalConfig>) => setConfig(prev => ({ ...prev, ...data }));
  const updateSocials = (data: SocialLink[]) => setSocials(data);

  const resetData = async () => {
      if (!confirm("Are you sure you want to reset to demo data? This will overwrite everything.")) return;
      setProjects(INITIAL_PROJECTS);
      setExperience(INITIAL_EXPERIENCE);
      setClients(INITIAL_CLIENTS);
      setSkills(INITIAL_SKILLS);
      setConfig(INITIAL_CONFIG);
      setSocials(INITIAL_SOCIALS);
      setTimeout(() => syncData("Reset to Demo Data"), 500);
  };

  // --- Helpers ---
  const verifyConnection = async () => {
      const { token, owner, repo } = getAuth();
      if (!token || !owner || !repo) return { success: false, message: "Missing Credentials" };
      try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
               const data = await res.json();
               setBranch(data.default_branch);
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