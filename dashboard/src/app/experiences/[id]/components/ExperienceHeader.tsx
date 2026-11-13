'use client';

import { ArrowLeft, Edit3, UploadCloud, Archive, MapPin } from 'lucide-react';
import Link from 'next/link';
import { ExperienceEditorContext } from '../hooks/useExperienceEditor';

interface ExperienceHeaderProps {
  editor: ExperienceEditorContext;
}

export function ExperienceHeader({ editor }: ExperienceHeaderProps) {
  const { exp, router, setShowEditModal, setShowPublishModal, setShowArchiveModal } = editor;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 shrink-0 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title & Badges */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/experiences')} 
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{exp.name}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400">
                {exp.type || 'Service-Linked'}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                exp.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400' : 
                exp.status === 'ARCHIVED' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {exp.status || 'DRAFT'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                v{exp.version || 1}.0.0
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Bound to:</span>
              <Link href={`/places/${exp.targetPlaceId}`} className="text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold">
                <MapPin className="w-3.5 h-3.5" /> {exp.targetPlaceName}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm"
          >
            <Edit3 className="w-4 h-4" /> Edit Meta
          </button>
          <button 
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" /> Compile & Publish
          </button>
          <button 
            onClick={() => setShowArchiveModal(true)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-lg transition-colors" 
            title="Archive Scene"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
