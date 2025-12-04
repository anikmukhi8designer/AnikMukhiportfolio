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
  hasNewVersion: boolean;
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
  refreshAllClients: (commitMessage?: string) => Promise<string | null>;
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
        // Retry on Server Errors (5xx) or Rate Limits (403/429) if possible, though 403 might be permanent config error
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
            throw new Error(`Retryable Error: ${res.status}`);
        }
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
  const lastUpdatedRef = useRef<Date | null>(null);

  const [activeDataPath, setActiveDataPath] = useState('src/data.json');
  const [fileSha, setFileSha] = useState<string | null>(null);
  const fileShaRef = useRef<string | null>(null);
  
  const stateRef = useRef({ projects, experience, clients, skills, config, socials });

  // Sync refs
  useEffect(() => {
      stateRef.current = { projects, experience, clients, skills, config, socials };
  }, [projects, experience, clients, skills, config, socials]);

  useEffect(() => {
    fileShaRef.current = fileSha;
  }, [fileSha]);

  useEffect(() => {
      lastUpdatedRef.current = lastUpdated;
  }, [lastUpdated]);

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

    // Cache buster
    const cacheBuster = `?update=${timestamp}`;
    const refParam = branch ? `&ref=${branch}` : '';
    
    // --- Strategy 1: Admin Direct Access (Priority: GitHub API with Token) ---
    // Best for Admin users as it uses the token to get fresh data immediately
    if (owner && repo && token) {
        try {
            const headers: HeadersInit = {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${token}`
            };
            
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
             // Fall through
        }
    }
    
    // --- Strategy 2: Vercel/Next.js API Proxy (Guest - Production) ---
    // Primary strategy for guests. Using proxy avoids CORS and Rate Limits (if server has token).
    // Prioritized over Public API to avoid rate limits.
    try {
        const proxyUrl = `/api/data?path=${path}&t=${timestamp}`;
        const response = await fetch(proxyUrl, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        
        if (response.ok) {
            const content = await response.json();
            
            // Handle proxy 404 (file not found) by trying root path
            if (content.error && content.status === 404 && path === 'src/data.json') {
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
        // Fall through
    }

    // --- Strategy 3: Public GitHub API (Guest - Local/Rate-Limited) ---
    // Fallback if Proxy is down (e.g. static export or local dev without server).
    if (owner && repo && !token) {
        try {
             // Try src/data.json
             let apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?t=${timestamp}${refParam}`;
             let response = await fetch(apiUrl, { 
                 headers: { 'Accept': 'application/vnd.github.v3+json' },
                 cache: 'no-store'
             });
             
             if (response.status === 404 && path === 'src/data.json') {
                 // Try data.json
                 const rootPath = 'data.json';
                 apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${rootPath}?t=${timestamp}${refParam}`;
                 response = await fetch(apiUrl, { 
                     headers: { 'Accept': 'application/vnd.github.v3+json' },
                     cache: 'no-store'
                 });
             }
 
             if (response.ok) {
                 const data = await response.json();
                 handleDataSuccess(data, path, shouldApplyData, silent);
                 return true;
             }
        } catch(e) {
            // Fall through
        }
     }

    // --- Strategy 4: Raw GitHub Content (Fallback - Heavily Cached) ---
    // Last resort. 
    if (owner && repo) {
        try {
            // Raw URL typically has 5min cache. Adding timestamp helps sometimes but not always.
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}?t=${timestamp}`;
            const rawRes = await fetch(rawUrl, { cache: 'no-store' });
            
            if (rawRes.ok) {
                const rawData = await rawRes.json();
                handleDataSuccess(rawData, path, shouldApplyData, silent);
                return true;
            } else if (path === 'src/data.json') {
                // Try root data.json
                 const rawUrlRoot = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/data.json?t=${timestamp}`;
                 const rawResRoot = await fetch(rawUrlRoot, { cache: 'no-store' });
                 if (rawResRoot.ok) {
                    const rawDataRoot = await rawResRoot.json();
                    handleDataSuccess(rawDataRoot, 'data.json', shouldApplyData, silent);
                    return true;
                 }
            }
        } catch (e) {
             // Fall through
        }
    }
    
    if (!silent) setIsLoading(false);
    return false;
  }, [activeDataPath, branch]);

  const handleDataSuccess = (data: any, path: string, shouldApplyData: boolean, silent: boolean) => {
      let applyNow = shouldApplyData;
      const isAdmin = !!localStorage.getItem('github_token');
      
      let incomingContent = data;
      // Handle Base64 from API
      if (data.content && data.encoding === 'base64') {
          try {
              const cleanContent = data.content.replace(/\s/g, '');
              const decodedContent = decodeURIComponent(escape(atob(cleanContent)));
              incomingContent = JSON.parse(decodedContent);
          } catch(e) { 
              console.error("Parse error", e); 
              return;
          }
      }

      // VERSION DETECTION LOGIC
      let isNew = false;

      // 1. Check SHA (API strategies)
      if (data.sha || data._sha) {
          const newSha = data.sha || data._sha;
          if (fileShaRef.current && fileShaRef.current !== newSha) {
               isNew = true;
          }
          // Always update SHA if present
          if (applyNow || isNew) {
               setFileSha(newSha);
          }
      } 
      // 2. Check Timestamp (Raw strategy - no SHA available usually)
      else if (incomingContent.lastUpdated && lastUpdatedRef.current) {
          const newDate = new Date(incomingContent.lastUpdated);
          const oldDate = new Date(lastUpdatedRef.current);
          if (newDate.getTime() > oldDate.getTime()) {
              isNew = true;
          }
      }

      // DECISION: Apply or Notify
      if (isNew) {
          if (!isAdmin) {
               // Guest: Auto-apply always
               applyNow = true;
          } else {
               // Admin: Notify, don't auto-apply to prevent conflict
               setHasNewVersion(true);
               if (!applyNow) return; 
          }
      }

      if (applyNow) {
          setHasNewVersion(false);
          if (path !== activeDataPath) setActiveDataPath(path);
          applyData(incomingContent);
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

  const updateSyncLog = async (previewUrl: string) => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      const logPath = 'public/admin/sync-log.json';
      
      if (!owner || !repo || !token) return;

      try {
          let existingLogs: SyncLogEntry[] = [];
          let logSha = '';

          const getRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}?ref=${branch}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
          }, 1);

          if (getRes.ok) {
              const data = await getRes.json();
              logSha = data.sha;
              try {
                  const content = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
                  existingLogs = JSON.parse(content);
              } catch (e) {}
          }

          const newEntry: SyncLogEntry = {
              id: self.crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              previewUrl,
              author: localStorage.getItem('github_owner') || 'Admin'
          };
          
          const updatedLogs = [newEntry, ...existingLogs].slice(0, 50); 
          const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(updatedLogs, null, 2))));

          const body: any = {
              message: `Sync Log Update: ${newEntry.timestamp}`,
              content: contentBase64,
              branch: branch 
          };
          if (logSha) body.sha = logSha;

          await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}`, {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(body)
          }, 1);
      } catch (e) { console.warn("Log update failed", e); }
  };

  const saveToGitHub = async (isManualSync = false, customMessage?: string) => {
    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
    }

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
        // 1. Create Blob
        const blobRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: contentString, encoding: 'utf-8' })
        });
        const blobData = await blobRes.json();

        // 2. Get Latest Commit
        const commitsRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let parentSha = '';
        let baseTreeSha = '';

        if (commitsRes.ok) {
            const commitData = await commitsRes.json();
            parentSha = commitData.sha;
            baseTreeSha = commitData.commit.tree.sha;
        }

        // 3. Create Tree
        const treeRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: [{ path: activeDataPath, mode: '100644', type: 'blob', sha: blobData.sha }]
            })
        });
        const treeData = await treeRes.json();
        
        // 4. Create Commit
        const message = customMessage || `CMS Update: ${now.toLocaleString()}`;
        const commitRes = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                tree: treeData.sha,
                parents: parentSha ? [parentSha] : []
            })
        });
        const newCommitData = await commitRes.json();

        // 5. Update Reference (Push)
        await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ sha: newCommitData.sha })
        });

        setLastUpdated(now);
        fetchFromGitHub(false, true); 
        
        if (isManualSync) {
             const url = `${window.location.origin}/preview?update=${now.getTime()}`;
             setLatestPreviewUrl(url);
             await updateSyncLog(url);
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

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    triggerSave();
  };

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
    triggerSave();
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    triggerSave();
  };

  const updateExperience = (id: string, data: Partial<Experience>) => {
    setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    triggerSave();
  };

  const addExperience = (exp: Experience) => {
    setExperience(prev => [exp, ...prev]);
    triggerSave();
  };

  const deleteExperience = (id: string) => {
    setExperience(prev => prev.filter(e => e.id !== id));
    triggerSave();
  };

  const reorderExperience = (items: Experience[]) => {
    setExperience(items);
    triggerSave();
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    triggerSave();
  };

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
    triggerSave();
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    triggerSave();
  };

  const updateSkill = (id: string, data: Partial<SkillCategory>) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    triggerSave();
  };

  const addSkill = (skill: SkillCategory) => {
    setSkills(prev => [...prev, skill]);
    triggerSave();
  };

  const deleteSkill = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    triggerSave();
  };

  const updateConfig = (data: Partial<GlobalConfig>) => {
    setConfig(prev => ({ ...prev, ...data }));
    triggerSave();
  };

  const updateSocials = (data: SocialLink[]) => {
    setSocials(data);
    triggerSave();
  };

  const resetData = async () => {
    setProjects(INITIAL_PROJECTS);
    setExperience(INITIAL_EXPERIENCE);
    setClients(INITIAL_CLIENTS);
    setSkills(INITIAL_SKILLS);
    setConfig(INITIAL_CONFIG);
    setSocials(INITIAL_SOCIALS);
    stateRef.current = { 
        projects: INITIAL_PROJECTS, 
        experience: INITIAL_EXPERIENCE, 
        clients: INITIAL_CLIENTS, 
        skills: INITIAL_SKILLS, 
        config: INITIAL_CONFIG, 
        socials: INITIAL_SOCIALS 
    };
    await saveToGitHub(false, "Reset to Demo Data");
  };

  const triggerSave = () => {
      if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true); 
      saveTimeoutRef.current = setTimeout(() => {
          saveToGitHub(false, "Auto-save").catch(err => console.error("Auto-save failed:", err));
      }, 3000); 
  };
  
  const getHistory = async (): Promise<CommitInfo[]> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      if (!owner || !repo || !token) return [];

      try {
          const response = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/commits?path=${activeDataPath}&sha=${branch}&per_page=10`, {
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'Cache-Control': 'no-cache'
              }
          });
          if (response.ok) {
              const data = await response.json();
              return data.map((item: any) => ({
                  sha: item.sha,
                  message: item.commit.message,
                  date: item.commit.committer.date,
                  author: item.commit.author.name
              }));
          }
      } catch (e) { }
      return [];
  };

  const restoreVersion = async (sha: string): Promise<void> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      if (!owner || !repo || !token) throw new Error("Config missing");

      const response = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/contents/${activeDataPath}?ref=${sha}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });

      if (response.ok) {
          const data = await response.json();
          try {
              const cleanContent = data.content.replace(/\s/g, '');
              const decodedContent = decodeURIComponent(escape(atob(cleanContent)));
              const content = JSON.parse(decodedContent);
              applyData(content);
              await saveToGitHub(false, `Rollback to version ${sha.substring(0, 7)}`); 
          } catch (e) {
              throw new Error("Failed to parse data");
          }
      }
  };

  const getSyncHistory = async (): Promise<SyncLogEntry[]> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      if (!owner || !repo || !token) return [];

      try {
          const res = await fetchWithRetry(`https://api.github.com/repos/${owner}/${repo}/contents/public/admin/sync-log.json?ref=${branch}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
          });
          if (res.ok) {
              const data = await res.json();
              const content = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
              const logs = JSON.parse(content);
              if (logs.length > 0) setLatestPreviewUrl(logs[0].previewUrl);
              return logs;
          }
      } catch (e) { }
      return [];
  };

  // Define reloadContent
  const reloadContent = useCallback(() => {
    fetchFromGitHub(true);
  }, [fetchFromGitHub]);

  // Polling for Real-Time Updates (Every 5 seconds)
  useEffect(() => {
    const init = async () => {
        await verifyConnection();
        fetchFromGitHub(true, false);
    };
    init();

    // Aggressive polling (5s) for real-time feel
    const interval = setInterval(() => {
        fetchFromGitHub(false, true);
    }, 5000);

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
      resetData, 
      refreshAllClients: (commitMessage?: string) => saveToGitHub(true, commitMessage),
      verifyConnection, fetchFromGitHub,
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