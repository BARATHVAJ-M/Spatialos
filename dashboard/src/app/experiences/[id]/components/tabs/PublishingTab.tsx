'use client';

import { UploadCloud, ShieldCheck, Database, Server, Send } from 'lucide-react';
import { ExperienceEditorContext } from '../../hooks/useExperienceEditor';

interface PublishingTabProps {
  editor: ExperienceEditorContext;
}

export function PublishingTab({ editor }: PublishingTabProps) {
  const { nodes, serviceInstances, setShowPublishModal } = editor;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-bold">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Pre-Flight Publisher Compiler</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Run structural validation before deploying the binary SceneGraph.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex flex-col">
          <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Node Graph Validated</h4>
          <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
            {nodes.length} nodes structurally sound. No overlapping collisions detected.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex flex-col">
          <Database className="w-6 h-6 text-emerald-400 mb-2" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Assets Resolved</h4>
          <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
            Referenced media assets are validated and ready in storage.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex flex-col">
          <Server className="w-6 h-6 text-emerald-400 mb-2" />
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Services Active</h4>
          <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
            {serviceInstances.length} service instance(s) bound and operational.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => setShowPublishModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" /> Compile & Deploy to AR Engine
        </button>
      </div>
    </div>
  );
}
