import React, { useState, useEffect } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  Code,
  X,
} from 'lucide-react';
import { AnalysisLog, UserProfile } from '../types';

interface AdminLogsProps {
  user: UserProfile | null;
}

export const AdminLogs: React.FC<AdminLogsProps> = ({ user }) => {
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AnalysisLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/logs', {
        headers: {
          Authorization: user ? `Bearer ${user.id}` : 'Bearer usr_admin_demo',
        },
      });
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error('Failed to fetch admin logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filtered = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    return (
      (l.asset && l.asset.toLowerCase().includes(term)) ||
      (l.strategy && l.strategy.toLowerCase().includes(term)) ||
      (l.status && l.status.toLowerCase().includes(term)) ||
      (l.aiStatus && l.aiStatus.toLowerCase().includes(term))
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-400" />
            <h1 className="text-2xl font-black text-white font-mono">ADMIN ANALYSIS AUDIT TRAIL</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            System analysis records, execution telemetry, and pipeline debug logs.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Filter audit logs by asset, model, strategy, or status..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Asset / TF</th>
                <th className="py-3 px-4">Engine</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 font-sans text-xs">
                    No admin audit logs available.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {log.asset} <span className="text-slate-400 font-normal">({log.ltfTimeframe || log.mode})</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{log.strategy}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{log.decision}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          log.status === 'Success'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {log.status} ({log.aiStatus})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {log.duration ? `${log.duration}ms` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[10px] text-slate-300 hover:text-purple-300 hover:bg-purple-950/40"
                      >
                        Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white font-mono text-sm">
                  Log Audit Record: {selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-auto rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs font-mono text-slate-300">
              <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
