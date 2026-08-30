'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, Search, HelpCircle, ChevronDown, UserCircle2, X, CheckCircle2, 
  AlertTriangle, AlertCircle, Info, Settings, LogOut, RefreshCw, Globe, HelpCircle as HelpIcon
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
}

export function TopNav() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', type: 'success', title: 'Compile Successful', message: 'Experience "Notice Board" compiled successfully.', time: '5 mins ago', read: false, link: '/experiences/1' },
    { id: '2', type: 'error', title: 'Validation Failed', message: 'Cardiology Welcomer: 3D model banner.glb does not exist.', time: '1 hour ago', read: false, link: '/publishing' },
    { id: '3', type: 'warning', title: 'Empty Place', message: 'Place "Cafeteria" has no active experiences.', time: '1 day ago', read: true, link: '/places/3' },
    { id: '4', type: 'info', title: 'System Maintenance', message: 'Scheduled API gateway update at 23:00 UTC.', time: '2 days ago', read: true, link: '/monitoring' },
  ]);

  // Ping Latency State
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'connected'>('idle');
  const [latency, setLatency] = useState<number | null>(null);

  // Switch Workspace context mock
  const [activeOrg, setActiveOrg] = useState('Global Health Group');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const runLatencyTest = () => {
    setPingStatus('testing');
    setTimeout(() => {
      setLatency(Math.floor(Math.random() * 30) + 15);
      setPingStatus('connected');
    }, 800);
  };

  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 px-6 flex items-center justify-between shrink-0 z-30 relative">
      {/* Search Omnibar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search Places, Experiences, Services..." 
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-400 border border-slate-700">
              ⌘ K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 ml-6">
        <div className="flex items-center gap-4 text-slate-400">
          {/* About / Help Trigger */}
          <button 
            onClick={() => { setShowAbout(true); setShowNotifications(false); setShowProfile(false); }}
            className={`hover:text-slate-600 transition-colors p-1.5 rounded-lg ${showAbout ? 'bg-slate-700 text-slate-300' : ''}`}
            title="About Platform"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          {/* Notifications Bell Trigger */}
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowAbout(false); setShowProfile(false); }}
            className={`hover:text-slate-600 transition-colors relative p-1.5 rounded-lg ${showNotifications ? 'bg-slate-700 text-slate-300' : ''}`}
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        {/* Profile Dropdown Trigger */}
        <div 
          onClick={() => { setShowProfile(!showProfile); setShowAbout(false); setShowNotifications(false); }}
          className={`flex items-center gap-3 cursor-pointer group p-1.5 rounded-lg transition-colors select-none ${showProfile ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-300 leading-none">{activeOrg}</p>
            <p className="text-xs text-slate-400 mt-1">Sarah Connor</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            SC
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>

      {/* Profile Dropdown Drawer (Section 1) */}
      {showProfile && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowProfile(false)} />
          <div className="absolute right-6 top-16 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-40 py-4 animate-in fade-in duration-100">
            {/* Header info */}
            <div className="px-4 pb-4 border-b border-slate-800">
              <p className="text-sm font-bold text-slate-200">Sarah Connor</p>
              <p className="text-xs text-slate-400">sarah.c@spatialos.com</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-400 mt-2">
                Super Admin
              </span>
            </div>

            {/* Org / Workspace switch */}
            <div className="px-4 py-3 border-b border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Workspace</span>
              <select 
                value={activeOrg}
                onChange={(e) => setActiveOrg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="Global Health Group">Global Health Group</option>
                <option value="Hospital East Wing">Hospital East Wing</option>
                <option value="Central Campus District">Central Campus District</option>
              </select>
            </div>

            {/* Links */}
            <div className="px-2 py-2 border-b border-slate-800">
              <Link 
                href="/settings" 
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-900 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Profile Settings
              </Link>
            </div>

            {/* Actions */}
            <div className="px-2 pt-2">
              <button 
                onClick={() => { setShowProfile(false); alert('Securely logging out...'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Notifications Panel Drawer (Section 2) */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
          <div className="absolute right-6 top-16 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-40 flex flex-col max-h-[500px] overflow-hidden animate-in fade-in duration-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead} 
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No notifications found.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`p-4 flex gap-3 hover:bg-slate-700 transition-colors relative ${!n.read ? 'bg-indigo-50/20' : ''}`}>
                    <div className="mt-0.5">
                      {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {n.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {n.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <Link 
                          href={n.link} 
                          onClick={() => setShowNotifications(false)}
                          className="text-xs font-bold text-slate-200 hover:underline"
                        >
                          {n.title}
                        </Link>
                        <button 
                          onClick={() => clearNotification(n.id)}
                          className="text-slate-300 hover:text-slate-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 leading-normal">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block pt-1">{n.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* About/Help Platform Drawer Panel (Section 3) */}
      {showAbout && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowAbout(false)} />
          <div className="absolute right-6 top-16 w-[360px] bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-40 flex flex-col p-5 animate-in fade-in duration-100 space-y-5">
            {/* Header / Brand */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold font-mono">
                S
              </div>
              <div>
                <h3 className="font-bold text-white leading-none">SpatialOS Control Plane</h3>
                <span className="text-[10px] text-slate-400 mt-1 block">v2.5.4-Stable</span>
              </div>
            </div>

            {/* Health / Latency Check */}
            <div className="bg-slate-900 rounded-lg p-3.5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">API Connection Ping</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  pingStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
                  pingStatus === 'testing' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {pingStatus === 'connected' && latency ? `Connected (${latency}ms)` :
                   pingStatus === 'testing' ? 'Testing...' : 'Disconnected'}
                </span>
              </div>
              <button 
                onClick={runLatencyTest}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-1.5 rounded text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${pingStatus === 'testing' ? 'animate-spin' : ''}`} />
                Test Connection Latency
              </button>
            </div>

            {/* Storage Quota */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Asset Storage Context</span>
                <span>24.8% Used</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '24.8%' }} />
              </div>
              <span className="text-[10px] text-slate-400 block">12.4 GB / 50 GB Global Limit</span>
            </div>

            {/* Rules / Limitations info */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-300 block mb-2">Payload Upload Limits</span>
              <div className="flex justify-between text-slate-400 border-b border-slate-800 py-1">
                <span>Maximum Image:</span>
                <span className="font-semibold text-slate-300">10 MB</span>
              </div>
              <div className="flex justify-between text-slate-400 border-b border-slate-800 py-1">
                <span>Maximum Video:</span>
                <span className="font-semibold text-slate-300">50 MB</span>
              </div>
              <div className="flex justify-between text-slate-400 py-1">
                <span>Maximum 3D model (.glb):</span>
                <span className="font-semibold text-slate-300">25 MB</span>
              </div>
            </div>

            {/* Links */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-semibold text-indigo-400">
              <a href="#" className="hover:underline flex items-center gap-1">
                <Globe className="w-3 h-3" /> API Specs
              </a>
              <a href="#" className="hover:underline flex items-center gap-1">
                <HelpIcon className="w-3 h-3" /> System Docs
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
