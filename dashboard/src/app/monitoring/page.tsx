'use client';

import { Activity, ShieldAlert, Database, HardDrive, Network, Glasses, Clock, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export default function MonitoringPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSeverity, setActiveSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<any[]>('/overview/monitoring/logs');
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (activeSeverity === 'all') return true;
    return log.severity?.toLowerCase() === activeSeverity;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Monitoring</h1>
        <p className="text-slate-400 mt-1 text-sm">Real-time status metrics, activity feeds, and runtime logs of SpatialOS modules</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Sessions', count: '1,492', status: 'Healthy', color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'API Gateway Latency', count: '48 ms', status: 'Healthy', color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Sync Rate', count: '100%', status: 'Healthy', color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Compilation Errors', count: '1', status: 'Warning', color: 'text-amber-500 bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 border border-slate-700 shadow-sm rounded-xl p-5">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white">{stat.count}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${stat.color}`}>
                {stat.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Log Feed Control */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-200">Operational Log Feed</h2>
          </div>
          
          <div className="flex gap-2">
            {['all', 'info', 'warning', 'error'].map((sev) => (
              <button
                key={sev}
                onClick={() => setActiveSeverity(sev as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeSeverity === sev 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table List */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          <div className="divide-y divide-slate-800">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-slate-900 border-dashed">
                No logs available.
              </div>
            ) : filteredLogs.map((log, idx) => (
              <div key={idx} className="p-4 flex gap-4 hover:bg-slate-700 transition-colors">
                <Clock className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.severity === 'Error' ? 'bg-red-500/10 text-red-400' :
                        log.severity === 'Warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.severity}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{log.time}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed">{log.message}</p>
                  </div>

                  <div className="text-sm text-slate-400">
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Source</span>
                    <span className="font-medium">{log.source}</span>
                  </div>

                  <div className="text-sm text-slate-400">
                    <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Related Entity</span>
                    <span className="font-semibold text-slate-300">{log.entity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
