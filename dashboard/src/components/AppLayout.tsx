'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Do not render Sidebar and TopNav on the login page
  if (pathname === '/login') {
    return (
      <main className="flex-1 overflow-auto bg-slate-900 min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        <TopNav />
        <main className="flex-1 overflow-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
