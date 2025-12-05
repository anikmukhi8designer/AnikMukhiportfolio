import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Project, Experience, Client, SkillCategory, GlobalConfig, SocialLink, SyncLogEntry } from '../types';
import { 
  PROJECTS as INITIAL_PROJECTS, 
  EXPERIENCE as INITIAL_EXPERIENCE, 
  CLIENTS as INITIAL_CLIENTS, 
  SKILLS as INITIAL_SKILLS, 
  INITIAL_CONFIG, 
  SOCIALS as INITIAL_SOCIALS
} from '../data';
import { supabase } from '../src/supabaseClient';

// --- Types ---
interface DataContextType {
  projects: Project[];
  experience: Experience[];
  clients: Client[];
  skills: SkillCategory[];
  config: GlobalConfig;
  socials: SocialLink[];
  lastUpdated: Date | null;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  branch: string;
  hasNewVersion: boolean;
  reloadContent: () => void;
  syncData: (commitMessage?: string) => Promise<void>; 
  triggerDeploy: () => Promise<void>;
  resetData: () => Promise<void>;
  
  // Direct CRUD
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
  latestPreviewUrl: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [experience, setExperience] = useState<Experience[]>(INITIAL_EXPERIENCE);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [skills, setSkills] = useState<SkillCategory[]>(INITIAL_SKILLS);
  const [config, setConfig] = useState<GlobalConfig>(INITIAL_CONFIG);
  const [socials, setSocials] = useState<SocialLink[]>(INITIAL_SOCIALS);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [branch, setBranch] = useState('main'); 
  const [latestPreviewUrl, setLatestPreviewUrl] = useState<string | null>(null);

  // --- Real-time Handler ---
  // Using any for payload to avoid type import issues with different supabase versions
  const handleRealtimeChange = (payload: any, table: string, setState: React.Dispatch<React.SetStateAction<any[]>>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      console.log(`Realtime Update: ${table} (${eventType})`, newRecord);

      setState(prevData => {
          if (eventType === 'INSERT') {
              // Check if already exists to prevent duplication
              if (prevData.some(item => item.id === newRecord.id)) return prevData;
              return [newRecord, ...prevData];
          } 
          if (eventType === 'UPDATE') {
              return prevData.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
          }
          if (eventType === 'DELETE') {
              return prevData.filter(item => item.id !== oldRecord.id);
          }
          return prevData;
      });
      
      setLastUpdated(new Date());
      setHasNewVersion(true); // Trigger UI refresh indicator if needed
  };

  // --- Core Logic: Fetch from Supabase ---
  const fetchData = useCallback(async (silent = false): Promise<boolean> => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
        // 1. Check connectivity and Schema existence
        const { error: connectionError, count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        
        if (connectionError) {
            if (connectionError.code === '42P01') {
                throw new Error("Tables not found. Please run the supabase_schema.sql in your Supabase SQL Editor.");
            }
            throw connectionError;
        }

        // 2. Auto-Seed if Database is Empty
        if (count === 0 && !isInitialized) {
            console.log("Empty database detected. Auto-seeding with demo data...");
            try {
                await Promise.all([
                    supabase.from('projects').upsert(INITIAL_PROJECTS),
                    supabase.from('experience').upsert(INITIAL_EXPERIENCE),
                    supabase.from('clients').upsert(INITIAL_CLIENTS),
                    supabase.from('skills').upsert(INITIAL_SKILLS),
                    supabase.from('socials').upsert(INITIAL_SOCIALS),
                    supabase.from('config').upsert({ ...INITIAL_CONFIG, id: 1 })
                ]);
            } catch (seedError) {
                console.warn("Auto-seeding warning: ", seedError);
            }
        }

        // 3. Fetch Actual Data
        const [
            { data: projectsData },
            { data: experienceData },
            { data: clientsData },
            { data: skillsData },
            { data: socialsData },
            { data: configData }
        ] = await Promise.all([
            supabase.from('projects').select('*').order('created_at', { ascending: false }),
            supabase.from('experience').select('*').order('order', { ascending: true }),
            supabase.from('clients').select('*').order('order', { ascending: true }),
            supabase.from('skills').select('*').order('order', { ascending: true }),
            supabase.from('socials').select('*').order('order', { ascending: true }),
            supabase.from('config').select('*').single()
        ]);

        if (projectsData) setProjects(projectsData);
        if (experienceData) setExperience(experienceData);
        if (clientsData) setClients(clientsData);
        if (skillsData) setSkills(skillsData);
        if (socialsData) setSocials(socialsData);
        if (configData) setConfig(prev => ({ ...prev, ...configData }));
        
        setLastUpdated(new Date());
        setIsInitialized(true);
        return true;

    } catch (e: any) {
        console.error("Supabase Fetch failed:", e);
        if (!silent) {
           setError(e.message || "Failed to load data.");
        }
        return false;
    } finally {
        if (!silent) setIsLoading(false);
    }
  }, [isInitialized]);

  // --- Realtime Subscription Setup ---
  useEffect(() => {
    // Remove existing channels first to avoid duplicates
    supabase.removeAllChannels();

    const channel = supabase.channel('global-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => handleRealtimeChange(payload, 'projects', setProjects))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'experience' }, (payload) => handleRealtimeChange(payload, 'experience', setExperience))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => handleRealtimeChange(payload, 'clients', setClients))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, (payload) => handleRealtimeChange(payload, 'skills', setSkills))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'socials' }, (payload) => handleRealtimeChange(payload, 'socials', setSocials))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, (payload) => {
             console.log("Config Updated", payload.new);
             if (payload.new) setConfig(prev => ({ ...prev, ...payload.new }));
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log("Realtime subscription active");
            } else if (status === 'CHANNEL_ERROR') {
                console.error("Realtime connection error");
            }
        });

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // --- CRUD Operations ---
  const updateProject = async (id: string, data: Partial<Project>) => {
      // Optimistic update
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      const { error } = await supabase.from('projects').update(data).eq('id', id);
      if (error) {
        console.error("Update failed", error);
        // Revert (needs fetch)
        fetchData(true);
        throw error;
      }
  };

  const addProject = async (p: Project) => {
      setProjects(prev => [p, ...prev]);
      const { error } = await supabase.from('projects').insert(p);
      if (error) {
        setProjects(prev => prev.filter(item => item.id !== p.id));
        throw error;
      }
  };

  const deleteProject = async (id: string) => {
      const prevProjects = [...projects];
      setProjects(prev => prev.filter(p => p.id !== id));
      
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) {
          setProjects(prevProjects);
          throw error;
      }
  };
  
  const updateExperience = async (id: string, data: Partial<Experience>) => {
      setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      const { error } = await supabase.from('experience').update(data).eq('id', id);
      if (error) throw error;
  };

  const addExperience = async (e: Experience) => {
      setExperience(prev => [e, ...prev]);
      const { error } = await supabase.from('experience').insert(e);
      if (error) throw error;
  };

  const deleteExperience = async (id: string) => {
      setExperience(prev => prev.filter(e => e.id !== id));
      const { error } = await supabase.from('experience').delete().eq('id', id);
      if (error) throw error;
  };
  
  const reorderExperience = async (items: Experience[]) => {
      setExperience(items);
      const updates = items.map((item, index) => ({
          id: item.id,
          order: index,
          ...item
      }));
      const { error } = await supabase.from('experience').upsert(updates);
      if (error) throw error;
  };
  
  const updateClient = async (id: string, data: Partial<Client>) => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      await supabase.from('clients').update(data).eq('id', id);
  };

  const addClient = async (c: Client) => {
      setClients(prev => [...prev, c]);
      await supabase.from('clients').insert(c);
  };

  const deleteClient = async (id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
      await supabase.from('clients').delete().eq('id', id);
  };
  
  const updateSkill = async (id: string, data: Partial<SkillCategory>) => {
      setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      await supabase.from('skills').update(data).eq('id', id);
  };

  const addSkill = async (s: SkillCategory) => {
      setSkills(prev => [...prev, s]);
      await supabase.from('skills').insert(s);
  };

  const deleteSkill = async (id: string) => {
      setSkills(prev => prev.filter(s => s.id !== id));
      await supabase.from('skills').delete().eq('id', id);
  };
  
  const updateConfig = async (data: Partial<GlobalConfig>) => {
      setConfig(prev => ({ ...prev, ...data }));
      await supabase.from('config').update(data).eq('id', 1);
  };

  const updateSocials = async (data: SocialLink[]) => {
      setSocials(data);
      const { error } = await supabase.from('socials').upsert(data);
      if (error) throw error;
  };

  const syncData = async (commitMessage = "Manual Sync") => {
     setIsSaving(true);
     try {
         const payload = {
             config,
             projects,
             experience,
             clients,
             skills,
             socials,
             _commitMessage: commitMessage
         };
         
         const res = await fetch('/api/data', {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload)
         });
         
         if (!res.ok) throw new Error("Failed to sync to GitHub");
         
     } catch(e: any) {
         console.error("Sync error:", e);
         throw e;
     } finally {
         setIsSaving(false);
     }
  };

  useEffect(() => {
      fetchData();
  }, [fetchData]);

  const resetData = async () => {
      if (!confirm("Reset database to default demo data? This cannot be undone.")) return;
      
      setIsLoading(true);
      try {
          // Clear all tables
          await supabase.from('projects').delete().neq('id', 'placeholder');
          await supabase.from('experience').delete().neq('id', 'placeholder');
          await supabase.from('clients').delete().neq('id', 'placeholder');
          await supabase.from('skills').delete().neq('id', 'placeholder');
          await supabase.from('socials').delete().neq('id', 'placeholder');
          await supabase.from('config').delete().neq('id', 0);
          
          // Re-insert defaults
          await Promise.all([
            supabase.from('projects').insert(INITIAL_PROJECTS),
            supabase.from('experience').insert(INITIAL_EXPERIENCE),
            supabase.from('clients').insert(INITIAL_CLIENTS),
            supabase.from('skills').insert(INITIAL_SKILLS),
            supabase.from('socials').insert(INITIAL_SOCIALS),
            supabase.from('config').upsert({ ...INITIAL_CONFIG, id: 1 })
          ]);
          
          await fetchData(true);
      } catch(e) {
          console.error("Reset failed", e);
          alert("Reset failed. Check console.");
      } finally {
          setIsLoading(false);
      }
  };

  const verifyConnection = async () => {
      try {
          const { count, error } = await supabase.from('projects').select('*', { count: 'exact', head: true });
          if (error) throw error;
          return { success: true, message: `Connected. Projects found: ${count}` };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  };

  const getHistory = async () => [];
  const restoreVersion = async (sha: string) => {};
  const getSyncHistory = async () => [];
  const triggerDeploy = async () => {};

  return (
    <DataContext.Provider value={{
        projects, experience, clients, skills, config, socials,
        lastUpdated, isSaving, isLoading, error, branch, hasNewVersion,
        reloadContent: () => fetchData(true),
        syncData, resetData, triggerDeploy,
        updateProject, addProject, deleteProject,
        updateExperience, addExperience, deleteExperience, reorderExperience,
        updateClient, addClient, deleteClient,
        updateSkill, addSkill, deleteSkill,
        updateConfig, updateSocials,
        verifyConnection, getHistory, restoreVersion, getSyncHistory, latestPreviewUrl
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