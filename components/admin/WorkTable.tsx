import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Edit2, Trash2, Plus, Loader2, Check, AlertCircle } from 'lucide-react';

// Robust UUID Generator
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface WorkTableProps {
  onEdit?: (projectId: string) => void;
}

const WorkTable: React.FC<WorkTableProps> = ({ onEdit }) => {
  const { projects, updateProject, deleteProject, addProject } = useData();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Status Notification State
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  const showStatus = (type: 'success' | 'error' | 'loading', message: string) => {
    setStatus({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleAddNew = async () => {
    try {
        showStatus('loading', 'Creating new project in Database...');
        
        const newId = generateUUID();
        const newProject = {
          id: newId,
          title: "New Project",
          client: "Client Name",
          roles: ["Design"],
          description: "Short description...",
          year: new Date().getFullYear(),
          heroImage: "https://picsum.photos/1200/800",
          thumb: "https://picsum.photos/800/600",
          tags: ["Tag 1"],
          published: true, 
          images: [],
          content: []
        };
        
        await addProject(newProject);
        showStatus('success', 'Project created successfully!');
        
        // Delay opening editor slightly so user sees the success message
        setTimeout(() => {
            if (onEdit) onEdit(newId);
        }, 500);

    } catch (e: any) {
        console.error("Add Project Failed:", e);
        showStatus('error', `Failed to create project: ${e.message || 'Unknown error'}`);
    }
  };
  
  const handleDelete = async (id: string) => {
      if(!confirm("Delete this project?")) return;
      
      try {
          setDeletingId(id);
          showStatus('loading', 'Deleting project...');
          await deleteProject(id);
          showStatus('success', 'Project deleted from Database');
      } catch (e: any) {
          showStatus('error', 'Failed to delete project');
      } finally {
          setDeletingId(null);
      }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
      try {
          showStatus('loading', 'Updating status...');
          await updateProject(id, { published: !currentStatus });
          showStatus('success', `Project ${!currentStatus ? 'Published' : 'Unpublished'}`);
      } catch (e) {
          showStatus('error', 'Failed to update status');
      }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">All Projects ({projects.length})</h3>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Project Title</th>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Year</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleTogglePublish(project.id, project.published)}
                      className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold w-fit transition-colors ${
                        project.published 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {project.published ? 'Live' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-neutral-900">{project.title}</span>
                  </td>
                  <td className="px-6 py-4 text-neutral-600">
                     {project.client}
                  </td>
                  <td className="px-6 py-4 text-neutral-600">
                    {project.year}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-neutral-400">
                      <button 
                        onClick={() => onEdit && onEdit(project.id)}
                        className="hover:text-neutral-900 flex items-center gap-1"
                        title="Open Editor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className="hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === project.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Toast Notification */}
      {status.message && (
        <div className={`fixed bottom-8 right-8 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in z-[9999] border backdrop-blur-md ${
            status.type === 'error' ? 'bg-red-50/90 text-red-700 border-red-200' : 
            status.type === 'success' ? 'bg-green-50/90 text-green-700 border-green-200' : 
            'bg-neutral-900/90 text-white border-neutral-800'
        }`}>
            {status.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status.type === 'success' && <Check className="w-4 h-4" />}
            {status.type === 'error' && <AlertCircle className="w-4 h-4" />}
            <span className="pr-1">{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default WorkTable;