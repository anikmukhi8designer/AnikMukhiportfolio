import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Experience, Client, SkillCategory } from '../types';
import { PROJECTS as INITIAL_PROJECTS, EXPERIENCE as INITIAL_EXPERIENCE, CLIENTS as INITIAL_CLIENTS, SKILLS as INITIAL_SKILLS } from '../data';

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

  updateClient: (id: string, data: Partial<Client>) => void;
  addClient: (client: Client) => void;
  deleteClient: (id: string) => void;

  updateSkill: (id: string, data: Partial<SkillCategory>) => void;
  addSkill: (skill: SkillCategory) => void;
  deleteSkill: (id: string) => void;

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

  const [skills, setSkills] = useState<SkillCategory[]>(() => {
    const saved = localStorage.getItem('cms_skills');
    return saved ? JSON.parse(saved) : INITIAL_SKILLS;
  });

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
      updateExperience, addExperience, deleteExperience,
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