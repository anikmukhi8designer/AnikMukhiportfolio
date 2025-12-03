import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
  refreshAllClients: () => Promise<void>;
  verifyConnection: () => Promise<{ success: boolean; message: string }>;
  
  // New History Methods
  getHistory: () => Promise<CommitInfo[]>;
  restoreVersion: (sha: string) => Promise<void>;

  // Sync Log Methods
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
    } catch(e) {
        console.warn('Environment access error:', e);
    }
    return '';
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [experience, setExperience] = useState<Experience[]>(INITIAL_EXPERIENCE);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [skills, setSkills] = useState<SkillCategory[]>(INITIAL_SKILLS);
  const [config, setConfig] = useState<GlobalConfig>(INITIAL_CONFIG);
  const [socials, setSocials] = useState<SocialLink[]>(INITIAL_SOCIALS);
  const [isSaving, setIsSaving] = useState(false);
  const [latestPreviewUrl, setLatestPreviewUrl] = useState<string | null>(null);
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const saved = localStorage.getItem('cms_last_updated');
    return saved ? new Date(saved) : null;
  });

  // Store the SHA of the data.json file to handle GitHub atomic updates
  const [fileSha, setFileSha] = useState<string | null>(null);
  
  // Track the valid path for data.json (src/data.json or data.json)
  const [activeDataPath, setActiveDataPath] = useState('src/data.json');

  // Ref to hold the timeout ID for debouncing
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs to access latest state inside the debounced function
  const stateRef = useRef({ projects, experience, clients, skills, config, socials });
  useEffect(() => {
      stateRef.current = { projects, experience, clients, skills, config, socials };
  }, [projects, experience, clients, skills, config, socials]);


  // Helper to get token from Env OR LocalStorage
  const getGitHubToken = () => {
      const env = getEnv('VITE_GITHUB_TOKEN');
      if (env) return env;
      return localStorage.getItem('github_token') || '';
  };

  // Helper to get Repo Config from Env OR LocalStorage
  const getGitHubConfig = () => {
      const owner = getEnv('VITE_GITHUB_OWNER') || localStorage.getItem('github_owner') || "";
      const repo = getEnv('VITE_GITHUB_REPO') || localStorage.getItem('github_repo') || "";
      return { owner, repo };
  };

  // --- GitHub Helpers ---

  const verifyConnection = async (): Promise<{ success: boolean; message: string }> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      
      if (!owner) return { success: false, message: "Missing Repository Owner" };
      if (!repo) return { success: false, message: "Missing Repository Name" };
      if (!token) return { success: false, message: "Missing GitHub Token" };

      try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/vnd.github.v3+json'
              }
          });
          
          if (res.ok) return { success: true, message: "Connection Successful" };
          
          if (res.status === 404) return { success: false, message: `Repository "${owner}/${repo}" not found. Check Settings.` };
          if (res.status === 401) return { success: false, message: "Invalid Token or Token expired." };
          if (res.status === 403) return { success: false, message: "Access Forbidden (403). Check Permissions." };
          
          return { success: false, message: `GitHub API Error: ${res.status}` };
      } catch (e: any) {
          return { success: false, message: e.message || "Network Error: Could not reach GitHub." };
      }
  };
  
  const fetchFromGitHub = async (shouldApplyData = true): Promise<boolean> => {
    const { owner, repo } = getGitHubConfig();
    const token = getGitHubToken();
    const timestamp = Date.now();
    let path = activeDataPath;

    // Check for explicit update param (from preview URL)
    const urlParams = new URLSearchParams(window.location.search);
    const updateTimestamp = urlParams.get('update');
    const fetchTimestamp = updateTimestamp || timestamp;

    // --- Strategy 1: Direct GitHub API (Admin Mode) ---
    if (owner && repo && token) {
        try {
            const headers: HeadersInit = {
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Authorization': `Bearer ${token}`
            };

            let apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?t=${fetchTimestamp}`;
            let response = await fetch(apiUrl, { headers });

            // Handle Path Fallback
            if (response.status === 404 && path === 'src/data.json') {
                path = 'data.json';
                apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?t=${fetchTimestamp}`;
                response = await fetch(apiUrl, { headers });
            }

            if (response.ok) {
                const data: any = await response.json();
                if (path !== activeDataPath) setActiveDataPath(path);
                setFileSha(data.sha);

                if (shouldApplyData) {
                    const cleanContent = data.content.replace(/\s/g, '');
                    const decodedContent = decodeURIComponent(escape(atob(cleanContent)));
                    const content = JSON.parse(decodedContent);
                    applyData(content);
                    console.log(`Data synced from GitHub API (${path})`);
                }
                return true;
            } 
        } catch (error) {
            console.warn("GitHub Admin API fetch failed, trying fallback...", error);
        }
    }

    // --- Strategy 2: Proxy API (Public/Preview Mode) ---
    try {
        const proxyUrl = `/api/data?path=${path}&t=${fetchTimestamp}`;
        const response = await fetch(proxyUrl, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store' }
        });
        
        if (response.ok) {
            const content = await response.json();
            
            if (content.error && path === 'src/data.json') {
                 // Retry with root path
                 const rootPathProxy = `/api/data?path=data.json&t=${fetchTimestamp}`;
                 const rootRes = await fetch(rootPathProxy, { cache: 'no-store' });
                 if (rootRes.ok) {
                     const rootContent = await rootRes.json();
                     if (!rootContent.error) {
                         setActiveDataPath('data.json');
                         if (shouldApplyData) {
                             applyData(rootContent);
                             console.log("Data synced from API Proxy (Root)");
                         }
                         return true;
                     }
                 }
            } else if (!content.error) {
                if (shouldApplyData) {
                    applyData(content);
                    console.log(`Data synced from API Proxy (${path})`);
                }
                return true;
            }
        }
    } catch (e) {
        console.warn("Proxy fetch failed:", e);
    }

    return false;
  };

  const applyData = (content: any) => {
      if (content.projects && Array.isArray(content.projects)) setProjects(content.projects);
      if (content.experience && Array.isArray(content.experience)) setExperience(content.experience);
      if (content.clients && Array.isArray(content.clients)) setClients(content.clients);
      if (content.skills && Array.isArray(content.skills)) setSkills(content.skills);
      if (content.config) setConfig(content.config);
      if (content.socials && Array.isArray(content.socials)) setSocials(content.socials);
      
      if (content.lastUpdated) {
          const date = new Date(content.lastUpdated);
          setLastUpdated(date);
          localStorage.setItem('cms_last_updated', date.toISOString());
      }
  };

  const updateSyncLog = async (previewUrl: string) => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      const logPath = 'public/admin/sync-log.json';
      
      if (!owner || !repo || !token) return;

      try {
          // 1. Fetch existing log
          let existingLogs: SyncLogEntry[] = [];
          let logSha = '';

          const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
          });

          if (getRes.ok) {
              const data = await getRes.json();
              logSha = data.sha;
              try {
                  const content = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
                  existingLogs = JSON.parse(content);
              } catch (e) { console.warn("Failed to parse sync log", e); }
          } else if (getRes.status === 404) {
              console.log("Creating new sync log file...");
          }

          // 2. Append new entry
          const newEntry: SyncLogEntry = {
              id: self.crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              previewUrl,
              author: localStorage.getItem('github_owner') || 'Admin'
          };
          
          const updatedLogs = [newEntry, ...existingLogs].slice(0, 50); // Keep last 50
          const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(updatedLogs, null, 2))));

          // 3. Save log
          const body: any = {
              message: `Sync Log Update: ${newEntry.timestamp}`,
              content: contentBase64,
              branch: 'main'
          };
          if (logSha) body.sha = logSha;

          await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${logPath}`, {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(body)
          });
          
      } catch (e) {
          console.error("Failed to update sync log:", e);
          // Don't throw, log failure shouldn't stop flow
      }
  };

  const saveToGitHub = async (isManualSync = false) => {
    // Clear pending debounce
    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
    }

    let { owner, repo } = getGitHubConfig();
    const token = getGitHubToken();

    // Strict validation with helpful errors
    if (!owner) throw new Error("Repository Owner is missing. Check Settings.");
    if (!repo) throw new Error("Repository Name is missing. Check Settings.");
    if (!token) throw new Error("GitHub Token is missing. Please login again.");

    setIsSaving(true);
    const now = new Date();

    const content = {
      projects, experience, clients, skills, config, socials,
      lastUpdated: now.toISOString()
    };
    
    // Prepare Content
    const contentString = JSON.stringify(content, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));

    try {
      // FORCE FRESH SHA CHECK
      // We explicitly check for the file's existence and SHA before every write operation.
      // This solves "sha wasn't supplied" errors caused by state mismatches.
      
      let targetPath = activeDataPath; 
      let shaToUse = null;

      try {
          // 1. Check Primary Path (activeDataPath)
          const res1 = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store' }
          });
          
          if (res1.ok) {
              const data = await res1.json();
              shaToUse = data.sha;
          } else if (res1.status === 404) {
              // 2. If Primary is 'src/data.json' and not found, check Root 'data.json'
              if (targetPath === 'src/data.json') {
                  const res2 = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data.json`, {
                      method: 'GET',
                      headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store' }
                  });
                  if (res2.ok) {
                      const data = await res2.json();
                      shaToUse = data.sha;
                      targetPath = 'data.json';
                      setActiveDataPath('data.json'); // Correct state for future
                  }
              }
          }
      } catch (e) {
          console.warn("SHA Check Network Error", e);
          // If network check fails, fallback to state as last resort
          shaToUse = fileSha; 
      }

      // Construct Payload
      const body: any = {
        message: `CMS Update: ${now.toLocaleString()}`,
        content: contentBase64,
        branch: 'main'
      };
      
      // CRITICAL: Attach SHA if we found one
      if (shaToUse) {
          body.sha = shaToUse;
      }

      // Perform PUT
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data: any = await response.json();
        setFileSha(data.content.sha); // Update state with new SHA
        setLastUpdated(now);
        localStorage.setItem('cms_last_updated', now.toISOString());
        
        // 3. Handle Sync Log & Redirect (Only for Manual Sync/Broadcast)
        if (isManualSync) {
            const previewUrl = `${window.location.origin}/preview?update=${now.getTime()}`;
            setLatestPreviewUrl(previewUrl);
            
            // Wait for log update but don't fail if it errors
            await updateSyncLog(previewUrl);
            
            // Redirect
            window.location.href = previewUrl;
        } else {
             // Warm up proxy silently for auto-saves
             try { fetch(`/api/data?path=${targetPath}&t=${Date.now()}`, { cache: 'no-store' }); } catch(e){}
        }
        
      } else {
        // Error Handling
        if (response.status === 404) {
             throw new Error(`Repository not found (${owner}/${repo}). Please check your settings.`);
        }
        if (response.status === 401) {
            throw new Error("Invalid GitHub Token. Please re-authenticate.");
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `GitHub Error: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error saving to GitHub:", error);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
          throw new Error("Network Error: Could not connect to GitHub. Check internet connection.");
      }
      throw error;
    } finally {
        setIsSaving(false);
    }
  };

  const getSyncHistory = async (): Promise<SyncLogEntry[]> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      if (!owner || !repo || !token) return [];

      try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/public/admin/sync-log.json`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
          });
          if (res.ok) {
              const data = await res.json();
              const content = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
              const logs = JSON.parse(content);
              if (logs.length > 0) setLatestPreviewUrl(logs[0].previewUrl);
              return logs;
          }
      } catch (e) { console.warn("No sync history found"); }
      return [];
  };

  // --- Version History Methods ---
  const getHistory = async (): Promise<CommitInfo[]> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      
      if (!owner || !repo || !token) return [];

      try {
          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?path=${activeDataPath}&per_page=10`, {
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
      } catch (e) { console.error("Error fetching history", e); }
      return [];
  };

  const restoreVersion = async (sha: string): Promise<void> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      if (!owner || !repo || !token) throw new Error("Config missing");

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${activeDataPath}?ref=${sha}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
      });

      if (response.ok) {
          const data = await response.json();
          try {
              const cleanContent = data.content.replace(/\s/g, '');
              const decodedContent = decodeURIComponent(escape(atob(cleanContent)));
              const content = JSON.parse(decodedContent);
              applyData(content);
              // Trigger a save to make this restored version the current one
              saveToGitHub(false); 
              alert("Version restored successfully. A new commit has been created.");
          } catch (e) {
              throw new Error("Failed to parse historical data");
          }
      } else {
          throw new Error("Failed to fetch version");
      }
  };

  // --- Initialization ---
  useEffect(() => {
    fetchFromGitHub(true);
    getSyncHistory(); // Fetch logs on init
  }, []);

  // --- Actions ---

  const triggerSave = () => {
      if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true); 
      // 2-second debounce for auto-save
      saveTimeoutRef.current = setTimeout(() => {
          saveToGitHub(false).catch(err => console.error("Auto-save failed:", err));
      }, 2000); 
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
    setClients(prev => [client, ...prev]);
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
    if (confirm("Reset to default data? This will overwrite your current changes.")) {
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
        await saveToGitHub(false);
    }
  };

  // Called when "Sync Data" is clicked
  const refreshAllClients = async () => {
      try {
          await saveToGitHub(true); // Pass true to trigger Log update + Redirect
      } catch (e: any) {
          throw e;
      }
  };

  return (
    <DataContext.Provider value={{
      projects, experience, clients, skills, lastUpdated, config, socials, isSaving,
      updateProject, addProject, deleteProject,
      updateExperience, addExperience, deleteExperience, reorderExperience,
      updateClient, addClient, deleteClient,
      updateSkill, addSkill, deleteSkill,
      updateConfig, updateSocials,
      resetData, refreshAllClients,
      getHistory, restoreVersion,
      getSyncHistory, latestPreviewUrl,
      verifyConnection
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