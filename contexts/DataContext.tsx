
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Experience, Client, SkillCategory, GlobalConfig, SocialLink, SyncLogEntry } from '../types';
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
  
  updateProjectInMemory: (id: string, data: Partial<Project>) => void;
  updateConfig: (data: Partial<GlobalConfig>) => Promise<void>;
  updateSocials: (data: SocialLink[]) => Promise<void>;
  
  // Legacy / Compatibility methods (now mapped to saveAllData)
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateExperience: (id: string, data: Partial<Experience>) => Promise<void>;
  addExperience: (exp: Experience) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
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
    try {
        console.log("Fetching live data from GitHub...");
        const res = await fetch('/api/data?t=' + Date.now(), {
            headers: {
                'x-github-owner': localStorage.getItem('github_owner') || '',
                'x-github-repo': localStorage.getItem('github_repo') || '',
                'Authorization': `Bearer ${localStorage.getItem('github_token') || ''}`
            }
        });
        
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
            console.warn("API unavailable or not configured. Using bundled data.");
        }
    } catch (e: any) {
        console.error("Data fetch error:", e);
        setError("Failed to load live data. Using cached version.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveAllData = async (commitMessage = "Update content via CMS") => {
      setIsSaving(true);
      setError(null);
      try {
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

          const res = await fetch('/api/data', {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'x-github-owner': localStorage.getItem('github_owner') || '',
                  'x-github-repo': localStorage.getItem('github_repo') || '',
                  'Authorization': `Bearer ${localStorage.getItem('github_token') || ''}`
              },
              body: JSON.stringify(payload)
          });

          const result = await res.json();
          if (!res.ok) throw new Error(result.error || "Save failed");

          setCurrentSha(result.newSha);
          setLastUpdated(new Date());
      } catch (e: any) {
          console.error("Save error:", e);
          setError(e.message);
          throw e;
      } finally {
          setIsSaving(false);
      }
  };

  const updateProjectInMemory = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const updateConfig = async (data: Partial<GlobalConfig>) => {
      setConfig(prev => ({ ...prev, ...data }));
  };

  const updateSocials = async (data: SocialLink[]) => {
      setSocials(data);
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

  return (
    <DataContext.Provider value={{
        projects, experience, clients, skills, config, socials,
        isLoading, isSaving, error, lastUpdated,
        reloadContent: fetchData,
        saveAllData,
        updateProjectInMemory,
        updateConfig,
        updateSocials,
        updateProject,
        addProject,
        deleteProject,
        updateExperience,
        addExperience,
        deleteExperience
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
