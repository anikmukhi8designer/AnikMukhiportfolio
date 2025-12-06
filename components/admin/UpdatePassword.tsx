import React, { useState } from 'react';
import { Lock, Loader2, Save } from 'lucide-react';
import { supabase } from '../../src/supabaseClient';

interface UpdatePasswordProps {
    onComplete: () => void;
}

const UpdatePassword: React.FC<UpdatePasswordProps> = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            onComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 font-sans">
            <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl border border-neutral-200 shadow-xl">
                 <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-neutral-900 text-white rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 mb-2">Set New Password</h1>
                    <p className="text-sm text-neutral-500">Enter your new secure password below.</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">New Password</label>
                        <input 
                            type="password" 
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-neutral-900 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePassword;