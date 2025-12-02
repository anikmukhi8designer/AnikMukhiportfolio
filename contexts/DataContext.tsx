import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Project, Experience, Client, SkillCategory } from '../types';
import { supabase } from '../supabaseClient';
import { 
  PROJECTS as INITIAL_PROJECTS, 
  EXPERIENCE as INITIAL_EXPERIENCE, 
  CLIENTS as INITIAL_CLIENTS, 
  SKILLS as INITIAL_SKILLS
} from '../data';

interface DataContextType {
  projects: Project[];
  experience: Experience[];
  clients: Client[];
  skills: SkillCategory[];
  lastUpdated: Date | null;
  
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
  refreshAllClients: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [skills, setSkills] = useState<SkillCategory[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Unique ID for this session to identify self-broadcasts
  const clientId = useRef(Math.random().toString(36).substring(7)).current;
  
  // Keep track of the broadcast channel to send messages
  const [globalChannel, setGlobalChannel] = useState<any>(null);

  // Helper to map DB snake_case to Frontend camelCase
  const mapProjectFromDB = (data: any): Project => ({
    ...data,
    heroImage: data.hero_image,
    // Ensure arrays are initialized
    roles: data.roles || [],
    tags: data.tags || [],
    images: data.images || [],
    content: data.content || []
  });

  const mapProjectToDB = (data: Partial<Project>) => {
    const { heroImage, ...rest } = data;
    return {
      ...rest,
      ...(heroImage && { hero_image: heroImage })
    };
  };

  // --- Real-time Sync & Fetch Logic ---

  const fetchData = async () => {
    try {
        // 1. Projects
        const { data: projData, error: projError } = await supabase.from('work_items').select('*').order('created_at', { ascending: false });
        
        if (projData && projData.length > 0) {
            setProjects(projData.map(mapProjectFromDB));
        } else if (!projError) {
            // DB is accessible but empty. Auto-seed so updates work.
            console.log("Seeding Projects DB...");
            const dbPayload = INITIAL_PROJECTS.map(p => mapProjectToDB({ ...p, published: true }));
            await supabase.from('work_items').insert(dbPayload);
            setProjects(INITIAL_PROJECTS);
        } else {
            // Offline fallback
            setProjects(INITIAL_PROJECTS);
        }

        // 2. Experience
        const { data: expData, error: expError } = await supabase.from('experience_items').select('*').order('created_at', { ascending: false });
        
        if (expData && expData.length > 0) {
            setExperience(expData as Experience[]);
        } else if (!expError) {
             console.log("Seeding Experience DB...");
             const dbPayload = INITIAL_EXPERIENCE.map(e => ({ ...e, published: true }));
             await supabase.from('experience_items').insert(dbPayload);
             setExperience(INITIAL_EXPERIENCE);
        } else {
            setExperience(INITIAL_EXPERIENCE);
        }

        // 3. Clients
        const { data: clientData, error: clientError } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        
        if (clientData && clientData.length > 0) {
            setClients(clientData as Client[]);
        } else if (!clientError) {
             console.log("Seeding Clients DB...");
             await supabase.from('clients').insert(INITIAL_CLIENTS);
             setClients(INITIAL_CLIENTS);
        } else {
            setClients(INITIAL_CLIENTS);
        }

        // 4. Skills
        const { data: skillData, error: skillError } = await supabase.from('skills').select('*').order('created_at', { ascending: true });
        
        if (skillData && skillData.length > 0) {
            setSkills(skillData as SkillCategory[]);
        } else if (!skillError) {
             console.log("Seeding Skills DB...");
             await supabase.from('skills').insert(INITIAL_SKILLS);
             setSkills(INITIAL_SKILLS);
        } else {
            setSkills(INITIAL_SKILLS);
        }

    } catch (e) {
        console.warn("Fetch Error - falling back to local data:", e);
        // Ensure data is present even if fetch explodes
        if(projects.length === 0) setProjects(INITIAL_PROJECTS);
        if(experience.length === 0) setExperience(INITIAL_EXPERIENCE);
        if(clients.length === 0) setClients(INITIAL_CLIENTS);
        if(skills.length === 0) setSkills(INITIAL_SKILLS);
    }
  };

  useEffect(() => {
    fetchData();

    // Safely subscribe only if supabase real-time is available
    try {
        // 1. Setup Broadcast Channel for Manual Sync
        const syncChannel = supabase.channel('global_sync')
            .on('broadcast', { event: 'force_update' }, (payload) => {
                // Only fetch if the signal came from a DIFFERENT client
                if (payload.payload?.senderId !== clientId) {
                    console.log("Received global update signal");
                    fetchData();
                }
            })
            .subscribe();
        setGlobalChannel(syncChannel);

        // 2. Setup Database Change Listeners
        const channels = [
          supabase.channel('work_items_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'work_items' }, () => fetchData())
            .subscribe(),

          supabase.channel('experience_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'experience_items' }, () => fetchData())
            .subscribe(),

          supabase.channel('clients_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => fetchData())
            .subscribe(),

          supabase.channel('skills_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, () => fetchData())
            .subscribe(),
        ];

        return () => {
          supabase.removeChannel(syncChannel);
          channels.forEach(channel => supabase.removeChannel(channel));
        };
    } catch (e) {
        console.warn("Realtime subscription failed (offline mode):", e);
    }
  }, []);

  // --- Broadcast Action ---
  const refreshAllClients = async () => {
      // 1. Force Sync current state to DB (Repository Update)
      console.log("Syncing all data to repository...");
      
      try {
          // Projects
          const projectsPayload = projects.map(p => mapProjectToDB(p));
          await supabase.from('work_items').upsert(projectsPayload);

          // Experience
          await supabase.from('experience_items').upsert(experience);

          // Clients
          await supabase.from('clients').upsert(clients);

          // Skills
          await supabase.from('skills').upsert(skills);
          
          console.log("Repository updated successfully.");
          setLastUpdated(new Date());
      } catch (e) {
          console.error("Failed to sync to repository:", e);
      }

      // 2. Send signal to the world
      if (globalChannel) {
          try {
              await globalChannel.send({
                  type: 'broadcast',
                  event: 'force_update',
                  payload: { 
                      timestamp: Date.now(),
                      senderId: clientId // Identify ourselves so we don't handle our own broadcast
                  }
              });
              console.log("Global update signal sent.");
          } catch (e) {
              console.warn("Failed to broadcast update:", e);
          }
      }
  };

  // --- Actions ---

  // Projects
  const updateProject = async (id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try {
        const dbData = mapProjectToDB(data);
        const { error } = await supabase.from('work_items').update(dbData).eq('id', id);
        if (error) console.warn("Supabase Sync Error (Update Project):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };
  
  const addProject = async (project: Project) => {
    setProjects(prev => [project, ...prev]);
    try {
        const dbData = mapProjectToDB(project);
        const { error } = await supabase.from('work_items').insert([dbData]);
        if (error) console.warn("Supabase Sync Error (Add Project):", error.message);
    } catch (e) { console.warn("Sync failed", e); }
  };
  
  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    try {
        const { error } = await supabase.from('work_items').delete().eq('id', id);
        if (error) console.warn("Supabase Sync Error (Delete Project):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };

  // Experience
  const updateExperience = async (id: string, data: Partial<Experience>) => {
    setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    try {
        const { error } = await supabase.from('experience_items').update(data).eq('id', id);
        if (error) console.warn("Supabase Sync Error (Update Experience):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };
  const addExperience = async (exp: Experience) => {
    setExperience(prev => [exp, ...prev]);
    try {
        const { error } = await supabase.from('experience_items').insert([exp]);
        if (error) console.warn("Supabase Sync Error (Add Experience):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };
  const deleteExperience = async (id: string) => {
    setExperience(prev => prev.filter(e => e.id !== id));
    try {
        const { error } = await supabase.from('experience_items').delete().eq('id', id);
        if (error) console.warn("Supabase Sync Error (Delete Experience):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };
  const reorderExperience = (items: Experience[]) => {
    setExperience(items);
  };

  // Clients
  const updateClient = async (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try {
        const { error } = await supabase.from('clients').update(data).eq('id', id);
        if (error) console.warn("Supabase Sync Error (Update Client):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };
  const addClient = async (client: Client) => {
    setClients(prev => [client, ...prev]);
    try {
        const { error } = await supabase.from('clients').insert([client]);
        if (error) console.warn("Supabase Sync Error (Add Client):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };
  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    try {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) console.warn("Supabase Sync Error (Delete Client):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };

  // Skills
  const updateSkill = async (id: string, data: Partial<SkillCategory>) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    try {
        const { error } = await supabase.from('skills').update(data).eq('id', id);
        if (error) console.warn("Supabase Sync Error (Update Skill):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };
  const addSkill = async (skill: SkillCategory) => {
    setSkills(prev => [...prev, skill]);
    try {
        const { error } = await supabase.from('skills').insert([skill]);
        if (error) console.warn("Supabase Sync Error (Add Skill):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };
  const deleteSkill = async (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    try {
        const { error } = await supabase.from('skills').delete().eq('id', id);
        if (error) console.warn("Supabase Sync Error (Delete Skill):", error.message);
    } catch(e) { console.warn("Sync failed", e) }
  };

  // --- Reset / Seed ---
  const resetData = async () => {
    if (confirm("⚠️ WARNING: This will WIPE the Supabase Database and seed with demo data. Continue?")) {
      try {
          await supabase.from('work_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('experience_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');

          const projectsPayload = INITIAL_PROJECTS.map(p => {
            const { id, ...rest } = p;
            return mapProjectToDB({ ...rest, published: true });
          });
          await supabase.from('work_items').insert(projectsPayload);

          const expPayload = INITIAL_EXPERIENCE.map(e => {
            const { id, ...rest } = e;
            return { ...rest, published: true };
          });
          await supabase.from('experience_items').insert(expPayload);

          const clientsPayload = INITIAL_CLIENTS.map(c => {
            const { id, ...rest } = c;
            return rest;
          });
          await supabase.from('clients').insert(clientsPayload);

          const skillsPayload = INITIAL_SKILLS.map(s => {
            const { id, ...rest } = s;
            return rest;
          });
          await supabase.from('skills').insert(skillsPayload);

          alert("Database reset complete.");
          fetchData();
          setLastUpdated(new Date());
      } catch (e: any) {
          console.warn("Reset failed", e);
      }
    }
  };

  return (
    <DataContext.Provider value={{
      projects, experience, clients, skills, lastUpdated,
      updateProject, addProject, deleteProject,
      updateExperience, addExperience, deleteExperience, reorderExperience,
      updateClient, addClient, deleteClient,
      updateSkill, addSkill, deleteSkill,
      resetData, refreshAllClients
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