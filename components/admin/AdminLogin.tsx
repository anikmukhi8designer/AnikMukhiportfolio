
import React, { useState } from 'react';
import { Github, Key, Loader2, AlertCircle, Info, ExternalLink, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [ghToken, setGhToken] = useState(localStorage.getItem('github_token') || '');
  const [ghOwner, setGhOwner] = useState(localStorage.getItem('github_owner') || '');
  const [ghRepo, setGhRepo] = useState(localStorage.getItem('github_repo') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!ghToken || !ghOwner || !ghRepo) {
      setError("All GitHub credentials are required.");
      setLoading(false);
      return;
    }

    try {
      localStorage.setItem('github_token', ghToken.trim());
      localStorage.setItem('github_owner', ghOwner.trim());
      localStorage.setItem('github_repo', ghRepo.trim());
      
      onLogin();
    } catch (err: any) {
      setError("Failed to save credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl shadow-neutral-200/50 relative z-10">
        
        <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-neutral-900/20">
                <Github className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">GitHub Access</h1>
            <p className="text-sm text-neutral-500">
                Unlock the CMS by connecting your repository.
            </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-600 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">GitHub Personal Access Token</label>
                <div className="relative">
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none transition-all placeholder:text-neutral-400"
                        value={ghToken}
                        onChange={(e) => setGhToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                    />
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Repo Owner</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                        value={ghOwner}
                        onChange={(e) => setGhOwner(e.target.value)}
                        placeholder="e.g. mukhianik"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Repo Name</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                        value={ghRepo}
                        onChange={(e) => setGhRepo(e.target.value)}
                        placeholder="e.g. portfolio"
                    />
                </div>
            </div>

            <div className="bg-blue-50/80 p-4 rounded-xl flex gap-3 items-start border border-blue-100 mt-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-[11px] text-blue-800/80 leading-relaxed font-medium">
                        Changes are pushed to <code>src/data.json</code> using your PAT.
                    </p>
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline">
                        Create Token <ExternalLink className="w-3 h-3"/>
                    </a>
                </div>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-lg shadow-neutral-900/10"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                {loading ? 'Validating...' : 'Unlock Admin Panel'}
            </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <button 
                onClick={() => window.location.hash = ''}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium inline-flex items-center gap-2"
            >
                <ArrowLeft className="w-3 h-3" /> Return to Live Site
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
