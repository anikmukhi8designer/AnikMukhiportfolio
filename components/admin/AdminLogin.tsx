import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulated authentication
    if (email === 'admin@newgenre.studio' && password === 'password') {
      onLogin();
    } else {
      setError('Invalid credentials. Try admin@newgenre.studio / password');
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
              placeholder="admin@newgenre.studio"
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
