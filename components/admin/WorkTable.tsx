import React from 'react';
import { useData } from '../../contexts/DataContext';
import { Edit2, Trash2, Eye, EyeOff, Plus } from 'lucide-react';

const WorkTable: React.FC = () => {
  const { projects, updateProject, deleteProject, addProject } = useData();

  const handleAddNew = () => {
    const newId = `project-${Date.now()}`;
    addProject({
      id: newId,
      title: "New Project",
      client: "Client Name",
      roles: ["Design"],
      description: "Short description...",
      year: new Date().getFullYear(),
      heroImage: "https://picsum.photos/1200/800",
      thumb: "https://picsum.photos/800/600",
      tags: ["Tag 1"],
      published: false,
      images: []
    });
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
                <th className="px-6 py-4 font-semibold">Role</th>
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
                    <input 
                      className="bg-transparent border-none p-0 font-medium text-neutral-900 w-full focus:ring-0"
                      value={project.title}
                      onChange={(e) => updateProject(project.id, { title: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                     <input 
                      className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0"
                      value={project.client}
                      onChange={(e) => updateProject(project.id, { client: e.target.value })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      className="bg-transparent border-none p-0 text-neutral-600 w-16 focus:ring-0"
                      value={project.year}
                      type="number"
                      onChange={(e) => updateProject(project.id, { year: parseInt(e.target.value) })}
                    />
                  </td>
                   <td className="px-6 py-4">
                    <input 
                      className="bg-transparent border-none p-0 text-neutral-600 w-full focus:ring-0"
                      value={project.roles.join(', ')}
                      onChange={(e) => updateProject(project.id, { roles: e.target.value.split(',').map(s => s.trim()) })}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-neutral-400">
                      <button className="hover:text-neutral-900"><Edit2 className="w-4 h-4" /></button>
                      <button 
                        onClick={() => deleteProject(project.id)}
                        className="hover:text-red-600"
                      ><Trash2 className="w-4 h-4" /></button>
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
