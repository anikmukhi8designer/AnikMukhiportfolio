import React, { useState } from 'react';
import { Database, Key, Loader2, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import DbStatus from '../DbStatus';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
        if (isSignUp) {
            // Casting auth to any to bypass potential type mismatch where signUp might not be recognized in strict mode or old types
            const { data, error } = await (supabase.auth as any).signUp({
                email,
                password,
            });
            if (error) throw error;
            if (data.user) {
                setMessage("Account created! You can now log in.");
                setIsSignUp(false);
            }
        } else {
            // Casting auth to any to bypass potential type mismatch for signInWithPassword
            const { data, error } = await (supabase.auth as any).signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            if (data.user) {
                localStorage.setItem('supabase_user', data.user.id);
                onLogin();
            }
        }
    } catch (err: any) {
        setError(err.message || "Authentication failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 font-sans relative">
      <DbStatus />
      
      <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl shadow-neutral-200/50 relative z-10">
        
        <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {isSignUp ? 'Create Admin Account' : 'CMS Login'}
            </h1>
            <p className="text-sm text-neutral-500">
                {isSignUp ? 'Set up your secure access credentials.' : 'Sign in to your Supabase-backed Portfolio.'}
            </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            
            {message && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2 text-sm text-green-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{message}</span>
                </div>
            )}

            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Email</label>
                <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Password</label>
                <div className="relative">
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                    />
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? <UserPlus className="w-4 h-4"/> : <LogIn className="w-4 h-4" />)}
                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
            <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium underline"
            >
                {isSignUp ? "Already have an account? Sign in" : "Need to configure a new user? Sign up"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;