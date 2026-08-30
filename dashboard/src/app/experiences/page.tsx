'use client';

import { Search, Plus, Filter, Trash2, Box, QrCode, Download, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Experience } from '../../types/api';

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQrExp, setSelectedQrExp] = useState<any>(null);

  const fetchExperiences = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<Experience[]>('/experiences');
      setExperiences(data);
    } catch (error) {
      console.error('Failed to fetch experiences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Experiences</h1>
          <p className="text-slate-400 mt-1 text-sm">Define what the user sees/interacts with at specific physical places</p>
        </div>
        <Link 
          href="/experiences/create" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Experience
        </Link>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Experiences..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-700 text-xs uppercase tracking-wider font-semibold text-slate-400">
                <th className="p-4">Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Target Place</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Services</th>
                <th className="p-4 text-right">Content Items</th>
                <th className="p-4">Publishing Status</th>
                <th className="p-4 text-center">QR Code</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : experiences.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 bg-slate-900 border-dashed">
                    No experiences available.
                  </td>
                </tr>
              ) : experiences.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-700 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                        <Box className="w-4 h-4" />
                      </div>
                      <Link href={`/experiences/${exp.id}`} className="font-medium text-white hover:text-indigo-600 transition-colors">
                        {exp.name}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{exp.type || 'Service'}</td>
                  <td className="p-4 text-sm text-slate-400">{exp.place?.name || '-'}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      (exp.status || 'Active') === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {exp.status || 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-400 text-right">{exp._count?.serviceInstances || 0}</td>
                  <td className="p-4 text-sm text-slate-400 text-right">{exp._count?.spatialNodes || 0}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      (exp.status === 'PUBLISHED') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {exp.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedQrExp({ ...exp, qrId: exp.place?.qrTargetId || exp.id })}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-md transition-colors"
                      title="View QR Code"
                    >
                      <QrCode className="w-4.5 h-4.5" />
                    </button>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{exp.updatedAt ? new Date(exp.updatedAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to permanently delete the experience "${exp.name}"? This action will destroy all attached services, content, and spatial nodes without any traces.`)) {
                          try {
                            await apiFetch(`/experiences/${exp.id}`, { method: 'DELETE' });
                            setExperiences(prev => prev.filter(e => e.id !== exp.id));
                          } catch (err) {
                            alert('Failed to delete experience');
                          }
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors"
                      title="Delete Experience completely"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Viewer Modal */}
      {selectedQrExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedQrExp(null)} />
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white">Experience QR Anchor</h3>
              <button 
                onClick={() => setSelectedQrExp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center space-y-6">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider text-center">
                Scan to launch {selectedQrExp.name}
              </span>
              
              {/* Mock QR */}
              <div className="w-48 h-48 border-4 border-slate-900 p-2 bg-slate-800 rounded-xl flex items-center justify-center relative">
                <div className="w-full h-full bg-slate-900 border border-slate-150 relative flex items-center justify-center text-slate-400 select-none animate-in fade-in duration-300">
                  <div className="absolute top-2 left-2 w-10 h-10 border-4 border-slate-900 bg-transparent rounded" />
                  <div className="absolute top-2 right-2 w-10 h-10 border-4 border-slate-900 bg-transparent rounded" />
                  <div className="absolute bottom-2 left-2 w-10 h-10 border-4 border-slate-900 bg-transparent rounded" />
                  <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest leading-relaxed">
                    EXPERIENCE<br />ANCHOR
                  </span>
                </div>
              </div>

              <div className="w-full text-center space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-widest">QR Code ID</span>
                <span className="text-xs font-mono font-bold text-slate-200">{selectedQrExp.qrId}</span>
              </div>
              
              <button 
                onClick={() => { alert(`Downloading QR Code package for: ${selectedQrExp.qrId}`); setSelectedQrExp(null); }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Download QR Code PNG
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
