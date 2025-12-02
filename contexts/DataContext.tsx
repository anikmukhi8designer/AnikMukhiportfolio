import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Experience, Client, SkillCategory } from '../types';
import { 
  PROJECTS as INITIAL_PROJECTS, 
  EXPERIENCE as INITIAL_EXPERIENCE, 
  CLIENTS as INITIAL_CLIENTS, 
  SKILLS as INITIAL_SKILLS
} from '../data';

interface DataContextType {
  projects: Project[];
  experience: Experience[];
  clients: Client[];
  skills: SkillCategory[];
  lastUpdated: Date | null;
  
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
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    const saved = localStorage.getItem('cms_last_updated');
    return saved ? new Date(saved) : null;
  });

  // Store the SHA of the data.json file to handle GitHub atomic updates
  const [fileSha, setFileSha] = useState<string | null>(null);

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
  
  const fetchFromGitHub = async () => {
    const token = getGitHubToken();
    if (!token) return;

    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'If-None-Match': '' // Disable caching
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Decode base64 content
        const content = JSON.parse(decodeURIComponent(escape(atob(data.content))));
        
        setProjects(content.projects || INITIAL_PROJECTS);
        setExperience(content.experience || INITIAL_EXPERIENCE);
        setClients(content.clients || INITIAL_CLIENTS);
        setSkills(content.skills || INITIAL_SKILLS);
        setFileSha(data.sha);
        
        if (content.lastUpdated) {
            const date = new Date(content.lastUpdated);
            setLastUpdated(date);
            localStorage.setItem('cms_last_updated', date.toISOString());
        }
      } else if (response.status === 404) {
        console.log("Data file not found on GitHub. Initializing with default data...");
        setProjects(INITIAL_PROJECTS);
        setExperience(INITIAL_EXPERIENCE);
        setClients(INITIAL_CLIENTS);
        setSkills(INITIAL_SKILLS);
      }
    } catch (error) {
      console.error("Failed to fetch from GitHub:", error);
    }
  };

  const saveToGitHub = async (
    p: Project[], 
    e: Experience[], 
    c: Client[], 
    s: SkillCategory[]
  ) => {
    const token = getGitHubToken();
    if (!token) {
        console.warn("Missing GitHub Token - cannot save.");
        return;
    }

    const now = new Date();
    const content = {
      projects: p,
      experience: e,
      clients: c,
      skills: s,
      lastUpdated: now.toISOString()
    };

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
        if (response.status === 409 || response.status === 422) {
             console.warn("SHA mismatch or missing. Fetching latest to resolve...");
             await fetchFromGitHub();
        }
      }
    } catch (error) {
      console.error("Error saving to GitHub:", error);
    }
  };

  // --- Initialization ---
  useEffect(() => {
    fetchFromGitHub();
  }, []);

  // --- Actions ---

  const triggerSave = (p: Project[], e: Experience[], c: Client[], s: SkillCategory[]) => {
      saveToGitHub(p, e, c, s);
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    const newProjects = projects.map(p => p.id === id ? { ...p, ...data } : p);
    setProjects(newProjects);
    triggerSave(newProjects, experience, clients, skills);
  };
  
  const addProject = (project: Project) => {
    const newProjects = [project, ...projects];
    setProjects(newProjects);
    triggerSave(newProjects, experience, clients, skills);
  };
  
  const deleteProject = (id: string) => {
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    triggerSave(newProjects, experience, clients, skills);
  };

  const updateExperience = (id: string, data: Partial<Experience>) => {
    const newExp = experience.map(e => e.id === id ? { ...e, ...data } : e);
    setExperience(newExp);
    triggerSave(projects, newExp, clients, skills);
  };
  
  const addExperience = (exp: Experience) => {
    const newExp = [exp, ...experience];
    setExperience(newExp);
    triggerSave(projects, newExp, clients, skills);
  };
  
  const deleteExperience = (id: string) => {
    const newExp = experience.filter(e => e.id !== id);
    setExperience(newExp);
    triggerSave(projects, newExp, clients, skills);
  };
  
  const reorderExperience = (items: Experience[]) => {
    setExperience(items);
    triggerSave(projects, items, clients, skills);
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    const newClients = clients.map(c => c.id === id ? { ...c, ...data } : c);
    setClients(newClients);
    triggerSave(projects, experience, newClients, skills);
  };
  
  const addClient = (client: Client) => {
    const newClients = [client, ...clients];
    setClients(newClients);
    triggerSave(projects, experience, newClients, skills);
  };
  
  const deleteClient = (id: string) => {
    const newClients = clients.filter(c => c.id !== id);
    setClients(newClients);
    triggerSave(projects, experience, newClients, skills);
  };

  const updateSkill = (id: string, data: Partial<SkillCategory>) => {
    const newSkills = skills.map(s => s.id === id ? { ...s, ...data } : s);
    setSkills(newSkills);
    triggerSave(projects, experience, clients, newSkills);
  };
  
  const addSkill = (skill: SkillCategory) => {
    const newSkills = [...skills, skill];
    setSkills(newSkills);
    triggerSave(projects, experience, clients, newSkills);
  };
  
  const deleteSkill = (id: string) => {
    const newSkills = skills.filter(s => s.id !== id);
    setSkills(newSkills);
    triggerSave(projects, experience, clients, newSkills);
  };

  const resetData = async () => {
    if (confirm("⚠️ WARNING: This will overwrite your GitHub data file with the default demo data. Continue?")) {
        setProjects(INITIAL_PROJECTS);
        setExperience(INITIAL_EXPERIENCE);
        setClients(INITIAL_CLIENTS);
        setSkills(INITIAL_SKILLS);
        await saveToGitHub(INITIAL_PROJECTS, INITIAL_EXPERIENCE, INITIAL_CLIENTS, INITIAL_SKILLS);
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
              await fetchFromGitHub();
          } else {
              alert("Sync cancelled. Token is required.");
              return;
          }
      }

      try {
          if (!fileSha) {
             await fetchFromGitHub();
          }

          await saveToGitHub(projects, experience, clients, skills);
          alert("Data successfully synced to GitHub!");
      } catch (e) {
          console.error(e);
          alert("Sync failed. See console.");
      }
  };

  return (
    <DataContext.Provider value={{
      projects, experience, clients, skills, lastUpdated,
      updateProject, addProject, deleteProject,
      updateExperience, addExperience, deleteExperience, reorderExperience,
      updateClient, addClient, deleteClient,
      updateSkill, addSkill, deleteSkill,
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