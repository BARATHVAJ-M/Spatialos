'use client';

import { 
  MapPin, 
  Box, 
  Server, 
  ImageIcon, 
  Users, 
  ArrowRight,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const DEFAULT_SUMMARY_DATA = [
  { label: 'Active Places', value: '...', total: '...', icon: MapPin, href: '/places', color: 'bg-blue-500' },
  { label: 'Published Exp.', value: '...', total: '...', icon: Box, href: '/experiences', color: 'bg-purple-500' },
  { label: 'Active Services', value: '...', total: '...', icon: Server, href: '/services', color: 'bg-emerald-500' },
  { label: 'Total Content', value: '...', icon: ImageIcon, href: '/content', color: 'bg-amber-500' },
  { label: 'Total Users', value: '...', icon: Users, href: '/users', color: 'bg-indigo-500' },
];

export function SummaryCards() {
  const [summaryData, setSummaryData] = useState(DEFAULT_SUMMARY_DATA);

  useEffect(() => {
    let isMounted = true;
    apiFetch<any[]>('/overview/summary').then(data => {
      if (isMounted && data && data.length) {
        setSummaryData(prev => prev.map(item => {
          const apiItem = data.find(d => d.label === item.label);
          return apiItem ? { ...item, value: apiItem.value, total: apiItem.total } : item;
        }));
      }
    }).catch(err => console.error(err));
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {summaryData.map((item) => {
        const Icon = item.icon;
        return (
        <Link key={item.label} href={item.href} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-200 mt-1">{item.value}</h3>
              {item.total && (
                <p className="text-xs text-slate-400 mt-1">out of {item.total} total</p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-white bg-opacity-10`}>
              <Icon className={`w-5 h-5 text-${item.color.split('-')[1]}-500`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
            View details <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </Link>
        );
      })}
    </div>
  );
}

const DEFAULT_PUBLISH_STATUS = [
  { label: 'Draft', count: 0, icon: FileText, color: 'text-slate-400' },
  { label: 'Ready', count: 0, icon: AlertCircle, color: 'text-amber-500' },
  { label: 'Published', count: 0, icon: CheckCircle2, color: 'text-emerald-500' },
  { label: 'Unpublished', count: 0, icon: UploadCloud, color: 'text-indigo-500' },
  { label: 'Failed', count: 0, icon: XCircle, color: 'text-red-500' },
];

export function PublishingSummary() {
  const [publishStatus, setPublishStatus] = useState(DEFAULT_PUBLISH_STATUS);

  useEffect(() => {
    let isMounted = true;
    apiFetch<any[]>('/overview/publishing').then(data => {
      if (isMounted && data && data.length) {
        setPublishStatus(prev => prev.map(item => {
          const apiItem = data.find(d => d.label === item.label);
          return apiItem ? { ...item, count: apiItem.count } : item;
        }));
      }
    }).catch(err => console.error(err));
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-200">Publishing Status</h3>
        <Link href="/publishing" className="text-sm font-medium text-indigo-400 hover:text-indigo-700">View All</Link>
      </div>
      <div className="space-y-3">
        {publishStatus.map((status) => {
          const StatusIcon = status.icon;
          return (
          <Link key={status.label} href={`/publishing?status=${status.label.toLowerCase()}`} className="flex items-center justify-between p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
              <span className="text-sm font-medium text-slate-300">{status.label}</span>
            </div>
            <span className="text-sm font-semibold text-white">{status.count}</span>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
