import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Experience, Client, SkillCategory } from '../types';
import { 
  PROJECTS as INITIAL_PROJECTS, 
  EXPERIENCE as INITIAL_EXPERIENCE, 
  CLIENTS as INITIAL_CLIENTS, 
  SKILLS as INITIAL_SKILLS
} from '../data';
import { db } from '../firebase';

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

  // --- Helper: Sync Collection ---
  // Connects local state to a Firestore collection using Compat SDK
  const syncCollection = (
    collectionName: string, 
    setState: React.Dispatch<React.SetStateAction<any[]>>, 
    initialData: any[]
  ) => {
    useEffect(() => {
      const colRef = db.collection(collectionName);
      const unsubscribe = colRef.onSnapshot(async (snapshot: any) => {
        if (snapshot.empty) {
          // SEEDING: If DB is empty, upload initial data automatically
          console.log(`Seeding ${collectionName}...`);
          const batch = db.batch();
          initialData.forEach((item) => {
            const docRef = db.collection(collectionName).doc(item.id);
            batch.set(docRef, item);
          });
          await batch.commit();
        } else {
          // SYNC: Update local state from DB
          const items = snapshot.docs.map((doc: any) => doc.data());
          setState(items);
        }
      });
      return () => unsubscribe();
    }, []);
  };

  // --- Activate Syncs ---
  syncCollection('projects', setProjects, INITIAL_PROJECTS.map(p => ({ ...p, published: true })));
  syncCollection('experience', setExperience, INITIAL_EXPERIENCE.map(e => ({ ...e, published: true })));
  syncCollection('clients', setClients, INITIAL_CLIENTS);
  syncCollection('skills', setSkills, INITIAL_SKILLS);

  // --- Actions (Write to Firebase) ---

  // Projects
  const updateProject = async (id: string, data: Partial<Project>) => {
    await db.collection('projects').doc(id).update(data);
  };
  const addProject = async (project: Project) => {
    await db.collection('projects').doc(project.id).set(project);
  };
  const deleteProject = async (id: string) => {
    await db.collection('projects').doc(id).delete();
  };

  // Experience
  const updateExperience = async (id: string, data: Partial<Experience>) => {
    await db.collection('experience').doc(id).update(data);
  };
  const addExperience = async (exp: Experience) => {
    await db.collection('experience').doc(exp.id).set(exp);
  };
  const deleteExperience = async (id: string) => {
    await db.collection('experience').doc(id).delete();
  };
  const reorderExperience = async (items: Experience[]) => {
    const batch = db.batch();
    items.forEach((item) => {
      batch.set(db.collection('experience').doc(item.id), item);
    });
    await batch.commit();
    setExperience(items); // Optimistic update
  };

  // Clients
  const updateClient = async (id: string, data: Partial<Client>) => {
    await db.collection('clients').doc(id).update(data);
  };
  const addClient = async (client: Client) => {
    await db.collection('clients').doc(client.id).set(client);
  };
  const deleteClient = async (id: string) => {
    await db.collection('clients').doc(id).delete();
  };

  // Skills
  const updateSkill = async (id: string, data: Partial<SkillCategory>) => {
    await db.collection('skills').doc(id).update(data);
  };
  const addSkill = async (skill: SkillCategory) => {
    await db.collection('skills').doc(skill.id).set(skill);
  };
  const deleteSkill = async (id: string) => {
    await db.collection('skills').doc(id).delete();
  };

  const resetData = async () => {
    if (confirm("This will overwrite your Cloud Database with the demo data. Are you sure?")) {
      alert("Please clear the collections in your Firebase Console to trigger a re-seed.");
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