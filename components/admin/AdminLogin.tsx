import React, { useState, useEffect } from 'react';
import { Lock, RotateCcw } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usingDefaults, setUsingDefaults] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('cms_credentials');
    if (stored) {
        setUsingDefaults(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get stored credentials or use defaults
    const storedCreds = localStorage.getItem('cms_credentials');
    const { email: validEmail, password: validPassword } = storedCreds 
      ? JSON.parse(storedCreds) 
      : { email: 'admin@newgenre.studio', password: 'password' };

    if (email === validEmail && password === validPassword) {
      onLogin();
    } else {
      setError('Invalid credentials.');
    }
  };

  const handleReset = () => {
    if (window.confirm("This will reset your login credentials to the defaults (admin@newgenre.studio / password). Continue?")) {
        localStorage.removeItem('cms_credentials');
        setUsingDefaults(true);
        setError('');
        alert("Credentials have been reset to default.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">CMS Login</h1>
          <p className="text-neutral-500 text-sm">Restricted Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full py-3 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Access Dashboard
          </button>
        </form>
        
        {usingDefaults ? (
            <div className="mt-6 text-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">Default Credentials:</p>
                <p className="text-xs font-mono text-neutral-700">admin@newgenre.studio</p>
                <p className="text-xs font-mono text-neutral-700">password</p>
            </div>
        ) : (
            <div className="mt-4 text-center">
                <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 w-full text-xs text-red-500 hover:text-red-700 transition-colors py-2"
                >
                    <RotateCcw className="w-3 h-3" /> Reset to Default Password
                </button>
            </div>
        )}

        <div className="mt-6 text-center">
            <a href="#" className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
                Return to Portfolio
            </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;