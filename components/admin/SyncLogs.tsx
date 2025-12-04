import React, { useEffect, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { SyncLogEntry } from '../../types';
import { RotateCcw, ArrowUpCircle, ArrowDownCircle, AlertCircle, CheckCircle, Clock, User, Loader2, AlertTriangle } from 'lucide-react';

const SyncLogs: React.FC = () => {
  const { getSyncHistory } = useData();
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const data = await getSyncHistory();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Sync Activity Log</h3>
          <p className="text-sm text-neutral-500">Track push and pull operations to the repository.</p>
        </div>
        <button 
          onClick={loadLogs}
          className="text-sm text-neutral-600 hover:text-neutral-900 flex items-center gap-2"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-neutral-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Fetching logs...</p>
            </div>
        ) : logs.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No sync history found yet.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-32">Timestamp</th>
                    <th className="px-6 py-4 font-semibold w-24">Action</th>
                    <th className="px-6 py-4 font-semibold w-24">Status</th>
                    <th className="px-6 py-4 font-semibold">Message</th>
                    <th className="px-6 py-4 font-semibold text-right">User</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                             <Clock className="w-3 h-3" />
                             {formatDate(log.timestamp)}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide w-fit px-2 py-0.5 rounded-full border ${
                            log.action === 'Push' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                            {log.action === 'Push' ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                            {log.action}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className={`flex items-center gap-1.5 font-medium ${
                             log.status === 'Success' ? 'text-green-600' : 'text-red-600'
                         }`}>
                             {log.status === 'Success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                             {log.status}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-700 font-medium">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-500">
                        <div className="flex items-center justify-end gap-1.5">
                            <User className="w-3 h-3" />
                            {log.author}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default SyncLogs;
