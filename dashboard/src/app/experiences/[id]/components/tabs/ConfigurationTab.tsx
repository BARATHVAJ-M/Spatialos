'use client';

import { ExperienceEditorContext } from '../../hooks/useExperienceEditor';

interface ConfigurationTabProps {
  editor: ExperienceEditorContext;
}

export function ConfigurationTab({ editor }: ConfigurationTabProps) {
  const { config, setConfig } = editor;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Global Experience Overrides</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">JSON schema overrides applied to the entire scene upon initialization.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Ambient Light Intensity</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={config.ambientLighting} 
            onChange={e => setConfig({ ...config, ambientLighting: parseFloat(e.target.value) })} 
            className="w-full accent-indigo-500" 
          />
          <span className="text-xs font-mono text-indigo-500 dark:text-indigo-400">{config.ambientLighting}</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Max Render Distance (m)</label>
          <input 
            type="number" 
            value={config.maxRenderDistance} 
            onChange={e => setConfig({ ...config, maxRenderDistance: parseFloat(e.target.value) || 0 })} 
            className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:col-span-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Enable Shadow Casting</span>
          <input 
            type="checkbox" 
            checked={config.shadowsEnabled} 
            onChange={e => setConfig({ ...config, shadowsEnabled: e.target.checked })} 
            className="w-5 h-5 accent-indigo-600 rounded" 
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:col-span-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Enable Physics/Collisions</span>
          <input 
            type="checkbox" 
            checked={config.physicsCollision} 
            onChange={e => setConfig({ ...config, physicsCollision: e.target.checked })} 
            className="w-5 h-5 accent-indigo-600 rounded" 
          />
        </div>
      </div>
    </div>
  );
}
