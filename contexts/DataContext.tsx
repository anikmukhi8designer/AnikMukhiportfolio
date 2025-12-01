import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [skills, setSkills] = useState<SkillCategory[]>([]);

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
    // Projects
    const { data: projData } = await supabase.from('work_items').select('*').order('created_at', { ascending: false });
    if (projData) setProjects(projData.map(mapProjectFromDB));

    // Experience
    const { data: expData } = await supabase.from('experience_items').select('*').order('created_at', { ascending: false });
    if (expData) setExperience(expData as Experience[]);

    // Clients
    const { data: clientData } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (clientData) setClients(clientData as Client[]);

    // Skills
    const { data: skillData } = await supabase.from('skills').select('*').order('created_at', { ascending: true });
    if (skillData) setSkills(skillData as SkillCategory[]);
  };

  useEffect(() => {
    fetchData();

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
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // --- Actions ---

  // Projects
  const updateProject = async (id: string, data: Partial<Project>) => {
    // Optimistic UI update
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    const dbData = mapProjectToDB(data);
    await supabase.from('work_items').update(dbData).eq('id', id);
  };
  
  const addProject = async (project: Project) => {
    // Optimistic Update: Add immediately to local state
    setProjects(prev => [project, ...prev]);

    const dbData = mapProjectToDB(project);
    const { error } = await supabase.from('work_items').insert([dbData]);
    
    if (error) {
      console.error("Add Project Error:", error);
      // Rollback on error
      setProjects(prev => prev.filter(p => p.id !== project.id));
      alert("Failed to save project to database. Check console.");
    }
  };
  
  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    await supabase.from('work_items').delete().eq('id', id);
  };

  // Experience
  const updateExperience = async (id: string, data: Partial<Experience>) => {
    setExperience(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    await supabase.from('experience_items').update(data).eq('id', id);
  };
  const addExperience = async (exp: Experience) => {
    // Optimistic Update
    setExperience(prev => [exp, ...prev]);
    
    const { error } = await supabase.from('experience_items').insert([exp]);
    if (error) {
        console.error("Add Experience Error:", error);
        setExperience(prev => prev.filter(e => e.id !== exp.id));
    }
  };
  const deleteExperience = async (id: string) => {
    setExperience(prev => prev.filter(e => e.id !== id));
    await supabase.from('experience_items').delete().eq('id', id);
  };
  const reorderExperience = (items: Experience[]) => {
    setExperience(items);
    // Note: To persist order, we would need an 'order_index' column in DB.
    // For now, we update local state.
  };

  // Clients
  const updateClient = async (id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    await supabase.from('clients').update(data).eq('id', id);
  };
  const addClient = async (client: Client) => {
    // Optimistic Update
    setClients(prev => [client, ...prev]);
    
    const { error } = await supabase.from('clients').insert([client]);
    if (error) {
        console.error("Add Client Error:", error);
        setClients(prev => prev.filter(c => c.id !== client.id));
    }
  };
  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await supabase.from('clients').delete().eq('id', id);
  };

  // Skills
  const updateSkill = async (id: string, data: Partial<SkillCategory>) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    await supabase.from('skills').update(data).eq('id', id);
  };
  const addSkill = async (skill: SkillCategory) => {
    // Optimistic Update
    setSkills(prev => [...prev, skill]);
    
    const { error } = await supabase.from('skills').insert([skill]);
    if (error) {
        console.error("Add Skill Error:", error);
        setSkills(prev => prev.filter(s => s.id !== skill.id));
    }
  };
  const deleteSkill = async (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    await supabase.from('skills').delete().eq('id', id);
  };

  // --- Reset / Seed ---
  const resetData = async () => {
    if (confirm("⚠️ WARNING: This will WIPE the Supabase Database and seed with demo data. Continue?")) {
      
      // Clear all tables
      await supabase.from('work_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('experience_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Seed Projects
      const projectsPayload = INITIAL_PROJECTS.map(p => {
        // We can reuse IDs from data.ts for seed if they are UUIDs, 
        // but they are slugs. We should let DB generate or force them.
        // For simplicity in seed, let's just insert.
        const { id, ...rest } = p;
        return mapProjectToDB({ ...rest, published: true });
      });
      await supabase.from('work_items').insert(projectsPayload);

      // Seed Experience
      const expPayload = INITIAL_EXPERIENCE.map(e => {
        const { id, ...rest } = e;
        return { ...rest, published: true };
      });
      await supabase.from('experience_items').insert(expPayload);

      // Seed Clients
      const clientsPayload = INITIAL_CLIENTS.map(c => {
        const { id, ...rest } = c;
        return rest;
      });
      await supabase.from('clients').insert(clientsPayload);

      // Seed Skills
      const skillsPayload = INITIAL_SKILLS.map(s => {
        const { id, ...rest } = s;
        return rest;
      });
      await supabase.from('skills').insert(skillsPayload);

      alert("Database reset complete.");
      fetchData();
    }
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