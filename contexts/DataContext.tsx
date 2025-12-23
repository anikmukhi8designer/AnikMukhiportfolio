
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  reloadContent: () => Promise<void>;
  saveAllData: (commitMessage?: string) => Promise<void>;
  
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  updateProjectInMemory: (id: string, data: Partial<Project>) => void;
  addProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  updateExperience: (id: string, data: Partial<Experience>) => Promise<void>;
  addExperience: (exp: Experience) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
  
  updateConfig: (data: Partial<GlobalConfig>) => Promise<void>;
  updateSocials: (data: SocialLink[]) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [experience, setExperience] = useState<Experience[]>(INITIAL_EXPERIENCE);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [skills, setSkills] = useState<SkillCategory[]>(INITIAL_SKILLS);
  const [config, setConfig] = useState<GlobalConfig>(INITIAL_CONFIG);
  const [socials, setSocials] = useState<SocialLink[]>(INITIAL_SOCIALS);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentSha, setCurrentSha] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    const owner = localStorage.getItem('github_owner');
    const repo = localStorage.getItem('github_repo');
    const token = localStorage.getItem('github_token');

    if (!owner || !repo || !token) {
        console.log("GitHub credentials missing, using local data.");
        setIsLoading(false);
        return;
    }

    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const res = await fetch(`/api/data?owner=${owner}&repo=${repo}&t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            setProjects(data.projects || INITIAL_PROJECTS);
            setExperience(data.experience || INITIAL_EXPERIENCE);
            setClients(data.clients || INITIAL_CLIENTS);
            setSkills(data.skills || INITIAL_SKILLS);
            setConfig(data.config || INITIAL_CONFIG);
            setSocials(data.socials || INITIAL_SOCIALS);
            setCurrentSha(data._sha);
            setLastUpdated(new Date());
        } else {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with ${res.status}`);
        }
    } catch (e: any) {
        console.error("Data fetch error:", e);
        const errorMessage = e.name === 'AbortError' 
            ? "Connection timed out. Check your internet or API proxy."
            : e.message || "Failed to sync with GitHub.";
        setError(errorMessage);
        // Fallback to initial data is implicit as states are initialized with them
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveAllData = async (commitMessage = "Update via CMS") => {
    setIsSaving(true);
    try {
        const owner = localStorage.getItem('github_owner');
        const repo = localStorage.getItem('github_repo');
        const token = localStorage.getItem('github_token');

        if (!owner || !repo || !token) throw new Error("GitHub credentials missing in Settings.");

        const payload = {
            projects,
            experience,
            clients,
            skills,
            config,
            socials,
            _sha: currentSha,
            _commitMessage: commitMessage
        };

        const res = await fetch(`/api/data?owner=${owner}&repo=${repo}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "GitHub sync failed");

        setCurrentSha(result.newSha);
        setLastUpdated(new Date());
        setError(null);
    } catch (e: any) {
        setError(e.message);
        throw e;
    } finally {
        setIsSaving(false);
    }
  };

  const updateProjectInMemory = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const addProject = async (project: Project) => {
      setProjects(prev => [project, ...prev]);
  };

  const deleteProject = async (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
  };

  const updateExperience = async (id: string, data: Partial<Experience>) => {
    setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const addExperience = async (exp: Experience) => {
    setExperience(prev => [...prev, exp]);
  };

  const deleteExperience = async (id: string) => {
    setExperience(prev => prev.filter(e => e.id !== id));
  };

  const updateConfig = async (data: Partial<GlobalConfig>) => {
      setConfig(prev => ({ ...prev, ...data }));
  };

  const updateSocials = async (data: SocialLink[]) => {
      setSocials(data);
  };

  return (
    <DataContext.Provider value={{
        projects, experience, clients, skills, config, socials,
        isLoading, isSaving, error, lastUpdated,
        reloadContent: fetchData,
        saveAllData,
        updateProject, updateProjectInMemory, addProject, deleteProject,
        updateExperience, addExperience, deleteExperience,
        updateConfig, updateSocials
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
