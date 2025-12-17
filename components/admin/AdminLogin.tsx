import React, { useState, useEffect } from 'react';
import { Database, Key, Loader2, AlertCircle, UserPlus, LogIn, Settings, X, Save, ArrowLeft, Mail, CheckCircle, ShieldAlert, Lock, Globe } from 'lucide-react';
import { supabase, isDemo } from '../../src/supabaseClient';

interface AdminLoginProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState('');
  
  // Connection Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [envDetected, setEnvDetected] = useState(false);

  useEffect(() => {
      // Load existing custom settings
      const storedUrl = localStorage.getItem('sb_url');
      const storedKey = localStorage.getItem('sb_key');
      if (storedUrl) setCustomUrl(storedUrl);
      if (storedKey) setCustomKey(storedKey);

      // Check if Env vars are active
      // @ts-ignore
      const envUrl = import.meta.env.VITE_SUPABASE_URL;
      setEnvDetected(!!envUrl);

      // Identify current connection
      // @ts-ignore
      const currentUrl = supabase.supabaseUrl || '';
      const match = currentUrl.match(/https:\/\/([^.]+)\./);
      setProjectUrl(match ? match[1] : 'Unknown Project');
      
      // Check if we have a hash indicating a specific mode
      if (window.location.hash === '#signup') setMode('signup');
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
        if (mode === 'signup') {
            // We allow signup attempts even in Demo mode (user might be mistaken or using a permissive demo instance)
            // But we warn them if it fails.
            
            if (password !== confirmPassword) {
                throw new Error("Passwords do not match.");
            }
            if (password.length < 6) {
                throw new Error("Password must be at least 6 characters.");
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            
            if (error) {
                 if (isDemo) {
                     throw new Error(`${error.message} (Note: You are currently connected to the Read-Only Demo Database. Please click the Settings icon to connect your own Supabase project.)`);
                 }
                 throw error;
            }

            if (data.user) {
                setMessage("Account created successfully! Logging you in...");
                if (data.session) {
                    setTimeout(onLogin, 1000);
                } else {
                    setMessage("Account created! Please check your email to confirm.");
                    setMode('login');
                }
            }
        } else if (mode === 'login') {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    throw new Error("User not found or wrong password. If this is your first time, please switch to 'Create Admin Account'.");
                }
                throw error;
            }
            if (data.session) {
                onLogin();
            }
        } else if (mode === 'forgot') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/#admin',
            });
            if (error) {
                if (isDemo) throw new Error("Cannot reset password on Demo Database.");
                throw error;
            }
            setMessage("Password reset link sent! Check your email.");
        }
    } catch (err: any) {
        setError(err.message || "Authentication failed");
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
      window.location.reload();
  };

  const clearConnectionSettings = () => {
      if(confirm("Reset to default/environment connection?")) {
          localStorage.removeItem('sb_url');
          localStorage.removeItem('sb_key');
          window.location.reload();
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl shadow-neutral-200/50 relative z-10">
        
        {/* Settings Modal Overlay */}
        {showSettings && (
            <div className="absolute inset-0 bg-white z-20 rounded-2xl p-8 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Settings className="w-5 h-5" /> Connection
                    </h3>
                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-neutral-100 rounded-full">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>
                
                <div className="space-y-4 flex-grow overflow-y-auto">
                    <div className="text-xs text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                        <p className="font-bold mb-1">Status:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Env Variables: <strong>{envDetected ? 'Detected' : 'Not Detected'}</strong></li>
                            <li>Current Project: <strong>{projectUrl}</strong></li>
                            <li>Mode: <strong>{isDemo ? 'Demo (Read-Only)' : 'Live (Read/Write)'}</strong></li>
                        </ul>
                    </div>
                    
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

                    <div className="text-xs text-neutral-400 mt-2">
                        Tip: You can also set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file.
                    </div>
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-neutral-100">
                    <button 
                        onClick={clearConnectionSettings}
                        className="flex-1 py-2 text-red-600 text-sm font-bold hover:bg-red-50 rounded"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={saveConnectionSettings}
                        className="flex-1 py-2 bg-neutral-900 text-white text-sm font-bold rounded hover:bg-black flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Connect
                    </button>
                </div>
            </div>
        )}

        <div className="mb-6 text-center">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-neutral-900/20">
                <Database className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                {mode === 'signup' ? 'Setup Admin Account' : mode === 'forgot' ? 'Reset Password' : 'CMS Login'}
            </h1>
            <p className="text-sm text-neutral-500">
                {mode === 'signup' ? 'Create your admin credentials.' : mode === 'forgot' ? 'Enter email to receive reset link.' : 'Sign in to manage your portfolio.'}
            </p>
        </div>

        {/* Connection Status Badge */}
        <div 
            onClick={() => setShowSettings(true)}
            className={`mb-6 mx-auto w-fit flex items-center gap-2 px-3 py-1.5 border rounded-full text-[10px] font-mono cursor-pointer transition-all ${
                isDemo 
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' 
                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
            }`}
        >
            <div className={`w-2 h-2 rounded-full ${isDemo ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            {isDemo ? 'DEMO MODE (READ ONLY)' : `Connected: ${projectUrl}`}
            <Settings className="w-3 h-3 ml-1 opacity-50" />
        </div>

        {isDemo && mode !== 'login' && (
             <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 flex gap-2 items-start">
                 <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                 <p>
                    <strong>Note:</strong> You are connected to the Demo Database. 
                    If you have your own Supabase project, click the badge above to enter your keys.
                 </p>
             </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-600 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            
            {message && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2 text-sm text-green-600 animate-in slide-in-from-top-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{message}</span>
                </div>
            )}

            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {mode === 'signup' ? 'Set Admin Email' : 'Email'}
                </label>
                <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />
            </div>

            {mode !== 'forgot' && (
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                        {mode === 'signup' ? 'Set Admin Password' : 'Password'}
                    </label>
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

            {mode === 'signup' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-1 fade-in">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input 
                            type="password" 
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
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
                className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-lg shadow-neutral-900/10"
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
                    onClick={() => { 
                        setMode(mode === 'login' ? 'signup' : 'login'); 
                        setError(''); 
                        setMessage(''); 
                        setConfirmPassword('');
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-900 font-medium"
                >
                    {mode === 'login' ? (
                        <span>New here? <span className="underline font-bold text-neutral-800">Create Admin Account</span></span>
                    ) : (
                        <span>Already have an account? <span className="underline font-bold text-neutral-800">Sign in</span></span>
                    )}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;