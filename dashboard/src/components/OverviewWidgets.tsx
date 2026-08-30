'use client';

import { 
  Database, 
  HardDrive, 
  Network, 
  Glasses, 
  Activity,
  Plus,
  Upload,
  Settings2,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface HealthItem {
  label: string;
  icon: any;
  status: string;
  color: string;
  bg: string;
  message?: string;
}

const DEFAULT_HEALTH_ITEMS: HealthItem[] = [
  { label: 'Backend API', icon: Network, status: '...', color: 'text-slate-400', bg: 'bg-slate-900' },
  { label: 'Database', icon: Database, status: '...', color: 'text-slate-400', bg: 'bg-slate-900' },
  { label: 'Asset Storage', icon: HardDrive, status: '...', color: 'text-slate-400', bg: 'bg-slate-900' },
  { label: 'AR Engine', icon: Glasses, status: '...', color: 'text-slate-400', bg: 'bg-slate-900' },
];

export function SystemHealth() {
  const [healthItems, setHealthItems] = useState<HealthItem[]>(DEFAULT_HEALTH_ITEMS);

  useEffect(() => {
    let isMounted = true;
    apiFetch<any[]>('/overview/health').then(data => {
      if (isMounted && data && data.length) {
        setHealthItems(prev => prev.map(item => {
          const apiItem = data.find(d => d.label === item.label);
          return apiItem ? { ...item, status: apiItem.status, color: apiItem.color, bg: apiItem.bg, message: apiItem.message } : item;
        }));
      }
    }).catch(err => console.error(err));
    return () => { isMounted = false; };
  }, []);


  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-slate-400" />
        <h3 className="text-base font-semibold text-slate-200">System Health</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {healthItems.map((item) => {
          const Icon = item.icon;
          return (
          <div key={item.label} className={`p-3 rounded-lg border border-slate-800 ${item.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 ${item.color}`} />
              {item.status === 'Healthy' ? (
                <CheckCircle2 className={`w-4 h-4 ${item.color}`} />
              ) : (
                <AlertCircle className={`w-4 h-4 ${item.color}`} />
              )}
            </div>
            <p className="text-xs font-medium text-slate-400">{item.label}</p>
            <p className={`text-xs font-bold mt-0.5 ${item.color}`}>
              {item.status} {item.message && <span className="font-normal opacity-80">({item.message})</span>}
            </p>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuickActions() {
  const ACTIONS = [
    { label: 'Create Place', icon: Plus, href: '/places/create', primary: true },
    { label: 'Create Experience', icon: Plus, href: '/experiences/create', primary: true },
    { label: 'Add Content', icon: Upload, href: '/content/add' },
    { label: 'Configure Service', icon: Settings2, href: '/services' },
    { label: 'Publish Changes', icon: Send, href: '/publishing', color: 'text-indigo-400 bg-indigo-50 hover:bg-indigo-100' },
  ];

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-5">
      <h3 className="text-base font-semibold text-slate-200 mb-4">Quick Actions</h3>
      <div className="flex flex-col gap-2">
        {ACTIONS.map((action) => {
          const ActionIcon = action.icon;
          return (
          <Link 
            key={action.label} 
            href={action.href}
            className={`flex items-center gap-3 p-2.5 rounded-lg text-sm font-medium transition-colors ${
              action.primary 
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : action.color 
                  ? action.color 
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ActionIcon className="w-4 h-4" />
            {action.label}
          </Link>
          );
        })}
      </div>
    </div>
  );
}

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  entity: string;
  time: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiFetch<ActivityItem[]>('/overview/activity').then(data => {
      if (isMounted && data && data.length) {
        setActivities(data);
      }
    }).catch(err => console.error(err));
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-5 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-200">Recent Activity</h3>
      </div>
      <div className="space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="flex gap-3">
            <div className="mt-0.5">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                act.type === 'error' ? 'bg-red-500' : 
                act.type === 'publish' ? 'bg-emerald-500' : 'bg-indigo-500'
              }`} />
            </div>
            <div>
              <p className="text-sm text-slate-200">
                <span className="font-semibold">{act.action}</span> {act.entity}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{act.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
