import React, { useState } from 'react';
import { Github, Key, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        // 1. Verify Credentials against GitHub API
        const response = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            }
        });

        if (!response.ok) {
            if (response.status === 401) throw new Error("Invalid Token. Please check your permissions.");
            if (response.status === 403) throw new Error("Rate limit exceeded or forbidden.");
            throw new Error("Failed to connect to GitHub.");
        }

        const data = await response.json();

        // 2. Verify Username match (Case insensitive)
        if (data.login.toLowerCase() !== username.trim().toLowerCase()) {
            throw new Error(`Token belongs to user "${data.login}", not "${username}".`);
        }

        // 3. Save to LocalStorage for CMS Context to use
        localStorage.setItem('github_token', token.trim());
        localStorage.setItem('github_owner', username.trim());
        // We assume the repo name is either already set or will be set in Settings
        // If it's the first time, we might prompt for repo, but for now we just auth the user.
        
        onLogin();

    } catch (err: any) {
        setError(err.message || "Authentication failed");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 font-sans">
      <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl shadow-neutral-200/50">
        
        <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                <Github className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">CMS Login</h1>
            <p className="text-sm text-neutral-500">
                Authenticate with your GitHub account to manage your portfolio content securely.
            </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">GitHub Username</label>
                <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. mukhianik"
                />
            </div>
            
            <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Personal Access Token</label>
                    <a 
                        href="https://github.com/settings/tokens/new?scopes=repo,user" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                        Generate Token <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <div className="relative">
                    <input 
                        type="password"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 focus:border-transparent outline-none transition-all placeholder:text-neutral-400"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_..."
                    />
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                    Token requires <strong>repo</strong> scope to read/write data.
                </p>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Authenticate'}
            </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-xs text-neutral-400">
                Data is stored directly in your GitHub repository.<br/>No external database required.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;