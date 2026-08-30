'use client';

import { Settings, Shield, HardDrive, Bell, Power } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Configure organization profile details and spatial platform defaults</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Nav menu */}
        <div className="space-y-1">
          {[
            { label: 'General Profile', icon: Settings, active: true },
            { label: 'Security & Access', icon: Shield },
            { label: 'Storage Quotas', icon: HardDrive },
            { label: 'Notifications', icon: Bell },
            { label: 'Integrations', icon: Power },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button 
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  item.active 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-700 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Form area */}
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 shadow-sm rounded-xl p-6 space-y-6">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">Organization Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Organization Name</label>
              <input 
                type="text" 
                defaultValue="Global Health Group"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Primary Domain Context</label>
              <input 
                type="text" 
                defaultValue="hospital"
                disabled
                className="w-full bg-slate-700 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-400 focus:outline-none cursor-not-allowed font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">Configured during organization onboarding. Governs types & constraints.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Support Contact Email</label>
              <input 
                type="email" 
                defaultValue="support@globalhealth.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
