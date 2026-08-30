'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MapPin, 
  Box, 
  Server, 
  Image as ImageIcon, 
  Users, 
  UploadCloud, 
  Activity, 
  Settings,
  Hexagon
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Places', href: '/places', icon: MapPin },
  { label: 'Experiences', href: '/experiences', icon: Box },
  { label: 'Services', href: '/services', icon: Server },
  { label: 'Content', href: '/content', icon: ImageIcon },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Publishing', href: '/publishing', icon: UploadCloud },
  { label: 'Monitoring', href: '/monitoring', icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl flex-shrink-0 z-20">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 shrink-0 select-none">
        {/* CSS-rendered SpatialOS Logo (cyan to blue gradient) */}
        <div className="flex items-center px-3 py-1 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
          <span className="text-[1.1rem] font-bold tracking-tight text-black">Spatial</span>
          <span className="text-[1.1rem] font-bold tracking-tight text-blue-950">OS</span>
        </div>
      </div>
      
      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings (Pinned to bottom) */}
      <div className="p-3 border-t border-slate-800 shrink-0">
        <Link 
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ${
            pathname.startsWith('/settings') 
              ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
