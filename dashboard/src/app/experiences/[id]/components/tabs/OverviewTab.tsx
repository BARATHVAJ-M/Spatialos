'use client';

import { Box, ExternalLink, Map, Server, Database } from 'lucide-react';
import Link from 'next/link';
import { ExperienceEditorContext } from '../../hooks/useExperienceEditor';

interface OverviewTabProps {
  editor: ExperienceEditorContext;
}

export function OverviewTab({ editor }: OverviewTabProps) {
  const { exp, nodes, serviceInstances } = editor;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-500" /> Experience Meta
          </h3>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Description</span>
            <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{exp.description || 'No description provided.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Target Binding</span>
              <Link href={`/places/${exp.targetPlaceId}`} className="font-bold text-indigo-500 dark:text-indigo-400 mt-0.5 hover:underline flex items-center gap-1">
                {exp.targetPlaceName} <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Schedule</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{exp.schedule || 'Always Available (24/7)'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Spatial Nodes</span>
            <Map className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{nodes.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Services</span>
            <Server className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{serviceInstances.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Compilation Checksum</span>
            <Database className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
            {exp.checksum || 'Pending compilation'}
          </p>
        </div>
      </div>
    </div>
  );
}
