
import React, { useState, useEffect } from 'react';
import { Database, Key, Loader2, AlertCircle, UserPlus, LogIn, Settings, X, Save, ArrowLeft, Mail, AlertTriangle } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';
import DbStatus from '../DbStatus';

interface AdminLoginProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState('');
  const [isDemoConnection, setIsDemoConnection] = useState(false);
  
  // Connection Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');

  useEffect(() => {
      // Load existing custom settings
      const storedUrl = localStorage.getItem('sb_url');
      const storedKey = localStorage.getItem('sb_key');
      if (storedUrl) setCustomUrl(storedUrl);
      if (storedKey) setCustomKey(storedKey);

      // Check if connected to the placeholder demo database
      // @ts-ignore - Accessing internal property for validation
      const currentUrl = supabase.supabaseUrl || '';
      if (currentUrl.includes('ppaaanrjvptohtuduebu')) {
          setIsDemoConnection(true);
      }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDemoConnection && mode !== 'login') {
        setError("You are connected to the Demo Database. You cannot create accounts or reset passwords here. Please connect to your own Supabase project via 'Connection Settings' below.");
        return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
        if (mode === 'signup') {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            if (data.user) {
                setMessage("Account created! You can now log in.");
                setMode('login');
            } else if (data.session) {
                // Auto login if session returned immediately (email confirm off)
                onLogin();
            }
        } else if (mode === 'login') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            if (data.session) {
                onLogin();
            }
        } else if (mode === 'forgot') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/#admin',
            });
            if (error) throw error;
            setMessage("Password reset link sent! Check your email.");
        }
    } catch (err: any) {
        let msg = err.message || "Authentication failed";
        // Specific help for common Supabase errors
        if (msg.toLowerCase().includes('captcha')) {
            msg = "Signup failed: Captcha is enabled. Please go to your Supabase Dashboard > Authentication > Security and disable 'Enable CAPTCHA protection'.";
        } else if (msg.includes('rate limit')) {
            msg = "Too many attempts. Please wait a moment.";
        }
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  const saveConnectionSettings = () => {
      if (!customUrl.trim() || !customKey.trim()) {
          setError("URL and Key are required.");
          return;
      }
      localStorage.setItem('sb_url', customUrl.trim());
      localStorage.setItem('sb_key', customKey.trim());
      // Reload to re-initialize supabase client with new keys
      window.location.reload();
  };

  const clearConnectionSettings = () => {
      if(confirm("Reset to default connection?")) {
          localStorage.removeItem('sb_url');
          localStorage.removeItem('sb_key');
          window.location.reload();
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 font-sans relative">
      <DbStatus />
      
      <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl shadow-neutral-200/50 relative z-10">
        
        {/* Settings Modal Overlay */}
        {showSettings && (
            <div className="absolute inset-0 bg-white z-20 rounded-2xl p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Connection Settings
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-neutral-100 rounded-full">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>
                
                <div className="space-y-4 flex-grow overflow-y-auto">
                    <p className="text-xs text-neutral-500 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                        Connect to your own Supabase project to enable editing. Find these in Project Settings &rarr; API.
                    </p>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Project URL</label>
                        <input 
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                            placeholder="https://xyz.supabase.co"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                        />
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">Anon / Public Key</label>
                        <input 
                            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                            placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                            value={customKey}
                            onChange={(e) => setCustomKey(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button 
                        onClick={clearConnectionSettings}
                        className="flex-1 py-2 text-red-600 text-sm font-bold hover:bg-red-50 rounded"
                    >
                        Reset Default
                    </button>
                    <button 
                        onClick={saveConnectionSettings}
                        className="flex-1 py-2 bg-neutral-900 text-white text-sm font-bold rounded hover:bg-black flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save & Reload
                    </button>
                </div>
            </div>
        )}

        <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {mode === 'signup' ? 'Create Admin Account' : mode === 'forgot' ? 'Reset Password' : 'CMS Login'}
            </h1>
            <p className="text-sm text-neutral-500">
                {mode === 'signup' ? 'Set up your secure access credentials.' : mode === 'forgot' ? 'Enter email to receive reset link.' : 'Sign in to your Supabase-backed Portfolio.'}
            </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
            {isDemoConnection && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2 text-xs text-blue-700">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You are using the Demo Database. Signups are disabled. Click "Connection Settings" to connect your own DB.</span>
                </div>
            )}

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

            {mode !== 'forgot' && (
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
            )}
            
            {mode === 'login' && (
                 <div className="flex justify-end">
                    <button 
                        type="button"
                        onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                        className="text-xs text-neutral-500 hover:text-neutral-900 font-medium"
                    >
                        Forgot Password?
                    </button>
                 </div>
            )}

            <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'signup' ? <UserPlus className="w-4 h-4"/> : mode === 'forgot' ? <Mail className="w-4 h-4"/> : <LogIn className="w-4 h-4" />)}
                {loading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In')}
            </button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col items-center gap-4">
            {mode === 'forgot' ? (
                 <button 
                    onClick={() => { setMode('login'); setError(''); setMessage(''); }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 font-medium flex items-center gap-1"
                 >
                    <ArrowLeft className="w-3 h-3" /> Back to Login
                 </button>
            ) : (
                <button 
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 font-medium underline"
                >
                    {mode === 'login' ? "Need to configure a new user? Sign up" : "Already have an account? Sign in"}
                </button>
            )}

            <button 
                onClick={() => setShowSettings(true)}
                className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-1"
            >
                <Settings className="w-3 h-3" /> Connection Settings
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
