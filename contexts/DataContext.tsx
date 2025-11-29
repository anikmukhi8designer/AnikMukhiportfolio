import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Experience, Client } from '../types';
import { PROJECTS as INITIAL_PROJECTS, EXPERIENCE as INITIAL_EXPERIENCE, CLIENTS as INITIAL_CLIENTS } from '../data';

interface DataContextType {
  projects: Project[];
  experience: Experience[];
  clients: Client[];
  updateProject: (id: string, data: Partial<Project>) => void;
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  updateExperience: (id: string, data: Partial<Experience>) => void;
  addExperience: (exp: Experience) => void;
  deleteExperience: (id: string) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage or fall back to static data
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('cms_projects');
    // Ensure initial data has 'published' flag if loading from static for the first time
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS.map(p => ({ ...p, published: true }));
  });

  const [experience, setExperience] = useState<Experience[]>(() => {
    const saved = localStorage.getItem('cms_experience');
    return saved ? JSON.parse(saved) : INITIAL_EXPERIENCE.map(e => ({ ...e, published: true }));
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('cms_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  // Persistence effects
  useEffect(() => { localStorage.setItem('cms_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('cms_experience', JSON.stringify(experience)); }, [experience]);
  useEffect(() => { localStorage.setItem('cms_clients', JSON.stringify(clients)); }, [clients]);

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

  const resetData = () => {
    setProjects(INITIAL_PROJECTS.map(p => ({ ...p, published: true })));
    setExperience(INITIAL_EXPERIENCE.map(e => ({ ...e, published: true })));
    localStorage.clear();
    window.location.reload();
  };

  return (
    <DataContext.Provider value={{
      projects, experience, clients,
      updateProject, addProject, deleteProject,
      updateExperience, addExperience, deleteExperience,
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
