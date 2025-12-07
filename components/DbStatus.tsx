import React, { useState, useEffect } from 'react';
import { supabase } from '../src/supabaseClient';
import { Loader2, RefreshCw, Database } from 'lucide-react';

const DbStatus: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [projectUrl, setProjectUrl] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const checkConnection = async () => {
        setStatus('loading');
        
        // Extract project ID from the supabase client URL for display
        try {
            // @ts-ignore - access private property to help user debug
            const url = supabase.supabaseUrl || '';
            const match = url.match(/https:\/\/([^.]+)\./);
            setProjectUrl(match ? match[1] : 'Unknown Project');
        } catch(e) {
            setProjectUrl('Unknown Configuration');
        }

        try {
            // Try to fetch the count of projects to verify access
            const { error, count } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true });

            if (error) throw error;
            
            setStatus('success');
            // Matched text format with ProfileSettings component
            setMessage(`Connected. Projects found: ${count ?? 0}`);
        } catch (e: any) {
            console.error("DB Connection Check Failed:", e);
            setStatus('error');
            setMessage(e.message || "Connection Failed");
        }
    };

    useEffect(() => {
        checkConnection();
    }, []);

    return (
        <div className="fixed bottom-4 left-4 z-[9999] flex flex-col items-start gap-2">
            <div 
                className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-full border shadow-xl backdrop-blur-md transition-all cursor-pointer select-none
                    ${status === 'success' ? 'bg-white/95 border-green-200 text-green-700 dark:bg-neutral-900/95 dark:border-green-900 dark:text-green-400' : ''}
                    ${status === 'error' ? 'bg-white/95 border-red-200 text-red-600 dark:bg-neutral-900/95 dark:border-red-900 dark:text-red-400' : ''}
                    ${status === 'loading' ? 'bg-white/95 border-neutral-200 text-neutral-500 dark:bg-neutral-900/95 dark:border-neutral-800' : ''}
                `}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="relative flex items-center justify-center">
                    {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {status === 'success' && <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                    {status === 'error' && <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />}
                </div>
                
                <div className="flex flex-col leading-none">
                    <span className="text-xs font-bold tracking-wide uppercase">
                        {status === 'loading' && "Connecting..."}
                        {status === 'success' && "DB Connected"}
                        {status === 'error' && "DB Error"}
                    </span>
                    {projectUrl && (
                         <span className="text-[9px] opacity-60 font-mono mt-0.5 max-w-[100px] truncate">{projectUrl}</span>
                    )}
                </div>

                <div className="w-px h-3 bg-current opacity-20 mx-1"></div>

                <button 
                    onClick={(e) => { e.stopPropagation(); checkConnection(); }} 
                    className="hover:opacity-60 transition-opacity" 
                    title="Retry Connection"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {(isExpanded || status === 'error') && message && (
                <div className="ml-2 px-3 py-2 bg-black/80 text-white text-[10px] font-mono rounded-lg max-w-[250px] break-words animate-in fade-in slide-in-from-bottom-2">
                    {message}
                    {status === 'error' && (
                        <div className="mt-1 pt-1 border-t border-white/20 opacity-75">
                            Verify URL/Key in Settings.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DbStatus;