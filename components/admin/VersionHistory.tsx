import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { RotateCcw, GitCommit, Calendar, User, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface Commit {
    sha: string;
    message: string;
    date: string;
    author: string;
}

const VersionHistory: React.FC = () => {
  const { getHistory, restoreVersion } = useData();
  const [history, setHistory] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringSha, setRestoringSha] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
      setLoading(true);
      const data = await getHistory();
      setHistory(data);
      setLoading(false);
  };

  const handleRestore = async (sha: string) => {
      if (!confirm("Are you sure you want to restore this version? This will overwrite your current data and create a new commit.")) return;
      
      setRestoringSha(sha);
      try {
          await restoreVersion(sha);
          // Refresh history after restore (since restore creates a new commit)
          setTimeout(loadHistory, 2000); 
      } catch (e) {
          alert("Failed to restore version.");
      } finally {
          setRestoringSha(null);
      }
  };

  const formatDate = (isoString: string) => {
      return new Date(isoString).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h3 className="text-lg font-medium">Version History</h3>
            <p className="text-sm text-neutral-500">View and rollback to previous data checkpoints from GitHub.</p>
        </div>
        <button 
            onClick={loadHistory}
            className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
        >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-neutral-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Fetching commits from GitHub...</p>
            </div>
        ) : history.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No history found. Make sure your GitHub repository is connected properly in Settings.</p>
            </div>
        ) : (
            <div className="divide-y divide-neutral-100">
                {history.map((commit, index) => (
                    <div key={commit.sha} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors">
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-full ${index === 0 ? 'bg-green-100 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                                {index === 0 ? <CheckCircle className="w-4 h-4" /> : <GitCommit className="w-4 h-4" />}
                            </div>
                            <div>
                                <h4 className="font-medium text-neutral-900 text-sm">
                                    {commit.message}
                                    {index === 0 && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Current</span>}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-neutral-500">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {commit.author}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(commit.date)}</span>
                                    <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded">{commit.sha.substring(0, 7)}</span>
                                </div>
                            </div>
                        </div>

                        {index !== 0 && (
                            <button 
                                onClick={() => handleRestore(commit.sha)}
                                disabled={restoringSha !== null}
                                className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 rounded text-xs font-medium text-neutral-700 transition-colors flex items-center justify-center gap-2 min-w-[100px]"
                            >
                                {restoringSha === commit.sha ? <Loader2 className="w-3 h-3 animate-spin"/> : <RotateCcw className="w-3 h-3"/>}
                                {restoringSha === commit.sha ? 'Restoring...' : 'Rollback'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;