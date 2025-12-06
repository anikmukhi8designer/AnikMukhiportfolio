
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        toast.success("Password updated successfully");
        router.push('/admin/dashboard');
        router.refresh();
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-orange-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-orange-100 shadow-xl">
            <div className="flex flex-col items-center mb-6 text-center">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-neutral-900">Change Password Required</h1>
                <p className="text-sm text-neutral-500 mt-2">
                    You are using a temporary password. For security, please set a new permanent password.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Current Temp Password</label>
                    <input 
                        type="password" 
                        required 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">New Password</label>
                    <input 
                        type="password" 
                        required 
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="Min 8 chars"
                    />
                </div>
                <button 
                    disabled={loading}
                    className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin"/>} Update Password
                </button>
            </form>
        </div>
    </div>
  );
}
