import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Experience, Client, SkillCategory } from '../types';
import { 
  PROJECTS as INITIAL_PROJECTS, 
  EXPERIENCE as INITIAL_EXPERIENCE, 
  CLIENTS as INITIAL_CLIENTS, 
  SKILLS as INITIAL_SKILLS,
  LAST_UPDATED as REMOTE_LAST_UPDATED
} from '../data';

interface DataContextType {
  projects: Project[];
  experience: Experience[];
  clients: Client[];
  skills: SkillCategory[];
  
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to determine initial state based on sync status
const getInitialState = <T,>(key: string, initialData: T): T => {
    const saved = localStorage.getItem(key);
    const localTimestamp = localStorage.getItem('cms_last_updated');
    const isAdmin = localStorage.getItem('cms_authenticated') === 'true';

    // Smart Sync: If we are a public visitor (not admin) and the remote version is newer,
    // we ignore the local cache and use the fresh data from the build.
    if (!isAdmin && localTimestamp !== REMOTE_LAST_UPDATED) {
        return initialData;
    }

    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error(`Failed to parse ${key}`, e);
            return initialData;
        }
    }
    return initialData;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  const [projects, setProjects] = useState<Project[]>(() => 
    getInitialState('cms_projects', INITIAL_PROJECTS.map(p => ({ ...p, published: true })))
  );

  const [experience, setExperience] = useState<Experience[]>(() => 
    getInitialState('cms_experience', INITIAL_EXPERIENCE.map(e => ({ ...e, published: true })))
  );

  const [clients, setClients] = useState<Client[]>(() => 
    getInitialState('cms_clients', INITIAL_CLIENTS)
  );

  const [skills, setSkills] = useState<SkillCategory[]>(() => {
    // Custom logic for skills migration + sync
    const saved = localStorage.getItem('cms_skills');
    const localTimestamp = localStorage.getItem('cms_last_updated');
    const isAdmin = localStorage.getItem('cms_authenticated') === 'true';

    if (!isAdmin && localTimestamp !== REMOTE_LAST_UPDATED) {
        return INITIAL_SKILLS;
    }

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Migration check
            if (parsed.length > 0 && parsed[0].items.length > 0 && typeof parsed[0].items[0] === 'string') {
                return parsed.map((cat: any) => ({
                    ...cat,
                    items: cat.items.map((item: string) => ({ name: item, icon: 'Default' }))
                }));
            }
            return parsed;
        } catch (e) {
            return INITIAL_SKILLS;
        }
    }
    return INITIAL_SKILLS;
  });

  // Sync Timestamp Effect
  useEffect(() => {
    const isAdmin = localStorage.getItem('cms_authenticated') === 'true';
    if (!isAdmin) {
        // If we just loaded fresh data (implied by the getInitialState logic returning initial),
        // we must update the local timestamp so next reload is consistent.
        if (localStorage.getItem('cms_last_updated') !== REMOTE_LAST_UPDATED) {
            localStorage.setItem('cms_last_updated', REMOTE_LAST_UPDATED);
            
            // Also, to be safe, we should overwrite the 'saved' keys in LS with the fresh data
            // because the useEffects below will run and might save stale state if we aren't careful.
            // However, since state is initialized with Fresh Data, the useEffects below 
            // will immediately save that Fresh Data to LS. So we are good.
        }
    }
  }, []);

  // Persistence effects
  useEffect(() => { localStorage.setItem('cms_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('cms_experience', JSON.stringify(experience)); }, [experience]);
  useEffect(() => { localStorage.setItem('cms_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('cms_skills', JSON.stringify(skills)); }, [skills]);

  // Project Actions
  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // Experience Actions
  const updateExperience = (id: string, data: Partial<Experience>) => {
    setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const addExperience = (exp: Experience) => {
    setExperience(prev => [exp, ...prev]);
  };

  const deleteExperience = (id: string) => {
    setExperience(prev => prev.filter(e => e.id !== id));
  };

  const reorderExperience = (items: Experience[]) => {
    setExperience(items);
  };

  // Client Actions
  const updateClient = (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const addClient = (client: Client) => {
    setClients(prev => [...prev, client]);
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  // Skill Actions
  const updateSkill = (id: string, data: Partial<SkillCategory>) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  };

  const addSkill = (skill: SkillCategory) => {
    setSkills(prev => [...prev, skill]);
  };

  const deleteSkill = (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  const resetData = () => {
    setProjects(INITIAL_PROJECTS.map(p => ({ ...p, published: true })));
    setExperience(INITIAL_EXPERIENCE.map(e => ({ ...e, published: true })));
    setClients(INITIAL_CLIENTS);
    setSkills(INITIAL_SKILLS);
    localStorage.clear();
    window.location.reload();
  };

  return (
    <DataContext.Provider value={{
      projects, experience, clients, skills,
      updateProject, addProject, deleteProject,
      updateExperience, addExperience, deleteExperience, reorderExperience,
      updateClient, addClient, deleteClient,
      updateSkill, addSkill, deleteSkill,
      resetData
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