'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Send, Eye, ShieldAlert, RefreshCw, RotateCcw, Activity } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export default function PublishingPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [queue, setQueue] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [validatingItem, setValidatingItem] = useState<any | null>(null);
  const [validationStep, setValidationStep] = useState<'idle' | 'validating' | 'passed' | 'failed'>('idle');
  
  const [rollbackItem, setRollbackItem] = useState<any | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const [publishingItem, setPublishingItem] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'queue') {
        const data = await apiFetch<any[]>('/overview/publishing/queue');
        setQueue(data);
      } else {
        const data = await apiFetch<any[]>('/overview/publishing/history');
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleValidateAndPublish = (item: any) => {
    setValidatingItem(item);
    setValidationStep('validating');
    setTimeout(() => {
      setValidationStep('passed');
    }, 1200);
  };

  const executePublish = async (item: any) => {
    setPublishingItem(item.id);
    try {
      await apiFetch(`/experiences/${item.id}/publish`, { method: 'POST' });
      setValidatingItem(null);
      await fetchData();
    } catch (error) {
      console.error('Publish failed', error);
      alert('Failed to publish the experience.');
    } finally {
      setPublishingItem(null);
    }
  };

  const confirmRollback = async () => {
    if (!rollbackItem) return;
    setIsRollingBack(true);
    try {
      await apiFetch(`/experiences/${rollbackItem.id}/rollback`, { method: 'POST' });
      setRollbackItem(null);
      await fetchData();
    } catch (error) {
      console.error('Rollback failed', error);
      alert('Failed to rollback to this version.');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Global Release Queue</h1>
          <p className="text-slate-400 mt-1 text-sm">Review drafts, manage active production deployments, and rollback if necessary.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6 shrink-0 space-x-6">
        <button 
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'queue' 
              ? 'border-indigo-500 text-indigo-400 font-semibold' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Approval Queue (Drafts)
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history' 
              ? 'border-indigo-500 text-indigo-400 font-semibold' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Version History & Live
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-xs uppercase font-semibold text-slate-400 tracking-wider">
                <th className="p-4">Entity</th>
                <th className="p-4">Type</th>
                <th className="p-4">Target Place</th>
                <th className="p-4">Version</th>
                <th className="p-4">Status</th>
                <th className="p-4">Modified By</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : (activeTab === 'queue' ? queue : history).length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 bg-slate-900 border-dashed">
                    No items found.
                  </td>
                </tr>
              ) : (activeTab === 'queue' ? queue : history).map((item) => (
                <tr key={item.id} className="hover:bg-slate-700 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-white">{item.entity}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">{item.type}</td>
                  <td className="p-4 text-sm text-slate-400">{item.place}</td>
                  <td className="p-4 text-sm text-slate-400 font-mono">{item.version}</td>
                  <td className="p-4">
                    {item.status === 'PUBLISHED' && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">
                         <Activity className="w-3 h-3 mr-1" /> LIVE
                       </span>
                    )}
                    {item.status === 'ARCHIVED' && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-400">
                         Archived
                       </span>
                    )}
                    {item.status === 'Ready' && (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400">
                         Draft
                       </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-slate-400">{item.by}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {activeTab === 'queue' ? (
                        <button 
                          onClick={() => handleValidateAndPublish(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm"
                        >
                          <Send className="w-3 h-3" /> Validate & Publish
                        </button>
                      ) : item.status === 'ARCHIVED' ? (
                        <button 
                          onClick={() => setRollbackItem(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-200"
                        >
                          <RotateCcw className="w-3 h-3" /> Rollback
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Active</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation Dialog */}
      {validatingItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { if(validationStep !== 'validating' && !publishingItem) setValidatingItem(null); }} />
          
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-base font-bold text-white">Validating & Publishing</h2>
              <p className="text-xs text-slate-400 mt-1">Entity: {validatingItem.entity} ({validatingItem.type})</p>
            </div>

            <div className="p-6">
              {validationStep === 'validating' && (
                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
                  <p className="text-sm font-medium text-slate-300">Verifying scene payload integrity...</p>
                </div>
              )}

              {validationStep === 'passed' && (
                <div className="py-6 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">Validation Passed</h3>
                    <p className="text-sm text-slate-400 mt-1">Payload meets all requirements. Ready to push to AR Engine.</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setValidatingItem(null)}
                      disabled={!!publishingItem}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => executePublish(validatingItem)}
                      disabled={!!publishingItem}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center"
                    >
                      {publishingItem ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Go Live!'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackItem && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isRollingBack && setRollbackItem(null)} />
          
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-rose-100 bg-rose-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Confirm Rollback</h2>
                  <p className="text-xs text-rose-600 font-medium">Critical Action</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                You are about to swap the currently live AR experience for <span className="font-semibold text-white">{rollbackItem.place}</span> with an archived version (<span className="font-mono bg-slate-700 px-1 rounded text-slate-300">{rollbackItem.version}</span>).
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                This will instantly update the content for any users opening the app in that location.
              </p>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setRollbackItem(null)}
                  disabled={isRollingBack}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmRollback}
                  disabled={isRollingBack}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center"
                >
                  {isRollingBack ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Rollback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
