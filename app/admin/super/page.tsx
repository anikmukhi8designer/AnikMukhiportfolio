
'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/supabaseClient';
import { Shield, Clock, Check, X, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'manager' });
  const [createdTempPass, setCreatedTempPass] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    // Note: This fetch uses the client-side supabase which might fail if RLS is strict.
    // In a real app, you should create an API route to fetch this data securely.
    // For now, assuming you might adjust RLS or use the API route.
    const { data: userData } = await supabase.from('auth_users').select('*').order('created_at', { ascending: false });
    if (userData) setUsers(userData);

    const { data: reqData } = await supabase.from('password_reset_requests').select('*, auth_users(email, full_name)').eq('status', 'pending');
    if (reqData) setRequests(reqData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', { method: 'POST', body: JSON.stringify(newUser) });
    const data = await res.json();
    if(data.success) {
        setCreatedTempPass(data.temp_password);
        toast.success("User created!");
        fetchData();
        setNewUser({ email: '', full_name: '', role: 'manager' });
    } else {
        toast.error(data.error);
    }
  };

  const handleRequestAction = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/reset-action', { method: 'POST', body: JSON.stringify({ request_id: id, action }) });
    const data = await res.json();
    if(data.success) {
        toast.success(`Request ${action}ed`);
        if(data.temp_password) setCreatedTempPass(data.temp_password);
        fetchData();
    } else {
        toast.error(data.error);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Pending Reset Requests</h2>
        <div className="grid gap-4">
            {requests.map(req => (
                <div key={req.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex justify-between items-center">
                    <div>
                        <div className="font-bold">{req.auth_users?.full_name}</div>
                        <div className="text-sm text-neutral-500">{req.auth_users?.email}</div>
                        <div className="text-xs mt-1 bg-neutral-100 w-fit px-2 py-0.5 rounded">Reason: {req.reason}</div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleRequestAction(req.id, 'reject')} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded flex items-center gap-1"><X className="w-3 h-3"/> Reject</button>
                        <button onClick={() => handleRequestAction(req.id, 'approve')} className="px-3 py-1.5 text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 rounded flex items-center gap-1"><Check className="w-3 h-3"/> Approve</button>
                    </div>
                </div>
            ))}
        </div>
      </section>

      <div className="border-t border-neutral-200"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-blue-500" /> System Users</h2>
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 text-neutral-500 uppercase text-xs">
                        <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="px-4 py-3"><div className="font-medium">{u.full_name}</div><div className="text-neutral-500 text-xs">{u.email}</div></td>
                                <td className="px-4 py-3 capitalize">{u.role.replace('_', ' ')}</td>
                                <td className="px-4 py-3">{u.is_temp_password ? <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">Temp PW</span> : <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Active</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 h-fit">
            <h3 className="font-bold mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
                <input placeholder="Full Name" required className="w-full px-3 py-2 border rounded text-sm" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})}/>
                <input placeholder="Email" type="email" required className="w-full px-3 py-2 border rounded text-sm" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}/>
                <select className="w-full px-3 py-2 border rounded text-sm bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                </select>
                <button className="w-full bg-neutral-900 text-white py-2 rounded text-sm font-bold hover:bg-black">Create User</button>
            </form>
        </div>
      </div>

      {createdTempPass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center">
                <h3 className="text-xl font-bold mb-2 text-green-600">Action Successful</h3>
                <p className="text-sm text-neutral-500 mb-6">A temporary password has been generated.</p>
                <div className="bg-neutral-100 p-4 rounded-lg font-mono text-lg font-bold tracking-widest break-all mb-6 relative group cursor-pointer" onClick={() => { navigator.clipboard.writeText(createdTempPass); toast.success("Copied"); }}>
                    {createdTempPass} <Copy className="w-4 h-4 absolute top-2 right-2 opacity-50"/>
                </div>
                <button onClick={() => setCreatedTempPass(null)} className="w-full bg-neutral-900 text-white py-2 rounded font-bold">Done</button>
            </div>
        </div>
      )}
    </div>
  );
}
