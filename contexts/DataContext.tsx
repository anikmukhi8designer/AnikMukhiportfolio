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
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        // Fetch all data in parallel
        const [pRes, eRes, cRes, sRes, confRes, socRes] = await Promise.all([
            supabase.from('projects').select('*').order('year', { ascending: false }),
            supabase.from('experience').select('*').order('order', { ascending: true }),
            supabase.from('clients').select('*').order('order', { ascending: true }),
            supabase.from('skills').select('*').order('order', { ascending: true }),
            supabase.from('config').select('*').single(),
            supabase.from('socials').select('*').order('order', { ascending: true })
        ]);

        if (pRes.data) setProjects(pRes.data);
        if (eRes.data) setExperience(eRes.data);
        if (cRes.data) setClients(cRes.data);
        if (sRes.data) setSkills(sRes.data);
        if (confRes.data) setConfig(confRes.data);
        if (socRes.data) setSocials(socRes.data);
        
        // If Database is completely empty, fall back to initial static data for display
        // ensuring the site doesn't look broken on first load before seeding
        if (pRes.data?.length === 0 && eRes.data?.length === 0) {
            console.log("Database empty, using static fallback.");
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

  // --- Actions ---

  const reloadContent = async () => {
      await fetchData();
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
      setIsSaving(true);
      try {
          const { error } = await supabase.from('projects').update(data).eq('id', id);
          if (error) throw error;
          await fetchData();
      } catch (e: any) {
          console.error(e);
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
    await supabase.from('experience').update(data).eq('id', id);
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
      // Optimistic update
      setExperience(items);
      
      // Persist order
      for(let i=0; i<items.length; i++) {
          await supabase.from('experience').update({ order: i }).eq('id', items[i].id);
      }
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    await supabase.from('clients').update(data).eq('id', id);
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
    await supabase.from('skills').update(data).eq('id', id);
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
    // Config table usually has 1 row with ID 1
    const { error } = await supabase.from('config').update(data).eq('id', 1);
    if (error) {
        // If row doesn't exist, insert it
        await supabase.from('config').insert({ id: 1, ...data });
    }
    await fetchData();
    setIsSaving(false);
  };

  const updateSocials = async (data: SocialLink[]) => {
      setIsSaving(true);
      // Delete all and re-insert is easiest for this list
      await supabase.from('socials').delete().neq('id', '0'); // delete all
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
        await supabase.from('projects').delete().neq('id', '0');
        await supabase.from('experience').delete().neq('id', '0');
        await supabase.from('clients').delete().neq('id', '0');
        await supabase.from('skills').delete().neq('id', '0');
        await supabase.from('config').delete().neq('id', 0);
        await supabase.from('socials').delete().neq('id', '0');

        await supabase.from('projects').insert(INITIAL_PROJECTS);
        await supabase.from('experience').insert(INITIAL_EXPERIENCE.map((e,i) => ({...e, order: i})));
        await supabase.from('clients').insert(INITIAL_CLIENTS.map((c,i) => ({...c, order: i})));
        await supabase.from('skills').insert(INITIAL_SKILLS.map((s,i) => ({...s, order: i})));
        await supabase.from('config').insert({ id: 1, ...INITIAL_CONFIG });
        await supabase.from('socials').insert(INITIAL_SOCIALS.map((s,i) => ({...s, order: i})));
        
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
        isLoading, isSaving, error, lastUpdated,
        branch: 'main', hasNewVersion: false, latestPreviewUrl: null,
        
        reloadContent,
        syncData: async () => {}, // Sync to Git not implemented in Supabase version for brevity
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