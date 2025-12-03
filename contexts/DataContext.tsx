import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Project, Experience, Client, SkillCategory, GlobalConfig, SocialLink } from '../types';
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
  
  // New History Methods
  getHistory: () => Promise<CommitInfo[]>;
  restoreVersion: (sha: string) => Promise<void>;
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
  
  const fetchFromGitHub = async (shouldApplyData = true): Promise<boolean> => {
    const { owner, repo } = getGitHubConfig();

    if (!owner || !repo) {
        return false;
    }

    const token = getGitHubToken();
    
    // STRICT Cache Busting Headers
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const timestamp = Date.now();
    
    // Try Default Path first, then fallback
    let path = activeDataPath;
    let apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?t=${timestamp}`;

    try {
      let response = await fetch(apiUrl, { headers });

      // If 404, check if we are using the default 'src/data.json' and try 'data.json' instead
      if (response.status === 404 && path === 'src/data.json') {
          console.log("src/data.json not found, trying data.json...");
          path = 'data.json';
          apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?t=${timestamp}`;
          response = await fetch(apiUrl, { headers });
      }

      if (response.ok) {
        const data: any = await response.json();
        
        // Update active path for future saves
        if (path !== activeDataPath) {
            setActiveDataPath(path);
        }
        
        // Update SHA regardless of applying data
        setFileSha(data.sha);

        if (shouldApplyData) {
            try {
                // Remove newlines/whitespace from base64
                const cleanContent = data.content.replace(/\s/g, '');
                // Decode UTF-8 safely
                const decodedContent = decodeURIComponent(escape(atob(cleanContent)));
                const content = JSON.parse(decodedContent);
                applyData(content);
                console.log(`Data synced from GitHub (${path})`);
            } catch (err) {
                console.error("Error parsing GitHub data:", err);
                throw new Error("Data file is corrupt or invalid JSON");
            }
        }
        return true;
      } else {
          // If 404 still, it means no data file exists at all
          if (response.status === 404) {
             console.warn("No data.json found in repo. First save will create it.");
             return false; // Not a fatal error, just means we start fresh
          }
          if (response.status === 401) throw new Error("Unauthorized: Invalid Token");
          if (response.status === 403) throw new Error("Forbidden: Check Scope or Rate Limit");
          
          console.warn(`GitHub API Error: ${response.status}`);
          throw new Error(`GitHub Error ${response.status}`);
      }
    } catch (error: any) {
      console.warn("GitHub API fetch failed:", error);
      if (error.message.includes("Unauthorized")) throw error;
      if (error.message.includes("Forbidden")) throw error;
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

  const saveToGitHub = async () => {
    // Clear pending debounce
    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
    }

    let { owner, repo } = getGitHubConfig();

    if (!owner || !repo) {
        console.warn("Repo not configured");
        setIsSaving(false);
        return;
    }

    const token = getGitHubToken();
    if (!token) {
        console.warn("Missing GitHub Token");
        setIsSaving(false);
        return;
    }

    setIsSaving(true);
    const now = new Date();
    
    // Get latest state
    const { projects, experience, clients, skills, config, socials } = stateRef.current;

    const content = {
      projects,
      experience,
      clients,
      skills,
      config,
      socials,
      lastUpdated: now.toISOString()
    };

    const contentString = JSON.stringify(content, null, 2);
    // Standard base64 encode for UTF-8
    const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));

    try {
      // 1. Ensure we have the latest SHA before saving to avoid 409 Conflict
      let currentSha = fileSha;
      if (!currentSha) {
          // Try to fetch SHA from active path
          const shaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${activeDataPath}`, {
             headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
          });
          if (shaRes.ok) {
              const shaData = await shaRes.json();
              currentSha = shaData.sha;
          } else if (shaRes.status === 404 && activeDataPath === 'src/data.json') {
               // Double check if it exists at root
               const rootRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/data.json`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
                });
                if (rootRes.ok) {
                    const rootData = await rootRes.json();
                    currentSha = rootData.sha;
                    setActiveDataPath('data.json'); // Switch to root for saving
                }
          }
      }

      const body: any = {
        message: `CMS Update: ${now.toLocaleString()}`,
        content: contentBase64,
        branch: 'main'
      };

      if (currentSha) {
        body.sha = currentSha;
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${activeDataPath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data: any = await response.json();
        setFileSha(data.content.sha); // Update SHA immediately for next save
        setLastUpdated(now);
        localStorage.setItem('cms_last_updated', now.toISOString());
        console.log("GitHub Save Successful");
      } else {
        const err = await response.json();
        console.error("GitHub Save Failed:", err);
        // Retry logic if SHA mismatch (409)
        if (response.status === 409) {
             console.log("SHA Mismatch, refetching and retrying...");
             const retryShaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${activeDataPath}?t=${Date.now()}`, {
                 headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache' }
             });
             
             if(retryShaRes.ok) {
                 const retryShaData = await retryShaRes.json();
                 body.sha = retryShaData.sha;
                 
                 const retryResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${activeDataPath}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                  });
                  
                  if (retryResponse.ok) {
                      const retryData = await retryResponse.json();
                      setFileSha(retryData.content.sha);
                      setLastUpdated(now);
                      localStorage.setItem('cms_last_updated', now.toISOString());
                      console.log("GitHub Save Successful (Retry)");
                  }
             }
        }
      }
    } catch (error) {
      console.error("Error saving to GitHub:", error);
    } finally {
        setIsSaving(false);
    }
  };

  // --- Version History Methods ---

  const getHistory = async (): Promise<CommitInfo[]> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      
      if (!owner || !repo || !token) return [];

      // Use activeDataPath
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
      } catch (e) {
          console.error("Error fetching history", e);
      }
      return [];
  };

  const restoreVersion = async (sha: string): Promise<void> => {
      const { owner, repo } = getGitHubConfig();
      const token = getGitHubToken();
      if (!owner || !repo || !token) throw new Error("Config missing");

      // Use activeDataPath
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${activeDataPath}?ref=${sha}`, {
          headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/vnd.github.v3+json'
          }
      });

      if (response.ok) {
          const data = await response.json();
          try {
              const cleanContent = data.content.replace(/\s/g, '');
              const decodedContent = decodeURIComponent(escape(atob(cleanContent)));
              const content = JSON.parse(decodedContent);
              
              applyData(content);
              triggerSave(); 
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
    // Attempt fetch. If it returns false, it might just mean file doesn't exist yet, which is fine for new setup.
    fetchFromGitHub(true); 
  }, []);

  // --- Actions ---

  const triggerSave = () => {
      if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true); 
      // 2-second debounce to batch rapid edits
      saveTimeoutRef.current = setTimeout(() => {
          saveToGitHub();
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
        await saveToGitHub();
    }
  };

  const refreshAllClients = async () => {
      let token = getGitHubToken();

      if (!token) {
          const userInput = prompt("GitHub Token required for sync. Enter your Personal Access Token:");
          if (userInput) {
              localStorage.setItem('github_token', userInput.trim());
              token = userInput.trim();
          } else {
              throw new Error("No token provided");
          }
      }
      
      const { owner, repo } = getGitHubConfig();
      if (!owner || !repo) {
         throw new Error("Repository configuration missing. Go to Settings.");
      }

      // Force fetch with strict cache busting
      try {
          const success = await fetchFromGitHub(true);
          if (!success) {
              // Not necessarily an error, might just be empty repo
              console.log("No remote data found, keeping local data.");
          }
      } catch (e: any) {
          throw e; // Pass error up to Dashboard
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
      getHistory, restoreVersion
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