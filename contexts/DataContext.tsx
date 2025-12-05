import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  updateConfig: (data: Partial<GlobalConfig>) => void;
  updateSocials: (data: SocialLink[]) => void;
  verifyConnection: () => Promise<{ success: boolean; message: string }>;
  getHistory: () => Promise<any[]>;
  restoreVersion: (sha: string) => Promise<void>;
  getSyncHistory: () => Promise<SyncLogEntry[]>;
  latestPreviewUrl: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to access env safely
const getEnv = (key: string) => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch(e) {}
    return '';
};

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
  
  // These are kept for API compatibility with UI but might be unused in Supabase context
  const [branch, setBranch] = useState('main'); 
  const [latestPreviewUrl, setLatestPreviewUrl] = useState<string | null>(null);

  const stateRef = useRef({ projects, experience, clients, skills, config, socials });
  useEffect(() => {
      stateRef.current = { projects, experience, clients, skills, config, socials };
  }, [projects, experience, clients, skills, config, socials]);

  // --- Core Logic: Fetch from Supabase ---
  const fetchData = useCallback(async (silent = false): Promise<boolean> => {
    if (!silent) setIsLoading(true);
    
    try {
        // Parallel fetch for speed
        const [
            { data: projectsData },
            { data: experienceData },
            { data: clientsData },
            { data: skillsData },
            { data: socialsData },
            { data: configData }
        ] = await Promise.all([
            supabase.from('projects').select('*').order('year', { ascending: false }),
            supabase.from('experience').select('*'),
            supabase.from('clients').select('*'),
            supabase.from('skills').select('*'),
            supabase.from('socials').select('*'),
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
        if (!silent) setError("Failed to load data from database.");
        return false;
    } finally {
        if (!silent) setIsLoading(false);
    }
  }, []);

  // --- Realtime Subscription ---
  useEffect(() => {
    const channel = supabase
      .channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        // When any table changes, refresh data
        setHasNewVersion(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Core Logic: Sync (Save to Supabase) ---
  const syncData = async (commitMessage = "Manual Sync") => {
      if (!navigator.onLine) throw new Error("No internet connection.");
      setIsSaving(true);
      const now = new Date();
      
      try {
          // Upsert Config (Single Row, ID=1)
          const configPayload = { ...stateRef.current.config, id: 1 };
          
          await Promise.all([
             supabase.from('projects').upsert(stateRef.current.projects),
             supabase.from('experience').upsert(stateRef.current.experience),
             supabase.from('clients').upsert(stateRef.current.clients),
             supabase.from('skills').upsert(stateRef.current.skills),
             supabase.from('config').upsert(configPayload),
             // For socials, we delete all and recreate to handle removals easily, 
             // or upsert if we track IDs carefully. Recreate is safer for small lists.
             (async () => {
                const { error } = await supabase.from('socials').upsert(stateRef.current.socials);
                if (error) console.error("Socials sync error", error);
             })()
          ]);

          setLastUpdated(now);
          setHasNewVersion(false);
          
          // Log sync locally or in a 'logs' table if you created one
          console.log("Database synced successfully");

      } catch (e: any) {
          console.error("Sync Data Failed", e);
          throw e;
      } finally {
          setIsSaving(false);
      }
  };

  // --- Lifecycle ---
  useEffect(() => {
      // Always fetch, as we have defaults in supabaseClient now
      fetchData();
  }, [fetchData]);

  // Wrappers
  const updateProject = (id: string, data: Partial<Project>) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const addProject = (p: Project) => setProjects(prev => [p, ...prev]);
  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    // Optimistic delete from DB
    supabase.from('projects').delete().eq('id', id).then();
  };
  
  const updateExperience = (id: string, data: Partial<Experience>) => setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  const addExperience = (e: Experience) => setExperience(prev => [e, ...prev]);
  const deleteExperience = (id: string) => {
      setExperience(prev => prev.filter(e => e.id !== id));
      supabase.from('experience').delete().eq('id', id).then();
  };
  
  const reorderExperience = (items: Experience[]) => setExperience(items);
  
  const updateClient = (id: string, data: Partial<Client>) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const addClient = (c: Client) => setClients(prev => [...prev, c]);
  const deleteClient = (id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
      supabase.from('clients').delete().eq('id', id).then();
  };
  
  const updateSkill = (id: string, data: Partial<SkillCategory>) => setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const addSkill = (s: SkillCategory) => setSkills(prev => [...prev, s]);
  const deleteSkill = (id: string) => {
      setSkills(prev => prev.filter(s => s.id !== id));
      supabase.from('skills').delete().eq('id', id).then();
  };
  
  const updateConfig = (data: Partial<GlobalConfig>) => setConfig(prev => ({ ...prev, ...data }));
  const updateSocials = (data: SocialLink[]) => setSocials(data);

  const resetData = async () => {
      if (!confirm("This will overwrite your database with the default demo data. Continue?")) return;
      
      setProjects(INITIAL_PROJECTS);
      setExperience(INITIAL_EXPERIENCE);
      setClients(INITIAL_CLIENTS);
      setSkills(INITIAL_SKILLS);
      setConfig(INITIAL_CONFIG);
      setSocials(INITIAL_SOCIALS);
      
      // Force sync immediately
      setTimeout(() => syncData("Reset Data"), 500);
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

  // Mock History for now as DB doesn't have git history
  const getHistory = async () => [];
  const restoreVersion = async (sha: string) => {};
  const getSyncHistory = async () => [];

  const triggerDeploy = async () => {
       const deployHook = localStorage.getItem('vercel_deploy_hook');
      if (!deployHook) throw new Error("No Deploy Hook configured in Settings.");
      try {
          const separator = deployHook.includes('?') ? '&' : '?';
          const hookWithCache = `${deployHook}${separator}t=${Date.now()}`;
          await fetch(hookWithCache, { method: 'POST', mode: 'no-cors' });
      } catch (e: any) {
          throw new Error("Failed to trigger deploy hook.");
      }
  };

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