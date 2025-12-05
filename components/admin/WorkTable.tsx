import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Edit2, Trash2, Plus, Loader2 } from 'lucide-react';

interface WorkTableProps {
  onEdit?: (projectId: string) => void;
}

const WorkTable: React.FC<WorkTableProps> = ({ onEdit }) => {
  const { projects, updateProject, deleteProject, addProject } = useData();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleAddNew = async () => {
    // Generate UUID locally so we can use it immediately in the UI (Optimistic Update)
    const newId = self.crypto.randomUUID();
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
      published: true, // Default to true so it shows up immediately
      images: [],
      content: []
    };
    
    await addProject(newProject);
    if (onEdit) onEdit(newId);
  };
  
  const handleDelete = async (id: string) => {
      if(!confirm("Delete this project?")) return;
      setDeletingId(id);
      await deleteProject(id);
      setDeletingId(null);
  };

  return (
    <div className="space-y-6">
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
                      onClick={() => updateProject(project.id, { published: !project.published })}
                      className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold w-fit ${
                        project.published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-neutral-100 text-neutral-500'
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
    </div>
  );
};

export default WorkTable;