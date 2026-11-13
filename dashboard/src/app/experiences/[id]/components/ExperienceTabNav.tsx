'use client';

import { MapPin, ImageIcon, Server, Map, Settings, UploadCloud } from 'lucide-react';

export const TABS = [
  { id: 'overview', label: 'Overview', icon: MapPin },
  { id: 'content', label: 'Content', icon: ImageIcon },
  { id: 'services', label: 'Services', icon: Server },
  { id: 'spatial', label: 'Spatial Canvas', icon: Map },
  { id: 'configuration', label: 'Configuration', icon: Settings },
  { id: 'publishing', label: 'Publishing', icon: UploadCloud }
];

interface ExperienceTabNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  spatialNodesCount: number;
}

export function ExperienceTabNav({ activeTab, onSelectTab, spatialNodesCount }: ExperienceTabNavProps) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 overflow-x-auto space-x-1 shadow-sm shrink-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px ${
            activeTab === tab.id
              ? 'border-indigo-600 text-indigo-500 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
          {tab.id === 'spatial' && (
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
              {spatialNodesCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
