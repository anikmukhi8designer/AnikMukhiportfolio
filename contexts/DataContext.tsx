import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Experience, Client, SkillCategory, GlobalConfig, SocialLink, SyncLogEntry } from '../types';
import { 
  PROJECTS as INITIAL_PROJECTS, 
  EXPERIENCE as INITIAL_EXPERIENCE, 
  CLIENTS as INITIAL_CLIENTS, 
  SKILLS as INITIAL_SKILLS, 
  INITIAL_CONFIG, 
  SOCIALS as INITIAL_SOCIALS
} from '../data';

// --- Types ---
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
  
  // Stubs for compatibility
  branch: string;
  hasNewVersion: boolean;
  latestPreviewUrl: string | null;
  
  reloadContent: () => void;
  syncData: (commitMessage?: string) => Promise<void>; 
  triggerDeploy: () => Promise<void>;
  resetData: () => Promise<void>;
  
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  updateExperience: (id: string, data: Partial<Experience>) => Promise<void>;
  addExperience: (exp: Experience) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
  reorderExperience: (items: Experience[]) => Promise<void>;
  
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  addClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  updateSkill: (id: string, data: Partial<SkillCategory>) => Promise<void>;
  addSkill: (skill: SkillCategory) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  
  updateConfig: (data: Partial<GlobalConfig>) => Promise<void>;
  updateSocials: (data: SocialLink[]) => Promise<void>;
  
  verifyConnection: () => Promise<{ success: boolean; message: string }>;
  getHistory: () => Promise<any[]>;
  restoreVersion: (sha: string) => Promise<void>;
  getSyncHistory: () => Promise<SyncLogEntry[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Static State ---
  const [projects] = useState<Project[]>(INITIAL_PROJECTS);
  const [experience] = useState<Experience[]>(INITIAL_EXPERIENCE);
  const [clients] = useState<Client[]>(INITIAL_CLIENTS);
  const [skills] = useState<SkillCategory[]>(INITIAL_SKILLS);
  const [config] = useState<GlobalConfig>(INITIAL_CONFIG);
  const [socials] = useState<SocialLink[]>(INITIAL_SOCIALS);
  
  // Static state flags
  const isLoading = false;
  const isSaving = false;
  const error = null;
  const lastUpdated = new Date();

  // No-op functions for static mode
  const noOp = async () => console.log("Action disabled in static mode");

  return (
    <DataContext.Provider value={{
        projects, experience, clients, skills, config, socials,
        isLoading, isSaving, error, lastUpdated,
        branch: 'main', hasNewVersion: false, latestPreviewUrl: null,
        
        reloadContent: () => {},
        syncData: noOp, resetData: noOp, triggerDeploy: noOp,
        
        updateProject: noOp, addProject: noOp, deleteProject: noOp,
        updateExperience: noOp, addExperience: noOp, deleteExperience: noOp, reorderExperience: noOp,
        updateClient: noOp, addClient: noOp, deleteClient: noOp,
        updateSkill: noOp, addSkill: noOp, deleteSkill: noOp,
        updateConfig: noOp, updateSocials: noOp,
        
        verifyConnection: async () => ({ success: true, message: 'Static Mode Active' }),
        getHistory: async () => [], restoreVersion: noOp, getSyncHistory: async () => []
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