
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Welcome back");
        router.push(data.redirect);
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl">
        <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Admin Access</h1>
            <p className="text-sm text-neutral-500">Secure System Login</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none"/>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neutral-900 outline-none"/>
            </div>
            <button disabled={loading} className="w-full py-3 bg-neutral-900 text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin"/>} Sign In
            </button>
        </form>
        <div className="mt-6 pt-6 border-t text-center">
            <a href="/admin/forgot-password" className="text-sm text-neutral-500 hover:text-neutral-900 underline flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4"/> Request Password Reset
            </a>
        </div>
      </div>
    </div>
  );
}
