import React from 'react';
import { ServiceInstance } from '../../types/api';

interface ComplaintBoxEditorProps {
  instance: ServiceInstance;
  config: Record<string, any>;
  onConfigChange: (newConfig: Record<string, any>) => void;
}

export function ComplaintBoxEditor({ instance, config, onConfigChange }: ComplaintBoxEditorProps) {
  const handleChange = (field: string, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Complaint Box Configuration</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          This service provides a zero-storage passthrough to an external form to guarantee user anonymity. 
          No PII or tracking data is stored in the SpatialOS database.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Anonymous Complaint Box"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={config.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="e.g., Submit your grievances securely."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Privacy Message
            </label>
            <textarea
              value={config.privacyMessage || ''}
              onChange={(e) => handleChange('privacyMessage', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="e.g., SpatialOS does not track or store your details."
              rows={2}
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <label className="block text-sm font-medium text-cyan-400 mb-1">
              Google Form URL (Required)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              The external URL where users will submit their complaints. The AR Engine will securely launch this URL.
            </p>
            <input
              type="url"
              value={config.googleFormUrl || ''}
              onChange={(e) => handleChange('googleFormUrl', e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-cyan-500/30 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              placeholder="https://forms.google.com/..."
              required
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Live Preview Simulation</h4>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-cyan-400 text-2xl">🔒</span>
          </div>
          <h5 className="text-slate-900 dark:text-white text-lg font-semibold mb-1">
            {config.title || 'Complaint Box'}
          </h5>
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-4">
            {config.description || 'Submit your grievances securely.'}
          </p>
          <div className="w-full bg-white dark:bg-slate-800 p-3 rounded-lg mb-4 text-center border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {config.privacyMessage || 'SpatialOS does not track or store your details.'}
            </p>
          </div>
          <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors" disabled>
            Submit Grievance
          </button>
        </div>
      </div>
    </div>
  );
}
