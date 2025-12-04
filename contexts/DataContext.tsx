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

  // --- Core Logic: Fetch ---
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
                // Determine if we auto-apply
                // If user is Admin (has token), we warn them. If Guest, we auto-update.
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
    } catch (e) {
        if (!silent) console.warn("Fetch failed:", e);
    } finally {
        if (!silent) setIsLoading(false);
    }
  }, [branch, fileSha]);

  // --- Core Logic: Save with Retry ---
  const syncData = async (commitMessage = "Update from CMS") => {
      const { token, owner, repo } = getAuth();
      if (!token || !owner || !repo) throw new Error("Missing configuration");

      setIsSaving(true);
      const now = new Date();
      
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

      // Recursive attempt function to handle 409 Conflicts (Stale SHA)
      const attemptSave = async (retriesLeft: number): Promise<void> => {
          try {
              // 1. Get FRESH SHA (No Cache)
              let currentSha: string | undefined = undefined;
              try {
                  const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/src/data.json?ref=${branch}&t=${Date.now()}`, {
                      headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                      },
                      cache: 'no-store'
                  });
                  if (getRes.ok) {
                      const currentFile = await getRes.json();
                      currentSha = currentFile.sha;
                  }
              } catch(e) { /* ignore 404, file might create new */ }

              // 2. PUT new content
              const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/src/data.json`, {
                  method: 'PUT',
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      message: commitMessage,
                      content: contentBase64,
                      sha: currentSha, // Must match exact SHA on server
                      branch: branch
                  })
              });

              // HANDLE CONFLICT (409) -> RETRY
              if (putRes.status === 409 && retriesLeft > 0) {
                  console.warn(`SHA Conflict (409). Retrying... (${retriesLeft} attempts left)`);
                  await new Promise(r => setTimeout(r, 800)); // Backoff
                  return attemptSave(retriesLeft - 1);
              }

              if (!putRes.ok) {
                  const errData = await putRes.json();
                  throw new Error(errData.message || "Failed to sync to GitHub");
              }

              const result = await putRes.json();
              setFileSha(result.content.sha);
              setLastUpdated(now);
              setHasNewVersion(false);
              
              // 3. Trigger Vercel Deploy Hook (if configured)
              const deployHook = localStorage.getItem('vercel_deploy_hook');
              if (deployHook) {
                  try {
                      // Important: mode 'no-cors' allows the request to be sent from browser without CORS errors
                      await fetch(deployHook, { method: 'POST', mode: 'no-cors' });
                      console.log("Vercel Deploy Hook triggered (no-cors mode)");
                  } catch (e) {
                      console.warn("Failed to trigger deploy hook", e);
                  }
              }
              
              // 4. Update Sync Log
              const url = `${window.location.origin}/preview?t=${now.getTime()}`;
              setLatestPreviewUrl(url);
              // Fire and forget log update to avoid blocking UI completion
              updateSyncLog(url, branch).catch(err => console.warn("Log update warning:", err));

          } catch (e) {
              if (retriesLeft > 0) {
                 // Retry on network errors too
                 await new Promise(r => setTimeout(r, 1000));
                 return attemptSave(retriesLeft - 1);
              }
              throw e;
          }
      };

      try {
          await attemptSave(3); // Start with 3 retries
      } catch (e: any) {
          console.error(e);
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

  // --- Lifecycle ---
  useEffect(() => {
      // 1. Initial Load
      fetchData();

      // 2. Polling (Heartbeat) - Every 10s
      const interval = setInterval(() => {
          fetchData(true);
      }, 10000);

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
      setProjects(INITIAL_PROJECTS);
      setExperience(INITIAL_EXPERIENCE);
      setClients(INITIAL_CLIENTS);
      setSkills(INITIAL_SKILLS);
      setConfig(INITIAL_CONFIG);
      setSocials(INITIAL_SOCIALS);
      // Trigger a save immediately to reset remote
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
               return { success: true, message: "Connected" };
          }
          return { success: false, message: "Failed to connect to repo" };
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
          // Auto-save the restored version as the new current
          setTimeout(() => syncData(`Restored version ${sha.substring(0,7)}`), 500);
      }
  };
  
  const updateSyncLog = async (url: string, currentBranch: string) => {
      const { token, owner, repo } = getAuth();
      if (!token) return;
      
      const logPath = 'public/admin/sync-log.json';
      let logs: SyncLogEntry[] = [];
      let sha = '';

      try {
        const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}?ref=${currentBranch}&t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' },
            cache: 'no-store'
        });
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            logs = JSON.parse(atob(data.content.replace(/\s/g, '')));
        }
      } catch (e) {}

      const newEntry = {
          id: self.crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          previewUrl: url,
          author: localStorage.getItem('github_owner') || 'Admin'
      };
      
      const newContent = btoa(JSON.stringify([newEntry, ...logs].slice(0, 20), null, 2));
      
      // Retry logic for log update as well
      const attemptLogUpdate = async (retries: number) => {
          try {
              const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}`, {
                  method: 'PUT',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      message: 'Log Update',
                      content: newContent,
                      sha: sha || undefined,
                      branch: currentBranch
                  })
              });
              
              if (res.status === 409 && retries > 0) {
                   // Refresh SHA and retry
                   const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}?ref=${currentBranch}&t=${Date.now()}`, {
                        headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
                   });
                   if (getRes.ok) {
                        const data = await getRes.json();
                        sha = data.sha;
                        await attemptLogUpdate(retries - 1);
                   }
              }
          } catch(e) {
              if (retries > 0) await attemptLogUpdate(retries - 1);
          }
      };

      await attemptLogUpdate(2);
  };

  const getSyncHistory = async () => {
      const { token, owner, repo } = getAuth();
      if (!token) return [];
      
      const logPath = 'public/admin/sync-log.json';
      try {
        const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}?ref=${branch}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' },
            cache: 'no-store'
        });
        if (getRes.ok) {
            const data = await getRes.json();
            const logs = JSON.parse(atob(data.content.replace(/\s/g, '')));
            return logs;
        }
      } catch (e) {}
      return [];
  };

  return (
    <DataContext.Provider value={{
        projects, experience, clients, skills, config, socials,
        lastUpdated, isSaving, isLoading, error, branch, hasNewVersion,
        reloadContent: () => fetchData(),
        syncData, resetData,
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