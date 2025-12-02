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

  const GITHUB_TOKEN = getEnv('VITE_GITHUB_TOKEN');
  const GITHUB_OWNER = getEnv('VITE_GITHUB_OWNER') || "anikmukhi8designer";
  const GITHUB_REPO = getEnv('VITE_GITHUB_REPO') || "AnikMukhiportfolio";
  const DATA_PATH = 'src/data.json';

  // --- GitHub Helpers ---
  
  const fetchFromGitHub = async () => {
    if (!GITHUB_TOKEN) return;

    try {
      const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          // Add cache busting to ensure we get fresh data
          'If-None-Match': '' 
        }
      });

      if (response.ok) {
        const data = await response.json();
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
        // If file doesn't exist, we'll create it on the first save
        saveToGitHub(INITIAL_PROJECTS, INITIAL_EXPERIENCE, INITIAL_CLIENTS, INITIAL_SKILLS);
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
    if (!GITHUB_TOKEN) {
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

    // UTF-8 safe base64 encoding
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
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
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
        // If we get a 409 Conflict, it means SHA didn't match (someone else updated). 
        // In a real app, we'd refetch and merge. Here we just alert.
        console.error("GitHub Save Failed:", err);
        if (response.status === 409) {
            alert("Sync Conflict: The data on GitHub has changed since you loaded the page. Please refresh and try again.");
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

  // --- Action Helpers ---
  // We update local state immediately for UI responsiveness, then trigger background save.

  const triggerSave = (p: Project[], e: Experience[], c: Client[], s: SkillCategory[]) => {
      // Debounce could be added here, but direct call is fine for low volume
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
        saveToGitHub(INITIAL_PROJECTS, INITIAL_EXPERIENCE, INITIAL_CLIENTS, INITIAL_SKILLS);
        alert("Data reset to defaults.");
    }
  };

  // In GitHub mode, refresh is just fetching
  const refreshAllClients = async () => {
      await fetchFromGitHub();
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