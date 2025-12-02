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

  const GITHUB_OWNER = getEnv('VITE_GITHUB_OWNER') || "anikmukhi8designer";
  const GITHUB_REPO = getEnv('VITE_GITHUB_REPO') || "AnikMukhiportfolio";
  const DATA_PATH = 'src/data.json';

  // --- GitHub Helpers ---
  
  const fetchFromGitHub = async (shouldApplyData = true) => {
    const token = getGitHubToken();
    
    // Prepare headers. If token exists, use it. If not, try public API access.
    const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'If-None-Match': '' // Disable caching
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // 1. Try fetching via API (Best for freshness)
      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        
        if (shouldApplyData) {
            // Decode base64 content
            try {
                const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
                applyData(content);
            } catch (err) {
                console.error("Error parsing GitHub data:", err);
            }
        }
        
        setFileSha(data.sha);
      } else {
        // 2. Fallback to Raw URL if API fails (e.g. Rate Limit exceeded for public user)
        if (shouldApplyData) {
            console.warn("GitHub API request failed (likely rate limit or private repo). Falling back to Raw content.");
            
            // Add timestamp to bust browser cache
            const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${DATA_PATH}?t=${Date.now()}`;
            const rawResponse = await fetch(rawUrl);
            
            if (rawResponse.ok) {
                const content = await rawResponse.json();
                applyData(content);
            } else {
                console.log("Could not fetch data from GitHub. Using default/initial data.");
            }
        }
      }
    } catch (error) {
      console.error("Failed to fetch from GitHub:", error);
    }
  };

  const applyData = (content: any) => {
      if (content.projects) setProjects(content.projects);
      if (content.experience) setExperience(content.experience);
      if (content.clients) setClients(content.clients);
      if (content.skills) setSkills(content.skills);
      if (content.config) setConfig(content.config);
      if (content.socials) setSocials(content.socials);
      
      if (content.lastUpdated) {
          const date = new Date(content.lastUpdated);
          setLastUpdated(date);
          localStorage.setItem('cms_last_updated', date.toISOString());
      }
  };

  const saveToGitHub = async () => {
    const token = getGitHubToken();
    if (!token) {
        console.warn("Missing GitHub Token - cannot save.");
        setIsSaving(false);
        return;
    }

    setIsSaving(true);
    const now = new Date();
    
    // Use the latest state from ref
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

    // Safe Base64 encoding for UTF-8 characters
    const contentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

    try {
      const body: any = {
        message: `CMS Update: ${now.toLocaleString()}`,
        content: contentBase64
      };

      if (fileSha) {
        body.sha = fileSha;
      }

      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        setFileSha(data.content.sha);
        setLastUpdated(now);
        localStorage.setItem('cms_last_updated', now.toISOString());
        console.log("GitHub Sync Successful");
      } else {
        const err = await response.json();
        console.error("GitHub Save Failed:", err);
        // If 409 Conflict (SHA mismatch), usually implies someone else pushed.
        if (response.status === 409 || response.status === 422) {
             console.warn("SHA mismatch or missing. Fetching latest SHA to resolve...");
             // Pass false to avoid overwriting local changes with remote data
             // We just want to get the new SHA so the next save succeeds
             // await fetchFromGitHub(false); // Can lead to loop if not careful, just refresh SHA
             const shaRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             if(shaRes.ok) {
                 const shaData = await shaRes.json();
                 setFileSha(shaData.sha);
                 // We don't retry immediately to avoid loops, next user action will succeed
             }
        }
      }
    } catch (error) {
      console.error("Error saving to GitHub:", error);
    } finally {
        setIsSaving(false);
    }
  };

  // --- Initialization ---
  useEffect(() => {
    fetchFromGitHub(true); // Initial load: we want the data
  }, []);

  // --- Actions ---

  const triggerSave = () => {
      // Debounce the save operation to prevent API rate limiting
      if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
      }
      setIsSaving(true); // Indicate pending save
      saveTimeoutRef.current = setTimeout(() => {
          saveToGitHub();
      }, 2000); // Wait 2 seconds of inactivity before saving
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
    if (confirm("⚠️ WARNING: This will overwrite your GitHub data file with the default demo data. Continue?")) {
        setProjects(INITIAL_PROJECTS);
        setExperience(INITIAL_EXPERIENCE);
        setClients(INITIAL_CLIENTS);
        setSkills(INITIAL_SKILLS);
        setConfig(INITIAL_CONFIG);
        setSocials(INITIAL_SOCIALS);
        
        // Immediate save for reset
        stateRef.current = { 
            projects: INITIAL_PROJECTS, 
            experience: INITIAL_EXPERIENCE, 
            clients: INITIAL_CLIENTS, 
            skills: INITIAL_SKILLS, 
            config: INITIAL_CONFIG, 
            socials: INITIAL_SOCIALS 
        };
        await saveToGitHub();
        alert("Data reset to defaults.");
    }
  };

  // Forces a Push to GitHub to ensure the file in the repo matches the current App state
  const refreshAllClients = async () => {
      let token = getGitHubToken();

      if (!token) {
          const userInput = prompt("GitHub Token is missing.\n\nPlease enter your GitHub Personal Access Token (with 'repo' scope) to enable syncing:");
          if (userInput) {
              // Save to localStorage so they don't have to enter it again this session
              localStorage.setItem('github_token', userInput.trim());
              token = userInput.trim();
              
              // Try to fetch first to get the latest SHA
              await fetchFromGitHub(false);
          } else {
              alert("Sync cancelled. Token is required.");
              return;
          }
      }

      try {
          if (!fileSha) {
             await fetchFromGitHub(false);
          }
          await saveToGitHub();
          alert("Data successfully synced to GitHub!");
      } catch (e) {
          console.error(e);
          alert("Sync failed. See console.");
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
      resetData, refreshAllClients
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