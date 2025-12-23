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
  hasUnsavedChanges: boolean;
  isEditMode: boolean;
  error: string | null;
  
  setEditMode: (val: boolean) => void;
  reloadContent: () => Promise<void>;
  saveAllData: (commitMessage?: string) => Promise<void>;
  discardChanges: () => void;
  
  updateProjectInMemory: (id: string, data: Partial<Project>) => void;
  updateConfigInMemory: (data: Partial<GlobalConfig>) => void;
  updateExperienceInMemory: (id: string, data: Partial<Experience>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [experience, setExperience] = useState<Experience[]>(INITIAL_EXPERIENCE);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [skills, setSkills] = useState<SkillCategory[]>(INITIAL_SKILLS);
  const [config, setConfig] = useState<GlobalConfig>(INITIAL_CONFIG);
  const [socials, setSocials] = useState<SocialLink[]>(INITIAL_SOCIALS);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSha, setCurrentSha] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => setIsEditMode(window.location.hash === '#edit' || window.location.hash === '#admin');
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const fetchData = async () => {
    const owner = localStorage.getItem('github_owner');
    const repo = localStorage.getItem('github_repo');
    const token = localStorage.getItem('github_token');

    if (!owner || !repo || !token) {
        // Silently fail and use static data if not configured
        return;
    }

    setIsLoading(true);
    try {
        const res = await fetch(`/api/data?owner=${owner}&repo=${repo}&t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            if (data.projects) setProjects(data.projects);
            if (data.experience) setExperience(data.experience);
            if (data.clients) setClients(data.clients);
            if (data.skills) setSkills(data.skills);
            if (data.config) setConfig(data.config);
            if (data.socials) setSocials(data.socials);
            setCurrentSha(data._sha);
            setHasUnsavedChanges(false);
        }
    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const saveAllData = async (commitMessage = "On-Page Update") => {
    const owner = localStorage.getItem('github_owner');
    const repo = localStorage.getItem('github_repo');
    const token = localStorage.getItem('github_token');

    if (!owner || !repo || !token) {
        throw new Error("GitHub credentials not configured in settings.");
    }

    setIsSaving(true);
    try {
        const payload = { projects, experience, clients, skills, config, socials, _sha: currentSha, _commitMessage: commitMessage };
        const res = await fetch(`/api/data?owner=${owner}&repo=${repo}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        setCurrentSha(result.newSha);
        setHasUnsavedChanges(false);
        setError(null);
    } catch (e: any) {
        setError(e.message);
        throw e;
    } finally {
        setIsSaving(false);
    }
  };

  const discardChanges = () => {
      if (window.confirm("Discard all pending visual edits?")) {
          fetchData();
          setHasUnsavedChanges(false);
      }
  };

  return (
    <DataContext.Provider value={{
        projects, experience, clients, skills, config, socials,
        isLoading, isSaving, hasUnsavedChanges, isEditMode, error,
        setEditMode: setIsEditMode,
        reloadContent: fetchData,
        saveAllData,
        discardChanges,
        updateProjectInMemory: (id, data) => { setProjects(prev => prev.map(p => p.id === id ? {...p, ...data} : p)); setHasUnsavedChanges(true); },
        updateConfigInMemory: (data) => { setConfig(prev => ({...prev, ...data})); setHasUnsavedChanges(true); },
        updateExperienceInMemory: (id, data) => { setExperience(prev => prev.map(e => e.id === id ? {...e, ...data} : e)); setHasUnsavedChanges(true); }
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