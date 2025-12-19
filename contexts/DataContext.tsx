
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Experience, Client, SkillCategory, GlobalConfig, SocialLink, SyncLogEntry } from '../types';
import { supabase } from '../src/supabaseClient';
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
  isDbEmpty: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  branch: string;
  hasNewVersion: boolean;
  latestPreviewUrl: string | null;
  
  reloadContent: () => Promise<void>;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [skills, setSkills] = useState<SkillCategory[]>([]);
  const [config, setConfig] = useState<GlobalConfig>(INITIAL_CONFIG);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [pRes, eRes, cRes, sRes, confRes, socRes] = await Promise.all([
            supabase.from('projects').select('*').order('year', { ascending: false }),
            supabase.from('experience').select('*').order('order', { ascending: true }),
            supabase.from('clients').select('*').order('order', { ascending: true }),
            supabase.from('skills').select('*').order('order', { ascending: true }),
            supabase.from('config').select('*').single(),
            supabase.from('socials').select('*').order('order', { ascending: true })
        ]);

        const dbHasProjects = pRes.data && pRes.data.length > 0;
        const dbHasExperience = eRes.data && eRes.data.length > 0;
        
        if (dbHasProjects || dbHasExperience) {
            setIsDbEmpty(false);
            if (pRes.data) setProjects(pRes.data);
            if (eRes.data) setExperience(eRes.data);
            if (cRes.data) setClients(cRes.data);
            if (sRes.data) setSkills(sRes.data);
            if (confRes.data) setConfig(confRes.data);
            if (socRes.data) setSocials(socRes.data);
        } else {
            console.log("Database appears empty, displaying static fallbacks.");
            setIsDbEmpty(true);
            setProjects(INITIAL_PROJECTS);
            setExperience(INITIAL_EXPERIENCE);
            setClients(INITIAL_CLIENTS);
            setSkills(INITIAL_SKILLS);
            setConfig(INITIAL_CONFIG);
            setSocials(INITIAL_SOCIALS);
        }

        setLastUpdated(new Date());
    } catch (e: any) {
        console.error("Error fetching data:", e);
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const reloadContent = async () => {
      await fetchData();
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
      setIsSaving(true);
      try {
          // Use upsert to handle potential new projects or unseeded projects
          const { error } = await supabase.from('projects').upsert({ ...data, id }).select();
          if (error) throw error;
          await fetchData();
      } catch (e: any) {
          console.error("Update Project Error:", e);
          throw e;
      } finally {
          setIsSaving(false);
      }
  };

  const addProject = async (project: Project) => {
      setIsSaving(true);
      try {
          const { error } = await supabase.from('projects').insert(project);
          if (error) throw error;
          await fetchData();
      } catch (e: any) {
          throw e;
      } finally {
          setIsSaving(false);
      }
  };

  const deleteProject = async (id: string) => {
      setIsSaving(true);
      try {
          const { error } = await supabase.from('projects').delete().eq('id', id);
          if (error) throw error;
          await fetchData();
      } catch (e: any) {
          throw e;
      } finally {
          setIsSaving(false);
      }
  };

  const updateExperience = async (id: string, data: Partial<Experience>) => {
    setIsSaving(true);
    await supabase.from('experience').upsert({ ...data, id });
    await fetchData();
    setIsSaving(false);
  };

  const addExperience = async (exp: Experience) => {
    setIsSaving(true);
    await supabase.from('experience').insert(exp);
    await fetchData();
    setIsSaving(false);
  };

  const deleteExperience = async (id: string) => {
    setIsSaving(true);
    await supabase.from('experience').delete().eq('id', id);
    await fetchData();
    setIsSaving(false);
  };
  
  const reorderExperience = async (items: Experience[]) => {
      setExperience(items);
      for(let i=0; i<items.length; i++) {
          await supabase.from('experience').update({ order: i }).eq('id', items[i].id);
      }
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    await supabase.from('clients').upsert({ ...data, id });
    fetchData();
  };

  const addClient = async (client: Client) => {
    await supabase.from('clients').insert(client);
    fetchData();
  };

  const deleteClient = async (id: string) => {
    await supabase.from('clients').delete().eq('id', id);
    fetchData();
  };

  const updateSkill = async (id: string, data: Partial<SkillCategory>) => {
    await supabase.from('skills').upsert({ ...data, id });
    fetchData();
  };

  const addSkill = async (skill: SkillCategory) => {
    await supabase.from('skills').insert(skill);
    fetchData();
  };

  const deleteSkill = async (id: string) => {
    await supabase.from('skills').delete().eq('id', id);
    fetchData();
  };

  const updateConfig = async (data: Partial<GlobalConfig>) => {
    setIsSaving(true);
    const { error } = await supabase.from('config').upsert({ id: 1, ...data });
    await fetchData();
    setIsSaving(false);
  };

  const updateSocials = async (data: SocialLink[]) => {
      setIsSaving(true);
      await supabase.from('socials').delete().neq('id', '0');
      if (data.length > 0) {
        const { error } = await supabase.from('socials').insert(data.map((s, i) => ({ ...s, order: i })));
        if(error) console.error(error);
      }
      await fetchData();
      setIsSaving(false);
  };

  const resetData = async () => {
    setIsSaving(true);
    try {
        await Promise.all([
            supabase.from('projects').delete().neq('id', '0'),
            supabase.from('experience').delete().neq('id', '0'),
            supabase.from('clients').delete().neq('id', '0'),
            supabase.from('skills').delete().neq('id', '0'),
            supabase.from('config').delete().neq('id', 0),
            supabase.from('socials').delete().neq('id', '0')
        ]);

        await Promise.all([
            supabase.from('projects').insert(INITIAL_PROJECTS),
            supabase.from('experience').insert(INITIAL_EXPERIENCE.map((e,i) => ({...e, order: i}))),
            supabase.from('clients').insert(INITIAL_CLIENTS.map((c,i) => ({...c, order: i}))),
            supabase.from('skills').insert(INITIAL_SKILLS.map((s,i) => ({...s, order: i}))),
            supabase.from('config').insert({ id: 1, ...INITIAL_CONFIG }),
            supabase.from('socials').insert(INITIAL_SOCIALS.map((s,i) => ({...s, order: i})))
        ]);
        
        await fetchData();
    } catch(e) {
        console.error("Reset failed", e);
    } finally {
        setIsSaving(false);
    }
  };

  const verifyConnection = async () => {
      try {
          const { count, error } = await supabase.from('projects').select('*', { count: 'exact', head: true });
          if (error) throw error;
          return { success: true, message: `Connected (${count} records)` };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  };

  return (
    <DataContext.Provider value={{
        projects, experience, clients, skills, config, socials,
        isLoading, isSaving, isDbEmpty, error, lastUpdated,
        branch: 'main', hasNewVersion: false, latestPreviewUrl: null,
        
        reloadContent,
        syncData: async () => {}, 
        triggerDeploy: async () => {},
        resetData,
        
        updateProject, addProject, deleteProject,
        updateExperience, addExperience, deleteExperience, reorderExperience,
        updateClient, addClient, deleteClient,
        updateSkill, addSkill, deleteSkill,
        updateConfig, updateSocials,
        
        verifyConnection,
        getHistory: async () => [], 
        restoreVersion: async () => {}, 
        getSyncHistory: async () => []
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
