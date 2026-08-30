'use client';

import { useState, useEffect } from 'react';
import { Server, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>('/services/definitions');
      setServices(data);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleRefreshRegistry = () => {
    fetchServices();
    showToast('Service templates refreshed from backend.', 'success');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative min-h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Service Templates</h1>
          <p className="text-slate-400 mt-1 text-sm">Discover available capability templates to attach to Experiences.</p>
        </div>
        <button 
          onClick={handleRefreshRegistry}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700 shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} /> Refresh Templates
        </button>
      </div>

      <div className="space-y-6">
        <div className="relative max-w-md">
          <input type="text" placeholder="Search service templates..." className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 shadow-sm rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50" />
          <Server className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((srv) => (
              <div key={srv.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 flex flex-col justify-between hover:border-indigo-300 transition-all">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center text-indigo-400 shadow-sm">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{srv.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-700 px-1.5 py-0.5 rounded">ID: {srv.id.slice(0, 8)}...</span>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-700 px-1.5 py-0.5 rounded">v{srv.version}</span>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                      Enabled
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-400 mt-5 leading-relaxed">{srv.description || srv.desc || 'No description provided.'}</p>
                  
                  <div className="mt-5 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Capabilities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(srv.capabilities || [srv.category || 'General']).map((cap: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-semibold rounded-md">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400 bg-slate-900 rounded-xl border border-dashed border-slate-600">
                No service templates available. Make sure the database is seeded.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Toasts */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 z-50 ${
          toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'
        }`}>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
