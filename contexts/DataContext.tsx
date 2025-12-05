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
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  
  const [branch, setBranch] = useState('main'); 
  const [latestPreviewUrl, setLatestPreviewUrl] = useState<string | null>(null);

  // --- Real-time Handler ---
  // This function merges incoming changes from Supabase into local React state automatically
  const handleRealtimeChange = (payload: RealtimePostgresChangesPayload<any>, table: string, setState: React.Dispatch<React.SetStateAction<any[]>>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setState(prevData => {
          if (eventType === 'INSERT') {
              // Prevent duplicates if we already added it optimistically
              if (prevData.find(item => item.id === newRecord.id)) return prevData;
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
  };

  // --- Core Logic: Fetch from Supabase ---
  const fetchData = useCallback(async (silent = false): Promise<boolean> => {
    if (!silent) setIsLoading(true);
    
    try {
        const [
            { data: projectsData },
            { data: experienceData },
            { data: clientsData },
            { data: skillsData },
            { data: socialsData },
            { data: configData }
        ] = await Promise.all([
            supabase.from('projects').select('*').order('year', { ascending: false }),
            supabase.from('experience').select('*').order('order', { ascending: true }),
            supabase.from('clients').select('*').order('order', { ascending: true }),
            supabase.from('skills').select('*').order('order', { ascending: true }),
            supabase.from('socials').select('*').order('order', { ascending: true }),
            supabase.from('config').select('*').single()
        ]);

        if (projectsData && projectsData.length > 0) setProjects(projectsData);
        if (experienceData && experienceData.length > 0) setExperience(experienceData);
        if (clientsData && clientsData.length > 0) setClients(clientsData);
        if (skillsData && skillsData.length > 0) setSkills(skillsData);
        if (socialsData && socialsData.length > 0) setSocials(socialsData);
        if (configData) setConfig(prev => ({ ...prev, ...configData }));
        
        setLastUpdated(new Date());
        return true;
    } catch (e) {
        console.error("Supabase Fetch failed:", e);
        // Don't show error immediately on init, as tables might be empty
        if (!silent) {
           // We might be just starting up without tables, use defaults silently
        }
        return false;
    } finally {
        if (!silent) setIsLoading(false);
    }
  }, []);

  // --- Realtime Subscription Setup ---
  useEffect(() => {
    const channel = supabase.channel('global-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => handleRealtimeChange(payload, 'projects', setProjects))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'experience' }, (payload) => handleRealtimeChange(payload, 'experience', setExperience))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, (payload) => handleRealtimeChange(payload, 'clients', setClients))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, (payload) => handleRealtimeChange(payload, 'skills', setSkills))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'socials' }, (payload) => handleRealtimeChange(payload, 'socials', setSocials))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, (payload) => {
             if (payload.new) setConfig(prev => ({ ...prev, ...payload.new }));
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);


  // --- CRUD Operations (Direct DB Access + Optimistic UI) ---
  
  const updateProject = async (id: string, data: Partial<Project>) => {
      // Optimistic
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      const { error } = await supabase.from('projects').update(data).eq('id', id);
      if (error) {
          console.error("Update failed", error);
          fetchData(true); // Revert on error
      }
  };

  const addProject = async (p: Project) => {
      // Optimistic
      setProjects(prev => [p, ...prev]);
      // Note: We use the locally generated ID for immediate UI update.
      // Ensure your DB table allows inserting UUIDs or use trigger to handle it.
      const { error } = await supabase.from('projects').insert(p);
      if (error) {
          console.error("Insert failed", error);
          setProjects(prev => prev.filter(item => item.id !== p.id));
      }
  };

  const deleteProject = async (id: string) => {
      // Optimistic
      setProjects(prev => prev.filter(p => p.id !== id));
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) fetchData(true);
  };
  
  const updateExperience = async (id: string, data: Partial<Experience>) => {
      setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      await supabase.from('experience').update(data).eq('id', id);
  };

  const addExperience = async (e: Experience) => {
      setExperience(prev => [e, ...prev]);
      await supabase.from('experience').insert(e);
  };

  const deleteExperience = async (id: string) => {
      setExperience(prev => prev.filter(e => e.id !== id));
      await supabase.from('experience').delete().eq('id', id);
  };
  
  const reorderExperience = async (items: Experience[]) => {
      setExperience(items);
      // Batch update order
      const updates = items.map((item, index) => ({
          id: item.id,
          order: index,
          company: item.company,
          role: item.role
      }));
      
      const { error } = await supabase.from('experience').upsert(updates, { onConflict: 'id' });
      if (error) console.error("Reorder failed", error);
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
      // Clean up deleted ones if any
      const ids = data.map(s => s.id);
      if (ids.length > 0) {
          await supabase.from('socials').delete().not('id', 'in', `(${ids.join(',')})`);
      }
  };

  // --- Legacy / Compatibility ---
  const syncData = async (commitMessage = "Manual Sync") => {
     // Operations are now real-time, but we can simulate a 'sync' visual
     console.log("Real-time sync active.");
     setIsSaving(true);
     await new Promise(resolve => setTimeout(resolve, 500));
     setIsSaving(false);
  };

  // --- Initialization ---
  useEffect(() => {
      fetchData();
  }, [fetchData]);

  const resetData = async () => {
      if (!confirm("Reset database to default demo data?")) return;
      
      // Clean tables
      await Promise.all([
          supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('experience').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
          supabase.from('socials').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);
      
      // Re-seed
      await supabase.from('projects').insert(INITIAL_PROJECTS);
      await supabase.from('experience').insert(INITIAL_EXPERIENCE);
      await supabase.from('clients').insert(INITIAL_CLIENTS);
      await supabase.from('skills').insert(INITIAL_SKILLS);
      await supabase.from('socials').insert(INITIAL_SOCIALS);
      await supabase.from('config').upsert({ ...INITIAL_CONFIG, id: 1 });
      
      fetchData(true);
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
